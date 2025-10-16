"use client";

import React, { useEffect, useRef, useState } from 'react';
import { VoiceSession } from '@/types';
import { SpeechRecognitionManager } from '@/lib/speechRecognition';
import { getLanguageByCode } from '@/lib/languages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Clock, 
  FileText, 
  Volume2, 
  AlertTriangle, 
  Save, 
  X, 
  Trash2,
  Edit3,
  Loader2
} from 'lucide-react';

interface SessionEditModalProps {
  open: boolean;
  session: VoiceSession;
  inputLanguage: string;
  onClose: () => void;
  onSaved: (updated: VoiceSession) => void;
}

export default function SessionEditModal({ open, session, inputLanguage, onClose, onSaved }: SessionEditModalProps) {
  const [isSupported, setIsSupported] = useState(false);
  const speechManager = useRef<SpeechRecognitionManager | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [newTranscript, setNewTranscript] = useState('');
  const [title, setTitle] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cumulative = useRef<string>('');

  useEffect(() => {
    speechManager.current = new SpeechRecognitionManager();
    setIsSupported(speechManager.current.isSupportedInBrowser());
  }, []);

  useEffect(() => {
    if (!open) {
      // Cleanup when closing
      stopRecording();
      setRecordedDuration(0);
      setNewTranscript('');
      setTitle('');
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setTitle(session.title || '');
    }
  }, [open, session]);

  const startRecording = () => {
    if (!speechManager.current) return;

    const selected = getLanguageByCode(inputLanguage);
    if (selected) {
      speechManager.current.setLanguage(selected.speechRecognitionCode);
    }

    cumulative.current = '';
    setNewTranscript('');
    setRecordedDuration(0);
    setIsRecording(true);

    timerRef.current = setInterval(() => setRecordedDuration(prev => prev + 1), 1000);

    speechManager.current.startRecording(
      (partial, isFinal) => {
        if (isFinal) {
          cumulative.current += partial;
          setNewTranscript(cumulative.current);
        } else {
          setNewTranscript(cumulative.current + partial);
        }
      },
      (err) => {
        console.error('Speech error:', err);
        setError('Speech recognition error');
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

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(''); // Clear any previous errors
      
      const appended = newTranscript.trim();
      if (!appended) {
        // Allow title-only edits for outline sessions
        if ((session.origin === 'outline') && title.trim() !== (session.title || '')) {
          const res = await fetch(`/api/voiceSessions/${session.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...session,
              title: title.trim(),
              timestamp: new Date().toISOString(),
            })
          });
          if (!res.ok) throw new Error(`Failed to save session: ${res.status}`);
          const updated: VoiceSession = await res.json();
          onSaved(updated);
          onClose();
          return;
        } else {
          onClose();
          return;
        }
      }
      const merged = session.transcript + (session.transcript.endsWith(' ') || session.transcript.length === 0 ? '' : ' ') + appended;

      const res = await fetch(`/api/voiceSessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...session,
          transcript: merged,
          duration: session.duration + recordedDuration,
          timestamp: new Date().toISOString(),
          ...(session.origin === 'outline' ? { title: title.trim() } : {})
        })
      });
      if (!res.ok) throw new Error(`Failed to save session: ${res.status}`);
      const updated: VoiceSession = await res.json();
      onSaved(updated);
      onClose();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isSaving ? undefined : onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-6xl xl:max-w-7xl w-full max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Edit3 className="h-5 w-5 text-primary" />
            Edit Session {session.sessionNumber}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Add more voice input to this session or edit the title and content.
          </DialogDescription>
        </DialogHeader>

        {!isSupported ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Speech recognition is not supported in this browser.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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

            {/* Current Content and Notes - Full width utilization */}
            {(session.transcript && session.transcript.trim().length > 0) || (session.notes && session.notes.trim().length > 0) ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {session.transcript && session.transcript.trim().length > 0 && (
                  <Card className={`${session.notes && session.notes.trim().length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        Current Content
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Existing voice transcript for this session
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 sm:p-5 bg-muted/30 rounded-lg border max-h-64 sm:max-h-80 overflow-y-auto">
                        <p className="whitespace-pre-wrap text-foreground text-sm sm:text-base leading-relaxed">
                          {session.transcript}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {session.notes && session.notes.trim().length > 0 && (
                  <Card className="lg:col-span-1">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                        Session Notes
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Additional context and outline points
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="p-3 sm:p-4 bg-accent/20 rounded-lg border border-accent/30 max-h-64 sm:max-h-80 overflow-y-auto">
                        {(() => {
                          const raw = session.notes!.trim();
                          const hasSeparator = raw.includes('\n\n');
                          const [descPart, bulletsPart] = hasSeparator ? raw.split('\n\n', 2) : [raw, ''];
                          const description = (descPart || '').trim();
                          const bullets = (bulletsPart || '')
                            .split('\n')
                            .map((s) => s.trim())
                            .filter(Boolean);
                          return (
                            <div className="space-y-3">
                              {description && (
                                <p className="text-sm text-muted-foreground italic whitespace-pre-wrap leading-relaxed">
                                  {description}
                                </p>
                              )}
                              {bullets.length > 0 && (
                                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground italic">
                                  {bullets.map((b, i) => (
                                    <li key={i}>{b}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : null}

            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                    Live Voice Input
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
                  Add more content to this session using voice input
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 sm:p-6 bg-primary/5 border border-primary/20 rounded-lg min-h-[120px] sm:min-h-[140px]">
                  <p className="whitespace-pre-wrap text-foreground text-sm sm:text-base leading-relaxed">
                    {newTranscript || (
                      <span className="text-muted-foreground italic">
                        Start speaking to add more content...
                      </span>
                    )}
                  </p>
                </div>
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
                    onClick={() => { setNewTranscript(''); cumulative.current=''; setRecordedDuration(0); }} 
                    variant="outline"
                    className="flex items-center gap-2 w-full sm:w-auto"
                    disabled={isSaving}
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview Final Content - Full width */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                  Preview Final Content
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  This is how your session will look after saving
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 sm:p-6 bg-secondary/30 rounded-lg border border-secondary/40 min-h-[140px] sm:min-h-[160px] max-h-72 sm:max-h-80 overflow-y-auto">
                  <p className="whitespace-pre-wrap text-foreground text-sm sm:text-base leading-relaxed">
                    {(session.transcript + (newTranscript ? (session.transcript.endsWith(' ') || session.transcript.length===0 ? '' : ' ') + newTranscript : ''))}
                  </p>
                </div>
              </CardContent>
            </Card>

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
              disabled={isSaving || !((session.origin === 'outline' && title.trim() !== (session.title || '')) || newTranscript.trim().length > 0)}
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
