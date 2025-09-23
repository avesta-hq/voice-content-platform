'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DocumentWithSessions } from '@/types';
import { DocumentService } from '@/lib/documentService';
import { getLanguageByCode } from '@/lib/languages';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Zap,
  FileText,
  Twitter,
  Linkedin,
  Rss,
  Mic,
  AlertTriangle,
  Loader2
} from 'lucide-react';

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Zap className="h-6 w-6 text-primary" />
            Generate Content
          </DialogTitle>
          <DialogDescription>
            Review your document content and confirm to generate platform-specific versions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading document content...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              </AlertDescription>
            </Alert>
          ) : document ? (
            <div className="space-y-6">
              {/* Document Info */}
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-orange-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-center text-xl text-foreground">{document.title}</CardTitle>
                  <CardDescription className="text-center">
                    Language: {getLanguageByCode(document.inputLanguage)?.nativeName} → {getLanguageByCode(document.outputLanguage)?.nativeName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-background/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{document.sessions.length}</div>
                      <div className="text-sm text-muted-foreground">Total Sessions</div>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{document.wordCount}</div>
                      <div className="text-sm text-muted-foreground">Total Words</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Combined Transcript Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Combined Content Preview
                  </CardTitle>
                  <CardDescription>
                    This is the complete content that will be processed for content generation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 border rounded-lg p-4 max-h-64 overflow-y-auto">
                    <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
                      {getCombinedTranscript()}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Scroll to see full content • {document.wordCount} words total
                  </p>
                </CardContent>
              </Card>

              {/* What Will Be Generated */}
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-orange-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    What Will Be Generated
                  </CardTitle>
                  <CardDescription>
                    AI will optimize your content for each platform while preserving your original message
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center bg-background/50 p-3 rounded-lg border">
                      <Rss className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <div className="font-medium text-foreground">Blog Post</div>
                    </div>
                    <div className="text-center bg-background/50 p-3 rounded-lg border">
                      <Linkedin className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="font-medium text-foreground">LinkedIn</div>
                    </div>
                    <div className="text-center bg-background/50 p-3 rounded-lg border">
                      <Twitter className="h-8 w-8 mx-auto mb-2 text-sky-500" />
                      <div className="font-medium text-foreground">Twitter</div>
                    </div>
                    <div className="text-center bg-background/50 p-3 rounded-lg border">
                      <Mic className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <div className="font-medium text-foreground">Podcast</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Warning */}
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  <div>
                    <h4 className="font-medium text-orange-800 mb-1">Important Note</h4>
                    <p className="text-sm text-orange-700">
                      Once you confirm, AI will process your content and generate platform-specific versions. 
                      You can always go back to edit your document and regenerate content later.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex items-center justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!document || isProcessing}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Generate Content
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
