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

    // Invalidate generated content for the parent document (mark requiresRegeneration but keep existing content)
    if (db.userDocuments && Array.isArray(db.userDocuments)) {
      const docIndex = db.userDocuments.findIndex((d: import('@/types').UserDocument) => String(d.id) === String(newSession.documentId));
      if (docIndex !== -1) {
        db.userDocuments[docIndex] = {
          ...db.userDocuments[docIndex],
          hasGeneratedContent: true,
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
