import { NextRequest, NextResponse } from 'next/server';
import { VoiceAgentService } from '@/lib/voiceAgentService';

export async function GET(
  request: NextRequest,
  { params }: { params: { callId: string } }
) {
  try {
    const { callId } = params;

    if (!callId) {
      return NextResponse.json(
        { error: 'Call ID is required' },
        { status: 400 }
      );
    }

    console.log(`📞 API: Fetching call status for ${callId}`);

    // Get call status
    const callStatus = await VoiceAgentService.getCallStatus(callId);

    if (!callStatus) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        callId: callStatus.id,
        status: callStatus.status,
        initiatedAt: callStatus.initiatedAt,
        completedAt: callStatus.completedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ API Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'An error occurred';

    return NextResponse.json(
      { error: `Failed to fetch call status: ${errorMessage}` },
      { status: 500 }
    );
  }
}
