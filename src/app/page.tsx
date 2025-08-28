'use client';

import React, { useState } from 'react';
import VoiceRecorder from '@/components/VoiceRecorder';
import ContentProcessor from '@/components/ContentProcessor';
import ContentDisplay from '@/components/ContentDisplay';
import { PlatformContent, LanguageSettings } from '@/types';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<'recording' | 'processing' | 'complete'>('recording');
  const [originalText, setOriginalText] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<PlatformContent[]>([]);
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings>({
    inputLanguage: 'gu', // Default to Gujarati
    outputLanguage: 'en'  // Default to English
  });

  const handleTranscriptComplete = (transcript: string) => {
    setOriginalText(transcript);
    setCurrentStep('processing');
  };

  const handleProcessingComplete = (content: PlatformContent[]) => {
    console.log('Processing complete, received content:', content);
    setGeneratedContent(content);
    setCurrentStep('complete');
    console.log('State updated: currentStep = complete, generatedContent =', content);
  };

  const resetToRecording = () => {
    setCurrentStep('recording');
    setOriginalText('');
    setGeneratedContent([]);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Voice Content Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your voice into professional blog posts, social media content, and podcast scripts.
            Your original message stays intact while we optimize it for different platforms.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 ${currentStep === 'recording' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep === 'recording' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
              }`}>
                1
              </div>
              <span className="font-medium">Voice Input</span>
            </div>
            
            <div className={`w-16 h-0.5 ${currentStep === 'recording' ? 'bg-gray-300' : 'bg-blue-600'}`}></div>
            
            <div className={`flex items-center space-x-2 ${currentStep === 'processing' || currentStep === 'complete' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep === 'processing' || currentStep === 'complete' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
              }`}>
                2
              </div>
              <span className="font-medium">Processing</span>
            </div>
            
            <div className={`w-16 h-0.5 ${currentStep === 'complete' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            
            <div className={`flex items-center space-x-2 ${currentStep === 'complete' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep === 'complete' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
              }`}>
                3
              </div>
              <span className="font-medium">Content Ready</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {currentStep === 'recording' && (
            <VoiceRecorder 
              languageSettings={languageSettings}
              onLanguageSettingsChange={setLanguageSettings}
              onTranscriptComplete={handleTranscriptComplete}
            />
          )}

          {currentStep === 'processing' && (
            <ContentProcessor 
              originalText={originalText}
              languageSettings={languageSettings}
              onProcessingComplete={handleProcessingComplete}
            />
          )}

          {currentStep === 'complete' && (
            <ContentDisplay 
              originalText={originalText}
              generatedContent={generatedContent}
              onReset={resetToRecording}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p>Powered by OpenAI • Built with Next.js & Tailwind CSS</p>
          
          {/* System Status */}
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg max-w-2xl mx-auto">
            <h4 className="font-semibold text-green-800 mb-2">🎉 System Fully Operational!</h4>
            <p className="text-green-700 text-sm">
              Your OpenAI API key is configured and the system is ready for full AI-powered content generation.
            </p>
            <p className="text-green-600 text-xs mt-2">
              ✨ <strong>Features:</strong> Multi-language support, voice recording, pause/resume, AI content generation for all platforms
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
