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
  platform: string;
  content: string;
  formatted: boolean;
  twitterThread?: string[];
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

// User Management Types
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar: string;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
  preferences: UserPreferences;
}

export interface UserPreferences {
  defaultInputLanguage: string;
  defaultOutputLanguage: string;
  theme: 'light' | 'dark';
}

export interface UserSession {
  id: string;
  userId: number;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface UserContent {
  id: string;
  userId: number;
  originalText: string;
  generatedContent: PlatformContent[];
  inputLanguage: string;
  outputLanguage: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

// Document Management Types
export interface GeneratedContent {
  blog: string;
  linkedin: string;
  twitter: string;
  podcast: string;
  twitterThread?: string[];
}

export interface GeneratedMeta {
  inputLanguage: string;
  outputLanguage: string;
  wordCount: number;
}

export interface UserDocument {
  id: string;
  userId: number;
  title: string;
  inputLanguage: string;
  outputLanguage: string;
  createdAt: string;
  updatedAt: string;
  
  // Content Management
  sessions: string[] | VoiceSession[]; // Can be either session IDs or full session objects
  totalDuration: number;
  totalSessions: number;
  wordCount: number;

  // Generated Content (auto-saved)
  generatedContent?: GeneratedContent;
  hasGeneratedContent?: boolean;
  generatedAt?: string;
  generatedMeta?: GeneratedMeta;
  requiresRegeneration?: boolean;

  // Document Status (defaults to 'draft' for backward compatibility)
  status?: 'draft' | 'completed';
}

export interface VoiceSession {
  id: string;
  documentId: string;
  sessionNumber: number;
  transcript: string;
  duration: number;
  timestamp: string;
  notes?: string;
}

export interface DocumentWithSessions extends UserDocument {
  sessions: VoiceSession[];
}

export interface CreateDocumentData {
  title: string;
  inputLanguage: string;
  outputLanguage: string;
}
