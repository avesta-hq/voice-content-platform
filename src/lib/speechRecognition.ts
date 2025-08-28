export class SpeechRecognitionManager {
  private recognition: SpeechRecognition | null;
  private isSupported: boolean;
  private isRecording: boolean = false;

  constructor() {
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    if (this.isSupported) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    } else {
      this.recognition = null;
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'gu-IN'; // Gujarati language code
  }

  public startRecording(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ) {
    if (!this.isSupported || !this.recognition) {
      onError('Speech recognition is not supported in this browser');
      return;
    }

    this.isRecording = true;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!this.isRecording) return;

      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Always call onResult with the current state
      onResult(finalTranscript + interimTranscript, finalTranscript.length > 0);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (this.isRecording) {
        onError(event.error);
      }
    };

    this.recognition.onend = () => {
      if (this.isRecording) {
        onEnd();
      }
    };

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      onError('Failed to start speech recognition');
    }
  }

  public stopRecording() {
    if (!this.recognition) return;
    
    this.isRecording = false;
    
    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
  }

  public pauseRecording() {
    if (!this.recognition) return;
    
    this.isRecording = false;
    
    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Failed to pause speech recognition:', error);
    }
  }

  public resumeRecording() {
    if (!this.recognition) return;
    
    this.isRecording = true;
    
    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to resume speech recognition:', error);
    }
  }

  public setLanguage(languageCode: string) {
    if (this.recognition) {
      this.recognition.lang = languageCode;
    }
  }

  public isSupportedInBrowser(): boolean {
    return this.isSupported;
  }

  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }
}

// Type declarations for browser compatibility
declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition;
    SpeechRecognition: typeof SpeechRecognition;
  }
}
