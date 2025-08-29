import { UserDocument, VoiceSession, DocumentWithSessions, CreateDocumentData } from '@/types';
import { UserService } from './userService';

// Use environment variable for API base URL, fallback to /api for production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export class DocumentService {
  // Get all documents for a user
  static async getUserDocuments(userId: number): Promise<UserDocument[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/userDocuments?userId=${userId}`, {
        headers: DocumentService.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user documents');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get user documents error:', error);
      throw error;
    }
  }

  // Get a single document with all its sessions
  static async getDocumentWithSessions(documentId: string): Promise<DocumentWithSessions> {
    try {
      // Get the document
      const docResponse = await fetch(`${API_BASE_URL}/userDocuments/${documentId}`, {
        headers: DocumentService.getAuthHeaders(),
      });
      
      if (!docResponse.ok) {
        throw new Error('Failed to fetch document');
      }
      
      const document: UserDocument = await docResponse.json();
      
      // Get all sessions for this document
      const sessionsResponse = await fetch(`${API_BASE_URL}/voiceSessions?documentId=${documentId}`, {
        headers: DocumentService.getAuthHeaders(),
      });
      
      if (!sessionsResponse.ok) {
        throw new Error('Failed to fetch document sessions');
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
  }

  // Create a new document
  static async createDocument(userId: number, documentData: CreateDocumentData): Promise<UserDocument> {
    try {
      const newDocument: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt' | 'sessions' | 'totalDuration' | 'wordCount'> = {
        userId,
        title: documentData.title,
        inputLanguage: documentData.inputLanguage,
        outputLanguage: documentData.outputLanguage,
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
        throw new Error('Failed to create document');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create document error:', error);
      throw error;
    }
  }

  // Add a new session to a document
  static async addSession(documentId: string, sessionData: Omit<VoiceSession, 'id' | 'documentId' | 'timestamp'>): Promise<VoiceSession> {
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
        throw new Error('Failed to create session');
      }
      
      const createdSession = await response.json();
      
      // Update document stats in a single operation
      await this.updateDocumentStats(documentId, createdSession);
      
      return createdSession;
    } catch (error) {
      console.error('Add session error:', error);
      throw error;
    }
  }

  // Update document statistics (total duration and word count)
  static async updateDocumentStats(documentId: string, newSession?: VoiceSession): Promise<void> {
    try {
      // If we have a new session, we can calculate stats more efficiently
      if (newSession) {
        // Get current document
        const docResponse = await fetch(`${API_BASE_URL}/userDocuments/${documentId}`, {
          headers: DocumentService.getAuthHeaders(),
        });
        
        if (!docResponse.ok) {
          throw new Error('Failed to fetch document for stats update');
        }
        
        // Get all sessions for this document
        const sessionsResponse = await fetch(`${API_BASE_URL}/voiceSessions?documentId=${documentId}`, {
          headers: DocumentService.getAuthHeaders(),
        });
        
        if (!sessionsResponse.ok) {
          throw new Error('Failed to fetch sessions for stats update');
        }
        
        const sessions: VoiceSession[] = await sessionsResponse.json();
        
        // Calculate new stats
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
            totalDuration,
            wordCount,
            updatedAt: new Date().toISOString()
          }),
        });
        
        if (!updateResponse.ok) {
          throw new Error('Failed to update document stats');
        }
      } else {
        // Fallback to the old method if no new session provided
        const document = await this.getDocumentWithSessions(documentId);
        
        const totalDuration = document.sessions.reduce((sum, session) => sum + session.duration, 0);
        const wordCount = document.sessions.reduce((sum, session) => {
          const words = session.transcript.trim().split(/\s+/).length;
          return sum + words;
        }, 0);
        
        const response = await fetch(`${API_BASE_URL}/userDocuments/${documentId}`, {
          method: 'PATCH',
          headers: DocumentService.getAuthHeaders(),
          body: JSON.stringify({
            totalDuration,
            wordCount,
            updatedAt: new Date().toISOString()
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update document stats');
        }
      }
    } catch (error) {
      console.error('Update document stats error:', error);
      throw error;
    }
  }

  // Check if document title is unique for a user
  static async isTitleUnique(userId: number, title: string, excludeDocumentId?: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/userDocuments?userId=${userId}`, {
        headers: DocumentService.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to check title uniqueness');
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
  }

  // Delete a document and all its sessions
  static async deleteDocument(documentId: string): Promise<void> {
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
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      console.error('Delete document error:', error);
      throw error;
    }
  }

  // Get combined transcript from all sessions
  static async getCombinedTranscript(documentId: string): Promise<string> {
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
