import { UserDocument, VoiceSession, DocumentWithSessions, CreateDocumentData } from '@/types';
import { UserService } from './userService';

// Use environment variable for API base URL, fallback to /api for production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// Retry configuration for S3 eventual consistency
const S3_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 500, // Start with 500ms
  maxDelay: 2000, // Max delay of 2 seconds
};

export class DocumentService {
  // Helper method to implement exponential backoff retry for S3 operations
  private static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      // Check for various error conditions that indicate S3 eventual consistency
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRetryableError = 
        errorMessage.includes('404') || 
        errorMessage.includes('Failed to fetch document') ||
        errorMessage.includes('Failed to fetch document sessions') ||
        errorMessage.includes('Failed to fetch user documents') ||
        errorMessage.includes('Failed to fetch sessions for stats update') ||
        errorMessage.includes('Failed to fetch document for stats update');
      
      // Only retry on retryable errors and if we haven't exceeded max retries
      if (isRetryableError && retryCount < S3_RETRY_CONFIG.maxRetries) {
        const delay = Math.min(
          S3_RETRY_CONFIG.baseDelay * Math.pow(2, retryCount),
          S3_RETRY_CONFIG.maxDelay
        );
        
        console.log(`🔄 S3 eventual consistency retry ${retryCount + 1}/${S3_RETRY_CONFIG.maxRetries} in ${delay}ms for:`, errorMessage);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryWithBackoff(operation, retryCount + 1);
      }
      
      // Log the final error if we've exhausted retries
      if (retryCount >= S3_RETRY_CONFIG.maxRetries && isRetryableError) {
        console.error(`❌ S3 retry exhausted after ${S3_RETRY_CONFIG.maxRetries} attempts:`, errorMessage);
      }
      
