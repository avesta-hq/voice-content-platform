'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserDocument } from '@/types';
import { DocumentService } from '@/lib/documentService';
import { UserService } from '@/lib/userService';
import { getLanguageByCode } from '@/lib/languages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Dialog imports removed - using custom modal for delete confirmation
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { DocumentGridSkeleton } from '@/components/ui/loading-state';
import { Plus, Search, FileText, Mic, Trash2, Edit, Eye, Calendar, Loader2 } from 'lucide-react';
import { PageTransition, StaggeredContainer, StaggeredItem } from '@/components/animations/page-transitions';
import { HoverScale, SlideInView } from '@/components/animations/interactive-elements';

interface DocumentDashboardProps {
  onCreateNew: () => void;
  onEditDocument: (documentId: string) => void;
  onGenerateContent: (documentId: string) => void;
  onViewContent?: (documentId: string) => void;
  reloadToken?: number;
}


export default function DocumentDashboard({ onCreateNew, onEditDocument, onGenerateContent, onViewContent, reloadToken }: DocumentDashboardProps) {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'draft' | 'completed'>('draft');
  const hasLoadedRef = useRef(false);
  const [isStatusChanging, setIsStatusChanging] = useState<boolean>(false);
  const [overlayMessage, setOverlayMessage] = useState<string>('Applying status change…');
  
  // Navigation loading states
  const [navigatingTo, setNavigatingTo] = useState<{ [key: string]: 'edit' | 'generate' | 'view' | null }>({});

  // Navigation handlers with immediate feedback
  const handleEditDocument = (documentId: string) => {
    setNavigatingTo(prev => ({ ...prev, [documentId]: 'edit' }));
    onEditDocument(documentId);
  };

  const handleGenerateContent = (documentId: string) => {
    setNavigatingTo(prev => ({ ...prev, [documentId]: 'generate' }));
    onGenerateContent(documentId);
  };

  const handleViewContent = (documentId: string) => {
    setNavigatingTo(prev => ({ ...prev, [documentId]: 'view' }));
    onViewContent && onViewContent(documentId);
  };

  const loadDocuments = useCallback(async (forceReload = false) => {
    // Prevent multiple API calls unless forced
    if (hasLoadedRef.current && !forceReload) {
      return;
    }
    
    try {
      if (!forceReload) hasLoadedRef.current = true;
      setIsLoading(true);
      const currentUser = UserService.getCurrentUser();
      if (currentUser) {
        let userDocs: UserDocument[];
        
        if (activeTab === 'completed') {
          userDocs = await DocumentService.getCompletedDocuments(currentUser.id);
        } else {
          userDocs = await DocumentService.getDraftDocuments(currentUser.id);
        }
        
        setDocuments(userDocs);
      }
    } catch (err) {
      setError(`Failed to load ${activeTab} documents`);
      console.error('Load documents error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  // Function to manually refresh documents (for delete operations)
  const refreshDocuments = useCallback(async () => {
    await loadDocuments(true);
  }, [loadDocuments]);

  useEffect(() => {
    console.log('🚀 DocumentDashboard useEffect triggered, hasLoadedRef.current:', hasLoadedRef.current);
    // Only load documents once when component mounts
    if (!hasLoadedRef.current) {
      loadDocuments();
    }
  }, []); // Remove loadDocuments dependency to prevent infinite loops

  // Force refresh when reloadToken changes
  useEffect(() => {
    if (typeof reloadToken === 'number' && reloadToken > 0) {
      hasLoadedRef.current = false;
      loadDocuments();
    }
  }, [reloadToken, loadDocuments]);

  // Reload documents when tab changes
  useEffect(() => {
    hasLoadedRef.current = false;
    loadDocuments();
  }, [activeTab, loadDocuments]);

  const handleDeleteDocument = async (documentId: string) => {
    const document = documents.find(doc => doc.id === documentId);
    const documentTitle = document?.title || 'this document';
    
    // Build a lightweight custom confirm modal
    const modal = window.document.createElement('div');
    modal.className = 'fixed inset-0 z-50 bg-black/30 flex items-center justify-center';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4">
        <div class="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h4 class="text-lg font-semibold">Delete document?</h4>
          <button id="del-close" class="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div class="p-5 space-y-3">
          <p class="text-gray-700 text-sm">You're about to permanently delete <span class="font-medium">${documentTitle}</span> and all its sessions. This cannot be undone.</p>
          <div class="flex justify-end gap-3">
            <button id="del-cancel" class="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800">Cancel</button>
            <button id="del-confirm" class="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white flex items-center gap-2">
              <svg id="del-spinner" class="hidden animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span id="del-text">Delete</span>
            </button>
          </div>
        </div>
      </div>`;
    window.document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector('#del-close')?.addEventListener('click', close);
    modal.querySelector('#del-cancel')?.addEventListener('click', close);
    const confirmBtn = modal.querySelector('#del-confirm');
    const cancelBtn = modal.querySelector('#del-cancel');
    const closeBtn = modal.querySelector('#del-close');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        // Get button elements for loading state
        const spinner = modal.querySelector('#del-spinner');
        const buttonText = modal.querySelector('#del-text');
        
        try {
          // Show loading state immediately
          if (spinner) spinner.classList.remove('hidden');
          if (buttonText) buttonText.textContent = 'Deleting...';
          
          // Disable all buttons to prevent multiple clicks
          confirmBtn.disabled = true;
          if (cancelBtn) cancelBtn.disabled = true;
          if (closeBtn) closeBtn.disabled = true;
          
          // Add visual disabled state
          confirmBtn.classList.add('opacity-75', 'cursor-not-allowed');
          if (cancelBtn) cancelBtn.classList.add('opacity-50', 'cursor-not-allowed');
          if (closeBtn) closeBtn.classList.add('opacity-50', 'cursor-not-allowed');
          
          // Show full-screen overlay after button loading state
          setOverlayMessage('Deleting document…');
          setIsStatusChanging(true);
          
          await DocumentService.deleteDocument(documentId);
          await refreshDocuments();
        } catch (err) {
          // Reset button state on error
          if (spinner) spinner.classList.add('hidden');
          if (buttonText) buttonText.textContent = 'Delete';
          confirmBtn.disabled = false;
          if (cancelBtn) {
            cancelBtn.disabled = false;
            cancelBtn.classList.remove('opacity-50', 'cursor-not-allowed');
          }
          if (closeBtn) {
            closeBtn.disabled = false;
            closeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
          }
          confirmBtn.classList.remove('opacity-75', 'cursor-not-allowed');
          
          setError('Failed to delete document');
          console.error('Delete document error:', err);
        } finally {
          setIsStatusChanging(false);
          close();
        }
      });
    }
  };

  const handleStatusChange = async (documentId: string, newStatus: 'draft' | 'completed') => {
    try {
      setOverlayMessage(`Marking document as ${newStatus}…`);
      setIsStatusChanging(true);
      
      if (newStatus === 'completed') {
        await DocumentService.markDocumentCompleted(documentId);
      } else {
        await DocumentService.markDocumentDraft(documentId);
      }
      await refreshDocuments();
    } catch (err) {
      setError(`Failed to change document status to ${newStatus}`);
      console.error('Status change error:', err);
    } finally {
      setIsStatusChanging(false);
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

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Modern Header */}
        <SlideInView direction="up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Documents</h1>
              <p className="text-muted-foreground">
                Create, edit, and manage your voice content documents
              </p>
            </div>
            <HoverScale scale={1.05}>
              <Button onClick={onCreateNew} size="lg" className="sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create New Document
              </Button>
            </HoverScale>
          </div>
        </SlideInView>

        {/* Modern Tabs with Search */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'draft' | 'completed')} className="space-y-4 sm:space-y-6">
          <div className="flex flex-col gap-4">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="draft" className="flex items-center justify-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                <span className="hidden xs:inline sm:hidden md:inline">Draft Documents</span>
                <span className="xs:hidden sm:inline md:hidden">Drafts</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center justify-center gap-2 text-sm font-medium">
                <Eye className="h-4 w-4" />
                <span className="hidden xs:inline sm:hidden md:inline">Completed Documents</span>
                <span className="xs:hidden sm:inline md:hidden">Completed</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Search Bar */}
      {documents.length > 0 && (
              <div className="relative w-full max-w-md mx-auto sm:mx-0 sm:max-w-sm sm:ml-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
              type="text"
                  placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
            />
            </div>
            )}
          </div>

      {/* Error Display */}
      {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Tab Content */}
          <TabsContent value="draft" className="space-y-6">
      {isLoading ? (
              <DocumentGridSkeleton count={6} />
      ) : filteredDocuments.length === 0 ? (
              <Card className="border-dashed border-2 border-muted-foreground/25">
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">No documents yet</h3>
                    <p className="text-muted-foreground max-w-sm">
                      Create your first document to get started with voice content creation
                    </p>
                  </div>
                  <Button onClick={onCreateNew} size="lg">
                    <Plus className="mr-2 h-4 w-4" />
              Create Your First Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <StaggeredContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {filteredDocuments.map((document) => {
                  const inputLang = getLanguageByCode(document.inputLanguage);
                  const outputLang = getLanguageByCode(document.outputLanguage);
                  
                  return (
                    <StaggeredItem key={document.id}>
                      <HoverScale scale={1.02}>
                        <Card className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/20 cursor-pointer h-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between overflow-hidden">
                          <div className="flex-1 min-w-0 pr-2 overflow-hidden">
                            <h3 
                              className="font-semibold group-hover:text-primary transition-colors" 
                              title={document.title}
                              style={{
                                fontSize: '1.125rem',
                                lineHeight: '1.2',
                                height: '1.5rem',
                                minHeight: '1.5rem',
                                maxHeight: '1.5rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                width: '100%',
                                display: 'block'
                              }}
                            >
                              {document.title}
                            </h3>
                            <CardDescription className="mt-1 flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {formatDate(document.createdAt || new Date().toISOString())}
                            </CardDescription>
                          </div>
                          <Button variant="ghost" size="sm" className="opacity-100" onClick={() => handleDeleteDocument(document.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-2">
                        {/* Enhanced Language Flow */}
                        <div className="relative overflow-hidden rounded-lg border border-border/50 bg-gradient-to-r from-primary/5 via-background to-secondary/5">
                          <div className="flex items-center justify-between p-2 sm:p-3">
                            {/* Input Language */}
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                              <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/10 border border-primary/20 flex-shrink-0">
                                <Mic className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                    </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs text-muted-foreground font-medium">Speech</span>
                                <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                  {inputLang?.nativeName || 'Unknown'}
                                </span>
                    </div>
                  </div>

                            {/* Flow Arrow */}
                            <div className="flex items-center gap-1 px-2 flex-shrink-0">
                              <div className="w-4 sm:w-8 h-px bg-gradient-to-r from-primary/40 to-primary/60"></div>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rotate-45 border-t border-r border-primary/60"></div>
                            </div>

                            {/* Output Language */}
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 justify-end">
                              <div className="flex flex-col text-right min-w-0">
                                <span className="text-xs text-muted-foreground font-medium">Content</span>
                                <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                  {outputLang?.nativeName || 'Unknown'}
                                </span>
                              </div>
                              <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-secondary/10 border border-secondary/20 flex-shrink-0">
                                <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-secondary-foreground" />
                              </div>
                    </div>
                  </div>

                          {/* Subtle bottom accent */}
                          <div className="h-px bg-gradient-to-r from-primary/20 via-primary/40 to-secondary/20"></div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-accent/20 rounded-md">
                            <div className="text-lg font-bold text-foreground">
                              {document.totalSessions ?? (Array.isArray(document.sessions) ? document.sessions.length : 0) ?? 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Sessions</div>
                    </div>
                          <div className="text-center p-2 bg-accent/20 rounded-md">
                            <div className="text-lg font-bold text-foreground">{formatDuration(document.totalDuration || 0)}</div>
                            <div className="text-xs text-muted-foreground">Duration</div>
                    </div>
                          <div className="text-center p-2 bg-accent/20 rounded-md">
                            <div className="text-lg font-bold text-foreground">{document.wordCount || 0}</div>
                            <div className="text-xs text-muted-foreground">Words</div>
                    </div>
                  </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleEditDocument(document.id)} 
                              variant="default" 
                              size="sm" 
                              className="flex-1 h-8 text-xs"
                              disabled={navigatingTo[document.id] === 'edit'}
                            >
                              {navigatingTo[document.id] === 'edit' ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <Edit className="mr-1 h-3 w-3" />
                              )}
                              {navigatingTo[document.id] === 'edit' ? 'Opening...' : 'Edit'}
                            </Button>
                            {((document.totalSessions ?? (Array.isArray(document.sessions) ? document.sessions.length : 0)) > 0) && (
                              <Button 
                                onClick={() => handleGenerateContent(document.id)} 
                                variant="secondary" 
                                size="sm" 
                                className="flex-1 h-8 text-xs"
                                disabled={navigatingTo[document.id] === 'generate'}
                              >
                                {navigatingTo[document.id] === 'generate' ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <Mic className="mr-1 h-3 w-3" />
                                )}
                                {navigatingTo[document.id] === 'generate' ? 'Loading...' : 'Generate'}
                              </Button>
                            )}
                            {document.hasGeneratedContent && document.generatedContent && (
                              <Button 
                                onClick={() => handleViewContent(document.id)} 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 h-8 text-xs"
                                disabled={navigatingTo[document.id] === 'view'}
                              >
                                {navigatingTo[document.id] === 'view' ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <Eye className="mr-1 h-3 w-3" />
                                )}
                                {navigatingTo[document.id] === 'view' ? 'Loading...' : 'View'}
                              </Button>
                          )}
                        </div>
                        
                          {/* Status Toggle */}
                        {document.hasGeneratedContent && (
                            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-medium">Document Status</span>
                                <span className="text-xs text-muted-foreground">
                                  {document.status === 'completed' ? 'Mark as draft' : 'Mark as completed'}
                                </span>
                              </div>
                              <div 
                                className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-4 cursor-pointer select-none"
                                onClick={() => {
                                  if (!isStatusChanging) {
                                    handleStatusChange(document.id, document.status === 'completed' ? 'draft' : 'completed');
                                  }
                                }}
                              >
                                <span className="text-xs text-muted-foreground whitespace-nowrap">Draft</span>
                                <Switch 
                                  checked={document.status === 'completed'}
                                  onCheckedChange={(checked) => {
                                    handleStatusChange(document.id, checked ? 'completed' : 'draft');
                                  }}
                                  disabled={isStatusChanging}
                                  className="mx-1 pointer-events-none"
                                />
                                <span className="text-xs text-muted-foreground whitespace-nowrap">Done</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </HoverScale>
                </StaggeredItem>
              );
            })}
          </StaggeredContainer>
        )}
      </TabsContent>

          {/* Completed Tab Content */}
          <TabsContent value="completed" className="space-y-6">
            {isLoading ? (
              <DocumentGridSkeleton count={6} />
            ) : filteredDocuments.length === 0 ? (
              <Card className="border-dashed border-2 border-muted-foreground/25">
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Eye className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">No completed documents yet</h3>
                    <p className="text-muted-foreground max-w-sm">
                      Documents you mark as completed will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <StaggeredContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {filteredDocuments.map((document) => {
                  const inputLang = getLanguageByCode(document.inputLanguage);
                  const outputLang = getLanguageByCode(document.outputLanguage);

                  return (
                    <StaggeredItem key={document.id}>
                      <HoverScale scale={1.02}>
                        <Card className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/20 cursor-pointer h-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between overflow-hidden">
                          <div className="flex-1 min-w-0 pr-2 overflow-hidden">
                            <h3 
                              className="font-semibold group-hover:text-primary transition-colors" 
                              title={document.title}
                              style={{
                                fontSize: '1.125rem',
                                lineHeight: '1.2',
                                height: '1.5rem',
                                minHeight: '1.5rem',
                                maxHeight: '1.5rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                width: '100%',
                                display: 'block'
                              }}
                            >
                              {document.title}
                            </h3>
                            <CardDescription className="mt-1 flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {formatDate(document.createdAt || new Date().toISOString())}
                            </CardDescription>
                          </div>
                          <Button variant="ghost" size="sm" className="opacity-100" onClick={() => handleDeleteDocument(document.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-2">
                        {/* Enhanced Language Flow */}
                        <div className="relative overflow-hidden rounded-lg border border-border/50 bg-gradient-to-r from-primary/5 via-background to-secondary/5">
                          <div className="flex items-center justify-between p-2 sm:p-3">
                            {/* Input Language */}
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                              <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/10 border border-primary/20 flex-shrink-0">
                                <Mic className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs text-muted-foreground font-medium">Speech</span>
                                <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                  {inputLang?.nativeName || 'Unknown'}
                                </span>
                              </div>
                            </div>

                            {/* Flow Arrow */}
                            <div className="flex items-center gap-1 px-2 flex-shrink-0">
                              <div className="w-4 sm:w-8 h-px bg-gradient-to-r from-primary/40 to-primary/60"></div>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rotate-45 border-t border-r border-primary/60"></div>
                            </div>

                            {/* Output Language */}
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 justify-end">
                              <div className="flex flex-col text-right min-w-0">
                                <span className="text-xs text-muted-foreground font-medium">Content</span>
                                <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                  {outputLang?.nativeName || 'Unknown'}
                                </span>
                              </div>
                              <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-secondary/10 border border-secondary/20 flex-shrink-0">
                                <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-secondary-foreground" />
                              </div>
                            </div>
                          </div>
                          
                          {/* Subtle bottom accent */}
                          <div className="h-px bg-gradient-to-r from-primary/20 via-primary/40 to-secondary/20"></div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-accent/20 rounded-md">
                            <div className="text-lg font-bold text-foreground">
                              {document.totalSessions ?? (Array.isArray(document.sessions) ? document.sessions.length : 0) ?? 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Sessions</div>
                          </div>
                          <div className="text-center p-2 bg-accent/20 rounded-md">
                            <div className="text-lg font-bold text-foreground">{formatDuration(document.totalDuration || 0)}</div>
                            <div className="text-xs text-muted-foreground">Duration</div>
                          </div>
                          <div className="text-center p-2 bg-accent/20 rounded-md">
                            <div className="text-lg font-bold text-foreground">{document.wordCount || 0}</div>
                            <div className="text-xs text-muted-foreground">Words</div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button onClick={() => onEditDocument(document.id)} variant="outline" size="sm" className="flex-1 h-8 text-xs">
                            <Edit className="mr-1 h-3 w-3" />
                            View
                          </Button>
                          {document.hasGeneratedContent && document.generatedContent && (
                            <Button onClick={() => onViewContent && onViewContent(document.id)} variant="default" size="sm" className="flex-1 h-8 text-xs">
                              <Eye className="mr-1 h-3 w-3" />
                              Content
                            </Button>
                    )}
                  </div>

                        {/* Status Toggle - Same position as draft documents */}
                        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-medium">Document Status</span>
                            <span className="text-xs text-muted-foreground">
                              Mark as draft to continue editing
                            </span>
                          </div>
                          <div 
                            className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-4 cursor-pointer select-none"
                            onClick={() => {
                              if (!isStatusChanging) {
                                handleStatusChange(document.id, document.status === 'completed' ? 'draft' : 'completed');
                              }
                            }}
                          >
                            <span className="text-xs text-muted-foreground whitespace-nowrap">Draft</span>
                            <Switch 
                              checked={document.status === 'completed'}
                              onCheckedChange={(checked) => {
                                handleStatusChange(document.id, checked ? 'completed' : 'draft');
                              }}
                              disabled={isStatusChanging}
                              className="mx-1 pointer-events-none"
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">Done</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </HoverScale>
                </StaggeredItem>
              );
            })}
          </StaggeredContainer>
        )}
      </TabsContent>
        </Tabs>

        {/* Loading Overlay */}
        <LoadingOverlay 
          isVisible={isStatusChanging} 
          message={overlayMessage}
        />
        </div>
      </div>
    </PageTransition>
  );
}
