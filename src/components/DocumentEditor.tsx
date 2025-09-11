'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DocumentWithSessions, GeneratedOutline, VoiceSession } from '@/types';
import { DocumentService } from '@/lib/documentService';
import { getLanguageByCode } from '@/lib/languages';

interface DocumentEditorProps {
  documentId: string;
  onBackToDashboard: () => void;
  onGenerateContent: (documentId: string) => void;
  onViewContent?: (documentId: string) => void;
}

export default function DocumentEditor({ documentId, onBackToDashboard, onGenerateContent, onViewContent }: DocumentEditorProps) {
  const [document, setDocument] = useState<DocumentWithSessions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showSessionRecorder, setShowSessionRecorder] = useState(false);
  const [hasChangesAfterGeneration, setHasChangesAfterGeneration] = useState(false); // retained for future use
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const hasLoadedRef = useRef<string | null>(null);
  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [isStatusChanging, setIsStatusChanging] = useState<boolean>(false);
  // Outline generation state
  const [isOutlineModalOpen, setIsOutlineModalOpen] = useState(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [outline, setOutline] = useState<GeneratedOutline | null>(null);
  const [replaceOldOutlineSessions] = useState<boolean>(false);

  const generateOutlineNow = async () => {
    try {
      setOutline(null);
      setIsOutlineModalOpen(true);
      setIsGeneratingOutline(true);
      const res = await fetch('/api/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Omit maxItems to allow OPENAI_OUTLINE_MAX_ITEMS env to control default
        body: JSON.stringify({ documentId, platform: 'blog' })
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      setOutline(data.outline as GeneratedOutline);
    } catch (e) {
      alert('Failed to generate outline');
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setIsLoading(true);
        setError(''); // Clear any previous errors
        const doc = await DocumentService.getDocumentWithSessions(documentId);
        setDocument(doc);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load document';
        setError(`Failed to load document: ${errorMessage}. This might be due to S3 eventual consistency. Please try refreshing.`);
        console.error('Load document error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Guard to avoid duplicate effect runs (e.g., React StrictMode in dev)
    if (hasLoadedRef.current !== documentId) {
      hasLoadedRef.current = documentId;
      loadDocument();
    }
  }, [documentId]); // Only depend on documentId

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const handleSessionDelete = async (sessionId: string) => {
    if (!document) return;
    const confirm = window.confirm('Are you sure you want to delete this session? This action cannot be undone.');
    if (!confirm) return;

    try {
      const res = await fetch(`/api/voiceSessions/${sessionId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to delete session: ${res.status}`);

      // Update local state
      setDocument(prev => {
        if (!prev) return prev;
        const remaining = prev.sessions.filter(s => s.id !== sessionId);
        const totalDuration = remaining.reduce((sum, s) => sum + s.duration, 0);
        const wordCount = remaining.reduce((sum, s) => sum + s.transcript.trim().split(/\s+/).length, 0);
        return {
          ...prev,
          sessions: remaining,
          totalDuration,
          wordCount,
          updatedAt: new Date().toISOString(),
        };
      });

      // Mark as changed since last generation (for UI buttons)
      setHasChangesAfterGeneration(true);
      showToast('success', 'Session deleted successfully');
    } catch (e) {
      console.error(e);
      showToast('error', e instanceof Error ? e.message : 'Failed to delete session');
    }
  };

  const handleSessionComplete = async (transcript: string, duration: number, notes?: string) => {
    if (!document) return;

    try {
      // Calculate next session number locally instead of making an API call
      const nextSessionNumber = document.sessions.length + 1;
      
      const newSession = await DocumentService.addSession(documentId, {
        transcript,
        duration,
        sessionNumber: nextSessionNumber,
        notes: notes || ''
      });
      
      // Mark as changed since last generation
      setHasChangesAfterGeneration(true);
      
      // Update local state instead of reloading the entire document
      if (document) {
        setDocument(prev => {
          if (!prev) return prev;
          const updatedSessions = [...prev.sessions, newSession];
          const totalDuration = updatedSessions.reduce((sum, s) => sum + s.duration, 0);
          const wordCount = updatedSessions.reduce((sum, s) => sum + s.transcript.trim().split(/\s+/).length, 0);
          return {
            ...prev,
            sessions: updatedSessions,
            totalDuration,
            wordCount,
            updatedAt: new Date().toISOString()
          };
        });
      }
      
      setShowSessionRecorder(false);
      showToast('success', 'Session saved');
    } catch (err) {
      setError('Failed to save session');
      console.error('Save session error:', err);
      showToast('error', 'Failed to save session');
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
    const parts = document.sessions
      .sort((a, b) => a.sessionNumber - b.sessionNumber)
      .map((session) => {
        const hasTitle = !!(session.title && session.title.trim().length > 0);
        const body = session.transcript?.trim() || '';
        // Always keep title with its description to form best input for final generation
        return hasTitle ? `${session.title!.trim()}\n\n${body}` : body;
      })
      .filter(Boolean);
    return parts.join('\n\n');
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
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry Loading
            </button>
            <button
              onClick={onBackToDashboard}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inputLang = getLanguageByCode(document.inputLanguage);
  const outputLang = getLanguageByCode(document.outputLanguage);

  const isCompleted = (document.status || 'draft') === 'completed';

  return (
    <div className="relative max-w-6xl mx-auto p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
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
          {/* Completed: read-only header actions */}
          {isCompleted ? (
            <>
              {document.hasGeneratedContent && document.generatedContent && (
                <button
                  onClick={() => onViewContent && onViewContent(documentId)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                >
                  View Content
                </button>
              )}
              {/* Status switch (Completed -> Draft) */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                <span className="text-xs text-gray-600">Status</span>
                <span className="text-xs text-gray-500">Draft</span>
                <button
                  role="switch"
                  aria-checked={true}
                  aria-label="Toggle document status"
                  disabled={isStatusChanging}
                  onClick={async () => {
                    try {
                      setIsStatusChanging(true);
                      await DocumentService.markDocumentDraft(documentId);
                      // Update local state without full reload
                      setDocument(prev => (prev ? { ...prev, status: 'draft' } : prev));
                    } catch (e) {
                      alert('Failed to move back to draft');
                    } finally {
                      setIsStatusChanging(false);
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${isStatusChanging ? 'bg-emerald-400 opacity-80' : 'bg-emerald-600'} transition-colors`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition translate-x-5`} />
                </button>
                <span className="text-xs text-gray-900">Completed</span>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowSessionRecorder(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                + Add Session
              </button>
              {document.sessions.length > 0 && (
                <button
                  onClick={generateOutlineNow}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  title="Generate a structured outline from your sessions"
                >
                  Generate Outline
                </button>
              )}
              {/* Actions: always allow Generate if sessions exist; View when content exists */}
              {document.sessions.length > 0 && (
                <button
                  onClick={() => onGenerateContent(documentId)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  title="Generate content (overwrites saved content if present)"
                >
                  Generate Content
                </button>
              )}
              {document.hasGeneratedContent && document.generatedContent && (
                <button
                  onClick={() => onViewContent && onViewContent(documentId)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                >
                  View Content
                </button>
              )}
              {/* Status switch (Draft -> Completed) - only if generated once */}
              {document.hasGeneratedContent && (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                  <span className="text-xs text-gray-600">Status</span>
                  <span className="text-xs text-gray-500">Draft</span>
                  <button
                    role="switch"
                    aria-checked={false}
                    aria-label="Toggle document status"
                    aria-disabled={isStatusChanging}
                    disabled={isStatusChanging}
                    onClick={async () => {
                      if (isStatusChanging) return;
                      try {
                        setIsStatusChanging(true);
                        await DocumentService.markDocumentCompleted(documentId);
                        setDocument(prev => (prev ? { ...prev, status: 'completed' } : prev));
                      } catch (e) {
                        alert('Failed to mark as completed');
                      } finally {
                        setIsStatusChanging(false);
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isStatusChanging ? 'bg-gray-200 opacity-60 cursor-not-allowed' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition translate-x-1`} />
                  </button>
                  <span className="text-xs text-gray-900">Completed</span>
                </div>
              )}
            </>
          )}
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
      {!isCompleted && showSessionRecorder && (
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
            <div className="mb-2 text-sm text-gray-600">Final-style preview (for reference only)</div>
            <div className="max-h-64 overflow-y-auto p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <ol className="list-decimal pl-6 space-y-3">
                {document.sessions
                  .sort((a, b) => a.sessionNumber - b.sessionNumber)
                  .map((session) => {
                    const title = (session.title && session.title.trim()) || `Section ${session.sessionNumber}`;
                    const body = (session.transcript || '').trim();
                    // Heuristic: split first paragraph as description; remaining lines as bullets
                    const split = body.split(/\n{2,}/);
                    const description = split[0] || '';
                    const rest = split.slice(1).join('\n');
                    const bullets = rest ? rest.split(/\n+/).filter(Boolean) : [];
                    return (
                      <li key={session.id}>
                        <div className="font-semibold text-gray-900">{title}</div>
                        {description && (
                          <div className="mt-1 text-gray-800">{description}</div>
                        )}
                        {bullets.length > 0 && (
                          <ul className="list-disc pl-5 mt-1 text-gray-800">
                            {bullets.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
              </ol>
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
              .sort((a, b) => a.sessionNumber - b.sessionNumber) // Ascending order
              .map((session) => (
                <div key={session.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        {session.sessionNumber}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                          {session.title && session.title.trim().length > 0
                            ? session.title
                            : `Session ${session.sessionNumber}`}
                          {/* Edited badge for outline sessions when title differs from original outline title stored in notes */}
                          {session.origin === 'outline' && session.title && session.notes && session.notes.startsWith('Outline:') && session.title.trim() !== session.notes.replace(/^Outline:\s*/, '').trim() && (
                            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-200">Edited</span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(session.timestamp)} • {formatDuration(session.duration)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 gap-1 sm:gap-2">
                      <span>{session.transcript.trim().split(/\s+/).length} words</span>
                      {!isCompleted && (
                        <>
                          <button
                            onClick={() => setEditSessionId(session.id)}
                            className="text-blue-600 hover:text-blue-700 transition-colors p-1 icon-button"
                            title={`Edit ${session.title && session.title.trim() ? session.title : `session ${session.sessionNumber}`}`}
                            aria-label={`Edit ${session.title && session.title.trim() ? session.title : `session ${session.sessionNumber}`}`}
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleSessionDelete(session.id)}
                            className="text-red-500 hover:text-red-600 transition-colors p-1 icon-button"
                            title={`Delete ${session.title && session.title.trim() ? session.title : `session ${session.sessionNumber}`}`}
                            aria-label={`Delete ${session.title && session.title.trim() ? session.title : `session ${session.sessionNumber}`}`}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Session Content */}
                  <div className="mb-4">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {session.transcript && session.transcript.trim().length > 0 ? (
                          session.transcript
                        ) : (
                          <span className="text-gray-400 italic">No transcript yet — add your input here. Use the notes below as hints.</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Session Notes (for user reference only; not used in generation) */}
                  {session.notes && session.notes.trim().length > 0 && (
                    <div className="mt-2">
                      {(() => {
                        const raw = session.notes.trim();
                        const hasSeparator = raw.includes('\n\n');
                        const [descPart, bulletsPart] = hasSeparator ? raw.split('\n\n', 2) : [raw, ''];
                        const description = (descPart || '').trim();
                        const bullets = (bulletsPart || '')
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean);
                        return (
                          <div>
                            {description && (
                              <p className="text-xs text-gray-500 italic font-serif whitespace-pre-wrap">{description}</p>
                            )}
                            {bullets.length > 0 && (
                              <ul className="list-disc pl-5 mt-1 text-xs text-gray-500 italic font-serif">
                                {bullets.map((b, i) => (
                                  <li key={i}>{b}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
      {editSessionId && document && (
        <SessionEditModal
          open={true}
          session={document.sessions.find(s => s.id === editSessionId)!}
          inputLanguage={document.inputLanguage}
          onClose={() => setEditSessionId(null)}
          onSaved={(updated) => {
            setDocument(prev => {
              if (!prev) return prev;
              const updatedSessions = prev.sessions.map(s => s.id === updated.id ? updated : s);
              const totalDuration = updatedSessions.reduce((sum, s) => sum + s.duration, 0);
              const wordCount = updatedSessions.reduce((sum, s) => sum + s.transcript.trim().split(/\s+/).length, 0);
              return { ...prev, sessions: updatedSessions, totalDuration, wordCount, updatedAt: new Date().toISOString() };
            });
            setHasChangesAfterGeneration(true);
            showToast('success', 'Session updated');
          }}
        />
      )}

      {/* Outline Modal */}
      {isOutlineModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl mx-4">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-lg font-semibold">Generate Outline</h4>
              <button onClick={() => setIsOutlineModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {!outline && (
                <div className="py-10 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-200 border-t-purple-600 mx-auto mb-3"></div>
                  <div className="text-sm text-gray-700">Generating outline…</div>
                </div>
              )}

              {outline && (
                <>
                  <div className="mb-2 text-sm text-gray-600">Outline preview ({outline.items.length} items). Nothing will be created until you confirm.</div>
                  <div className="max-h-72 overflow-auto border border-gray-200 rounded-md">
                    <ul className="divide-y divide-gray-200">
                      {outline.items.map((it) => (
                        <li key={it.id} className="p-3">
                          <div className="font-medium text-gray-900">{it.title}</div>
                          <div className="text-gray-700 text-sm whitespace-pre-wrap">{it.description}</div>
                          {it.bullets && it.bullets.length > 0 && (
                            <ul className="list-disc pl-5 mt-1 text-sm text-gray-700">
                              {it.bullets.map((b, i) => (<li key={i}>{b}</li>))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center justify-end mt-3 gap-3">
                      <button
                        onClick={() => setIsOutlineModalOpen(false)}
                        className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (!document || !outline) return;
                          try {
                            // Build batch payload
                            const startNumber = 2;
                            const sessionInputs = outline.items.map((item, i) => {
                              const desc = (item.description || '').trim();
                              const bulletsText = item.bullets && item.bullets.length ? item.bullets.join('\n') : '';
                              const combinedNotes = [desc, bulletsText].filter(Boolean).join(desc && bulletsText ? '\n\n' : '');
                              return {
                                sessionNumber: startNumber + i,
                                // Keep transcript empty; user will create it using notes as hints
                                transcript: '',
                                duration: 0,
                                // Notes contain outline description + bullets (no title)
                                notes: combinedNotes,
                                origin: 'outline',
                                outlineRef: { outlineId: outline.outlineId, itemId: item.id },
                                title: item.title,
                                description: item.description,
                                estimatedDurationSec: item.estimatedDurationSec
                              };
                            });

                            // Overwrite check (beyond first)
                            const nonFirst = document.sessions.filter(s => s.sessionNumber > 1);
                            if (nonFirst.length > 0) {
                              // Open confirmation modal
                              const modal = window.document.createElement('div');
                              modal.className = 'fixed inset-0 z-50 bg-black/30 flex items-center justify-center';
                              modal.innerHTML = `
                                <div class="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4">
                                  <div class="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                                    <h4 class="text-lg font-semibold">Replace existing sessions?</h4>
                                    <button id="ovr-close" class="text-gray-500 hover:text-gray-700">✕</button>
                                  </div>
                                  <div class="p-5 space-y-4">
                                    <p class="text-gray-700 text-sm">This will delete sessions 2..N and recreate them from the outline. Your first session will be kept.</p>
                                    <div class="flex justify-end gap-3">
                                      <button id="ovr-cancel" class="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800">Cancel</button>
                                      <button id="ovr-confirm" class="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white">Overwrite and save</button>
                                    </div>
                                  </div>
                                </div>`;
                              window.document.body.appendChild(modal);
                              const close = () => modal.remove();
                              modal.querySelector('#ovr-close')?.addEventListener('click', close);
                              modal.querySelector('#ovr-cancel')?.addEventListener('click', close);
                              const confirmBtn = modal.querySelector('#ovr-confirm');
                              if (confirmBtn) {
                                confirmBtn.addEventListener('click', async () => {
                                  try {
                                    setIsStatusChanging(true);
                                    const res = await fetch('/api/voiceSessions/batch', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ documentId, replaceBeyondFirst: true, sessions: sessionInputs })
                                    });
                                    if (!res.ok) throw new Error(`Failed: ${res.status}`);
                                    const fresh = await DocumentService.getDocumentWithSessions(documentId);
                                    setDocument(fresh);
                                    setIsOutlineModalOpen(false);
                                    showToast('success', 'Sessions replaced from outline');
                                  } catch (e) {
                                    console.error(e);
                                    showToast('error', 'Failed to replace sessions');
                                  } finally {
                                    setIsStatusChanging(false);
                                    close();
                                  }
                                });
                              }
                              return;
                            }

                            // Show fullscreen overlay loader (reuse status one)
                            setIsStatusChanging(true);
                            const res = await fetch('/api/voiceSessions/batch', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ documentId, replaceBeyondFirst: false, sessions: sessionInputs })
                            });
                            if (!res.ok) throw new Error(`Failed: ${res.status}`);
                            // Reload document fresh
                            const fresh = await DocumentService.getDocumentWithSessions(documentId);
                            setDocument(fresh);
                            setIsOutlineModalOpen(false);
                            showToast('success', 'Sessions created from outline');
                          } catch (e) {
                            console.error(e);
                            showToast('error', 'Failed to create sessions from outline');
                          } finally {
                            setIsStatusChanging(false);
                          }
                        }}
                        className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Save as sessions
                      </button>
                    
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full-screen overlay loader during status change */}
      {isStatusChanging && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/90 rounded-xl shadow-xl px-6 py-5 flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-3"></div>
            <div className="text-sm text-gray-700">Applying status change…</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Overlay loader shown during status changes; keeps background visible but blocks interaction

import SessionRecorder from './SessionRecorder';
import SessionEditModal from './SessionEditModal';
import { Pencil, Trash2 } from 'lucide-react';
