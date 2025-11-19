import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const twilioClient = twilio(accountSid, authToken);

export interface CallResponse {
  callSid: string;
  status: string;
  to: string;
  from: string;
}

export interface CallStatusResponse {
  callSid: string;
  status: string;
  duration?: number;
  startTime?: string;
  endTime?: string;
}

export class CallProviderService {
  /**
   * Validate Twilio configuration
   */
  static validateConfiguration(): boolean {
    if (!accountSid || !authToken || !fromPhoneNumber) {
      console.error('❌ Twilio configuration incomplete. Missing:', {
        accountSid: !accountSid ? 'TWILIO_ACCOUNT_SID' : '✓',
        authToken: !authToken ? 'TWILIO_AUTH_TOKEN' : '✓',
        fromPhoneNumber: !fromPhoneNumber ? 'TWILIO_PHONE_NUMBER' : '✓',
      });
      return false;
    }
    return true;
  }

  /**
   * Initiate an outbound call with message
   * @param toPhoneNumber - Phone number to call (E.164 format)
   * @param message - Message text to speak (or audio URL)
   * @returns Call SID and details
   */
  static async initiateCall(toPhoneNumber: string, message: string): Promise<CallResponse> {
    try {
      if (!this.validateConfiguration()) {
        throw new Error('Twilio is not properly configured');
      }

      if (!toPhoneNumber || !message) {
        throw new Error('Phone number and message are required');
      }

      console.log(`📞 Initiating call: to=${toPhoneNumber}`);

      // Check if message is a URL (audio file) or text
      let twiml: string;
      if (message.startsWith('http://') || message.startsWith('https://')) {
        // It's a URL - use Play
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${message}</Play>
</Response>`;
      } else if (message.startsWith('data:')) {
        // It's a data URL - use Say instead (Twilio will handle it)
        // Extract text from the message if it's too large
        const messageText = message.length > 1000 
          ? message.substring(0, 1000) 
          : message;
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${this.escapeXml(messageText)}</Say>
</Response>`;
      } else {
        // It's plain text - use Say
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${this.escapeXml(message)}</Say>
</Response>`;
      }

      console.log(`📞 TwiML size: ${twiml.length} bytes`);

      // Initiate the call
      const call = await twilioClient.calls.create({
        to: toPhoneNumber,
        from: fromPhoneNumber!,
        twiml: twiml,
      });

      console.log(`✅ Call initiated successfully: SID=${call.sid}, Status=${call.status}`);

      return {
        callSid: call.sid,
        status: call.status,
        to: call.to,
        from: call.from,
      };
    } catch (error) {
      console.error('❌ Error initiating call:', error);
      throw new Error(`Failed to initiate call: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Escape XML special characters
   */
  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Get the status of a call
   * @param callSid - Call SID
   * @returns Call status details
   */
  static async getCallStatus(callSid: string): Promise<CallStatusResponse> {
    try {
      if (!this.validateConfiguration()) {
        throw new Error('Twilio is not properly configured');
      }

      if (!callSid) {
        throw new Error('Call SID is required');
      }

      console.log(`📞 Fetching call status: SID=${callSid}`);

      const call = await twilioClient.calls(callSid).fetch();

      console.log(`✅ Call status retrieved: ${call.status}`);

      return {
        callSid: call.sid,
        status: call.status,
        duration: call.duration ? parseInt(call.duration as any) : undefined,
        startTime: call.startTime?.toISOString() || undefined,
        endTime: call.endTime?.toISOString() || undefined,
      };
    } catch (error) {
      console.error('❌ Error fetching call status:', error);
      throw new Error(`Failed to fetch call status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Hangup a call
   * @param callSid - Call SID
   */
  static async hangupCall(callSid: string): Promise<void> {
    try {
      if (!this.validateConfiguration()) {
        throw new Error('Twilio is not properly configured');
      }

      if (!callSid) {
        throw new Error('Call SID is required');
      }

      console.log(`📞 Hanging up call: SID=${callSid}`);

      await twilioClient.calls(callSid).update({ status: 'completed' });

      console.log(`✅ Call hung up successfully`);
    } catch (error) {
      console.error('❌ Error hanging up call:', error);
      throw new Error(`Failed to hangup call: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate phone number format (E.164)
   * @param phoneNumber - Phone number to validate
   * @returns true if valid E.164 format
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    // E.164 format: +[1-9]{1}[0-9]{1,14}
    const e164Regex = /^\+?[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }
}
