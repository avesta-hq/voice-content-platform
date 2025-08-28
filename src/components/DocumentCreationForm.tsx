'use client';

import React, { useState } from 'react';
import { CreateDocumentData } from '@/types';
import { DocumentService } from '@/lib/documentService';
import { UserService } from '@/lib/userService';
import { SUPPORTED_LANGUAGES } from '@/lib/languages';

interface DocumentCreationFormProps {
  onDocumentCreated: (documentId: string) => void;
  onCancel: () => void;
}

export default function DocumentCreationForm({ onDocumentCreated, onCancel }: DocumentCreationFormProps) {
  const [formData, setFormData] = useState<CreateDocumentData>({
    title: '',
    description: '',
    inputLanguage: 'gu',
    outputLanguage: 'en'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [titleError, setTitleError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTitleError('');

    // Validation
    if (!formData.title.trim()) {
      setTitleError('Title is required');
      return;
    }

    if (formData.title.trim().length < 3) {
      setTitleError('Title must be at least 3 characters long');
      return;
    }

    try {
      setIsLoading(true);
      const currentUser = UserService.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Check title uniqueness
      const isUnique = await DocumentService.isTitleUnique(currentUser.id, formData.title);
      if (!isUnique) {
        setTitleError('A document with this title already exists');
        return;
      }

      // Create document
      const newDocument = await DocumentService.createDocument(currentUser.id, formData);
      onDocumentCreated(newDocument.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateDocumentData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear title error when user starts typing
    if (field === 'title') {
      setTitleError('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Create New Document</h2>
        <p className="text-gray-600 mt-2">
          Set up your document and start recording your first voice session
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Document Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              titleError ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter a descriptive title for your document"
            required
          />
          {titleError && (
            <p className="mt-1 text-sm text-red-600">{titleError}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Choose a unique title that describes your content
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Brief description of what this document will contain..."
          />
          <p className="mt-1 text-xs text-gray-500">
            Optional: Add context about your document&apos;s purpose
          </p>
        </div>

        {/* Language Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Language */}
          <div>
            <label htmlFor="inputLanguage" className="block text-sm font-medium text-gray-700 mb-2">
              🎤 Input Language (Speech)
            </label>
            <select
              id="inputLanguage"
              value={formData.inputLanguage}
              onChange={(e) => handleInputChange('inputLanguage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {SUPPORTED_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.nativeName} ({language.name})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              The language you&apos;ll speak in
            </p>
          </div>

          {/* Output Language */}
          <div>
            <label htmlFor="outputLanguage" className="block text-sm font-medium text-gray-700 mb-2">
              📝 Output Language (Content)
            </label>
            <select
              id="outputLanguage"
              value={formData.outputLanguage}
              onChange={(e) => handleInputChange('outputLanguage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {SUPPORTED_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.nativeName} ({language.name})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              The language for generated content
            </p>
          </div>
        </div>

        {/* Language Display */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-center">
            <h4 className="font-semibold text-blue-800 mb-2">Language Configuration</h4>
            <div className="flex items-center justify-center space-x-4 text-sm">
              <div className="text-center">
                <span className="text-gray-600">Input:</span>
                <div className="font-medium text-blue-700">
                  {SUPPORTED_LANGUAGES.find(l => l.code === formData.inputLanguage)?.nativeName || 'Not selected'}
                </div>
              </div>
              <div className="text-gray-400">→</div>
              <div className="text-center">
                <span className="text-gray-600">Output:</span>
                <div className="font-medium text-green-700">
                  {SUPPORTED_LANGUAGES.find(l => l.code === formData.outputLanguage)?.nativeName || 'Not selected'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Creating...' : 'Create Document & Start Recording'}
          </button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">💡 What happens next?</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Your document will be created with the selected settings</li>
            <li>• You&apos;ll immediately start recording your first voice session</li>
            <li>• You can add more sessions later to build your content</li>
            <li>• Once complete, generate blog content for all platforms</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
