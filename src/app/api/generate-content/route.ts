import { NextRequest, NextResponse } from 'next/server';
import { generateAllContent } from '@/lib/openai';
import { hybridStorageService } from '@/lib/hybridStorageService';
import type { UserDocument, VoiceSession } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Accept both 'text' and 'originalText' for compatibility
    let originalText: string | undefined = body.originalText || body.text;
    const { inputLanguage, outputLanguage } = body;
    const documentId: string | undefined = body.documentId;

    console.log('Generate content request:', {
      hasText: !!originalText,
      textLength: originalText?.length || 0,
      inputLanguage,
      outputLanguage,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasModelName: !!process.env.OPENAI_MODEL_NAME,
      nodeEnv: process.env.NODE_ENV
    });

    // Helper function to strip HTML but preserve emojis and text
    const stripHtmlKeepEmojis = (html: string): string => {
      return html
        .replace(/<br\s*\/?>/gi, '\n')           // Convert <br> to newlines
        .replace(/<\/p>/gi, '\n')                // Convert </p> to newlines
        .replace(/<\/li>/gi, '\n')               // Convert </li> to newlines
        .replace(/<\/h[1-6]>/gi, '\n')           // Convert heading ends to newlines
        .replace(/<[^>]*>/g, '')                 // Remove all other HTML tags
        .replace(/&nbsp;/g, ' ')                 // Convert &nbsp; to space
        .replace(/&amp;/g, '&')                  // Convert &amp; to &
        .replace(/&lt;/g, '<')                   // Convert &lt; to <
        .replace(/&gt;/g, '>')                   // Convert &gt; to >
        .replace(/&quot;/g, '"')                 // Convert &quot; to "
        .replace(/&#39;/g, "'")                  // Convert &#39; to '
        .replace(/\n\s*\n\s*\n/g, '\n\n')        // Normalize multiple newlines to double
        .replace(/[ \t]+/g, ' ')                 // Normalize spaces/tabs to single space
        .trim();
    };

    // If a documentId is provided, prefer building the combined transcript from sessions (title + description)
    if (!originalText && documentId) {
      const db = await hybridStorageService.getDatabase();
      if (db) {
        const doc = (db.userDocuments || []).find((d: UserDocument) => String(d.id) === String(documentId));
        const sessions = (db.voiceSessions || []).filter((s: VoiceSession) => String(s.documentId) === String(documentId));
        if (doc && sessions && sessions.length > 0) {
          originalText = sessions
            .sort((a, b) => a.sessionNumber - b.sessionNumber)
            .map((s, idx) => {
              const indexLabel = `${idx + 1}.`;
              const title = (s.title && s.title.trim()) || `Section ${idx + 1}`;
              
              // Use richContent if available (has emojis!), otherwise fall back to plain transcript
              const raw = s.richContent 
                ? stripHtmlKeepEmojis(s.richContent)  // Extract text + emojis from HTML
                : (s.transcript || '').trim();         // Fallback to plain text
              
              const chunks = raw.split(/\n{2,}/);
              const description = chunks[0] || '';
              const rest = chunks.slice(1).join('\n');
              const bullets = rest ? rest.split(/\n+/).filter(Boolean) : [];
              const bulletText = bullets.length ? bullets.map((b) => `- ${b}`).join('\n') : '';
              return [
                `${indexLabel} ${title}`,
                description,
                bulletText
              ].filter(Boolean).join('\n');
            })
            .join('\n\n');
        }
      }
    }

    if (!originalText || !inputLanguage || !outputLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields: text/originalText, inputLanguage, and outputLanguage' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please check environment variables.' },
        { status: 500 }
      );
    }

    if (!process.env.OPENAI_MODEL_NAME) {
      console.error('OpenAI model name not configured');
      return NextResponse.json(
        { error: 'OpenAI model name not configured. Please check environment variables.' },
        { status: 500 }
      );
    }

    console.log('Starting content generation...');
    const content = await generateAllContent(originalText, inputLanguage, outputLanguage);
    console.log('Content generation successful');

    return NextResponse.json(content);

  } catch (error) {
    console.error('Content generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to generate content',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
