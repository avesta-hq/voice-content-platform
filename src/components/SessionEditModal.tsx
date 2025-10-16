"use client";

import React, { useEffect, useRef, useState } from 'react';
import { VoiceSession } from '@/types';
// COMMENTED OUT: SessionImage import (not needed without image features)
// import { SessionImage } from '@/types';
import { SpeechRecognitionManager } from '@/lib/speechRecognition';
import { getLanguageByCode } from '@/lib/languages';
import { UserService } from '@/lib/userService';
import RichTextEditor from '@/components/RichTextEditorWrapper';
// COMMENTED OUT: Image upload feature temporarily disabled
// import ImageUploadGallery from '@/components/ImageUploadGallery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mic, 
  Square, 
  Clock, 
  FileText, 
  Volume2, 
  AlertTriangle, 
  Save, 
  X, 
  Edit3,
  Loader2,
  Type,
  RefreshCw,
  Info
} from 'lucide-react';

interface SessionEditModalProps {
  open: boolean;
  session: VoiceSession;
  inputLanguage: string;
  documentId: string;
  onClose: () => void;
  onSaved: (updated: VoiceSession) => void;
}

type EditMode = 'voice' | 'text';

export default function SessionEditModal({ 
  open, 
  session, 
  inputLanguage, 
  documentId,
  onClose, 
  onSaved 
}: SessionEditModalProps) {
  // Speech recognition
  const [isSupported, setIsSupported] = useState(false);
  const speechManager = useRef<SpeechRecognitionManager | null>(null);

  // Edit mode
  const [editMode, setEditMode] = useState<EditMode>('voice');
  const [showModeWarning, setShowModeWarning] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [newVoiceTranscript, setNewVoiceTranscript] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cumulative = useRef<string>('');

  // Text editing state
  const [richContent, setRichContent] = useState('');
  const [plainTranscript, setPlainTranscript] = useState('');

  // COMMENTED OUT: Images state
  // const [images, setImages] = useState<SessionImage[]>([]);

  // Common state
  const [title, setTitle] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize speech recognition
  useEffect(() => {
    speechManager.current = new SpeechRecognitionManager();
    setIsSupported(speechManager.current.isSupportedInBrowser());
  }, []);

  // Initialize state when modal opens
  useEffect(() => {
    if (open && session) {
      // Set title
      setTitle(session.title || '');
      
      // Set edit mode based on session data
      const initialMode: EditMode = session.editMode || (session.richContent ? 'text' : 'voice');
      setEditMode(initialMode);
      
      // Load content
      if (session.richContent) {
        setRichContent(session.richContent);
      } else if (session.transcript) {
        // Convert plain text to HTML paragraphs
        const htmlContent = session.transcript
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => `<p>${line}</p>`)
          .join('');
        setRichContent(htmlContent || '<p></p>');
      }
      
      setPlainTranscript(session.transcript || '');
      
      // COMMENTED OUT: Load images
      // setImages(session.images || []);
      
      // Reset temporary states
      setNewVoiceTranscript('');
      setRecordedDuration(0);
      setError('');
      setShowModeWarning(false);
    }
  }, [open, session]);

  // Cleanup when closing
  useEffect(() => {
    if (!open) {
      stopRecording();
      setNewVoiceTranscript('');
      setRecordedDuration(0);
      setError('');
      setShowModeWarning(false);
    }
  }, [open]);

  // Voice recording functions
  const startRecording = () => {
    if (!speechManager.current) return;

    const selected = getLanguageByCode(inputLanguage);
    if (selected) {
      speechManager.current.setLanguage(selected.speechRecognitionCode);
    }

    cumulative.current = '';
    setNewVoiceTranscript('');
    setRecordedDuration(0);
    setIsRecording(true);

    timerRef.current = setInterval(() => setRecordedDuration(prev => prev + 1), 1000);

    speechManager.current.startRecording(
      (partial, isFinal) => {
        if (isFinal) {
          cumulative.current += partial;
          setNewVoiceTranscript(cumulative.current);
        } else {
          setNewVoiceTranscript(cumulative.current + partial);
        }
      },
      (err) => {
        console.error('Speech error:', err);
        setError('Speech recognition error. Please try again.');
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );
  };

  const stopRecording = () => {
    if (!speechManager.current) return;
    speechManager.current.stopRecording();
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Mode switching
  const handleModeChange = (newMode: EditMode) => {
    if (newMode === editMode) return;
    
    // Show warning if switching from voice to text or vice versa
    if ((editMode === 'voice' && newMode === 'text') || (editMode === 'text' && newMode === 'voice')) {
      setShowModeWarning(true);
    }
    
    setEditMode(newMode);
    setError('');
  };

  // Convert rich HTML to plain text for voice mode preview
  const stripHtml = (html: string): string => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // COMMENTED OUT: Image upload handler
  /*
  const handleImageAdd = async (file: File, width?: number, height?: number) => {
    try {
      setError('');
      
      const currentUser = UserService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const formData = new FormData();
      formData.append('image', file);
      formData.append('userId', currentUser.id.toString());
      formData.append('documentId', documentId);
      formData.append('order', (images.length + 1).toString());
      if (width) formData.append('width', width.toString());
      if (height) formData.append('height', height.toString());

      const response = await fetch(`/api/voiceSessions/${session.id}/images`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const result = await response.json();
      setImages(prev => [...prev, result.image]);
      
    } catch (err) {
      console.error('Image upload error:', err);
      throw err; // Re-throw to let ImageUploadGallery handle it
    }
  };

  // Image remove handler
  const handleImageRemove = async (imageId: string) => {
    try {
      setError('');
      
      const response = await fetch(`/api/voiceSessions/${session.id}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }

      setImages(prev => prev.filter(img => img.id !== imageId));
      
    } catch (err) {
      console.error('Image delete error:', err);
      throw err; // Re-throw to let ImageUploadGallery handle it
    }
  };
  */

  // Save handler
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');

      let finalTranscript = session.transcript;
      let finalRichContent = session.richContent;
      let finalDuration = session.duration;

      // Handle based on edit mode
      if (editMode === 'voice') {
        // Voice mode: append new voice input to existing transcript
        const newText = newVoiceTranscript.trim();
        if (newText) {
          finalTranscript = session.transcript 
            ? `${session.transcript}${session.transcript.endsWith(' ') ? '' : ' '}${newText}`
            : newText;
          finalDuration = session.duration + recordedDuration;
          
          // Update rich content as well if it exists
          if (session.richContent) {
            finalRichContent = `${session.richContent}<p>${newText}</p>`;
          }
        }
      } else {
        // Text mode: use edited rich content
        finalRichContent = richContent;
        finalTranscript = stripHtml(richContent); // Update plain transcript from rich content
      }

      // Build update payload
      const updatePayload: Partial<VoiceSession> = {
        transcript: finalTranscript,
        richContent: finalRichContent,
        duration: finalDuration,
        editMode: editMode,
        lastEditedWith: editMode,
        timestamp: new Date().toISOString(),
        // COMMENTED OUT: Image data
        // images: images,
        // imageCount: images.length,
      };

      // Add createdWith if not set
      if (!session.createdWith) {
        updatePayload.createdWith = editMode;
      }

      // Add title for outline sessions
      if (session.origin === 'outline') {
        updatePayload.title = title.trim();
      }

      // Save to backend
      const response = await fetch(`/api/voiceSessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...session,
          ...updatePayload,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save session: ${response.status}`);
      }

      const updatedSession: VoiceSession = await response.json();
      onSaved(updatedSession);
      onClose();
      
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save session');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Check if there are changes to save
  const hasChanges = () => {
    if (editMode === 'voice') {
      return newVoiceTranscript.trim().length > 0;
    } else {
      const currentPlainText = stripHtml(richContent);
      return currentPlainText !== plainTranscript;
    }
  };

  const canSave = !isSaving && (
    hasChanges() || 
    // COMMENTED OUT: Image change detection
    // images.length !== (session.images?.length || 0) ||
    (session.origin === 'outline' && title.trim() !== (session.title || ''))
  );

  return (
    <Dialog open={open} onOpenChange={isSaving ? undefined : onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-6xl xl:max-w-7xl w-full max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Edit3 className="h-5 w-5 text-primary" />
            Edit Session {session.sessionNumber}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Edit your session content using voice input or text editor.
          </DialogDescription>
        </DialogHeader>

        {!isSupported ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Speech recognition is not supported in this browser. Please use text editor mode.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Title for outline sessions */}
            {session.origin === 'outline' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                    Session Title
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="session-title" className="text-sm sm:text-base">Title</Label>
                    <Input
                      id="session-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter session title"
                      disabled={isSaving}
                      className="h-10 sm:h-11 text-sm sm:text-base"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Edit Mode Selector */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Edit3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Edit Mode
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Choose how you want to edit this session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select 
                  value={editMode} 
                  onValueChange={(value: EditMode) => handleModeChange(value)}
                  disabled={isSaving}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="voice">
                      <div className="flex items-center gap-2">
                        <Mic className="h-4 w-4" />
                        <span>Voice Input</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="text">
                      <div className="flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        <span>Text Editor</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Mode Warning */}
                {showModeWarning && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {editMode === 'text' 
                        ? 'Switched to Text Editor. Your current content has been loaded and you can now edit it with rich formatting.'
                        : 'Switched to Voice Input. New voice recordings will be appended to your existing content.'
                      }
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Voice Input Mode */}
            {editMode === 'voice' && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                      Voice Input
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={isRecording ? "destructive" : "secondary"} className="text-xs">
                        {isRecording ? (
                          <>
                            <div className="w-2 h-2 bg-current rounded-full animate-pulse mr-1"></div>
                            Recording
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Idle
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {formatTime(recordedDuration)}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    Record additional voice input to append to this session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current Content Display */}
                  {session.transcript && (
                    <div className="p-4 bg-muted/30 rounded-lg border">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
                        Existing Content
                      </Label>
                      <p className="text-sm whitespace-pre-wrap text-foreground/80 max-h-32 overflow-y-auto">
                        {session.transcript}
                      </p>
                    </div>
                  )}

                  {/* New Voice Input Display */}
                  <div className="p-4 sm:p-6 bg-primary/5 border border-primary/20 rounded-lg min-h-[120px] sm:min-h-[140px]">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
                      New Voice Input
                    </Label>
                    <p className="whitespace-pre-wrap text-foreground text-sm sm:text-base leading-relaxed">
                      {newVoiceTranscript || (
                        <span className="text-muted-foreground italic">
                          {isRecording ? 'Listening... Speak now.' : 'Click "Start Recording" to add voice input.'}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Recording Controls */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {!isRecording ? (
                      <Button 
                        onClick={startRecording} 
                        className="flex items-center gap-2 w-full sm:w-auto"
                        disabled={isSaving}
                      >
                        <Mic className="h-4 w-4" />
                        Start Recording
                      </Button>
                    ) : (
                      <Button 
                        onClick={stopRecording} 
                        variant="destructive" 
                        className="flex items-center gap-2 w-full sm:w-auto"
                        disabled={isSaving}
                      >
                        <Square className="h-4 w-4" />
                        Stop Recording
                      </Button>
                    )}
                    <Button 
                      onClick={() => { 
                        setNewVoiceTranscript(''); 
                        cumulative.current = ''; 
                        setRecordedDuration(0); 
                      }} 
                      variant="outline"
                      className="flex items-center gap-2 w-full sm:w-auto"
                      disabled={isSaving || !newVoiceTranscript}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Text Editor Mode */}
            {editMode === 'text' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Type className="h-4 w-4 sm:h-5 sm:w-5" />
                    Text Editor
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Edit your content with rich text formatting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    content={richContent}
                    onChange={setRichContent}
                    placeholder="Type your content here... Use the toolbar for formatting."
                    disabled={isSaving}
                  />
                </CardContent>
              </Card>
            )}

            {/* COMMENTED OUT: Images Section */}
            {/*
            <Card>
              <CardContent className="pt-6">
                <ImageUploadGallery
                  images={images}
                  maxImages={5}
                  maxSizeMB={5}
                  onImageAdd={handleImageAdd}
                  onImageRemove={handleImageRemove}
                  disabled={isSaving}
                />
              </CardContent>
            </Card>
            */}
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-4 pt-6 border-t mt-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              Session #{session.sessionNumber}
            </Badge>
            {session.origin && (
              <Badge variant="secondary" className="text-xs">
                {session.origin === 'outline' ? 'From Outline' : 'Voice Recording'}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {editMode === 'voice' ? 'Voice Mode' : 'Text Mode'}
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSave}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
