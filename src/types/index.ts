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
  phoneNumber?: string; // E.164 format (e.g., +1234567890)
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
  // Optional fields for outline-derived sessions (backward compatible)
  origin?: 'user' | 'outline';
  outlineRef?: { outlineId: string; itemId: string };
  title?: string;
  description?: string;
  estimatedDurationSec?: number;
  
  // Rich content and images (new features)
  richContent?: string; // HTML from rich text editor
  editMode?: 'voice' | 'text'; // Current editing mode
  createdWith?: 'voice' | 'text'; // How session was initially created
  lastEditedWith?: 'voice' | 'text'; // Last editing method used
  images?: SessionImage[]; // Attached images
  imageCount?: number; // Quick reference for image count
}

// Session image metadata
export interface SessionImage {
  id: string;
  fileName: string; // Generated filename (img-timestamp.ext)
  originalName: string; // Original uploaded filename
  fileSize: number; // Size in bytes
  fileType: string; // MIME type (image/jpeg, etc.)
  uploadedAt: string; // ISO timestamp
  order: number; // Display order (1-5)
  s3Path: string; // Full S3 path
  s3Url: string; // Signed URL for access
  width?: number; // Image width in pixels
  height?: number; // Image height in pixels
  caption?: string; // Optional user caption
}

export interface DocumentWithSessions extends UserDocument {
  sessions: VoiceSession[];
}

export interface CreateDocumentData {
  title: string;
  inputLanguage: string;
  outputLanguage: string;
}

// Outline types used for Generate Outline feature
export interface OutlineItem {
  id: string;
  title: string;
  description: string;
  bullets?: string[];
  estimatedDurationSec?: number; // mainly for podcast
}

export interface GeneratedOutline {
  outlineId: string;
  items: OutlineItem[];
  displayText?: string;
}

// Voice Agent Types
export interface VoiceAgentCall {
  id: string;
  userId: number;
  documentId: string;
  phoneNumber: string;
  status: 'pending' | 'initiated' | 'completed' | 'failed';
  message: string;
  createdAt: string;
  initiatedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface TextToSpeechRequest {
  text: string;
  language: string;
  voice?: string;
}

export interface TextToSpeechResponse {
  audioUrl: string;
  duration: number;
  format: 'mp3' | 'opus' | 'aac' | 'flac';
}

export interface CallInitiationRequest {
  phoneNumber: string;
  documentId: string;
  contentType?: 'message';
}
