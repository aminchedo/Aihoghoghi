import React, { useState } from 'react'
import { useSystemContext } from '../../contexts/SystemContext'

const EnhancedAIAnalysisDashboard = () => {
  const { aiModels } = useSystemContext()
  const [selectedModel, setSelectedModel] = useState('')
  const [analysisText, setAnalysisText] = useState('')
  const [analysisResults, setAnalysisResults] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalysis = async (e) => {
    e.preventDefault()
    if (!analysisText.trim() || !selectedModel) return

    setIsAnalyzing(true)
    
    // Simulate AI analysis
    setTimeout(() => {
      const mockResults = {
        sentiment: 'positive',
        confidence: 0.87,
        entities: [
          { name: 'شرکت الف', type: 'ORGANIZATION', confidence: 0.95 },
          { name: 'قرارداد', type: 'DOCUMENT_TYPE', confidence: 0.89 },
          { name: '1402', type: 'DATE', confidence: 0.92 }
        ],
        summary: 'این سند یک قرارداد تجاری بین دو شرکت است که شامل شرایط و تعهدات طرفین می‌باشد.',
        keywords: ['قرارداد', 'تجاری', 'شرکت', 'تعهدات', 'شرایط']
      }
      
      setAnalysisResults(mockResults)
      setIsAnalyzing(false)
    }, 2000)
  }

  const availableModels = [
    { id: 'bert-fa', name: 'BERT فارسی', description: 'مدل زبانی برای تحلیل متن فارسی' },
    { id: 'legal-ner', name: 'تشخیص موجودیت‌های حقوقی', description: 'تشخیص نام‌ها، تاریخ‌ها و مفاهیم حقوقی' },
    { id: 'sentiment-fa', name: 'تحلیل احساسات', description: 'تحلیل احساسات و تنش در متن' },
    { id: 'summarization', name: 'خلاصه‌سازی', description: 'خلاصه‌سازی خودکار اسناد طولانی' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">تحلیل هوش مصنوعی</h1>
      </div>

      {/* Model Selection */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">انتخاب مدل</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableModels.map((model) => (
            <div
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedModel === model.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-medium text-gray-900">{model.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{model.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis Form */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">تحلیل متن</h2>
        <form onSubmit={handleAnalysis} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              متن مورد نظر
            </label>
            <textarea
              value={analysisText}
              onChange={(e) => setAnalysisText(e.target.value)}
              placeholder="متن حقوقی خود را اینجا وارد کنید..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            type="submit"
            disabled={!selectedModel || !analysisText.trim() || isAnalyzing}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isAnalyzing ? 'در حال تحلیل...' : 'شروع تحلیل'}
          </button>
        </form>
      </div>

      {/* Analysis Results */}
      {analysisResults && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">نتایج تحلیل</h2>
          </div>
          <div className="p-6 space-y-6">
            {/* Sentiment Analysis */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700">احساسات کلی:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                analysisResults.sentiment === 'positive' 
                  ? 'bg-green-100 text-green-800'
                  : analysisResults.sentiment === 'negative'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {analysisResults.sentiment === 'positive' ? 'مثبت' : 
                 analysisResults.sentiment === 'negative' ? 'منفی' : 'خنثی'}
              </span>
            </div>

            {/* Confidence Score */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700">درصد اطمینان:</span>
              <span className="text-lg font-semibold text-blue-600">
                {(analysisResults.confidence * 100).toFixed(1)}%
              </span>
            </div>

            {/* Entities */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">موجودیت‌های شناسایی شده:</h3>
              <div className="space-y-2">
                {analysisResults.entities.map((entity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <span className="font-medium text-blue-900">{entity.name}</span>
                      <span className="text-sm text-blue-700 mr-2">({entity.type})</span>
                    </div>
                    <span className="text-sm text-blue-600">
                      {(entity.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">خلاصه تحلیل:</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                {analysisResults.summary}
              </p>
            </div>

            {/* Keywords */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">کلمات کلیدی:</h3>
              <div className="flex flex-wrap gap-2">
                {analysisResults.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedAIAnalysisDashboard