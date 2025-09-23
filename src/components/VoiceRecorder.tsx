'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SpeechRecognitionManager } from '@/lib/speechRecognition';
import { RecordingState, LanguageSettings } from '@/types';
import { getLanguageByCode, SUPPORTED_LANGUAGES } from '@/lib/languages';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause, 
  ArrowRight,
  Clock, 
  Languages, 
  Volume2, 
  FileText, 
  AlertTriangle,
  CheckCircle2,
  Settings,
  Zap
} from 'lucide-react';

interface VoiceRecorderProps {
  languageSettings: LanguageSettings;
  onLanguageSettingsChange: (settings: LanguageSettings) => void;
  onTranscriptComplete: (transcript: string) => void;
}

export default function VoiceRecorder({ languageSettings, onLanguageSettingsChange, onTranscriptComplete }: VoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    transcript: '',
    duration: 0
  });

  const [isSupported, setIsSupported] = useState(false);
  const speechManager = useRef<SpeechRecognitionManager | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cumulativeTranscript = useRef<string>(''); // Store all speech input

  useEffect(() => {
    speechManager.current = new SpeechRecognitionManager();
    setIsSupported(speechManager.current.isSupportedInBrowser());
  }, []);

  useEffect(() => {
    if (recordingState.isRecording && !recordingState.isPaused) {
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
  }, [recordingState.isRecording, recordingState.isPaused]);

  const startRecording = () => {
    if (!speechManager.current) return;

    // Reset cumulative transcript when starting fresh
    cumulativeTranscript.current = '';
    
    // Set the language for speech recognition
    const selectedLanguage = getLanguageByCode(languageSettings.inputLanguage);
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

  const stopRecording = () => {
    if (!speechManager.current) return;

    speechManager.current.stopRecording();
    setRecordingState(prev => ({ ...prev, isRecording: false }));
  };

  const handleDone = () => {
    if (recordingState.transcript.trim()) {
      onTranscriptComplete(recordingState.transcript);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedInputLanguage = getLanguageByCode(languageSettings.inputLanguage);
  const selectedOutputLanguage = getLanguageByCode(languageSettings.outputLanguage);

  if (!isSupported) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-base">
            Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari for the best voice recording experience.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Volume2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Voice Input & Language Selection</h1>
          <p className="text-muted-foreground text-lg">
            Configure your languages and record voice content with advanced controls
          </p>
        </div>

        {/* Language Settings Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Settings className="h-5 w-5" />
              Language Configuration
            </CardTitle>
            <CardDescription>
              Set your input and output languages for voice recording and content generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Language */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center">
                    <Mic className="h-3 w-3 text-primary" />
                  </div>
                  Speech Input Language
                </Label>
                <Select
                  value={languageSettings.inputLanguage}
                  onValueChange={(value) => onLanguageSettingsChange({
                    ...languageSettings,
                    inputLanguage: value
                  })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Choose your speaking language" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((language) => (
                      <SelectItem key={language.code} value={language.code}>
                        <div className="flex items-center gap-2">
                          <span>{language.nativeName}</span>
                          <span className="text-muted-foreground">({language.name})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Output Language */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <div className="w-6 h-6 bg-secondary/20 rounded-md flex items-center justify-center">
                    <FileText className="h-3 w-3 text-secondary-foreground" />
                  </div>
                  Content Output Language
                </Label>
                <Select
                  value={languageSettings.outputLanguage}
                  onValueChange={(value) => onLanguageSettingsChange({
                    ...languageSettings,
                    outputLanguage: value
                  })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Choose content generation language" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((language) => (
                      <SelectItem key={language.code} value={language.code}>
                        <div className="flex items-center gap-2">
                          <span>{language.nativeName}</span>
                          <span className="text-muted-foreground">({language.name})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Language Flow Preview */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Language Workflow
              </Label>
              <div className="flex items-center justify-center gap-4 p-4 bg-background/50 rounded-lg border border-border/50">
                <div className="text-center">
                  <Badge variant="secondary" className="mb-2">
                    <Mic className="h-3 w-3 mr-1" />
                    Speech Input
                  </Badge>
                  <div className="text-sm font-medium">
                    {selectedInputLanguage?.nativeName || 'Select language'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedInputLanguage?.name || ''}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-primary" />
                <div className="text-center">
                  <Badge variant="default" className="mb-2">
                    <Zap className="h-3 w-3 mr-1" />
                    AI Processing
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    Real-time transcription
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-primary" />
                <div className="text-center">
                  <Badge variant="outline" className="mb-2">
                    <FileText className="h-3 w-3 mr-1" />
                    Content Output
                  </Badge>
                  <div className="text-sm font-medium">
                    {selectedOutputLanguage?.nativeName || 'Select language'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedOutputLanguage?.name || ''}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Advanced Recording Controls Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-6">
              {/* Main Recording Button */}
              <div className="flex justify-center">
                {!recordingState.isRecording ? (
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="h-20 w-20 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
                  >
                    <Mic className="h-10 w-10" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-4">
                    {recordingState.isPaused ? (
                      <Button
                        onClick={resumeRecording}
                        size="lg"
                        className="h-16 w-16 rounded-full bg-green-600 hover:bg-green-700 shadow-lg"
                      >
                        <Play className="h-8 w-8" />
                      </Button>
                    ) : (
                      <Button
                        onClick={pauseRecording}
                        size="lg"
                        variant="secondary"
                        className="h-16 w-16 rounded-full shadow-lg"
                      >
                        <Pause className="h-8 w-8" />
                      </Button>
                    )}
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      variant="destructive"
                      className="h-16 w-16 rounded-full shadow-lg"
                    >
                      <Square className="h-8 w-8" />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Recording Status */}
              {recordingState.isRecording && (
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      recordingState.isPaused 
                        ? 'bg-yellow-500' 
                        : 'bg-destructive animate-pulse'
                    }`}></div>
                    <Badge 
                      variant={recordingState.isPaused ? "secondary" : "destructive"} 
                      className="text-base px-4 py-2"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {recordingState.isPaused ? 'Paused' : 'Recording'} - {formatTime(recordingState.duration)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {recordingState.isPaused 
                      ? 'Your input is safely preserved. Click Resume to continue.'
                      : 'Speak clearly into your microphone. Use Pause to take breaks.'
                    }
                  </p>
                  
                  {/* Pause State Alert */}
                  {recordingState.isPaused && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <Pause className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <strong>Recording Paused:</strong> Your speech input is safely preserved. 
                        Click the Resume button to continue recording from where you left off.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              
              {/* Instructions for idle state */}
              {!recordingState.isRecording && (
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">
                    Click the microphone to start recording
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Advanced controls: Pause anytime to preserve your input
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Transcript Display */}
        {recordingState.transcript && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-primary" />
                Voice Input Transcript
              </CardTitle>
              <CardDescription>
                Real-time transcription of your speech with advanced pause/resume support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/30 rounded-lg min-h-[150px] border border-border/50">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed text-base">
                  {recordingState.transcript}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{recordingState.transcript.split(' ').length} words captured</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{formatTime(recordingState.duration)} recorded</span>
                  </div>
                </div>
                {recordingState.isPaused && (
                  <Badge variant="secondary" className="text-xs">
                    <Pause className="h-3 w-3 mr-1" />
                    Paused - Safe to resume
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Process Content Button */}
        {recordingState.transcript && !recordingState.isRecording && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Ready to Process</h3>
                  <p className="text-muted-foreground">
                    Your voice input has been captured successfully. Process it to generate content.
                  </p>
                </div>
                <Button
                  onClick={handleDone}
                  size="lg"
                  className="px-8"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Process Content
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Instructions */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">Advanced Recording Guide</CardTitle>
            <CardDescription>
              Master the advanced voice recording features with pause/resume functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Setup</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Configure your input language ({selectedInputLanguage?.name || 'not selected'})</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Set your output language ({selectedOutputLanguage?.name || 'not selected'})</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Ensure your microphone is enabled and working</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Recording</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Click the large microphone button to start recording</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Use Pause to take breaks - your input is safely preserved</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Click Resume to continue from where you left off</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Stop recording and process your content when finished</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
