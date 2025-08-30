'use client';

import React, { useState } from 'react';
import { PlatformContent } from '@/types';

interface ContentDisplayProps {
  originalText: string;
  generatedContent: PlatformContent[];
  onBackToDashboard: () => void;
}

export default function ContentDisplay({ originalText, generatedContent, onBackToDashboard }: ContentDisplayProps) {
  // State to track which buttons have been clicked
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const copyToClipboard = async (text: string, platform: string) => {
    try {
      await navigator.clipboard.writeText(text);
      
      // Update the copied state for this platform
      setCopiedStates(prev => ({ ...prev, [platform]: true }));
      
      // Reset the button state after 2 seconds
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [platform]: false }));
      }, 2000);
      
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const downloadContent = (content: string, platform: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${platform}-content.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Platform-specific styling
  const getPlatformStyle = (platform: string) => {
    switch (platform) {
      case 'Blog Post':
        return {
          headerBg: 'from-blue-500 to-blue-600',
          headerIcon: '📝',
          borderColor: 'border-blue-200',
          shadowColor: 'shadow-blue-100'
        };
      case 'LinkedIn':
        return {
          headerBg: 'from-blue-600 to-blue-700',
          headerIcon: '💼',
          borderColor: 'border-blue-200',
          shadowColor: 'shadow-blue-100'
        };
      case 'Twitter':
        return {
          headerBg: 'from-sky-400 to-sky-500',
          headerIcon: '🐦',
          borderColor: 'border-sky-200',
          shadowColor: 'shadow-sky-100'
        };
      case 'Podcast Script':
        return {
          headerBg: 'from-purple-500 to-purple-600',
          headerIcon: '🎙️',
          borderColor: 'border-purple-200',
          shadowColor: 'shadow-purple-100'
        };
      default:
        return {
          headerBg: 'from-gray-500 to-gray-600',
          headerIcon: '📄',
          borderColor: 'border-gray-200',
          shadowColor: 'shadow-gray-100'
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mb-6 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
          Content Generation Complete! 🎉
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Your voice has been magically transformed into multiple professional content formats while preserving your original message.
        </p>
      </div>

      {/* Original Input Display */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Original Voice Input</h3>
        </div>
        <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl shadow-lg">
          <p className="text-gray-800 text-lg leading-relaxed">{originalText}</p>
        </div>
      </div>

      {/* Generated Content */}
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">✨ Generated Content</h3>
          <p className="text-gray-600">Choose your preferred platform and copy or download the content</p>
        </div>
        
        {generatedContent.map((content, index) => {
          const platformStyle = getPlatformStyle(content.platform);
          return (
            <div key={index} className="group">
              <div className={`border-2 ${platformStyle.borderColor} rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}>
                {/* Platform Header */}
                <div className={`bg-gradient-to-r ${platformStyle.headerBg} px-6 py-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{platformStyle.headerIcon}</span>
                      <h4 className="text-xl font-bold capitalize">
                        {content.platform}
                      </h4>
                    </div>
                    <div className="text-sm opacity-90">Ready to use</div>
                  </div>
                </div>
                
                {/* Content Body */}
                <div className="p-6 bg-white">
                  <div className="mb-6">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <pre className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base font-medium">
                        {content.content}
                      </pre>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => copyToClipboard(content.content, content.platform)}
                      className={`px-6 py-3 rounded-xl transition-all duration-300 font-semibold flex items-center space-x-2 ${
                        copiedStates[content.platform]
                          ? 'bg-green-500 text-white cursor-default shadow-lg'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg transform hover:scale-105'
                      }`}
                      disabled={copiedStates[content.platform]}
                    >
                      {copiedStates[content.platform] ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copy Content</span>
                        </>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => downloadContent(content.content, content.platform)}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download</span>
                    </button>
                    
                    {/* content.platform === 'Podcast Script' && (
                      <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Play Audio</span>
                      </button>
                    ) */}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Success Message */}
     {/*  <div className="text-center p-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl mt-12 shadow-lg">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-green-800 mb-2">🎊 All Done!</h3>
        <p className="text-green-700 text-lg leading-relaxed">
          Your content is ready! Copy, download, or share it across your preferred platforms.
        </p>
      </div> */}

      {/* Action Buttons */}
      <div className="flex justify-center mt-8 mb-12">
        <button
          onClick={onBackToDashboard}
          className="px-10 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold text-lg flex items-center space-x-3"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
}
