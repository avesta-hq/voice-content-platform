import { NextRequest, NextResponse } from 'next/server';
import { hybridStorageService } from '@/lib/hybridStorageService';
import { generateRefinedContent } from '@/lib/openai';
import { UserDocument, VoiceSession } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, platform, comment } = body as { documentId?: string; platform?: string; comment?: string };

    if (!documentId || !platform || !comment || !comment.trim()) {
      return NextResponse.json({ error: 'Missing required fields: documentId, platform, comment' }, { status: 400 });
    }

    const db = await hybridStorageService.getDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const doc = (db.userDocuments || []).find((d: UserDocument) => d.id === documentId);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const sessions = (db.voiceSessions || []).filter((s: VoiceSession) => s.documentId === documentId);
    const combinedTranscript = sessions
      .sort((a, b) => a.sessionNumber - b.sessionNumber)
      .map((s) => s.transcript)
      .join(' ');

    const normalizedPlatform = String(platform).toLowerCase();
    type PlatformKey = 'blog' | 'linkedin' | 'twitter' | 'podcast';
    const validPlatforms: PlatformKey[] = ['blog', 'linkedin', 'twitter', 'podcast'];
    if (!validPlatforms.includes(normalizedPlatform as PlatformKey)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    const currentPlatformOutput = (() => {
      if (!doc.generatedContent) return undefined;
      switch (normalizedPlatform) {
        case 'blog': return doc.generatedContent.blog;
        case 'linkedin': return doc.generatedContent.linkedin;
        case 'twitter': return doc.generatedContent.twitter;
        case 'podcast': return doc.generatedContent.podcast;
      }
    })();

    const refined = await generateRefinedContent({
      originalText: combinedTranscript,
      inputLanguage: doc.inputLanguage,
      outputLanguage: doc.outputLanguage,
      platform: normalizedPlatform as PlatformKey,
      comment: comment.trim(),
      currentPlatformOutput,
    });

    return NextResponse.json({ refined });
  } catch (error) {
    console.error('Refine content error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to refine content', details: errorMessage }, { status: 500 });
  }
}
