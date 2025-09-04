import { NextRequest, NextResponse } from 'next/server';
import { hybridStorageService } from '@/lib/hybridStorageService';
import { generateContent } from '@/lib/openai';
import { VoiceSession, UserDocument } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId } = body as { documentId?: string };
    if (!documentId) return NextResponse.json({ error: 'Missing documentId' }, { status: 400 });

    const db = await hybridStorageService.getDatabase();
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    db.userDocuments = db.userDocuments || [];
    db.voiceSessions = db.voiceSessions || [];

    const doc = (db.userDocuments as UserDocument[]).find(d => d.id === documentId);
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const sessions = (db.voiceSessions as VoiceSession[]).filter(s => s.documentId === documentId);
    const combined = sessions.sort((a,b) => a.sessionNumber - b.sessionNumber).map(s => s.transcript).join(' ');

    const blogPost = await generateContent({ originalText: combined, inputLanguage: doc.inputLanguage, outputLanguage: doc.outputLanguage, platform: 'blog' });

    const idx = (db.userDocuments as UserDocument[]).findIndex(d => d.id === documentId);
    (db.userDocuments as UserDocument[])[idx] = {
      ...(db.userDocuments as UserDocument[])[idx],
      generatedContent: {
        ...((db.userDocuments as UserDocument[])[idx].generatedContent || {}),
        blog: blogPost,
      },
      hasGeneratedContent: true,
      generatedAt: new Date().toISOString(),
    } as UserDocument;
    await hybridStorageService.saveDatabase(db);

    return NextResponse.json({ blogPost });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to generate blog', details: msg }, { status: 500 });
  }
}
