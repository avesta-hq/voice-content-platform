'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserDocument } from '@/types';
import { DocumentService } from '@/lib/documentService';
import { UserService } from '@/lib/userService';
import { getLanguageByCode } from '@/lib/languages';

interface DocumentDashboardProps {
  onCreateNew: () => void;
  onEditDocument: (documentId: string) => void;
  onGenerateContent: (documentId: string) => void;
}

export default function DocumentDashboard({ onCreateNew, onEditDocument, onGenerateContent }: DocumentDashboardProps) {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const hasLoadedRef = useRef(false);

  const loadDocuments = useCallback(async () => {
    // Prevent multiple API calls
    if (hasLoadedRef.current) {
      console.log('🚫 Documents already loaded, skipping API call');
      return;
    }
    
    try {
      console.log('🔄 Loading documents...'); // Debug log
      hasLoadedRef.current = true;
      setIsLoading(true);
      const currentUser = UserService.getCurrentUser();
      if (currentUser) {
        console.log('👤 Current user:', currentUser.id); // Debug log
        const userDocs = await DocumentService.getUserDocuments(currentUser.id);
        console.log('📚 Documents loaded:', userDocs.length); // Debug log
        setDocuments(userDocs);
      }
    } catch (err) {
      setError('Failed to load documents');
      console.error('Load documents error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to manually refresh documents (for delete operations)
  const refreshDocuments = useCallback(async () => {
    try {
      console.log('🔄 Refreshing documents...'); // Debug log
      setIsLoading(true);
      const currentUser = UserService.getCurrentUser();
      if (currentUser) {
        const userDocs = await DocumentService.getUserDocuments(currentUser.id);
        console.log('📚 Documents refreshed:', userDocs.length); // Debug log
        setDocuments(userDocs);
      }
    } catch (err) {
      setError('Failed to refresh documents');
      console.error('Refresh documents error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🚀 DocumentDashboard useEffect triggered, hasLoadedRef.current:', hasLoadedRef.current);
    // Only load documents once when component mounts
    if (!hasLoadedRef.current) {
      loadDocuments();
    }
  }, []); // Remove loadDocuments dependency to prevent infinite loops

  const handleDeleteDocument = async (documentId: string) => {
    // Get document title for confirmation
    const document = documents.find(doc => doc.id === documentId);
    const documentTitle = document?.title || 'this document';
    
    if (window.confirm(`Are you sure you want to delete "${documentTitle}"?\n\nThis action will permanently remove the document and all its sessions. This cannot be undone.`)) {
      try {
        await DocumentService.deleteDocument(documentId);
        await refreshDocuments(); // Use refresh instead of loadDocuments
      } catch (err) {
        setError('Failed to delete document');
        console.error('Delete document error:', err);
      }
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

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Documents</h1>
          <p className="text-gray-600 mt-2">Create, edit, and manage your voice content documents</p>
        </div>
        <button
          onClick={onCreateNew}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
        >
          <span>+</span>
          <span>Create New Document</span>
        </button>
      </div>

      {/* Search - Only show when there are documents */}
      {filteredDocuments.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search documents by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
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

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-500 mb-6">Create your first document to get started with voice content creation</p>
          <button
            onClick={onCreateNew}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Your First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => {
            const inputLang = getLanguageByCode(document.inputLanguage);
            const outputLang = getLanguageByCode(document.outputLanguage);
            
            return (
              <div key={document.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 flex flex-col h-full">
                <div className="p-6 flex-1 flex flex-col">
                  {/* Document Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                        {document.title}
                      </h3>
                    </div>
                    <div className="ml-3">
                      <button
                        onClick={() => handleDeleteDocument(document.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Delete document"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Language Info */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>🌍</span>
                      <span>{getLanguageByCode(document.inputLanguage || 'en')?.nativeName || getLanguageByCode(document.inputLanguage || 'en')?.name || 'Unknown'}</span>
                      <span>→</span>
                      <span>{getLanguageByCode(document.outputLanguage || 'en')?.nativeName || getLanguageByCode(document.outputLanguage || 'en')?.name || 'Unknown'}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-gray-800">{document.sessions?.length || 0}</div>
                      <div className="text-gray-500">Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-800">{formatDuration(document.totalDuration || 0)}</div>
                      <div className="text-gray-500">Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-800">{document.wordCount || 0}</div>
                      <div className="text-gray-500">Words</div>
                    </div>
                  </div>

                  {/* Date Info */}
                  <div className="text-xs text-gray-500 mb-4">
                    Created: {formatDate(document.createdAt || new Date().toISOString())}
                  </div>

                  {/* Action Buttons - Fixed at bottom */}
                  <div className="mt-auto flex space-x-2">
                    <button
                      onClick={() => onEditDocument(document.id)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Edit Document
                    </button>
                    <button
                      onClick={() => onGenerateContent(document.id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Generate Blog
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
