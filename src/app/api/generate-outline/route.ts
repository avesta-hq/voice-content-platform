import { NextRequest, NextResponse } from 'next/server';
import { hybridStorageService } from '@/lib/hybridStorageService';
import { generateOutlineFromTranscript } from '@/lib/openai';
import type { UserDocument, VoiceSession } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, platform, maxItems } = body as { documentId?: string; platform?: string; maxItems?: number };

    if (!documentId || !platform) {
      return NextResponse.json({ error: 'Missing required fields: documentId, platform' }, { status: 400 });
    }

    const normalizedPlatform = String(platform).toLowerCase();
    const valid = ['blog', 'linkedin', 'twitter', 'podcast', 'twitter_thread'];
    if (!valid.includes(normalizedPlatform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    const db = await hybridStorageService.getDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const doc = (db.userDocuments || []).find((d: UserDocument) => String(d.id) === String(documentId));
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const sessions = (db.voiceSessions || []).filter((s: VoiceSession) => String(s.documentId) === String(documentId));
    if (!sessions.length) {
      return NextResponse.json({ error: 'At least one session is required to generate an outline' }, { status: 400 });
    }

    const combinedTranscript = sessions
      .sort((a, b) => a.sessionNumber - b.sessionNumber)
      .map((s) => s.transcript)
      .join(' ');

    const outline = await generateOutlineFromTranscript({
      originalText: combinedTranscript,
      inputLanguage: doc.inputLanguage,
      outputLanguage: doc.outputLanguage,
      platform: normalizedPlatform as 'blog' | 'linkedin' | 'twitter' | 'podcast' | 'twitter_thread',
      maxItems: typeof maxItems === 'number' ? maxItems : undefined,
    });

    return NextResponse.json({ outline });
  } catch (error) {
    console.error('Generate outline error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to generate outline', details: message }, { status: 500 });
  }
}


