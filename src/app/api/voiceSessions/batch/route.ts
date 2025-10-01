import { NextRequest, NextResponse } from 'next/server';
import { hybridStorageService } from '@/lib/hybridStorageService';
import type { UserDocument, VoiceSession } from '@/types';

type BatchSessionInput = Omit<VoiceSession, 'id' | 'documentId' | 'timestamp' | 'sessionNumber'> & {
  sessionNumber?: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Batch sessions API - Request body:', body);
    
    const { documentId, replaceBeyondFirst, sessions } = body as {
      documentId?: string;
      replaceBeyondFirst?: boolean;
      sessions?: BatchSessionInput[];
    };

    console.log('Batch sessions API - Parsed params:', { documentId, replaceBeyondFirst, sessionsCount: sessions?.length });

    if (!documentId || !Array.isArray(sessions) || sessions.length === 0) {
      console.error('Batch sessions API - Validation failed:', { documentId, sessionsIsArray: Array.isArray(sessions), sessionsLength: sessions?.length });
      return NextResponse.json({ error: 'Missing required fields: documentId, sessions' }, { status: 400 });
    }

    const db = await hybridStorageService.getDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Normalize containers
    db.voiceSessions = db.voiceSessions || [];
    db.userDocuments = db.userDocuments || ([] as UserDocument[]);

    // Replace mode: delete all sessions for doc beyond the first (sessionNumber > 1)
    if (replaceBeyondFirst) {
      db.voiceSessions = (db.voiceSessions || []).filter((s: VoiceSession) => {
        return String(s.documentId) !== String(documentId) || s.sessionNumber === 1;
      });
    }

    // Determine starting sessionNumber
    const existingForDoc = (db.voiceSessions || [])
      .filter((s: VoiceSession) => String(s.documentId) === String(documentId))
      .sort((a: VoiceSession, b: VoiceSession) => a.sessionNumber - b.sessionNumber);

    const maxExistingNumber = existingForDoc.reduce((max: number, s: VoiceSession) => Math.max(max, s.sessionNumber), 0);
    let nextNumber = replaceBeyondFirst ? Math.max(1, 1) + 1 : (maxExistingNumber + 1);

    const nowIso = new Date().toISOString();
    const created: VoiceSession[] = [];

    for (const item of sessions) {
      const id = Date.now().toString() + '_' + Math.random().toString(36).slice(2, 6);
      const session: VoiceSession = {
        id,
        documentId: String(documentId),
        sessionNumber: item.sessionNumber ?? nextNumber++,
        transcript: item.transcript,
        duration: item.duration ?? 0,
        timestamp: nowIso,
        notes: item.notes,
        origin: item.origin,
        outlineRef: item.outlineRef as { outlineId: string; itemId: string } | undefined,
        title: item.title,
        description: item.description,
        estimatedDurationSec: item.estimatedDurationSec,
      };
      db.voiceSessions.push(session);
      created.push(session);
    }

    // Update parent document stats and flags
    const docIndex = (db.userDocuments || []).findIndex((d: UserDocument) => String(d.id) === String(documentId));
    if (docIndex !== -1) {
      const remaining = (db.voiceSessions || []).filter((s: VoiceSession) => String(s.documentId) === String(documentId));
      const totalSessions = remaining.length;
      const totalDuration = remaining.reduce((sum: number, s: VoiceSession) => sum + (s.duration || 0), 0);
      const wordCount = remaining.reduce((sum: number, s: VoiceSession) => sum + (s.transcript?.trim().split(/\s+/).length || 0), 0);

      db.userDocuments[docIndex] = {
        ...(db.userDocuments[docIndex] as UserDocument),
        hasGeneratedContent: (db.userDocuments[docIndex] as UserDocument).hasGeneratedContent,
        requiresRegeneration: true,
        totalSessions,
        totalDuration,
        wordCount,
        updatedAt: nowIso,
      } as UserDocument;
    }

    await hybridStorageService.saveDatabase(db);

    console.log('Batch sessions API - Success:', { createdCount: created.length, documentId });
    return NextResponse.json({ created });
  } catch (error) {
    console.error('Batch sessions API - Error:', error);
    return NextResponse.json({ error: 'Failed to process batch sessions' }, { status: 500 });
  }
}


