import { NextRequest, NextResponse } from 'next/server';
import { generateAllContent } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { originalText, inputLanguage, outputLanguage } = await request.json();

    if (!originalText || !inputLanguage || !outputLanguage) {
      return NextResponse.json(
        { error: 'Missing required fields: originalText, inputLanguage, and outputLanguage' },
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

    return NextResponse.json({
      success: true,
      content
    });

  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
