import { NextRequest, NextResponse } from 'next/server';
import { generateEngageBoth, type EngageGenerateParams } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<EngageGenerateParams>;
    const platform = (body.platform === 'twitter' ? 'twitter' : 'linkedin');
    const postText = (body.postText || '').toString();
    const intentText = (body.intentText || '').toString();
    const languageOut = (body.languageOut || 'en').toString();
    const tone = (body.tone || 'professional') as EngageGenerateParams['tone'];
    const length = (body.length || 'short') as EngageGenerateParams['length'];

    if (!postText.trim()) {
      return NextResponse.json({ error: 'postText is required' }, { status: 400 });
    }
    if (!intentText.trim()) {
      return NextResponse.json({ error: 'intent (voice) is required' }, { status: 400 });
    }

    const result = await generateEngageBoth({ platform, postText, intentText, languageOut, tone, length });
    return NextResponse.json({ result }, { status: 200 });
  } catch (e) {
    console.error('Engage generate error:', e);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}


