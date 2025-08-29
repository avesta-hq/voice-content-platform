'use client';

import React, { useState, useEffect } from 'react';
import { DocumentWithSessions } from '@/types';
import { DocumentService } from '@/lib/documentService';
import { getLanguageByCode } from '@/lib/languages';

interface DocumentEditorProps {
  documentId: string;
  onBackToDashboard: () => void;
  onGenerateContent: (documentId: string) => void;
}

export default function DocumentEditor({ documentId, onBackToDashboard, onGenerateContent }: DocumentEditorProps) {
  const [document, setDocument] = useState<DocumentWithSessions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showSessionRecorder, setShowSessionRecorder] = useState(false);

  useEffect(() => {
    const loadDocument = async () => {
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
    };

    loadDocument();
  }, [documentId]); // Only depend on documentId

  const handleSessionComplete = async (transcript: string, duration: number) => {
    if (!document) return;

    try {
      // Calculate next session number locally instead of making an API call
      const nextSessionNumber = document.sessions.length + 1;
      
      const newSession = await DocumentService.addSession(documentId, {
        transcript,
        duration,
        sessionNumber: nextSessionNumber,
        notes: ''
      });
      
      // Update local state instead of reloading the entire document
      if (document) {
        setDocument(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            sessions: [...prev.sessions, newSession],
            totalDuration: prev.totalDuration + duration,
            wordCount: prev.wordCount + transcript.trim().split(/\s+/).length,
            updatedAt: new Date().toISOString()
          };
        });
      }
      
      setShowSessionRecorder(false);
    } catch (err) {
      setError('Failed to save session');
      console.error('Save session error:', err);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCombinedTranscript = (): string => {
    if (!document) return '';
    return document.sessions
      .sort((a, b) => a.sessionNumber - b.sessionNumber) // Changed to ascending order for logical document flow
      .map(session => session.transcript)
      .join(' ');
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-red-600">Document not found</p>
          <button
            onClick={onBackToDashboard}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const inputLang = getLanguageByCode(document.inputLanguage);
  const outputLang = getLanguageByCode(document.outputLanguage);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={onBackToDashboard}
            className="text-blue-600 hover:text-blue-700 mb-2 flex items-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{document.title}</h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowSessionRecorder(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            + Add Session
          </button>
          <button
            onClick={() => onGenerateContent(documentId)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Generate Blog
          </button>
        </div>
      </div>

      {/* Document Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{document.sessions.length}</div>
          <div className="text-sm text-gray-600">Sessions</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">{formatDuration(document.totalDuration)}</div>
          <div className="text-sm text-gray-600">Total Duration</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-purple-600">{document.wordCount}</div>
          <div className="text-sm text-gray-600">Total Words</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-sm text-gray-600">Language</div>
          <div className="text-sm font-medium">
            {inputLang?.nativeName} → {outputLang?.nativeName}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Session Recorder */}
      {showSessionRecorder && (
        <div className="mb-8">
          <SessionRecorder
            inputLanguage={document.inputLanguage}
            onSessionComplete={handleSessionComplete}
            onCancel={() => setShowSessionRecorder(false)}
          />
        </div>
      )}

      {/* Combined Content Preview */}
      {document.sessions.length > 0 && (
        <div className="mb-8 bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Combined Content Preview</h2>
            <p className="text-gray-600 mt-1">
              This is how your content will look when combined for blog generation
            </p>
          </div>
          <div className="p-6">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              <p className="text-gray-800 whitespace-pre-wrap">
                {getCombinedTranscript()}
              </p>
            </div>
            <div className="mt-4 text-sm text-gray-500 text-center">
              Total: {document.wordCount} words • {formatDuration(document.totalDuration)} duration
            </div>
          </div>
        </div>
      )}

      {/* Session History */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Session History</h2>
          <p className="text-gray-600 mt-1">
            All recorded sessions for this document (read-only)
          </p>
        </div>

        {document.sessions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
            <p className="text-gray-500 mb-4">Start recording your first session to build your document</p>
            <button
              onClick={() => setShowSessionRecorder(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Record First Session
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {document.sessions
              .sort((a, b) => b.sessionNumber - a.sessionNumber) // Changed to descending order
              .map((session) => (
                <div key={session.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        {session.sessionNumber}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Session {session.sessionNumber}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(session.timestamp)} • {formatDuration(session.duration)}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {session.transcript.trim().split(/\s+/).length} words
                    </div>
                  </div>

                  {/* Session Content */}
                  <div className="mb-4">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {session.transcript}
                      </p>
                    </div>
                  </div>

                  {/* Session Notes */}
                  {session.notes && (
                    <div className="mb-4">
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <span className="font-medium">Notes:</span> {session.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Import SessionRecorder component
import SessionRecorder from './SessionRecorder';
