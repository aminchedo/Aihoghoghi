import React, { useState } from 'react'

const EnhancedAIAnalysisDashboard = () => {
  const [analysisType, setAnalysisType] = useState('document')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const analysisTypes = [
    { id: 'document', name: 'تحلیل سند', icon: '📄', description: 'تحلیل محتوای اسناد حقوقی' },
    { id: 'contract', name: 'تحلیل قرارداد', icon: '📋', description: 'بررسی ریسک‌ها و نکات کلیدی' },
    { id: 'legal', name: 'تحلیل قانونی', icon: '⚖️', description: 'تطبیق با قوانین جاری' },
    { id: 'sentiment', name: 'تحلیل احساسات', icon: '😊', description: 'بررسی لحن و احساسات متن' },
  ]

  const recentAnalyses = [
    { id: 1, document: 'قرارداد تجاری ABC', type: 'قرارداد', status: 'completed', accuracy: 94, date: '2024-01-15' },
    { id: 2, document: 'حکم قضایی 1234', type: 'حکم', status: 'processing', accuracy: null, date: '2024-01-15' },
    { id: 3, document: 'ماده قانونی مدنی', type: 'قانون', status: 'completed', accuracy: 97, date: '2024-01-14' },
  ]

  const handleAnalysis = async () => {
    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 3000))
    setIsAnalyzing(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">داشبورد تحلیل هوش مصنوعی</h1>
      
      {/* Analysis Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analysisTypes.map((type) => (
          <div
            key={type.id}
            onClick={() => setAnalysisType(type.id)}
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              analysisType === type.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">{type.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{type.name}</h3>
              <p className="text-sm text-gray-600">{type.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Interface */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          تحلیل {analysisTypes.find(t => t.id === analysisType)?.name}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              متن یا محتوای سند
            </label>
            <textarea
              rows={6}
              placeholder="متن مورد نظر برای تحلیل را وارد کنید..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
            />
          </div>
          
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <button
              onClick={handleAnalysis}
              disabled={isAnalyzing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isAnalyzing ? 'در حال تحلیل...' : 'شروع تحلیل'}
            </button>
            
            <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              آپلود فایل
            </button>
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">تحلیل‌های اخیر</h3>
        <div className="space-y-4">
          {recentAnalyses.map((analysis) => (
            <div key={analysis.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📊</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{analysis.document}</h4>
                  <div className="text-sm text-gray-500">
                    نوع: {analysis.type} | تاریخ: {analysis.date}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                {analysis.status === 'completed' ? (
                  <div className="text-right">
                    <div className="text-sm text-gray-600">دقت تحلیل</div>
                    <div className="text-lg font-semibold text-green-600">{analysis.accuracy}%</div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-yellow-600">در حال پردازش</span>
                  </div>
                )}
                
                <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50">
                  مشاهده
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Model Status */}
      <div className="bg-green-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-3">وضعیت مدل‌های AI</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-2">🤖</div>
            <div className="font-medium text-green-900">PersianBERT</div>
            <div className="text-sm text-green-700">آنلاین</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">📚</div>
            <div className="font-medium text-green-900">Legal NER</div>
            <div className="text-sm text-green-700">آنلاین</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🔍</div>
            <div className="font-medium text-green-900">Semantic Search</div>
            <div className="text-sm text-green-700">آنلاین</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedAIAnalysisDashboard