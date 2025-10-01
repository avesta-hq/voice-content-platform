'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SpeechRecognitionManager } from '@/lib/speechRecognition';
import { RecordingState } from '@/types';
import { getLanguageByCode } from '@/lib/languages';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Save, 
  X, 
  Clock, 
  Languages, 
  FileText, 
  AlertTriangle,
  CheckCircle2,
  Volume2
} from 'lucide-react';

interface SessionRecorderProps {
  inputLanguage: string;
  onSessionComplete: (transcript: string, duration: number, notes?: string) => void;
  onCancel: () => void;
}

export default function SessionRecorder({ inputLanguage, onSessionComplete, onCancel }: SessionRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false, // Keep this for now but won't be used
    transcript: '',
    duration: 0
  });

  const [isSupported, setIsSupported] = useState(false);
  const [notes, setNotes] = useState<string>('');
  const speechManager = useRef<SpeechRecognitionManager | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cumulativeTranscript = useRef<string>('');

  useEffect(() => {
    speechManager.current = new SpeechRecognitionManager();
    setIsSupported(speechManager.current.isSupportedInBrowser());
  }, []);

  useEffect(() => {
    if (recordingState.isRecording /* && !recordingState.isPaused */) {
      intervalRef.current = setInterval(() => {
        setRecordingState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [recordingState.isRecording /* , recordingState.isPaused */]);

  const startRecording = () => {
    if (!speechManager.current) return;

    // Reset cumulative transcript when starting fresh
    cumulativeTranscript.current = '';
    
    // Set the language for speech recognition
    const selectedLanguage = getLanguageByCode(inputLanguage);
    if (selectedLanguage) {
      speechManager.current.setLanguage(selectedLanguage.speechRecognitionCode);
    }
    
    setRecordingState({
      isRecording: true,
      isPaused: false,
      transcript: '',
      duration: 0
    });

    speechManager.current.startRecording(
      (transcript, isFinal) => {
        if (isFinal) {
          // Add final transcript to cumulative
          cumulativeTranscript.current += transcript;
          setRecordingState(prev => ({
            ...prev,
            transcript: cumulativeTranscript.current
          }));
        } else {
          // Show interim + cumulative transcript
          setRecordingState(prev => ({
            ...prev,
            transcript: cumulativeTranscript.current + transcript
          }));
        }
      },
      (error) => {
        console.error('Speech recognition error:', error);
        setRecordingState(prev => ({ ...prev, isRecording: false }));
      },
      () => {
        setRecordingState(prev => ({ ...prev, isRecording: false }));
      }
    );
  };

  // Pause feature commented out for now
  /*
  const pauseRecording = () => {
    if (!speechManager.current) return;

    // When pausing, ensure we keep the current transcript
    speechManager.current.pauseRecording();
    setRecordingState(prev => ({ ...prev, isPaused: true }));
  };

  const resumeRecording = () => {
    if (!speechManager.current) return;

    // When resuming, continue from where we left off
    speechManager.current.resumeRecording();
    setRecordingState(prev => ({ ...prev, isPaused: false }));
  };
  */

  const stopRecording = () => {
    if (!speechManager.current) return;

    speechManager.current.stopRecording();
    setRecordingState(prev => ({ ...prev, isRecording: false }));
  };

  const handleSaveSession = () => {
    if (recordingState.transcript.trim()) {
      onSessionComplete(recordingState.transcript, recordingState.duration, notes?.trim() || '');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedLanguage = getLanguageByCode(inputLanguage);

  if (!isSupported) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-base">
            Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari for the best experience.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mic className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Record New Session</h1>
          <p className="text-muted-foreground text-lg">
            Add more content to your document in {selectedLanguage?.nativeName || selectedLanguage?.name}
          </p>
        </div>

        {/* Language Display Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-primary">
              <Languages className="h-5 w-5" />
              Document Language Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Badge variant="secondary" className="text-lg px-4 py-2 mb-2">
              {selectedLanguage?.nativeName} ({selectedLanguage?.name})
            </Badge>
            <CardDescription>
              Language settings are configured for this document
            </CardDescription>
          </CardContent>
        </Card>
        
        {/* Recording Controls Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-6">
              {/* Recording Button */}
              <div className="flex justify-center">
                {!recordingState.isRecording ? (
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
                  >
                    <Mic className="h-8 w-8" />
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    size="lg"
                    variant="destructive"
                    className="h-16 w-16 rounded-full shadow-lg"
                  >
                    <Square className="h-8 w-8" />
                  </Button>
                )}
              </div>
              
              {/* Recording Status */}
              {recordingState.isRecording && (
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
                    <Badge variant="destructive" className="text-base px-3 py-1">
                      <Clock className="h-4 w-4 mr-1" />
                      Recording - {formatTime(recordingState.duration)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Speak clearly into your microphone
                  </p>
                </div>
              )}
              
              {/* Instructions */}
              {!recordingState.isRecording && (
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">
                    Click the microphone to start recording
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Make sure your microphone is enabled
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transcript Display */}
        {recordingState.transcript && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-primary" />
                Session Content
              </CardTitle>
              <CardDescription>
                Real-time transcription of your speech
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/30 rounded-lg min-h-[120px] border border-border/50">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {recordingState.transcript}
                </p>
              </div>
              {recordingState.transcript.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{recordingState.transcript.split(' ').length} words captured</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Session Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Session Notes
            </CardTitle>
            <CardDescription>
              Add optional context or notes about this recording session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="sessionNotes">Notes (Optional)</Label>
              <Textarea
                id="sessionNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any notes about this session (optional)..."
                className="resize-none"
              />
            </div>
            {notes.trim() && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>{notes.trim().length} characters added</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {recordingState.transcript && !recordingState.isRecording && (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={onCancel}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Session
                </Button>
                <Button
                  onClick={handleSaveSession}
                  size="lg"
                  className="flex-1"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Session
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">How to Record</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span>Click the microphone button to begin your recording session</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span>Speak clearly and naturally - your speech will be transcribed in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span>Click the stop button when you&apos;re finished with this session</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span>Add optional notes to provide context for your recording</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <span>Save your session to add this content to your document</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
