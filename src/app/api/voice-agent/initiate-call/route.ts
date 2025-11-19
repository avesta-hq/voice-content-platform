import { NextRequest, NextResponse } from 'next/server';
import { VoiceAgentService } from '@/lib/voiceAgentService';
import { UserService } from '@/lib/userService';
import { hybridStorageService } from '@/lib/hybridStorageService';

/**
 * POST /api/voice-agent/initiate-call
 * Initiates a voice call with AI-generated speech
 * 
 * Request body:
 * {
 *   "phoneNumber": "+1234567890",
 *   "documentId": "doc-123"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "callId": "call_123456789",
 *   "message": "Call initiated successfully. You should receive a call shortly.",
 *   "status": "initiated",
 *   "initiatedAt": "2025-11-19T10:00:00Z"
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('📞 [VOICE_AGENT] Call initiation request received');

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('❌ [VOICE_AGENT] Invalid JSON in request body');
      return NextResponse.json(
        { error: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      );
    }

    const { phoneNumber, documentId, userId } = body;

    // Validate required fields
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      console.warn('❌ [VOICE_AGENT] Missing or invalid phoneNumber');
      return NextResponse.json(
        { error: 'Phone number is required and must be a string' },
        { status: 400 }
      );
    }

    if (!documentId || typeof documentId !== 'string') {
      console.warn('❌ [VOICE_AGENT] Missing or invalid documentId');
      return NextResponse.json(
        { error: 'Document ID is required and must be a string' },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'number') {
      console.warn('❌ [VOICE_AGENT] Missing or invalid userId');
      return NextResponse.json(
        { error: 'User ID is required and must be a number' },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!VoiceAgentService.validatePhoneNumber(phoneNumber)) {
      console.warn(`❌ [VOICE_AGENT] Invalid phone number format: ${phoneNumber}`);
      return NextResponse.json(
        { 
          error: 'Invalid phone number format. Please use E.164 format (e.g., +1234567890). Phone numbers must start with + and contain 10-15 digits.' 
        },
        { status: 400 }
      );
    }

    // Validate authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.warn('❌ [VOICE_AGENT] Missing authorization header');
      return NextResponse.json(
        { error: 'Unauthorized. Please provide valid authentication.' },
        { status: 401 }
      );
    }

    // Get current user from the database using the userId from request
    const db = await hybridStorageService.getDatabase();
    if (!db || !db.users) {
      console.error('❌ [VOICE_AGENT] Database not found');
      return NextResponse.json(
        { error: 'Database error. Please try again.' },
        { status: 500 }
      );
    }

    const currentUser = db.users.find((u: any) => u.id === userId);
    if (!currentUser) {
      console.warn(`❌ [VOICE_AGENT] User not found: ${userId}`);
      return NextResponse.json(
        { error: 'User not found. Please log in and try again.' },
        { status: 401 }
      );
    }

    console.log(`📞 [VOICE_AGENT] Initiating call for user ${currentUser.id} (${currentUser.email})`);
    console.log(`📞 [VOICE_AGENT] Phone: ${phoneNumber}, Document: ${documentId}`);

    // Initiate voice call
    const voiceAgentCall = await VoiceAgentService.initiateVoiceCall(
      currentUser.id,
      phoneNumber,
      documentId,
      currentUser
    );

    const duration = Date.now() - startTime;
    console.log(`✅ [VOICE_AGENT] Call initiated successfully in ${duration}ms`);
    console.log(`✅ [VOICE_AGENT] Call ID: ${voiceAgentCall.id}`);

    return NextResponse.json(
      {
        success: true,
        callId: voiceAgentCall.id,
        message: 'Call initiated successfully! You should receive a call shortly.',
        status: voiceAgentCall.status,
        initiatedAt: voiceAgentCall.initiatedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [VOICE_AGENT] Error after ${duration}ms:`, error);

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    // Categorize and respond to different error types
    if (errorMessage.includes('Invalid phone number')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    if (errorMessage.includes('not authenticated')) {
      return NextResponse.json(
        { error: 'User not authenticated. Please log in and try again.' },
        { status: 401 }
      );
    }

    if (errorMessage.includes('not properly configured')) {
      console.error('❌ [VOICE_AGENT] Service configuration error - check environment variables');
      return NextResponse.json(
        { error: 'Voice service is not properly configured. Please contact support.' },
        { status: 503 }
      );
    }

    if (errorMessage.includes('TWILIO') || errorMessage.includes('Twilio')) {
      console.error('❌ [VOICE_AGENT] Twilio API error:', errorMessage);
      return NextResponse.json(
        { error: 'Failed to initiate call with phone provider. Please try again later.' },
        { status: 503 }
      );
    }

    if (errorMessage.includes('OpenAI') || errorMessage.includes('TTS')) {
      console.error('❌ [VOICE_AGENT] TTS API error:', errorMessage);
      return NextResponse.json(
        { error: 'Failed to generate speech. Please try again later.' },
        { status: 503 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: 'Failed to initiate call. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
