import { NextRequest, NextResponse } from 'next/server';
import { hybridStorageService } from '@/lib/hybridStorageService';
import { VoiceSession } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get current database using hybrid storage
    const db = await hybridStorageService.getDatabase();
    
    if (!db || !db.voiceSessions) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }
    
    const session = (db.voiceSessions || []).find((session: VoiceSession) => session.id === id);
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error reading voiceSession:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Get current database using hybrid storage
    const db = await hybridStorageService.getDatabase();
    
    if (!db || !db.voiceSessions) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }
    
    const sessionIndex = db.voiceSessions.findIndex((session: VoiceSession) => session.id === id);
    
    if (sessionIndex === -1) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    const updated = {
      ...db.voiceSessions[sessionIndex],
      ...body,
      timestamp: new Date().toISOString()
    };
    db.voiceSessions[sessionIndex] = updated;

    // Invalidate generated content on parent document (mark requiresRegeneration)
    if (db.userDocuments && Array.isArray(db.userDocuments)) {
      const docIndex = db.userDocuments.findIndex((d: import('@/types').UserDocument) => String(d.id) === String(updated.documentId));
      if (docIndex !== -1) {
        // Recalculate totals for this document
        const remaining = (db.voiceSessions || []).filter((s: VoiceSession) => String(s.documentId) === String(updated.documentId));
        const totalSessions = remaining.length;
        const totalDuration = remaining.reduce((sum: number, s: VoiceSession) => sum + s.duration, 0);
        const wordCount = remaining.reduce((sum: number, s: VoiceSession) => sum + (s.transcript?.trim().split(/\s+/).length || 0), 0);

        db.userDocuments[docIndex] = {
          ...db.userDocuments[docIndex],
          hasGeneratedContent: true,
          requiresRegeneration: true,
          totalSessions,
          totalDuration,
          wordCount,
          updatedAt: new Date().toISOString()
        };
      }
    }
    
    // Save database using hybrid storage
    await hybridStorageService.saveDatabase(db);
    
    return NextResponse.json(db.voiceSessions[sessionIndex]);
  } catch (error) {
    console.error('Error updating voiceSession:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get current database using hybrid storage
    const db = await hybridStorageService.getDatabase();
    
    if (!db || !db.voiceSessions) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }
    
    const sessionIndex = db.voiceSessions.findIndex((session: VoiceSession) => session.id === id);
    
    if (sessionIndex === -1) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const removed = db.voiceSessions[sessionIndex];
    
    // Remove the session
    db.voiceSessions.splice(sessionIndex, 1);

    // Invalidate generated content on parent document (mark requiresRegeneration) and update totals
    if (db.userDocuments && Array.isArray(db.userDocuments)) {
      const docIndex = db.userDocuments.findIndex((d: import('@/types').UserDocument) => String(d.id) === String(removed.documentId));
      if (docIndex !== -1) {
        const remaining = (db.voiceSessions || []).filter((s: VoiceSession) => String(s.documentId) === String(removed.documentId));
        const totalSessions = remaining.length;
        const totalDuration = remaining.reduce((sum: number, s: VoiceSession) => sum + s.duration, 0);
        const wordCount = remaining.reduce((sum: number, s: VoiceSession) => sum + (s.transcript?.trim().split(/\s+/).length || 0), 0);

        db.userDocuments[docIndex] = {
          ...db.userDocuments[docIndex],
          hasGeneratedContent: true,
          requiresRegeneration: true,
          totalSessions,
          totalDuration,
          wordCount,
          updatedAt: new Date().toISOString()
        };
      }
    }
    
    // Save database using hybrid storage
    await hybridStorageService.saveDatabase(db);
    
    return NextResponse.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting voiceSession:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
