'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DocumentWithSessions, GeneratedOutline } from '@/types';
import { DocumentService } from '@/lib/documentService';
import { getLanguageByCode } from '@/lib/languages';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DocumentEditorSkeleton } from '@/components/ui/loading-state';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { 
  Plus,
  Mic,
  FileText,
  Eye,
  Zap,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Home,
  ArrowLeft
} from 'lucide-react';

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
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const sessionsRef = useRef<HTMLDivElement>(null);
  const sessionRecorderRef = useRef<HTMLDivElement>(null);
  // Outline generation state
  const [isOutlineModalOpen, setIsOutlineModalOpen] = useState(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [outline, setOutline] = useState<GeneratedOutline | null>(null);
  const [replaceOldOutlineSessions] = useState<boolean>(false);
  
  // Navigation loading states
  const [isNavigatingToGenerate, setIsNavigatingToGenerate] = useState(false);
  const [isNavigatingToView, setIsNavigatingToView] = useState(false);
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');

  // Navigation handlers with immediate feedback
  const handleGenerateContent = () => {
    setIsNavigatingToGenerate(true);
    onGenerateContent(documentId);
  };

  const handleViewContent = () => {
    setIsNavigatingToView(true);
    onViewContent && onViewContent(documentId);
  };

  // Auto-scroll to session recorder when it becomes visible on mobile
  useEffect(() => {
    if (showSessionRecorder) {
      scrollToSessionRecorder();
    }
  }, [showSessionRecorder]);

  // Function to scroll to session recorder on mobile devices when Add Session is clicked
  const scrollToSessionRecorder = () => {
    // Only scroll on mobile devices (screen width < 640px)
    const isMobile = window.innerWidth < 640;
    console.log('ScrollToSessionRecorder called:', { isMobile, hasRef: !!sessionRecorderRef.current, windowWidth: window.innerWidth });
    
    if (isMobile && sessionRecorderRef.current) {
      // Use a delay to ensure the session recorder is rendered
      setTimeout(() => {
        if (sessionRecorderRef.current) {
          console.log('Scrolling to session recorder section using ref');
          const elementTop = sessionRecorderRef.current.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementTop - 80; // Add 80px offset for mobile menu bar
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 300); // Delay to ensure SessionRecorder is fully rendered
    }
  };

  // Function to scroll to sessions list on mobile devices after adding new session
  const scrollToSessions = () => {
    // Only scroll on mobile devices (screen width < 640px)
    const isMobile = window.innerWidth < 640;
    console.log('ScrollToSessions called:', { isMobile, hasRef: !!sessionsRef.current, windowWidth: window.innerWidth });
    
    if (isMobile && sessionsRef.current) {
      // Use a delay to ensure the new session is rendered
      setTimeout(() => {
        if (sessionsRef.current) {
          console.log('Scrolling to sessions section using ref');
          const elementTop = sessionsRef.current.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementTop - 80; // Add 80px offset for mobile menu bar
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 300); // Delay to ensure DOM is updated with new session
    }
  };

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
      setDeletingSessionId(sessionId);
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
      showToast('error', e instanceof Error ? e.message : 'Failed to delete session');
    } finally {
      setDeletingSessionId(null);
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
      
      // Auto-scroll to sessions on mobile after adding new session
      scrollToSessions();
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          <DocumentEditorSkeleton />
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-destructive/20">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Failed to Load Document</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="h-4 w-4" />
                  Retry Loading
                </Button>
                <Button
                  onClick={onBackToDashboard}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const inputLang = getLanguageByCode(document.inputLanguage);
  const outputLang = getLanguageByCode(document.outputLanguage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full sm:w-auto">
          <Alert className={`shadow-lg border-2 ${toast.type === 'success' ? 'border-green-200 bg-green-50' : 'border-destructive bg-destructive/10'}`}>
            <div className="flex items-start gap-2">
              {toast.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              )}
              <AlertDescription className={`${toast.type === 'success' ? 'text-green-800' : 'text-destructive'} text-sm leading-relaxed break-words`}>
                {toast.message}
              </AlertDescription>
            </div>
          </Alert>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex justify-start">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={onBackToDashboard}
                  className="flex items-center gap-1 cursor-pointer hover:text-primary"
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">Edit Document</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Document Title */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-foreground">{document.title}</h1>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowSessionRecorder(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Session
            </Button>
            {document.sessions.length > 0 && (
              <Button
                onClick={generateOutlineNow}
                variant="secondary"
                className="flex items-center gap-2"
                title="Generate a structured outline from your sessions"
              >
                <Sparkles className="h-4 w-4" />
                Generate Outline
              </Button>
            )}
            {/* Actions: always allow Generate if sessions exist; View when content exists */}
            {document.sessions.length > 0 && (
              <Button
                onClick={handleGenerateContent}
                className="flex items-center gap-2"
                title="Generate content (overwrites saved content if present)"
                disabled={isNavigatingToGenerate}
              >
                {isNavigatingToGenerate ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {isNavigatingToGenerate ? 'Loading...' : 'Generate Content'}
              </Button>
            )}
            {document.hasGeneratedContent && document.generatedContent && (
              <Button
                onClick={handleViewContent}
                variant="outline"
                className="flex items-center gap-2"
                disabled={isNavigatingToView}
              >
                {isNavigatingToView ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {isNavigatingToView ? 'Loading...' : 'View Content'}
              </Button>
            )}
          </div>
        </div>

      {/* Document Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{document.sessions.length}</div>
            <div className="text-sm text-muted-foreground">Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{formatDuration(document.totalDuration)}</div>
            <div className="text-sm text-muted-foreground">Total Duration</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{document.wordCount}</div>
            <div className="text-sm text-muted-foreground">Total Words</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm text-muted-foreground">Language</div>
            <div className="text-sm font-medium text-foreground">
              {inputLang?.nativeName} → {outputLang?.nativeName}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Session Recorder */}
      {showSessionRecorder && (
        <div ref={sessionRecorderRef} className="mb-8">
          <SessionRecorder
            inputLanguage={document.inputLanguage}
            onSessionComplete={handleSessionComplete}
            onCancel={() => setShowSessionRecorder(false)}
          />
        </div>
      )}

      {/* Combined Content Preview */}
      {document.sessions.length > 0 && (
        <Card className="mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Combined Content Preview
            </CardTitle>
            <CardDescription>
              This is how your content will look when combined for blog generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">Final-style preview (for reference only)</div>
            <div className="max-h-64 overflow-y-auto p-4 bg-muted/30 border rounded-lg">
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
                        <div className="font-semibold text-foreground">{title}</div>
                        {description && (
                          <div className="mt-1 text-foreground">{description}</div>
                        )}
                        {bullets.length > 0 && (
                          <ul className="list-disc pl-5 mt-1 text-foreground">
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
            <div className="text-sm text-muted-foreground text-center">
              Total: {document.wordCount} words • {formatDuration(document.totalDuration)} duration
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      <Card ref={sessionsRef}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Session History
          </CardTitle>
          <CardDescription>
            All recorded sessions for this document
          </CardDescription>
        </CardHeader>

        {document.sessions.length === 0 ? (
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No sessions yet</h3>
            <p className="text-muted-foreground mb-4">Start recording your first session to build your document</p>
            <Button
              onClick={() => setShowSessionRecorder(true)}
              className="flex items-center gap-2"
            >
              <Mic className="h-4 w-4" />
              Record First Session
            </Button>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <div className="divide-y">
              {document.sessions
                .sort((a, b) => a.sessionNumber - b.sessionNumber)
                .map((session) => (
                  <div key={session.id} className="p-4 sm:p-6">
                    {/* Mobile Layout (sm and below) - Two lines */}
                    <div className="block sm:hidden space-y-3">
                      {/* Mobile: Session Title Line */}
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                          {session.sessionNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground flex items-center gap-2">
                            {session.title && session.title.trim().length > 0
                              ? session.title
                              : `Session ${session.sessionNumber}`}
                            {/* Edited badge for outline sessions when title differs from original outline title stored in notes */}
                            {session.origin === 'outline' && session.title && session.notes && session.notes.startsWith('Outline:') && session.title.trim() !== session.notes.replace(/^Outline:\s*/, '').trim() && (
                              <Badge variant="secondary" className="text-xs">
                                Edited
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(session.timestamp)} • {formatDuration(session.duration)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Mobile: Word Count and Actions Line */}
                      <div className="flex items-center justify-between pl-11">
                        <span className="text-sm text-muted-foreground">
                          {session.transcript.trim().split(/\s+/).length} words
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditSessionId(session.id)}
                            title={`Edit ${session.title && session.title.trim() ? session.title : `session ${session.sessionNumber}`}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSessionDelete(session.id)}
                            disabled={deletingSessionId === session.id}
                            className="text-destructive hover:text-destructive"
                            title={`Delete ${session.title && session.title.trim() ? session.title : `session ${session.sessionNumber}`}`}
                          >
                            {deletingSessionId === session.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Tablet/Desktop Layout (sm and above) - Single line */}
                    <div className="hidden sm:flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                          {session.sessionNumber}
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground flex items-center gap-2">
                            {session.title && session.title.trim().length > 0
                              ? session.title
                              : `Session ${session.sessionNumber}`}
                            {/* Edited badge for outline sessions when title differs from original outline title stored in notes */}
                            {session.origin === 'outline' && session.title && session.notes && session.notes.startsWith('Outline:') && session.title.trim() !== session.notes.replace(/^Outline:\s*/, '').trim() && (
                              <Badge variant="secondary" className="text-xs">
                                Edited
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(session.timestamp)} • {formatDuration(session.duration)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground gap-1 sm:gap-2">
                        <span>{session.transcript.trim().split(/\s+/).length} words</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditSessionId(session.id)}
                            title={`Edit ${session.title && session.title.trim() ? session.title : `session ${session.sessionNumber}`}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSessionDelete(session.id)}
                            disabled={deletingSessionId === session.id}
                            className="text-destructive hover:text-destructive"
                            title={`Delete ${session.title && session.title.trim() ? session.title : `session ${session.sessionNumber}`}`}
                          >
                            {deletingSessionId === session.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Session Content */}
                    <div className="mb-4">
                      <div className="p-4 bg-muted/30 border rounded-lg">
                        <p className="text-foreground whitespace-pre-wrap">
                          {session.transcript && session.transcript.trim().length > 0 ? (
                            session.transcript
                          ) : (
                            <span className="text-muted-foreground italic">No transcript yet — add your input here. Use the notes below as hints.</span>
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
                                <p className="text-xs text-muted-foreground italic font-serif whitespace-pre-wrap">{description}</p>
                              )}
                              {bullets.length > 0 && (
                                <ul className="list-disc pl-5 mt-1 text-xs text-muted-foreground italic font-serif">
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
          </CardContent>
        )}
      </Card>
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
                                      <button id="ovr-confirm" class="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white flex items-center gap-2">
                                        <svg id="ovr-spinner" class="hidden animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                          <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span id="ovr-text">Overwrite and save</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>`;
                              window.document.body.appendChild(modal);
                              const close = () => modal.remove();
                              modal.querySelector('#ovr-close')?.addEventListener('click', close);
                              modal.querySelector('#ovr-cancel')?.addEventListener('click', close);
                              const confirmBtn = modal.querySelector('#ovr-confirm');
                              const spinner = modal.querySelector('#ovr-spinner');
                              const buttonText = modal.querySelector('#ovr-text');
                              const cancelBtn = modal.querySelector('#ovr-cancel');
                              const closeBtn = modal.querySelector('#ovr-close');
                              
                              if (confirmBtn && spinner && buttonText && cancelBtn && closeBtn) {
                                confirmBtn.addEventListener('click', async () => {
                                  try {
                                    // Show loading state in modal button
                                    spinner.classList.remove('hidden');
                                    buttonText.textContent = 'Replacing...';
                                    confirmBtn.disabled = true;
                                    cancelBtn.disabled = true;
                                    closeBtn.disabled = true;
                                    confirmBtn.classList.add('opacity-75', 'cursor-not-allowed');
                                    cancelBtn.classList.add('opacity-50', 'cursor-not-allowed');
                                    closeBtn.classList.add('opacity-50', 'cursor-not-allowed');
                                    
                                    // Show fullscreen loading overlay
                                    setLoadingMessage('Replacing existing sessions...');
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
                                    
                                    // Reset button state on error
                                    spinner.classList.add('hidden');
                                    buttonText.textContent = 'Overwrite and save';
                                    confirmBtn.disabled = false;
                                    cancelBtn.disabled = false;
                                    closeBtn.disabled = false;
                                    confirmBtn.classList.remove('opacity-75', 'cursor-not-allowed');
                                    cancelBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                                    closeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                                  } finally {
                                    setIsStatusChanging(false);
                                    close();
                                  }
                                });
                              }
                              return;
                            }

                            // Show fullscreen overlay loader
                            setLoadingMessage('Creating sessions from outline...');
                            setIsStatusChanging(true);
                            
                            console.log('Save as Sessions - Request payload:', {
                              documentId,
                              replaceBeyondFirst: false,
                              sessions: sessionInputs
                            });
                            
                            const res = await fetch('/api/voiceSessions/batch', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ documentId, replaceBeyondFirst: false, sessions: sessionInputs })
                            });
                            
                            console.log('Save as Sessions - Response status:', res.status);
                            
                            if (!res.ok) {
                              const errorData = await res.json().catch(() => null);
                              console.error('Save as Sessions - Error response:', errorData);
                              throw new Error(errorData?.error || `HTTP ${res.status}: ${res.statusText}`);
                            }
                            
                            const responseData = await res.json();
                            console.log('Save as Sessions - Success response:', responseData);
                            
                            // Reload document fresh
                            const fresh = await DocumentService.getDocumentWithSessions(documentId);
                            setDocument(fresh);
                            setIsOutlineModalOpen(false);
                            showToast('success', 'Sessions created from outline');
                          } catch (e) {
                            console.error('Save as Sessions - Full error:', e);
                            const errorMessage = e instanceof Error ? e.message : 'Failed to create sessions from outline';
                            showToast('error', errorMessage);
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

      {/* Loading Overlay for Save as Sessions and other status changes */}
      <LoadingOverlay 
        isVisible={isStatusChanging} 
        message={loadingMessage}
      />

      </div>
    </div>
  );
}

// Overlay loader shown during status changes; keeps background visible but blocks interaction

import SessionRecorder from './SessionRecorder';
import SessionEditModal from './SessionEditModal';
