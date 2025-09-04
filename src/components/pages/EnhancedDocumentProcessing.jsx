import React, { useState } from 'react'
import { useSystemContext } from '../../contexts/SystemContext'

const EnhancedDocumentProcessing = () => {
  const { documents, dispatch } = useSystemContext()
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [processingQueue, setProcessingQueue] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0
    }))
    
    setUploadedFiles(prev => [...prev, ...newFiles])
  }

  const handleStartProcessing = async () => {
    if (selectedFiles.length === 0) return
    
    setIsProcessing(true)
    const filesToProcess = uploadedFiles.filter(file => selectedFiles.includes(file.id))
    
    // Add to processing queue
    setProcessingQueue(prev => [...prev, ...filesToProcess])
    
    // Simulate processing
    filesToProcess.forEach((file, index) => {
      const processFile = async () => {
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 200))
          
          setUploadedFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, progress, status: progress === 100 ? 'completed' : 'processing' }
              : f
          ))
        }
        
        // Add to documents when completed
        const processedDoc = {
          id: Date.now() + Math.random(),
          title: file.name,
          type: file.type.split('/')[1] || 'unknown',
          date: new Date().toISOString(),
          size: file.size,
          status: 'processed'
        }
        
        dispatch({
          type: 'SET_DOCUMENTS',
          payload: [...documents, processedDoc]
        })
        
        // Remove from queue
        setProcessingQueue(prev => prev.filter(f => f.id !== file.id))
      }
      
      setTimeout(processFile, index * 1000)
    })
    
    setIsProcessing(false)
  }

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
    setSelectedFiles(prev => prev.filter(id => id !== fileId))
  }

  const handleSelectFile = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('image')) return '🖼️'
    if (type.includes('text')) return '📝'
    if (type.includes('word')) return '📘'
    if (type.includes('excel')) return '📊'
    return '📁'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">پردازش اسناد</h1>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">آپلود فایل</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-lg text-gray-600 mb-2">
              فایل‌های خود را اینجا رها کنید یا کلیک کنید
            </p>
            <p className="text-sm text-gray-500">
              پشتیبانی از فرمت‌های PDF، Word، متن و تصاویر
            </p>
          </label>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                فایل‌های آپلود شده ({uploadedFiles.length})
              </h2>
              <button
                onClick={handleStartProcessing}
                disabled={selectedFiles.length === 0 || isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? 'در حال پردازش...' : `پردازش ${selectedFiles.length} فایل`}
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => handleSelectFile(file.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{file.name}</h3>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 space-x-reverse">
                    {file.status === 'processing' && (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{file.progress}%</span>
                      </div>
                    )}
                    
                    {file.status === 'completed' && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        تکمیل شد
                      </span>
                    )}
                    
                    <button
                      onClick={() => handleRemoveFile(file.id)}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Processing Queue */}
      {processingQueue.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              صف پردازش ({processingQueue.length})
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {processingQueue.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <span className="text-2xl">⚙️</span>
                    <div>
                      <h3 className="font-medium text-blue-900">{file.name}</h3>
                      <p className="text-sm text-blue-700">در حال پردازش...</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="w-32 bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-blue-600">{file.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Processing Statistics */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">آمار پردازش</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{uploadedFiles.length}</div>
            <div className="text-sm text-gray-600">کل فایل‌ها</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {uploadedFiles.filter(f => f.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">پردازش شده</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {uploadedFiles.filter(f => f.status === 'processing').length}
            </div>
            <div className="text-sm text-gray-600">در حال پردازش</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedDocumentProcessing