import React, { useState } from 'react'

const EnhancedDocumentProcessing = () => {
  const [processingQueue, setProcessingQueue] = useState([
    { id: 1, name: 'قرارداد تجاری.pdf', type: 'PDF', status: 'processing', progress: 65, size: '2.4 MB' },
    { id: 2, name: 'حکم قضایی.docx', type: 'DOCX', status: 'queued', progress: 0, size: '1.8 MB' },
    { id: 3, name: 'ماده قانونی.txt', type: 'TXT', status: 'completed', progress: 100, size: '156 KB' },
  ])

  const [supportedFormats] = useState([
    { format: 'PDF', icon: '📄', description: 'Portable Document Format' },
    { format: 'DOCX', icon: '📝', description: 'Microsoft Word Document' },
    { format: 'TXT', icon: '📃', description: 'Plain Text File' },
    { format: 'RTF', icon: '📋', description: 'Rich Text Format' },
    { format: 'HTML', icon: '🌐', description: 'HyperText Markup Language' },
    { format: 'XML', icon: '📊', description: 'Extensible Markup Language' },
  ])

  const [conversionHistory] = useState([
    { id: 1, original: 'document.pdf', converted: 'document.txt', date: '2024-01-15', status: 'success' },
    { id: 2, original: 'contract.docx', converted: 'contract.pdf', date: '2024-01-14', status: 'success' },
    { id: 3, original: 'legal.txt', converted: 'legal.html', date: '2024-01-13', status: 'success' },
  ])

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files)
    const newFiles = files.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      type: file.name.split('.').pop().toUpperCase(),
      status: 'queued',
      progress: 0,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
    }))
    
    setProcessingQueue(prev => [...newFiles, ...prev])
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      case 'queued': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'تکمیل شده'
      case 'processing': return 'در حال پردازش'
      case 'queued': return 'در صف'
      case 'error': return 'خطا'
      default: return 'نامشخص'
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">پردازش اسناد</h1>
      
      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">آپلود فایل</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📁</div>
          <p className="text-gray-600 mb-4">فایل‌های خود را اینجا بکشید یا کلیک کنید</p>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            accept=".pdf,.docx,.txt,.rtf,.html,.xml"
          />
          <label
            htmlFor="file-upload"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
          >
            انتخاب فایل
          </label>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          فرمت‌های پشتیبانی شده: PDF, DOCX, TXT, RTF, HTML, XML
        </div>
      </div>

      {/* Processing Queue */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">صف پردازش</h3>
        <div className="space-y-4">
          {processingQueue.map((file) => (
            <div key={file.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">📄</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{file.name}</h4>
                    <div className="text-sm text-gray-500">
                      نوع: {file.type} | اندازه: {file.size}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(file.status)}`}>
                    {getStatusText(file.status)}
                  </div>
                </div>
              </div>
              
              {file.status === 'processing' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  ></div>
                </div>
              )}
              
              {file.status === 'processing' && (
                <div className="mt-2 text-sm text-gray-600">
                  پیشرفت: {file.progress}%
                </div>
              )}
              
              <div className="mt-3 flex items-center space-x-2 rtl:space-x-reverse">
                {file.status === 'queued' && (
                  <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                    شروع پردازش
                  </button>
                )}
                <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supported Formats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">فرمت‌های پشتیبانی شده</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supportedFormats.map((format) => (
            <div key={format.format} className="p-4 border border-gray-200 rounded-lg text-center">
              <div className="text-3xl mb-2">{format.icon}</div>
              <h4 className="font-medium text-gray-900 mb-1">{format.format}</h4>
              <p className="text-sm text-gray-600">{format.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Conversion History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">تاریخچه تبدیل</h3>
        <div className="space-y-3">
          {conversionHistory.map((conversion) => (
            <div key={conversion.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-sm">✅</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {conversion.original} → {conversion.converted}
                  </div>
                  <div className="text-xs text-gray-500">{conversion.date}</div>
                </div>
              </div>
              
              <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                موفق
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Processing Options */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">تنظیمات پردازش</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              کیفیت OCR
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>بالا (دقیق)</option>
              <option>متوسط (متوازن)</option>
              <option>پایین (سریع)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              زبان متن
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>فارسی</option>
              <option>انگلیسی</option>
              <option>عربی</option>
              <option>خودکار تشخیص</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              حفظ فرمت
            </label>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <input type="checkbox" id="preserve-format" className="rounded" />
              <label htmlFor="preserve-format" className="text-sm text-gray-700">
                حفظ فرمت اصلی تا حد ممکن
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              پردازش موازی
            </label>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <input type="checkbox" id="parallel-processing" className="rounded" />
              <label htmlFor="parallel-processing" className="text-sm text-gray-700">
                پردازش همزمان چندین فایل
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedDocumentProcessing