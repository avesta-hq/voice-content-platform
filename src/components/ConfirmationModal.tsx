'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DocumentWithSessions } from '@/types';
import { DocumentService } from '@/lib/documentService';
import { getLanguageByCode } from '@/lib/languages';

interface ConfirmationModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing?: boolean;
}

export default function ConfirmationModal({ documentId, isOpen, onClose, onConfirm, isProcessing = false }: ConfirmationModalProps) {
  const [document, setDocument] = useState<DocumentWithSessions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadDocument = useCallback(async () => {
    try {
      setIsLoading(true);
      const doc = await DocumentService.getDocumentWithSessions(documentId);
      setDocument(doc);
    } catch (err) {
      setError('Failed to load document');
      console.error('Load document error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (isOpen && documentId) {
      loadDocument();
    }
  }, [isOpen, documentId, loadDocument]);

  const getCombinedTranscript = (): string => {
    if (!document) return '';
    return document.sessions
      .sort((a, b) => a.sessionNumber - b.sessionNumber) // Changed to ascending order for logical document flow
      .map(session => session.transcript)
      .join(' ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-white/80">
          <h2 className="text-2xl font-bold text-gray-800">🚀 Generate Blog Content</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] bg-white/60">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading document content...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : document ? (
            <div className="space-y-6">
              {/* Document Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{document.title}</div>
                    <div className="text-sm text-blue-600">Document Title</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{document.sessions.length}</div>
                    <div className="text-sm text-green-600">Total Sessions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{document.wordCount}</div>
                    <div className="text-sm text-purple-600">Total Words</div>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <span className="text-sm text-blue-600">
                    Language: {getLanguageByCode(document.inputLanguage)?.nativeName} → {getLanguageByCode(document.outputLanguage)?.nativeName}
                  </span>
                </div>
              </div>

              {/* Combined Transcript Preview */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">📝 Combined Content Preview</h3>
                <p className="text-sm text-gray-600 mb-3">
                  This is the complete content that will be processed for blog generation:
                </p>
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200/50 rounded-xl p-4 max-h-64 overflow-y-auto shadow-sm">
                  <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                    {getCombinedTranscript()}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Scroll to see full content • {document.wordCount} words total
                </p>
              </div>

              {/* What Will Be Generated */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-green-800 mb-2">🎯 What Will Be Generated</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center bg-white/50 p-3 rounded-lg">
                    <div className="text-lg">📘</div>
                    <div className="font-medium text-green-700">Blog Post</div>
                  </div>
                  <div className="text-center bg-white/50 p-3 rounded-lg">
                    <div className="text-lg">💼</div>
                    <div className="font-medium text-green-700">LinkedIn</div>
                  </div>
                  <div className="text-center bg-white/50 p-3 rounded-lg">
                    <div className="text-lg">🐦</div>
                    <div className="font-medium text-green-700">Twitter</div>
                  </div>
                  <div className="text-center bg-white/50 p-3 rounded-lg">
                    <div className="text-lg">🎙️</div>
                    <div className="font-medium text-green-700">Podcast</div>
                  </div>
                </div>
                <p className="text-sm text-green-700 mt-3 text-center">
                  AI will optimize your content for each platform while preserving your original message
                </p>
              </div>

              {/* Warning */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200/50 rounded-xl p-4 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="text-yellow-600 mt-0.5">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-yellow-800">Important Note</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Once you confirm, AI will process your content and generate platform-specific versions. 
                      You can always go back to edit your document and regenerate content later.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200/50 bg-white/80">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!document || isProcessing}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              document && !isProcessing
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:shadow-lg transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? 'Generating...' : 'Generate Blog Content'}
          </button>
        </div>
      </div>
    </div>
  );
}