      throw error;
    }
  }

  // Get all documents for a user
  static async getUserDocuments(userId: number): Promise<UserDocument[]> {
    return this.retryWithBackoff(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/userDocuments?userId=${userId}`, {
          headers: DocumentService.getAuthHeaders(),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch user documents: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Get user documents error:', error);
        throw error;
      }
    });
  }

  // Get a single document with all its sessions
  static async getDocumentWithSessions(documentId: string): Promise<DocumentWithSessions> {
    return this.retryWithBackoff(async () => {
      try {
        // Get the document
        const docResponse = await fetch(`${API_BASE_URL}/userDocuments/${documentId}`, {
          headers: DocumentService.getAuthHeaders(),
        });
        
        if (!docResponse.ok) {
          throw new Error(`Failed to fetch document: ${docResponse.status}`);
        }
        
        const document: UserDocument = await docResponse.json();
        
        // Get all sessions for this document
        const sessionsResponse = await fetch(`${API_BASE_URL}/voiceSessions?documentId=${documentId}`, {
          headers: DocumentService.getAuthHeaders(),
        });
        
        if (!sessionsResponse.ok) {
          throw new Error(`Failed to fetch document sessions: ${sessionsResponse.status}`);
        }
        
        const sessions: VoiceSession[] = await sessionsResponse.json();
        
        // Sort sessions by session number (ascending order - logical document flow)
        const sortedSessions = sessions.sort((a, b) => a.sessionNumber - b.sessionNumber);
        
        return {
          ...document,
          sessions: sortedSessions
        };
      } catch (error) {
        console.error('Get document with sessions error:', error);
        throw error;
      }
    });
  }

  // Create a new document with immediate access guarantee
  static async createDocumentWithAccess(userId: number, documentData: CreateDocumentData): Promise<UserDocument> {
    try {
      // First, create the document using the basic create method
      const newDocument: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt' | 'sessions' | 'totalDuration' | 'wordCount'> = {
        userId,
        title: documentData.title,
        inputLanguage: documentData.inputLanguage,
        outputLanguage: documentData.outputLanguage,
        totalSessions: 0
      };

      const response = await fetch(`${API_BASE_URL}/userDocuments`, {
        method: 'POST',
        headers: DocumentService.getAuthHeaders(),
        body: JSON.stringify({
          ...newDocument,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sessions: [],
          totalDuration: 0,
          wordCount: 0
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create document: ${response.status}`);
      }
      
      const createdDocument = await response.json();
      
      // Then, wait for it to be accessible (handle S3 eventual consistency)
      console.log('🔄 Waiting for document to be accessible in S3...');
      
      // Try to access the document with exponential backoff
      let attempts = 0;
      const maxAttempts = 5;
      const baseDelay = 200; // Start with 200ms for faster access
      
      while (attempts < maxAttempts) {
        try {
          // Try to fetch the document to ensure it's accessible
          const fetchedDoc = await this.getDocumentWithSessions(createdDocument.id);
          console.log('✅ Document is now accessible in S3 after', attempts + 1, 'attempts');
          return createdDocument; // Return the created document
        } catch (error: unknown) {
          attempts++;
          if (attempts >= maxAttempts) {
            console.warn('⚠️ Document created but not immediately accessible in S3. This is normal for cloud storage.');
            return createdDocument; // Return the document anyway
          }
          
          const errorMessage = error instanceof Error ? error.message : String(error);
          const delay = baseDelay * Math.pow(2, attempts - 1);
          console.log(`⏳ Document not yet accessible, retrying in ${delay}ms (attempt ${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      return createdDocument;
    } catch (error) {
      console.error('Create document with access error:', error);
      throw error;
    }
  }

  // Create a new document
  static async createDocument(userId: number, documentData: CreateDocumentData): Promise<UserDocument> {
    return this.retryWithBackoff(async () => {
      try {
        const newDocument: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt' | 'sessions' | 'totalDuration' | 'wordCount'> = {
          userId,
          title: documentData.title,
          inputLanguage: documentData.inputLanguage,
          outputLanguage: documentData.outputLanguage,
          totalSessions: 0
        };

        const response = await fetch(`${API_BASE_URL}/userDocuments`, {
          method: 'POST',
          headers: DocumentService.getAuthHeaders(),
          body: JSON.stringify({
            ...newDocument,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sessions: [],
            totalDuration: 0,
            wordCount: 0
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create document: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Create document error:', error);
        throw error;
      }
    });
  }

  // Add a new session to a document
  static async addSession(documentId: string, sessionData: Omit<VoiceSession, 'id' | 'documentId' | 'timestamp'>): Promise<VoiceSession> {
    return this.retryWithBackoff(async () => {
      try {
        // Create the new session
        const newSession: Omit<VoiceSession, 'id' | 'timestamp'> = {
          documentId,
          sessionNumber: sessionData.sessionNumber,
          transcript: sessionData.transcript,
          duration: sessionData.duration,
          notes: sessionData.notes,
        };

        const response = await fetch(`${API_BASE_URL}/voiceSessions`, {
          method: 'POST',
          headers: DocumentService.getAuthHeaders(),
          body: JSON.stringify({
            ...newSession,
            timestamp: new Date().toISOString()
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create session: ${response.status}`);
        }
        
        const createdSession = await response.json();
        
        // Update document stats in a single operation
        await this.updateDocumentStats(documentId, createdSession);
        
        return createdSession;
      } catch (error) {
        console.error('Add session error:', error);
        throw error;
      }
    });
  }

  // Update document statistics (total duration and word count)
  static async updateDocumentStats(documentId: string, newSession?: VoiceSession): Promise<void> {
    return this.retryWithBackoff(async () => {
      try {
        // If we have a new session, we can calculate stats more efficiently
        if (newSession) {
          // Get current document
          const docResponse = await fetch(`${API_BASE_URL}/userDocuments/${documentId}`, {
            headers: DocumentService.getAuthHeaders(),
          });
          
          if (!docResponse.ok) {
            throw new Error(`Failed to fetch document for stats update: ${docResponse.status}`);
          }
          
          // Get all sessions for this document
          const sessionsResponse = await fetch(`${API_BASE_URL}/voiceSessions?documentId=${documentId}`, {
            headers: DocumentService.getAuthHeaders(),
          });
          
          if (!sessionsResponse.ok) {
            throw new Error(`Failed to fetch sessions for stats update: ${sessionsResponse.status}`);
          }
          
          const sessions: VoiceSession[] = await sessionsResponse.json();
          
          // Calculate new stats
          const totalSessions = sessions.length;
          const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
          const wordCount = sessions.reduce((sum, session) => {
            const words = session.transcript.trim().split(/\s+/).length;
            return sum + words;
          }, 0);
          
          // Update document with new stats
          const updateResponse = await fetch(`${API_BASE_URL}/userDocuments/${documentId}`, {
            method: 'PATCH',
            headers: DocumentService.getAuthHeaders(),
            body: JSON.stringify({
              totalSessions,
              totalDuration,
              wordCount,
              updatedAt: new Date().toISOString()
            }),
          });
          
          if (!updateResponse.ok) {
            throw new Error(`Failed to update document stats: ${updateResponse.status}`);
          }
        } else {
          // Fallback to the old method if no new session provided
          const document = await this.getDocumentWithSessions(documentId);
          
          const totalDuration = document.sessions.reduce((sum, session) => sum + session.duration, 0);
          const wordCount = document.sessions.reduce((sum, session) => {
            const words = session.transcript.trim().split(/\s+/).length;
            return sum + words;
          }, 0);
          const totalSessions = document.sessions.length;
          
          const response = await fetch(`${API_BASE_URL}/userDocuments/${documentId}`, {
            method: 'PATCH',
            headers: DocumentService.getAuthHeaders(),
            body: JSON.stringify({
              totalSessions,
              totalDuration,
              wordCount,
              updatedAt: new Date().toISOString()
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to update document stats: ${response.status}`);
          }
        }
      } catch (error) {
        console.error('Update document stats error:', error);
        throw error;
      }
    });
  }

  // Check if document title is unique for a user
  static async isTitleUnique(userId: number, title: string, excludeDocumentId?: string): Promise<boolean> {
    return this.retryWithBackoff(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/userDocuments?userId=${userId}`, {
          headers: DocumentService.getAuthHeaders(),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to check title uniqueness: ${response.status}`);
        }
        
        const documents: UserDocument[] = await response.json();
        
        return !documents.some(doc => 
          doc.title.toLowerCase() === title.toLowerCase() && 
          (!excludeDocumentId || doc.id !== excludeDocumentId)
        );
      } catch (error) {
        console.error('Check title uniqueness error:', error);
        throw error;
      }
    });
  }

  // Delete a document and all its sessions
  static async deleteDocument(documentId: string): Promise<void> {
    return this.retryWithBackoff(async () => {
      try {
        // Delete all sessions first
        const sessionsResponse = await fetch(`${API_BASE_URL}/voiceSessions?documentId=${documentId}`, {
          headers: DocumentService.getAuthHeaders(),
        });
        
        if (sessionsResponse.ok) {
          const sessions: VoiceSession[] = await sessionsResponse.json();
          for (const session of sessions) {
            await fetch(`${API_BASE_URL}/voiceSessions/${session.id}`, {
              method: 'DELETE',
              headers: DocumentService.getAuthHeaders(),
            });
          }
        }
        
        // Delete the document
        const response = await fetch(`${API_BASE_URL}/userDocuments/${documentId}`, {
          method: 'DELETE',
          headers: DocumentService.getAuthHeaders(),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete document: ${response.status}`);
        }
      } catch (error) {
        console.error('Delete document error:', error);
        throw error;
      }
    });
  }

  // Get combined transcript from all sessions
  static async getCombinedTranscript(documentId: string): Promise<string> {
    return this.retryWithBackoff(async () => {
      try {
        const document = await this.getDocumentWithSessions(documentId);
        return document.sessions
          .sort((a, b) => a.sessionNumber - b.sessionNumber) // Changed to ascending order for logical document flow
          .map(session => session.transcript)
          .join(' ');
      } catch (error) {
        console.error('Get combined transcript error:', error);
        throw error;
      }
    });
  }

  // Save generated content to a document
  static async saveGeneratedContent(documentId: string, payload: {
    blog: string; linkedin: string; twitter: string; podcast: string;
    inputLanguage: string; outputLanguage: string;
  }): Promise<UserDocument> {
    return this.retryWithBackoff(async () => {
      const response = await fetch(`${API_BASE_URL}/userDocuments/${documentId}`, {
        method: 'PATCH',
        headers: DocumentService.getAuthHeaders(),
        body: JSON.stringify({
          generatedContent: {
            blog: payload.blog,
            linkedin: payload.linkedin,
            twitter: payload.twitter,
            podcast: payload.podcast,
          },
          hasGeneratedContent: true,
          generatedAt: new Date().toISOString(),
          generatedMeta: {
            inputLanguage: payload.inputLanguage,
            outputLanguage: payload.outputLanguage,
            wordCount: payload.blog?.trim().split(/\s+/).length || 0
          }
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to save generated content: ${response.status}`);
      }
      return response.json();
    });
  }

  // Invalidate saved generated content when sessions change
  static async invalidateGeneratedContent(documentId: string): Promise<void> {
    return this.retryWithBackoff(async () => {
      const response = await fetch(`${API_BASE_URL}/userDocuments/${documentId}`, {
        method: 'PATCH',
        headers: DocumentService.getAuthHeaders(),
        body: JSON.stringify({
          hasGeneratedContent: false,
          generatedContent: undefined,
          generatedAt: undefined
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to invalidate generated content: ${response.status}`);
      }
    });
  }

  // Save refined content for a single platform only
  static async updateGeneratedPlatform(
    documentId: string,
    platform: 'blog' | 'linkedin' | 'twitter' | 'podcast',
    text: string,
    meta?: { inputLanguage?: string; outputLanguage?: string }
  ): Promise<UserDocument> {
    return this.retryWithBackoff(async () => {
      const response = await fetch(`${API_BASE_URL}/userDocuments/${documentId}`, {
        method: 'PATCH',
        headers: DocumentService.getAuthHeaders(),
        body: JSON.stringify({
          generatedContent: { [platform]: text },
          hasGeneratedContent: true,
          generatedAt: new Date().toISOString(),
          ...(meta?.inputLanguage && meta?.outputLanguage
            ? { generatedMeta: { inputLanguage: meta.inputLanguage, outputLanguage: meta.outputLanguage, wordCount: text?.trim().split(/\s+/).length || 0 } }
            : {})
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to save refined content: ${response.status}`);
      }
      return response.json();
    });
  }

  // Helper method to get auth headers
  private static getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const token = UserService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }
}
