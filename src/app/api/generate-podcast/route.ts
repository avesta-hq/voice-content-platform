import { NextRequest, NextResponse } from 'next/server';
import { hybridStorageService } from '@/lib/hybridStorageService';
import { generatePodcast } from '@/lib/openai';
import { VoiceSession, UserDocument } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    let documentId = url.searchParams.get('documentId') || undefined;
    try {
      const body = await request.json();
      documentId = documentId || (body?.documentId as string | undefined);
    } catch {}
    if (!documentId) return NextResponse.json({ error: 'Missing documentId' }, { status: 400 });

    const [draftDb, blogDb] = await Promise.all([
      hybridStorageService.getDatabase(),
      hybridStorageService.getBlogDatabase().catch(() => null)
    ]);
    if (!draftDb && !blogDb) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    draftDb && (draftDb.userDocuments = draftDb.userDocuments || []);
    blogDb && (blogDb.userDocuments = blogDb.userDocuments || []);

    const doc = ((draftDb?.userDocuments || []) as UserDocument[]).find(d => d.id === documentId)
      || ((blogDb?.userDocuments || []) as UserDocument[]).find(d => d.id === documentId);
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const sessions = await hybridStorageService.getVoiceSessions(documentId);
    const combined = sessions
      .sort((a, b) => a.sessionNumber - b.sessionNumber)
      .map((s, idx) => {
        const indexLabel = `${idx + 1}.`;
        const title = (s.title && s.title.trim()) || `Section ${idx + 1}`;
        const raw = (s.transcript || '').trim();
        const chunks = raw.split(/\n{2,}/);
        const description = chunks[0] || '';
        const rest = chunks.slice(1).join('\n');
        const bullets = rest ? rest.split(/\n+/).filter(Boolean) : [];
        const bulletText = bullets.length ? bullets.map((b) => `- ${b}`).join('\n') : '';
        return [ `${indexLabel} ${title}`, description, bulletText ].filter(Boolean).join('\n');
      })
      .join('\n\n');

    const script = await generatePodcast(combined, doc.inputLanguage, doc.outputLanguage);

    // Save back to whichever store holds the document
    if (draftDb && (draftDb.userDocuments as UserDocument[]).some(d => d.id === documentId)) {
      const idx = (draftDb.userDocuments as UserDocument[]).findIndex(d => d.id === documentId);
      (draftDb.userDocuments as UserDocument[])[idx] = {
        ...(draftDb.userDocuments as UserDocument[])[idx],
        generatedContent: {
          ...((draftDb.userDocuments as UserDocument[])[idx].generatedContent || {}),
          podcast: script,
        },
        hasGeneratedContent: true,
        generatedAt: new Date().toISOString(),
      } as UserDocument;
      await hybridStorageService.saveDatabase(draftDb);
    } else if (blogDb) {
      const idx = (blogDb.userDocuments as UserDocument[]).findIndex(d => d.id === documentId);
      if (idx !== -1) {
        (blogDb.userDocuments as UserDocument[])[idx] = {
          ...(blogDb.userDocuments as UserDocument[])[idx],
          generatedContent: {
            ...((blogDb.userDocuments as UserDocument[])[idx].generatedContent || {}),
            podcast: script,
          },
          hasGeneratedContent: true,
          generatedAt: new Date().toISOString(),
        } as UserDocument;
        await hybridStorageService.saveBlogDatabase(blogDb);
      }
    }

    return NextResponse.json({ podcastScript: script });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to generate podcast', details: msg }, { status: 500 });
  }
}
