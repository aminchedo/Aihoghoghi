import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSystem } from '../../contexts/SystemContext'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { 
  FileText, 
  Upload, 
  Eye, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Brain,
  Filter,
  BarChart3,
  Activity,
  Trash2,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

const EnhancedDocumentProcessing = () => {
  const { processDocument, documents } = useSystem()
  const { isConnected, subscribe } = useWebSocket()
  const [activeTab, setActiveTab] = useState('queue')
  const [processingQueue, setProcessingQueue] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})

  const tabs = [
    { id: 'queue', label: 'صف پردازش', icon: Clock, description: 'مدیریت صف پردازش' },
    { id: 'upload', label: 'آپلود فایل', icon: Upload, description: 'آپلود اسناد جدید' },
    { id: 'preview', label: 'پیش‌نمایش', icon: Eye, description: 'پیش‌نمایش اسناد' },
    { id: 'results', label: 'نتایج', icon: CheckCircle, description: 'نتایج پردازش' }
  ]

  useEffect(() => {
    // Subscribe to processing updates
    const unsubscribe = subscribe('documentProcessed', (data) => {
      toast.success(`سند ${data.title} پردازش شد`)
      updateProcessingQueue(data)
    })

    // Load initial queue
    loadProcessingQueue()

    return unsubscribe
  }, [subscribe])

  const loadProcessingQueue = () => {
    const sampleQueue = [
      {
        id: 1,
        title: 'دادنامه شماره ۱۲۳۴۵',
        url: 'https://www.judiciary.ir/fa/verdict/12345',
        status: 'pending',
        priority: 'high',
        estimated_time: 120,
        file_size: '2.3MB',
        document_type: 'دادنامه'
      },
      {
        id: 2,
        title: 'قانون حمایت از خانواده',
        url: 'https://rc.majlis.ir/fa/law/show/94203',
        status: 'processing',
        priority: 'medium',
        estimated_time: 180,
        file_size: '1.8MB',
        document_type: 'قانون',
        progress: 65
      },
      {
        id: 3,
        title: 'آیین‌نامه اجرایی نفقه',
        url: 'https://dotic.ir/portal/law/nafaqe',
        status: 'completed',
        priority: 'low',
        estimated_time: 90,
        file_size: '1.2MB',
        document_type: 'آیین‌نامه',
        completed_at: new Date()
      }
    ]
    setProcessingQueue(sampleQueue)
  }

  const updateProcessingQueue = (processedDoc) => {
    setProcessingQueue(prev => prev.map(item => 
      item.id === processedDoc.id 
        ? { ...item, status: 'completed', completed_at: new Date() }
        : item
    ))
  }

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files)
    setSelectedFiles(files)
    
    // Simulate upload progress
    files.forEach((file, index) => {
      simulateUploadProgress(file.name, index)
    })
    
    toast.success(`${files.length} فایل انتخاب شد`)
  }

  const simulateUploadProgress = (fileName, index) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 20
      setUploadProgress(prev => ({
        ...prev,
        [fileName]: Math.min(progress, 100)
      }))
      
      if (progress >= 100) {
        clearInterval(interval)
        toast.success(`فایل ${fileName} آپلود شد`)
      }
    }, 200)
  }

  const startProcessing = async () => {
    setIsProcessing(true)
    setProcessingProgress(0)
    
    try {
      const pendingItems = processingQueue.filter(item => item.status === 'pending')
      
      for (let i = 0; i < pendingItems.length; i++) {
        const item = pendingItems[i]
        
        // Update status to processing
        setProcessingQueue(prev => prev.map(q => 
          q.id === item.id ? { ...q, status: 'processing', progress: 0 } : q
        ))
        
        // Process document
        await processDocument(item.url, {
          priority: item.priority,
          ai_analysis: true
        })
        
        // Update progress
        const progress = ((i + 1) / pendingItems.length) * 100
        setProcessingProgress(progress)
        
        // Update status to completed
        setProcessingQueue(prev => prev.map(q => 
          q.id === item.id ? { ...q, status: 'completed', progress: 100, completed_at: new Date() } : q
        ))
      }
      
      toast.success('پردازش همه اسناد تکمیل شد')
    } catch (error) {
      toast.error('خطا در پردازش: ' + error.message)
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'processing':
        return <Play className="w-5 h-5 text-blue-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'در انتظار'
      case 'processing':
        return 'در حال پردازش'
      case 'completed':
        return 'تکمیل شده'
      case 'error':
        return 'خطا'
      default:
        return 'نامشخص'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'low':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              پردازش اسناد حقوقی
            </h1>
            <p className="text-gray-600">
              پایپ‌لاین کامل پردازش اسناد با تحلیل Persian BERT
            </p>
          </div>
          
          <div className="flex items-center space-x-reverse space-x-4">
            <button
              onClick={startProcessing}
              disabled={isProcessing}
              className="flex items-center space-x-reverse space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Play className={`w-5 h-5 ${isProcessing ? 'animate-pulse' : ''}`} />
              <span>{isProcessing ? 'در حال پردازش...' : 'شروع پردازش'}</span>
            </button>
          </div>
        </div>
        
        {/* Processing Progress */}
        {isProcessing && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">پیشرفت پردازش کلی</span>
              <span className="text-sm text-blue-700">{processingProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">در صف</p>
              <p className="text-2xl font-bold text-yellow-600">
                {processingQueue.filter(q => q.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">در حال پردازش</p>
              <p className="text-2xl font-bold text-blue-600">
                {processingQueue.filter(q => q.status === 'processing').length}
              </p>
            </div>
            <Play className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">تکمیل شده</p>
              <p className="text-2xl font-bold text-green-600">
                {processingQueue.filter(q => q.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">خطا</p>
              <p className="text-2xl font-bold text-red-600">
                {processingQueue.filter(q => q.status === 'error').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-reverse">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-reverse space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Queue Tab */}
            {activeTab === 'queue' && (
              <motion.div
                key="queue"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">صف پردازش اسناد</h3>
                  <div className="flex items-center space-x-reverse space-x-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-500">
                      {processingQueue.length} سند در صف
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {processingQueue.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-reverse space-x-3">
                          {getStatusIcon(item.status)}
                          <div>
                            <h4 className="font-medium text-gray-900">{item.title}</h4>
                            <p className="text-sm text-gray-500">{item.url}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-reverse space-x-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(item.priority)}`}>
                            {item.priority === 'high' ? 'بالا' : item.priority === 'medium' ? 'متوسط' : 'پایین'}
                          </span>
                          <span className="text-sm text-gray-500">{item.file_size}</span>
                          <span className="text-sm text-gray-500">{getStatusText(item.status)}</span>
                        </div>
                      </div>
                      
                      {/* Progress bar for processing items */}
                      {item.status === 'processing' && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${item.progress || 0}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            پیشرفت: {item.progress || 0}%
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">آپلود اسناد حقوقی</h3>
                
                {/* File Drop Zone */}
                <div className="border-2 border-dashed border-blue-300 border-opacity-50 rounded-lg p-8 text-center bg-blue-50 bg-opacity-50">
                  <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    آپلود اسناد حقوقی
                  </h4>
                  <p className="text-gray-600 mb-4">
                    فایل‌های PDF، DOC، DOCX یا TXT را اینجا بکشید یا کلیک کنید
                  </p>
                  <input 
                    type="file" 
                    multiple 
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <button 
                    onClick={() => document.getElementById('file-upload').click()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    انتخاب فایل‌ها
                  </button>
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">فایل‌های انتخاب شده</h4>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-reverse space-x-3">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <div>
                            <span className="font-medium">{file.name}</span>
                            <span className="text-sm text-gray-500 mr-2">
                              ({(file.size / 1024 / 1024).toFixed(1)} MB)
                            </span>
                          </div>
                        </div>
                        
                        {uploadProgress[file.name] && (
                          <div className="flex items-center space-x-reverse space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress[file.name]}%` }}
                              ></div>
                            </div>
                            <span className="text-xs">{uploadProgress[file.name]?.toFixed(0)}%</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">پیش‌نمایش اسناد</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">محتوای استخراج شده</h4>
                    <div className="bg-gray-50 rounded-lg p-4 min-h-64">
                      <div className="text-center text-gray-500 py-8">
                        <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>پیش‌نمایش محتوای استخراج شده</p>
                        <p className="text-xs mt-1">سند را برای پیش‌نمایش انتخاب کنید</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">تحلیل AI</h4>
                    <div className="bg-gray-50 rounded-lg p-4 min-h-64">
                      <div className="text-center text-gray-500 py-8">
                        <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>نتایج تحلیل Persian BERT</p>
                        <p className="text-xs mt-1">پس از پردازش نمایش داده می‌شود</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">نتایج پردازش</h3>
                
                {/* Processing Results */}
                <div className="space-y-4">
                  {processingQueue
                    .filter(item => item.status === 'completed')
                    .map((item, index) => (
                      <div key={item.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-reverse space-x-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                              <h4 className="font-medium text-green-900">{item.title}</h4>
                              <p className="text-sm text-green-700">
                                تکمیل شده در {item.completed_at?.toLocaleTimeString('fa-IR')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-reverse space-x-2">
                            <button className="p-2 text-green-600 hover:text-green-800 rounded-lg hover:bg-green-100">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-green-600 hover:text-green-800 rounded-lg hover:bg-green-100">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                  
                  {processingQueue.filter(item => item.status === 'completed').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>هنوز هیچ سندی پردازش نشده است</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default EnhancedDocumentProcessing