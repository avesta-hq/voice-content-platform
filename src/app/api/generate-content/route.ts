import { NextRequest, NextResponse } from 'next/server';
import { generateAllContent } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Accept both 'text' and 'originalText' for compatibility
    const originalText = body.originalText || body.text;
    const { inputLanguage, outputLanguage } = body;

    if (!originalText || !inputLanguage || !outputLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields: text/originalText, inputLanguage, and outputLanguage' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const content = await generateAllContent(originalText, inputLanguage, outputLanguage);

    return NextResponse.json(content);

  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
