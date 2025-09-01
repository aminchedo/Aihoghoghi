import React, { useState } from 'react';

const AddProxy = ({ onAdd, loading = false }) => {
  const [formData, setFormData] = useState({
    host: '',
    port: '',
    type: 'http',
    username: '',
    password: '',
    country: '',
    description: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.host.trim()) {
      newErrors.host = 'آدرس هاست الزامی است';
    }

    if (!formData.port.trim()) {
      newErrors.port = 'پورت الزامی است';
    } else if (!/^\d+$/.test(formData.port) || parseInt(formData.port) < 1 || parseInt(formData.port) > 65535) {
      newErrors.port = 'پورت باید عددی بین ۱ تا ۶۵۵۳۵ باشد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const proxyData = {
      ...formData,
      port: parseInt(formData.port)
    };

    onAdd(proxyData);
    
    // Reset form
    setFormData({
      host: '',
      port: '',
      type: 'http',
      username: '',
      password: '',
      country: '',
      description: ''
    });
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const proxyTypes = [
    { value: 'http', label: 'HTTP' },
    { value: 'https', label: 'HTTPS' },
    { value: 'socks4', label: 'SOCKS4' },
    { value: 'socks5', label: 'SOCKS5' }
  ];

  return (
    <div className="space-y-6">
      {/* Add Single Proxy */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          افزودن پروکسی جدید
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Host and Port */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                آدرس هاست <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => handleInputChange('host', e.target.value)}
                placeholder="192.168.1.1 یا proxy.example.com"
                className={`input ${errors.host ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                disabled={loading}
              />
              {errors.host && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  {errors.host}
                </p>
              )}
            </div>

            <div>
              <label className="label">
                پورت <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.port}
                onChange={(e) => handleInputChange('port', e.target.value)}
                placeholder="8080"
                className={`input ${errors.port ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                disabled={loading}
              />
              {errors.port && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  {errors.port}
                </p>
              )}
            </div>
          </div>

          {/* Type and Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">نوع پروکسی</label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="input"
                disabled={loading}
              >
                {proxyTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">کشور</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="ایران، آمریکا، ..."
                className="input"
                disabled={loading}
              />
            </div>
          </div>

          {/* Authentication */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">نام کاربری (اختیاری)</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="username"
                className="input"
                disabled={loading}
              />
            </div>

            <div>
              <label className="label">رمز عبور (اختیاری)</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="password"
                className="input"
                disabled={loading}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">توضیحات (اختیاری)</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="توضیحات کوتاه درباره این پروکسی..."
              rows={3}
              className="input resize-none"
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              پروکسی جدید به صورت خودکار تست خواهد شد
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -mr-1 ml-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>در حال افزودن...</span>
                </>
              ) : (
                <>
                  <span>➕</span>
                  <span>افزودن پروکسی</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Bulk Import */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          درون‌ریزی دسته‌ای
        </h3>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            پروکسی‌های متعدد را با فرمت زیر وارد کنید (هر خط یک پروکسی):
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
              host:port<br/>
              host:port:username:password<br/>
              type://host:port<br/>
              type://username:password@host:port
            </code>
          </div>
          
          <textarea
            placeholder="192.168.1.1:8080&#10;http://user:pass@proxy.example.com:3128&#10;socks5://127.0.0.1:1080"
            rows={6}
            className="input font-mono text-sm resize-none"
            disabled={loading}
          />
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              پروکسی‌های وارد شده به صورت خودکار تجزیه و تست خواهند شد
            </div>
            
            <button
              disabled={loading}
              className="btn btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              درون‌ریزی دسته‌ای
            </button>
          </div>
        </div>
      </div>

      {/* Import from URL */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          درون‌ریزی از URL
        </h3>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            پروکسی‌ها را از یک فایل آنلاین یا API دریافت کنید:
          </p>
          
          <div className="flex space-x-2 space-x-reverse">
            <input
              type="url"
              placeholder="https://example.com/proxies.txt"
              className="input flex-1"
              disabled={loading}
            />
            <button
              disabled={loading}
              className="btn btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              دریافت از URL
            </button>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            فرمت‌های پشتیبانی شده: TXT، JSON، CSV
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProxy;