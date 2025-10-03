import { NextRequest, NextResponse } from 'next/server';
import { hybridStorageService } from '@/lib/hybridStorageService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'documentId parameter is required' }, { status: 400 });
    }

    const sessions = await hybridStorageService.getVoiceSessions(documentId);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error reading voiceSessions:', error);
    return NextResponse.json({ error: 'Failed to fetch voice sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get current database
    const db = await hybridStorageService.getDatabase() || { voiceSessions: [], userDocuments: [] };
    
    const newSession = {
      id: Date.now().toString(),
      ...body,
      timestamp: new Date().toISOString()
    };

    // Add to database
    db.voiceSessions = db.voiceSessions || [];
    db.voiceSessions.push(newSession);

    // Mark that regeneration is needed, but DO NOT set hasGeneratedContent to true
    if (db.userDocuments && Array.isArray(db.userDocuments)) {
      const docIndex = db.userDocuments.findIndex((d: import('@/types').UserDocument) => String(d.id) === String(newSession.documentId));
      if (docIndex !== -1) {
        const existing = db.userDocuments[docIndex];
        db.userDocuments[docIndex] = {
          ...existing,
          // preserve existing hasGeneratedContent as-is
          hasGeneratedContent: existing.hasGeneratedContent,
          requiresRegeneration: true,
          updatedAt: new Date().toISOString()
        };
      }
    }

    // Save database
    await hybridStorageService.saveDatabase(db);

    return NextResponse.json(newSession, { status: 201 });

  } catch (error) {
    console.error('Error creating voiceSession:', error);
    return NextResponse.json({ error: 'Failed to create voice session' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'documentId parameter is required for bulk deletion' }, { status: 400 });
    }

    // Get current database
    const db = await hybridStorageService.getDatabase();
    
    if (!db || !db.voiceSessions) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }

    // Find sessions to delete
    const sessionsToDelete = db.voiceSessions.filter((session: import('@/types').VoiceSession) => 
      String(session.documentId) === String(documentId)
    );
    
    if (sessionsToDelete.length === 0) {
      return NextResponse.json({ message: 'No sessions found for this document', deletedCount: 0 });
    }

    // Remove all sessions for this document in one operation
    db.voiceSessions = db.voiceSessions.filter((session: import('@/types').VoiceSession) => 
      String(session.documentId) !== String(documentId)
    );

    // Update parent document totals (set to 0 since all sessions are deleted)
    if (db.userDocuments && Array.isArray(db.userDocuments)) {
      const docIndex = db.userDocuments.findIndex((d: import('@/types').UserDocument) => String(d.id) === String(documentId));
      if (docIndex !== -1) {
        db.userDocuments[docIndex] = {
          ...db.userDocuments[docIndex],
          hasGeneratedContent: false,
          requiresRegeneration: false,
          totalSessions: 0,
          totalDuration: 0,
          wordCount: 0,
          updatedAt: new Date().toISOString()
        };
      }
    }
    
    // Save database once (instead of N times)
    await hybridStorageService.saveDatabase(db);
    
    return NextResponse.json({ 
      message: 'All sessions deleted successfully', 
      deletedCount: sessionsToDelete.length 
    });

  } catch (error) {
    console.error('Error bulk deleting voiceSessions:', error);
    return NextResponse.json({ error: 'Failed to delete voice sessions' }, { status: 500 });
  }
}
