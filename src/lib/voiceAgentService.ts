import { VoiceAgentCall, User } from '@/types';
import { TextToSpeechService } from './textToSpeechService';
import { CallProviderService } from './callProviderService';
import { UserService } from './userService';

// Message template for voice calls
const MESSAGE_TEMPLATE = "Hello {userName}, {greeting}. You have 10 discrepancies in the team, please resolve as fast as you can";

export class VoiceAgentService {
  /**
   * Generate greeting based on current time
   * @returns Greeting string (Good morning/afternoon/evening)
   */
  static getGreeting(): string {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  }

  /**
   * Generate personalized message from template
   * @param userName - User's full name
   * @returns Generated message
   */
  static generateMessage(userName: string): string {
    const greeting = this.getGreeting();
    return MESSAGE_TEMPLATE.replace('{userName}', userName).replace('{greeting}', greeting);
  }

  /**
   * Validate phone number format
   * @param phoneNumber - Phone number to validate
   * @returns true if valid
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    if (!phoneNumber) {
      return false;
    }
    return CallProviderService.validatePhoneNumber(phoneNumber);
  }

  /**
   * Generate a unique call ID
   * @returns UUID string
   */
  private static generateCallId(): string {
    // Simple UUID-like generation without crypto dependency
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initiate a voice call with generated speech
   * @param userId - User ID
   * @param phoneNumber - Phone number to call (E.164 format)
   * @param documentId - Document ID
   * @param currentUser - User object (from database)
   * @returns VoiceAgentCall object
   */
  static async initiateVoiceCall(
    userId: number,
    phoneNumber: string,
    documentId: string,
    currentUser: User
  ): Promise<VoiceAgentCall> {
    const callId = this.generateCallId();
    const createdAt = new Date().toISOString();

    try {
      // Validate phone number
      if (!this.validatePhoneNumber(phoneNumber)) {
        throw new Error(`Invalid phone number format: ${phoneNumber}`);
      }

      console.log(`🎤 Voice Agent: Initiating call for user ${userId} to ${phoneNumber}`);

      // Validate user object
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const userName = `${currentUser.firstName} ${currentUser.lastName}`;

      // Generate message
      const message = this.generateMessage(userName);
      console.log(`📝 Generated message: ${message}`);

      // Get user's output language preference
      const language = currentUser.preferences?.defaultOutputLanguage || 'en';

      // Initiate call with Twilio using the message text
      // Twilio will use its built-in text-to-speech to speak the message
      console.log(`📞 Initiating Twilio call with message...`);
      const callResponse = await CallProviderService.initiateCall(phoneNumber, message);

      console.log(`✅ Call initiated successfully: ${callResponse.callSid}`);

      // Return call object
      const voiceAgentCall: VoiceAgentCall = {
        id: callId,
        userId,
        documentId,
        phoneNumber,
        status: 'initiated',
        message,
        createdAt,
        initiatedAt: new Date().toISOString(),
      };

      return voiceAgentCall;
    } catch (error) {
      console.error('❌ Error initiating voice call:', error);

      const voiceAgentCall: VoiceAgentCall = {
        id: callId,
        userId,
        documentId,
        phoneNumber,
        status: 'failed',
        message: '',
        createdAt,
        error: error instanceof Error ? error.message : String(error),
      };

      throw error;
    }
  }

  /**
   * Get call status
   * @param callId - Call ID
   * @returns Call status
   */
  static async getCallStatus(callId: string): Promise<VoiceAgentCall | null> {
    try {
      // In a real implementation, this would fetch from a database
      // For now, we'll just return null as we're not storing calls
      console.log(`📞 Fetching call status: ${callId}`);
      return null;
    } catch (error) {
      console.error('❌ Error fetching call status:', error);
      throw error;
    }
  }
}
