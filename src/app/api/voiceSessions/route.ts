import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface VoiceSession {
  id: string;
  documentId: string;
  sessionNumber: number;
  transcript: string;
  duration: number;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    
    if (documentId) {
      const sessions = (db.voiceSessions || []).filter((session: VoiceSession) => session.documentId === documentId);
      return NextResponse.json(sessions);
    }
    
    return NextResponse.json(db.voiceSessions || []);
  } catch (error) {
    console.error('Error reading voiceSessions:', error);
    return NextResponse.json({ error: 'Failed to fetch voice sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    
    const newSession = {
      id: Date.now().toString(),
      ...body,
      timestamp: new Date().toISOString()
    };
    
    db.voiceSessions = db.voiceSessions || [];
    db.voiceSessions.push(newSession);
    
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    
    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error('Error creating voiceSession:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
