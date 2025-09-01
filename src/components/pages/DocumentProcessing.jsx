import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useConfig } from '../../contexts/ConfigContext';
import { useNotification } from '../../contexts/NotificationContext';

// Components
import ProcessingTabs from '../document/ProcessingTabs';
import ManualProcessing from '../document/ManualProcessing';
import BatchProcessing from '../document/BatchProcessing';
import FileUpload from '../document/FileUpload';
import ProcessingHistory from '../document/ProcessingHistory';
import ProcessingProgress from '../document/ProcessingProgress';
import DocumentResults from '../document/DocumentResults';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import AIRankingSection from '../ai/AIRankingSection';

const DocumentProcessing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getApiUrl, getWebSocketUrl } = useConfig();
  const { showNotification, showApiError } = useNotification();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'manual');
  
  // Sample processed documents for AI ranking demonstration
  const [processedDocuments] = useState([
    'قرارداد خرید و فروش ملک واقع در تهران بین آقای احمد محمدی به عنوان خریدار و خانم زهرا احمدی به عنوان فروشنده منعقد می‌گردد.',
    'دادگاه عمومی تهران در جلسه مورخ 1402/09/15 با حضور قاضی دکتر رضایی و بررسی پرونده کلاسه 9801234 رای زیر را صادر نمود.',
    'بخشنامه شماره 1234 وزارت دادگستری در خصوص نحوه رسیدگی به پرونده‌های مدنی به تمامی دادگاه‌های کشور ابلاغ می‌گردد.'
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({
    current: 0,
    total: 0,
    processed: 0,
    failed: 0,
    currentUrl: '',
    startTime: null,
  });
  
  const wsRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Update URL when tab changes
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  // WebSocket connection for real-time progress updates
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(getWebSocketUrl());
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          setWsConnected(true);
          showNotification('اتصال بلادرنگ برقرار شد', 'success');
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setWsConnected(false);
          
          // Attempt to reconnect after 5 seconds
          setTimeout(() => {
            if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
              connectWebSocket();
            }
          }, 5000);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setWsConnected(false);
        };
        
        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setWsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [getWebSocketUrl, showNotification]);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'progress':
        setProcessingProgress(prev => ({
          ...prev,
          current: data.batch || prev.current,
          total: data.total_batches || prev.total,
        }));
        break;
        
      case 'success':
        setProcessingProgress(prev => ({
          ...prev,
          processed: prev.processed + 1,
          currentUrl: data.url || '',
        }));
        queryClient.invalidateQueries(['processedDocuments']);
        break;
        
      case 'error':
        setProcessingProgress(prev => ({
          ...prev,
          failed: prev.failed + 1,
        }));
        showNotification(`خطا در پردازش: ${data.url}`, 'error');
        break;
        
      case 'completed':
        setIsProcessing(false);
        setProcessingProgress(prev => ({ ...prev, currentUrl: '' }));
        showNotification(
          `پردازش تکمیل شد. موفق: ${data.total_processed}, ناموفق: ${data.total_failed}`,
          'success'
        );
        queryClient.invalidateQueries(['processedDocuments']);
        break;
        
      case 'info':
        showNotification(data.message, 'info');
        break;
        
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  };

  // Fetch processing status
  const { data: processingStatus } = useQuery({
    queryKey: ['processingStatus'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/process'));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    refetchInterval: 5000,
    onSuccess: (data) => {
      setIsProcessing(data.processing || false);
      if (data.processing) {
        setProcessingProgress(prev => ({
          ...prev,
          current: data.current_batch || 0,
          total: data.total_batches || 0,
          processed: data.processed_count || 0,
          failed: data.failed_count || 0,
          currentUrl: data.current_url || '',
        }));
      }
    },
  });

  // Fetch processed documents
  const { 
    data: documentsData, 
    isLoading: documentsLoading, 
    error: documentsError 
  } = useQuery({
    queryKey: ['processedDocuments'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/processed-documents'));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Process URLs mutation
  const processUrlsMutation = useMutation({
    mutationFn: async ({ urls, useProxy, batchSize, maxRetries }) => {
      const response = await fetch(getApiUrl('/process-urls'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls,
          use_proxy: useProxy,
          batch_size: batchSize,
          max_retries: maxRetries,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setIsProcessing(true);
      setProcessingProgress({
        current: 0,
        total: Math.ceil(data.total_urls / (data.batch_size || 5)),
        processed: 0,
        failed: 0,
        currentUrl: '',
        startTime: new Date(),
      });
      showNotification(`پردازش ${data.total_urls} سند آغاز شد`, 'success');
    },
    onError: (error) => {
      showApiError(error, 'خطا در شروع پردازش');
    },
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(getApiUrl('/upload-urls'), {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      showNotification(`${data.count} آدرس از فایل استخراج شد`, 'success');
    },
    onError: (error) => {
      showApiError(error, 'خطا در آپلود فایل');
    },
  });

  const handleStartProcessing = (urls, options = {}) => {
    processUrlsMutation.mutate({
      urls,
      useProxy: options.useProxy !== false,
      batchSize: options.batchSize || 5,
      maxRetries: options.maxRetries || 3,
    });
  };

  const handleFileUpload = (file) => {
    uploadFileMutation.mutate(file);
  };

  const tabs = [
    {
      id: 'manual',
      title: 'پردازش دستی',
      icon: '✏️',
      description: 'پردازش تک‌به‌تک اسناد',
    },
    {
      id: 'batch',
      title: 'پردازش دسته‌ای',
      icon: '📁',
      description: 'پردازش چندین سند همزمان',
    },
    {
      id: 'upload',
      title: 'آپلود فایل',
      icon: '📤',
      description: 'آپلود فایل حاوی آدرس‌ها',
    },
    {
      id: 'history',
      title: 'تاریخچه پردازش',
      icon: '📊',
      description: 'مشاهده سوابق پردازش',
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'manual':
        return (
          <ManualProcessing
            onProcess={handleStartProcessing}
            isProcessing={processUrlsMutation.isLoading}
          />
        );
      case 'batch':
        return (
          <BatchProcessing
            onProcess={handleStartProcessing}
            isProcessing={processUrlsMutation.isLoading}
          />
        );
      case 'upload':
        return (
          <FileUpload
            onUpload={handleFileUpload}
            onProcess={handleStartProcessing}
            isUploading={uploadFileMutation.isLoading}
            isProcessing={processUrlsMutation.isLoading}
            uploadResult={uploadFileMutation.data}
          />
        );
      case 'history':
        return (
          <ProcessingHistory
            documents={documentsData?.documents || []}
            loading={documentsLoading}
            error={documentsError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            پردازش اسناد حقوقی
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            پردازش، تحلیل و دسته‌بندی اسناد حقوقی
          </p>
        </div>
        
        <div className="flex items-center space-x-3 space-x-reverse">
          {/* WebSocket Status */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {wsConnected ? 'متصل' : 'قطع شده'}
            </span>
          </div>
          
          {/* Processing Status */}
          {isProcessing && (
            <div className="flex items-center space-x-2 space-x-reverse">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                در حال پردازش...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Processing Progress */}
      {isProcessing && (
        <ProcessingProgress
          progress={processingProgress}
          onCancel={() => {
            // TODO: Implement cancel functionality
            showNotification('قابلیت لغو در نسخه بعدی اضافه خواهد شد', 'info');
          }}
        />
      )}

      {/* Tabs */}
      <ProcessingTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="min-h-96">
        {renderTabContent()}
      </div>

      {/* Results Section */}
      {documentsData?.documents && documentsData.documents.length > 0 && (
        <div className="mt-8 space-y-6">
          {/* AI Ranking Section for processed documents */}
          <AIRankingSection 
            texts={processedDocuments}
            title="🧠 رتبه‌بندی اسناد پردازش شده"
            showDetails={true}
            autoAnalyze={false}
          />
          
          <DocumentResults
            documents={documentsData.documents}
            total={documentsData.total}
            loading={documentsLoading}
          />
        </div>
      )}

      {/* Error Display */}
      {documentsError && (
        <ErrorMessage
          title="خطا در دریافت نتایج پردازش"
          message={documentsError.message}
          onRetry={() => queryClient.invalidateQueries(['processedDocuments'])}
        />
      )}
    </div>
  );
};

export default DocumentProcessing;