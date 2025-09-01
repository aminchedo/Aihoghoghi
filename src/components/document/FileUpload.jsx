import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const FileUpload = ({ onUpload, isUploading = false, acceptedTypes = '.pdf,.doc,.docx,.txt' }) => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0 && onUpload) {
      onUpload(acceptedFiles);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragActive && !isDragReject
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : isDragReject
            ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="space-y-4">
            <div className="text-4xl">⏳</div>
            <div>
              <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                در حال آپلود...
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {uploadProgress}%
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl">
              {isDragActive ? '📥' : '📄'}
            </div>
            <div>
              <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {isDragActive
                  ? 'فایل‌ها را اینجا رها کنید'
                  : 'فایل‌هایتان را اینجا بکشید یا کلیک کنید'
                }
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                فرمت‌های پشتیبانی شده: PDF, DOC, DOCX, TXT (حداکثر ۵۰ مگابایت)
              </p>
            </div>
          </div>
        )}

        {isDragReject && (
          <div className="absolute inset-0 bg-red-50 dark:bg-red-900/20 border-2 border-red-400 border-dashed rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">❌</div>
              <div className="text-red-600 dark:text-red-400 font-medium">
                فرمت فایل پشتیبانی نمی‌شود
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        حداکثر ۱۰ فایل در هر بار آپلود • حداکثر حجم هر فایل: ۵۰ مگابایت
      </div>
    </div>
  );
};

export default FileUpload;