'use client';

import React from 'react';
import { PlatformContent } from '@/types';

interface ContentDisplayProps {
  originalText: string;
  generatedContent: PlatformContent[];
  onReset: () => void;
  onBackToDashboard: () => void;
}

export default function ContentDisplay({ originalText, generatedContent, onReset, onBackToDashboard }: ContentDisplayProps) {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Content Generation Complete!
        </h2>
        <p className="text-gray-600 mb-6">
          Your voice has been transformed into multiple content formats while preserving your original message.
        </p>
      </div>

      {/* Original Input Display */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Original Input:</h3>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-800">{originalText}</p>
        </div>
      </div>

      {/* Generated Content */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-800">Generated Content:</h3>
        
        {generatedContent.map((content, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="font-semibold text-gray-800 capitalize">
                {content.platform} Content
              </h4>
            </div>
            <div className="p-4">
              <div className="mb-3">
                <pre className="whitespace-pre-wrap text-gray-800 bg-gray-50 p-3 rounded border">
                  {content.content}
                </pre>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => copyToClipboard(content.content)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Copy
                </button>
                <button 
                  onClick={() => downloadContent(content.content, content.platform)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Download
                </button>
                {content.platform === 'podcast' && (
                  <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
                    Play Audio
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Success Message */}
      <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg mt-6">
        <p className="text-green-800 font-medium">
          Content generation complete! You can now copy, download, or share your content.
        </p>
      </div>
      <div className="flex justify-center space-x-4 mt-6">
        <button
          onClick={onBackToDashboard}
          className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
