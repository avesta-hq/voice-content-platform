import { NextRequest, NextResponse } from 'next/server';
import { generateAllContent } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Accept both 'text' and 'originalText' for compatibility
    const originalText = body.originalText || body.text;
    const { inputLanguage, outputLanguage } = body;

    console.log('Generate content request:', {
      hasText: !!originalText,
      textLength: originalText?.length || 0,
      inputLanguage,
      outputLanguage,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasModelName: !!process.env.OPENAI_MODEL_NAME,
      nodeEnv: process.env.NODE_ENV
    });

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
