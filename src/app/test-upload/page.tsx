'use client';

import { useState } from 'react';

export default function TestUploadPage() {
  const [message, setMessage] = useState('Component loaded');

  const handleClick = () => {
    console.log('🧪 Test button clicked!');
    setMessage('Button works!');
    
    // Create and trigger file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      console.log('📁 Files selected:', files?.length);
      setMessage(`Selected ${files?.length} files`);
    };
    
    console.log('🔧 Triggering file dialog...');
    input.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-4">🧪 Upload Test</h1>
        <p className="mb-4">{message}</p>
        
        <button
          onClick={handleClick}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded transition-colors"
        >
          Test File Upload
        </button>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>• Check browser console (F12)</p>
          <p>• Should see click and file selection messages</p>
        </div>
      </div>
    </div>
  );
}