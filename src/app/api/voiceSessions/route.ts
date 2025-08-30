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
    const db = await hybridStorageService.getDatabase() || { voiceSessions: [] };
    
    const newSession = {
      id: Date.now().toString(),
      ...body,
      timestamp: new Date().toISOString()
    };

    // Add to database
    db.voiceSessions = db.voiceSessions || [];
    db.voiceSessions.push(newSession);

    // Save database
    await hybridStorageService.saveDatabase(db);

    return NextResponse.json(newSession, { status: 201 });

  } catch (error) {
    console.error('Error creating voiceSession:', error);
    return NextResponse.json({ error: 'Failed to create voice session' }, { status: 500 });
  }
}
