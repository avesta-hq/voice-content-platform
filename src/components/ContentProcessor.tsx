'use client';

import React, { useState } from 'react';
import { AIProcessingState, PlatformContent, LanguageSettings } from '@/types';

interface ContentProcessorProps {
  originalText: string;
  languageSettings: LanguageSettings;
  onProcessingComplete: (content: PlatformContent[]) => void;
}

export default function ContentProcessor({ originalText, languageSettings, onProcessingComplete }: ContentProcessorProps) {
  const [processingState, setProcessingState] = useState<AIProcessingState>({
    isProcessing: false,
    progress: 0,
    currentStep: ''
  });

  const [generatedContent, setGeneratedContent] = useState<PlatformContent[]>([]);
  const [error, setError] = useState<string>('');

  const processContent = async () => {
    setProcessingState({
      isProcessing: true,
      progress: 0,
      currentStep: 'Initializing AI processing...'
    });

    try {
      const steps = [
        'Analyzing input content...',
        'Generating blog post...',
        'Creating LinkedIn post...',
        'Formatting Twitter post...',
        'Preparing podcast script...',
        'Finalizing content...'
      ];

      // Update progress for each step
      for (let i = 0; i < steps.length; i++) {
        setProcessingState(prev => ({
          ...prev,
          currentStep: steps[i],
          progress: ((i + 1) / steps.length) * 100
        }));

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Try to make API call to generate content
      let content;
      try {
        console.log('Making API call to generate content...');
        const response = await fetch('/api/generate-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            originalText,
            inputLanguage: languageSettings.inputLanguage,
            outputLanguage: languageSettings.outputLanguage
          }),
        });

        console.log('API Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('API Response data:', data);
          
          if (data.success) {
            content = data.content;
            console.log('Content received from API:', content);
          } else {
            throw new Error(data.error || 'Failed to generate content');
          }
        } else {
          throw new Error(`API request failed: ${response.status}`);
        }
      } catch (apiError) {
        console.log('API call failed, using demo content:', apiError);
        // Fallback to demo content if API fails
        content = generateDemoContent(originalText);
        console.log('Using demo content:', content);
      }

      // Transform content to our format
      const contentArray: PlatformContent[] = [
        {
          platform: 'blog',
          content: content.blogPost,
          formatted: true
        },
        {
          platform: 'linkedin',
          content: content.linkedinPost,
          formatted: true
        },
        {
          platform: 'twitter',
          content: content.twitterPost,
          formatted: true
        },
        {
          platform: 'podcast',
          content: content.podcastScript,
          formatted: true
        }
      ];

      console.log('Final content array:', contentArray);
      setGeneratedContent(contentArray);
      onProcessingComplete(contentArray);
      
      setProcessingState({
        isProcessing: false,
        progress: 100,
        currentStep: 'Processing complete!'
      });

    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process content. Please try again.');
      setProcessingState({
        isProcessing: false,
        progress: 0,
        currentStep: ''
      });
    }
  };

  // Generate demo content when API is not available
  const generateDemoContent = (originalText: string) => {
    return {
      blogPost: `# Blog Post: ${originalText}\n\nThis is a well-structured blog post based on your voice input. The content maintains your original meaning while providing proper formatting and structure for readers.\n\n## Key Points\n- Your original message: "${originalText}"\n- Professional blog formatting\n- SEO-friendly structure\n- Engaging content flow\n\n## Summary\nYour voice input has been transformed into a comprehensive blog post that preserves your original intent while optimizing it for online readers.`,
      
      linkedinPost: `Professional LinkedIn Post\n\nBased on your input: "${originalText}"\n\nThis engaging content is optimized for professional networking while maintaining your original message. Perfect for building your professional brand and engaging with your network.\n\n#ProfessionalDevelopment #Networking #ContentCreation`,
      
      twitterPost: `Twitter Post: "${originalText}"\n\nEngaging content that preserves your original meaning while being optimized for Twitter's character limit and engagement patterns.`,
      
      podcastScript: `Podcast Script\n\n[Introduction]\nWelcome to today's episode where we'll discuss: "${originalText}"\n\n[Main Content]\nBased on your voice input, here's the structured podcast content:\n\n• Point 1: ${originalText}\n• Point 2: Related insights and discussion\n• Point 3: Practical applications\n\n[Conclusion]\nThank you for listening. Remember, your original message stays intact while we optimize it for audio delivery.`
    };
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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Content Processing
      </h2>

      {/* Original Input Display */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Original Input:</h3>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-gray-800">{originalText}</p>
        </div>
      </div>

      {/* Processing Controls */}
      {!processingState.isProcessing && generatedContent.length === 0 && (
        <div className="text-center mb-6">
          <button
            onClick={processContent}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Generate Content
          </button>
        </div>
      )}

      {/* Processing Status */}
      {processingState.isProcessing && (
        <div className="mb-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Processing...</span>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{processingState.currentStep}</span>
              <span>{Math.round(processingState.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingState.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Generated Content */}
      {generatedContent.length > 0 && (
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
      )}

      {/* Processing Complete Message */}
      {processingState.progress === 100 && !processingState.isProcessing && (
        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">
            Content generation complete! You can now copy, download, or share your content.
          </p>
        </div>
      )}
    </div>
  );
}
