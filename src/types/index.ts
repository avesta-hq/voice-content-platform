export interface VoiceInput {
  text: string;
  language: string;
  timestamp: Date;
}

export interface ContentOutput {
  id: string;
  originalInput: VoiceInput;
  blogPost: string;
  linkedinPost: string;
  twitterPost: string;
  podcastScript: string;
  createdAt: Date;
}

export interface PlatformContent {
  platform: 'blog' | 'linkedin' | 'twitter' | 'podcast';
  content: string;
  formatted: boolean;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  transcript: string;
  duration: number;
}

export interface AIProcessingState {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
}

export interface LanguageSettings {
  inputLanguage: string;
  outputLanguage: string;
}
