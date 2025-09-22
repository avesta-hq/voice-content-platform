'use client';

import React, { useState } from 'react';
import { CreateDocumentData } from '@/types';
import { DocumentService } from '@/lib/documentService';
import { UserService } from '@/lib/userService';
import { SUPPORTED_LANGUAGES } from '@/lib/languages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Mic, FileText, ArrowRight, Lightbulb, Loader2 } from 'lucide-react';

interface DocumentCreationFormProps {
  onDocumentCreated: (documentId: string) => void;
  onCancel: () => void;
}

export default function DocumentCreationForm({ onDocumentCreated, onCancel }: DocumentCreationFormProps) {
  const [formData, setFormData] = useState<CreateDocumentData>({
    title: '',
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
      const newDocument = await DocumentService.createDocumentWithAccess(currentUser.id, formData);
      
      // Add a small delay to ensure S3 consistency before navigation
      console.log('⏳ Waiting for S3 consistency before navigation...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
    <div className="min-h-screen flex items-start sm:items-center justify-center p-4 pt-8 sm:pt-4">
      <div className="w-full max-w-lg space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create New Document</h1>
          <p className="text-sm sm:text-base text-muted-foreground px-4 sm:px-0">
            Set up your document and start your voice content journey
          </p>
        </div>

        {/* Main Form Card */}
        <Card className="border-0 shadow-xl mx-2 sm:mx-0">
          <CardContent className="p-4 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Title Input */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm sm:text-base font-medium flex items-center gap-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-md flex items-center justify-center">
                    <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                  </div>
                  Document Title
                </Label>
                <Input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`h-11 sm:h-12 text-sm sm:text-base ${titleError ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                  placeholder="e.g., My Weekly Tech Podcast"
                  required
                />
                {titleError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <span className="w-1 h-1 bg-destructive rounded-full"></span>
                    {titleError}
                  </p>
                )}
              </div>

              <Separator className="my-4 sm:my-6" />

              {/* Language Selection */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Language Settings</h3>
                
                <div className="space-y-3 sm:space-y-4">
                  {/* Input Language */}
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base font-medium flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-md flex items-center justify-center">
                        <Mic className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                      </div>
                      Speech Language
                    </Label>
                    <Select
                      value={formData.inputLanguage}
                      onValueChange={(value) => handleInputChange('inputLanguage', value)}
                    >
                      <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
                        <SelectValue placeholder="Choose your speaking language" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_LANGUAGES.map((language) => (
                          <SelectItem key={language.code} value={language.code} className="text-sm sm:text-base">
                            <div className="flex items-center gap-2">
                              <span>{language.nativeName}</span>
                              <span className="text-muted-foreground text-xs sm:text-sm">({language.name})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Output Language */}
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base font-medium flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/10 rounded-md flex items-center justify-center">
                        <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                      </div>
                      Content Language
                    </Label>
                    <Select
                      value={formData.outputLanguage}
                      onValueChange={(value) => handleInputChange('outputLanguage', value)}
                    >
                      <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
                        <SelectValue placeholder="Choose content output language" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_LANGUAGES.map((language) => (
                          <SelectItem key={language.code} value={language.code} className="text-sm sm:text-base">
                            <div className="flex items-center gap-2">
                              <span>{language.nativeName}</span>
                              <span className="text-muted-foreground text-xs sm:text-sm">({language.name})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Language Workflow Preview */}
                <div className="mt-4 sm:mt-6 space-y-3">
                  <div className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Workflow Preview
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-2">
                    {/* Step 1: Speech Input */}
                    <Card className="p-3 sm:p-4 bg-primary/5 border-primary/20">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                            <Mic className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-xs font-medium text-primary">STEP 1</span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">You speak in</div>
                          <div className="text-sm font-semibold text-foreground">
                            {SUPPORTED_LANGUAGES.find(l => l.code === formData.inputLanguage)?.nativeName || 'Select language'}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Arrow/Connector */}
                    <div className="hidden sm:flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="sm:hidden flex justify-center">
                      <div className="w-px h-4 bg-border"></div>
                    </div>

                    {/* Step 2: Content Output */}
                    <Card className="p-3 sm:p-4 bg-secondary/50 border-secondary/50">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                            <FileText className="h-3 w-3 text-secondary-foreground" />
                          </div>
                          <span className="text-xs font-medium text-secondary-foreground">STEP 2</span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Content generated in</div>
                          <div className="text-sm font-semibold text-foreground">
                            {SUPPORTED_LANGUAGES.find(l => l.code === formData.outputLanguage)?.nativeName || 'Select language'}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Quick Summary */}
                  <div className="p-3 bg-muted/30 rounded-md border border-muted/50">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-foreground">Ready to go!</div>
                        <div className="text-xs text-muted-foreground">
                          Speak in <span className="font-medium text-foreground">{SUPPORTED_LANGUAGES.find(l => l.code === formData.inputLanguage)?.name}</span>, 
                          get content in <span className="font-medium text-foreground">{SUPPORTED_LANGUAGES.find(l => l.code === formData.outputLanguage)?.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                  <AlertDescription className="text-base">{error}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="order-2 sm:order-1 flex-1 h-11 sm:h-12 text-sm sm:text-base"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !formData.title.trim()}
                  className="order-1 sm:order-2 flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Create & Start Recording</span>
                      <span className="sm:hidden">Create & Start Recording</span>
                      <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Bottom Info */}
        <div className="text-center space-y-2 px-4 sm:px-0 pb-4 sm:pb-0">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Your document will be ready for voice recording immediately
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-1 h-1 bg-primary rounded-full"></div>
              Multi-session recording
            </span>
            <span className="flex items-center gap-1">
              <div className="w-1 h-1 bg-primary rounded-full"></div>
              AI content generation
            </span>
            <span className="flex items-center gap-1">
              <div className="w-1 h-1 bg-primary rounded-full"></div>
              Export to all platforms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
