'use client';

import React from 'react';
import { SUPPORTED_LANGUAGES, Language } from '@/lib/languages';
import { LanguageSettings } from '@/types';

interface LanguageSelectorProps {
  settings: LanguageSettings;
  onSettingsChange: (settings: LanguageSettings) => void;
  onStartRecording: () => void;
}

export default function LanguageSelector({ settings, onSettingsChange, onStartRecording }: LanguageSelectorProps) {
  const handleInputLanguageChange = (languageCode: string) => {
    onSettingsChange({
      ...settings,
      inputLanguage: languageCode
    });
  };

  const handleOutputLanguageChange = (languageCode: string) => {
    onSettingsChange({
      ...settings,
      outputLanguage: languageCode
    });
  };

  const getLanguageDisplay = (language: Language) => (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">{language.nativeName}</span>
      <span className="text-xs text-gray-500">({language.name})</span>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Language Selection
      </h2>
      
      <div className="space-y-6">
        {/* Input Language Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            🎤 Select Input Language (Speech)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SUPPORTED_LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => handleInputLanguageChange(language.code)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  settings.inputLanguage === language.code
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {getLanguageDisplay(language)}
              </button>
            ))}
          </div>
        </div>

        {/* Output Language Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            📝 Select Output Language (Content)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SUPPORTED_LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => handleOutputLanguageChange(language.code)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  settings.outputLanguage === language.code
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {getLanguageDisplay(language)}
              </button>
            ))}
          </div>
        </div>

        {/* Current Selection Display */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Selected Languages:</h4>
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="text-center">
              <span className="text-gray-600">Input:</span>
              <div className="font-medium text-blue-700">
                {SUPPORTED_LANGUAGES.find(l => l.code === settings.inputLanguage)?.nativeName || 'Not selected'}
              </div>
            </div>
            <div className="text-gray-400">→</div>
            <div className="text-center">
              <span className="text-gray-600">Output:</span>
              <div className="font-medium text-green-700">
                {SUPPORTED_LANGUAGES.find(l => l.code === settings.outputLanguage)?.nativeName || 'Not selected'}
              </div>
            </div>
          </div>
        </div>

        {/* Start Recording Button */}
        <div className="text-center">
          <button
            onClick={onStartRecording}
            disabled={!settings.inputLanguage || !settings.outputLanguage}
            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
              settings.inputLanguage && settings.outputLanguage
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {settings.inputLanguage && settings.outputLanguage
              ? '🎤 Start Recording'
              : 'Please select both languages'}
          </button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">💡 How it works:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• <strong>Input Language:</strong> The language you&apos;ll speak in</li>
            <li>• <strong>Output Language:</strong> The language for generated content</li>
            <li>• You can mix languages (e.g., speak in Gujarati, get content in English)</li>
            <li>• The system preserves your original meaning while translating</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
