'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserDocument } from '@/types';
import { DocumentService } from '@/lib/documentService';
import { UserService } from '@/lib/userService';
import { getLanguageByCode } from '@/lib/languages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Plus, Search, FileText, Mic, Clock, Languages, MoreVertical, Trash2, Edit, Eye, Calendar, Filter } from 'lucide-react';

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

  const loadDocuments = useCallback(async (forceReload = false) => {
    // Prevent multiple API calls unless forced
    if (hasLoadedRef.current && !forceReload) {
      console.log('🚫 Documents already loaded, skipping API call');
      return;
    }
    
    try {
      console.log(`🔄 Loading ${activeTab} documents...`); // Debug log
      if (!forceReload) hasLoadedRef.current = true;
      setIsLoading(true);
      const currentUser = UserService.getCurrentUser();
      if (currentUser) {
        console.log('👤 Current user:', currentUser.id); // Debug log
        let userDocs: UserDocument[];
        
        if (activeTab === 'completed') {
          userDocs = await DocumentService.getCompletedDocuments(currentUser.id);
        } else {
          userDocs = await DocumentService.getDraftDocuments(currentUser.id);
        }
        
        console.log(`📚 ${activeTab} documents loaded:`, userDocs.length); // Debug log
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
            <button id="del-confirm" class="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white">Delete</button>
          </div>
        </div>
      </div>`;
    window.document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector('#del-close')?.addEventListener('click', close);
    modal.querySelector('#del-cancel')?.addEventListener('click', close);
    const confirmBtn = modal.querySelector('#del-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        try {
          setOverlayMessage('Deleting document…');
          setIsStatusChanging(true);
          await DocumentService.deleteDocument(documentId);
          await refreshDocuments();
        } catch (err) {
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
      setOverlayMessage('Applying status change…');
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Modern Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Documents</h1>
            <p className="text-muted-foreground">
              Create, edit, and manage your voice content documents
            </p>
          </div>
          <Button onClick={onCreateNew} size="lg" className="sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create New Document
          </Button>
        </div>

        {/* Modern Tabs with Search */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'draft' | 'completed')} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
              <TabsTrigger value="draft" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Draft Documents</span>
                <span className="sm:hidden">Drafts</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Completed Documents</span>
                <span className="sm:hidden">Completed</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Search Bar */}
            {documents.length > 0 && (
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
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
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
                <p className="text-muted-foreground">Loading your documents...</p>
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {filteredDocuments.map((document) => {
                  const inputLang = getLanguageByCode(document.inputLanguage);
                  const outputLang = getLanguageByCode(document.outputLanguage);
            
                  return (
                    <Card key={document.id} className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/20 cursor-pointer">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                              {document.title}
                            </CardTitle>
                            <CardDescription className="mt-1 flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {formatDate(document.createdAt || new Date().toISOString())}
                            </CardDescription>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Document</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete "{document.title}"? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline">Cancel</Button>
                                <Button variant="destructive" onClick={() => handleDeleteDocument(document.id)}>
                                  Delete Document
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-2">
                        {/* Language Flow */}
                        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                          <div className="flex items-center gap-1 text-xs">
                            <Languages className="h-3 w-3 text-primary" />
                            <span className="font-medium">{inputLang?.nativeName || 'Unknown'}</span>
                          </div>
                          <div className="w-4 h-px bg-border"></div>
                          <div className="flex items-center gap-1 text-xs">
                            <span className="font-medium">{outputLang?.nativeName || 'Unknown'}</span>
                            <FileText className="h-3 w-3 text-primary" />
                          </div>
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
                            <Button onClick={() => onEditDocument(document.id)} variant="default" size="sm" className="flex-1">
                              <Edit className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                            {((document.totalSessions ?? (Array.isArray(document.sessions) ? document.sessions.length : 0)) > 0) && (
                              <Button onClick={() => onGenerateContent(document.id)} variant="secondary" size="sm" className="flex-1">
                                <Mic className="mr-1 h-3 w-3" />
                                Generate
                              </Button>
                            )}
                            {document.hasGeneratedContent && document.generatedContent && (
                              <Button onClick={() => onViewContent && onViewContent(document.id)} variant="outline" size="sm" className="flex-1">
                                <Eye className="mr-1 h-3 w-3" />
                                View
                              </Button>
                            )}
                          </div>
                        
                          {/* Status Toggle */}
                          {document.hasGeneratedContent && (
                            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">Document Status</span>
                                <span className="text-xs text-muted-foreground">
                                  {activeTab === 'completed' ? 'Mark as draft' : 'Mark as completed'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Draft</span>
                                <Switch 
                                  checked={activeTab === 'completed'}
                                  onCheckedChange={(checked) => {
                                    handleStatusChange(document.id, checked ? 'completed' : 'draft');
                                  }}
                                  disabled={isStatusChanging}
                                />
                                <span className="text-xs text-muted-foreground">Done</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Completed Tab Content */}
          <TabsContent value="completed" className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
                <p className="text-muted-foreground">Loading your documents...</p>
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {filteredDocuments.map((document) => {
                  const inputLang = getLanguageByCode(document.inputLanguage);
                  const outputLang = getLanguageByCode(document.outputLanguage);

                  return (
                    <Card key={document.id} className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/20 cursor-pointer">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                              {document.title}
                            </CardTitle>
                            <CardDescription className="mt-1 flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {formatDate(document.createdAt || new Date().toISOString())}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={true}
                              onCheckedChange={(checked) => {
                                handleStatusChange(document.id, checked ? 'completed' : 'draft');
                              }}
                              disabled={isStatusChanging}
                            />
                            <Badge variant="default">Completed</Badge>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-2">
                        {/* Language Flow */}
                        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                          <div className="flex items-center gap-1 text-xs">
                            <Languages className="h-3 w-3 text-primary" />
                            <span className="font-medium">{inputLang?.nativeName || 'Unknown'}</span>
                          </div>
                          <div className="w-4 h-px bg-border"></div>
                          <div className="flex items-center gap-1 text-xs">
                            <span className="font-medium">{outputLang?.nativeName || 'Unknown'}</span>
                            <FileText className="h-3 w-3 text-primary" />
                          </div>
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
                          <Button onClick={() => onEditDocument(document.id)} variant="outline" size="sm" className="flex-1">
                            <Edit className="mr-1 h-3 w-3" />
                            View
                          </Button>
                          {document.hasGeneratedContent && document.generatedContent && (
                            <Button onClick={() => onViewContent && onViewContent(document.id)} variant="default" size="sm" className="flex-1">
                              <Eye className="mr-1 h-3 w-3" />
                              Content
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
