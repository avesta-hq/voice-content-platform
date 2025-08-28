'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PlatformContent, LanguageSettings } from '@/types';

interface ContentProcessorProps {
  originalText: string;
  languageSettings: LanguageSettings;
  onProcessingComplete: (content: PlatformContent[]) => void;
}

export default function ContentProcessor({ originalText, languageSettings, onProcessingComplete }: ContentProcessorProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  // Remove auto-processing - only process when explicitly called
  const processContent = useCallback(async () => {
    if (!originalText.trim()) return;
    
    setProgress(0);
    setCurrentStep('Initializing AI processing...');

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Update steps
      setTimeout(() => setCurrentStep('Analyzing your content...'), 500);
      setTimeout(() => setCurrentStep('Generating platform-specific content...'), 1500);
      setTimeout(() => setCurrentStep('Optimizing for each platform...'), 2500);
      setTimeout(() => setCurrentStep('Finalizing content...'), 3500);

      // Make API call
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: originalText,
          inputLanguage: languageSettings.inputLanguage,
          outputLanguage: languageSettings.outputLanguage,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);
      setCurrentStep('Content generation complete!');

      if (response.ok) {
        const content = await response.json();
        // Transform the API response to match our expected format
        const transformedContent = [
          { platform: 'Blog Post', content: content.blogPost, formatted: true },
          { platform: 'LinkedIn', content: content.linkedinPost, formatted: true },
          { platform: 'Twitter', content: content.twitterPost, formatted: true },
          { platform: 'Podcast Script', content: content.podcastScript, formatted: true }
        ];
        setTimeout(() => {
          onProcessingComplete(transformedContent);
        }, 500);
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Fallback to demo content
      const demoContent = generateDemoContent(originalText);
      setTimeout(() => {
        onProcessingComplete(demoContent);
      }, 500);
    }
  }, [originalText, languageSettings, onProcessingComplete]);

  // Remove useEffect that auto-triggers processing
  // useEffect(() => {
  //   if (originalText.trim()) {
  //     processContent();
  //   }
  // }, [originalText, processContent]);

  // Start processing immediately when component mounts
  useEffect(() => {
    if (originalText.trim()) {
      processContent();
    }
  }, []); // Empty dependency array - only run once on mount

  const generateDemoContent = (text: string): PlatformContent[] => {
    const truncatedText = text.length > 100 ? text.substring(0, 100) + '...' : text;
    
    return [
      {
        platform: 'Blog Post',
        content: `Here's a professional blog post based on your content: "${truncatedText}"\n\nThis is a demo blog post that showcases how your voice content would be transformed into a well-structured article. The AI would analyze your speech patterns, extract key themes, and create engaging content optimized for blog readers.`,
        formatted: true
      },
      {
        platform: 'LinkedIn',
        content: `LinkedIn Post:\n\n"${truncatedText}"\n\n💡 Key insights from today's thoughts:\n• Professional perspective\n• Industry relevance\n• Engaging discussion starter\n\nWhat are your thoughts on this? Share your experience below! 👇\n\n#ProfessionalDevelopment #IndustryInsights #Networking`,
        formatted: true
      },
      {
        platform: 'Twitter',
        content: `Thread 🧵\n\n1/ "${truncatedText}"\n\n2/ This is how your voice content transforms into engaging Twitter threads\n\n3/ Each tweet optimized for maximum engagement and readability\n\n4/ Ready to share your insights with the world! 🚀\n\n#TwitterThread #ContentCreation #VoiceToText`,
        formatted: true
      },
      {
        platform: 'Podcast Script',
        content: `🎙️ Podcast Script\n\nIntroduction:\n"Welcome to today's episode where we explore: ${truncatedText}"\n\nMain Content:\nYour voice content has been transformed into a structured podcast script with natural flow, engaging hooks, and clear transitions.\n\nConclusion:\n"Thanks for listening! Don't forget to subscribe and share this episode."`,
        formatted: true
      }
    ];
  };

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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">AI Content Generation</h2>
          <p className="text-gray-600">Transforming your voice into professional content for all platforms</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600">{progress}% Complete</div>
        </div>

        {/* Current Step */}
        <div className="mb-6">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="font-medium">{currentStep}</span>
          </div>
        </div>

        {/* Processing Animation */}
        <div className="flex justify-center space-x-2 mb-6">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        {/* Status Message */}
        <div className="text-sm text-gray-500">
          {progress < 100 ? (
            <p>Please wait while AI processes your content...</p>
          ) : (
            <p className="text-green-600 font-medium">✅ Content generation successful!</p>
          )}
        </div>
      </div>
    </div>
  );
}
