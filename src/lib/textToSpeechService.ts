import OpenAI from 'openai';
import { TextToSpeechRequest, TextToSpeechResponse } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Language to voice mapping for OpenAI TTS
const LANGUAGE_VOICE_MAP: Record<string, string> = {
  'en': 'alloy',      // English
  'es': 'nova',       // Spanish
  'fr': 'echo',       // French
  'de': 'fable',      // German
  'it': 'onyx',       // Italian
  'pt': 'shimmer',    // Portuguese
  'ru': 'alloy',      // Russian
  'ja': 'nova',       // Japanese
  'ko': 'echo',       // Korean
  'zh': 'fable',      // Chinese
  'hi': 'onyx',       // Hindi
  'gu': 'shimmer',    // Gujarati
  'ta': 'alloy',      // Tamil
  'te': 'nova',       // Telugu
};

export class TextToSpeechService {
  /**
   * Generate speech from text using OpenAI TTS API
   * @param text - Text to convert to speech
   * @param language - Language code (e.g., 'en', 'es', 'fr')
   * @returns Promise with audio buffer
   */
  static async generateSpeech(text: string, language: string = 'en'): Promise<Buffer> {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }

      if (!this.validateLanguageSupport(language)) {
        console.warn(`Language ${language} not supported, falling back to English`);
      }

      const voice = this.getVoiceForLanguage(language);
      const model = process.env.OPENAI_TTS_MODEL || 'tts-1';

      console.log(`🎤 Generating speech: language=${language}, voice=${voice}, model=${model}`);

      const response = await openai.audio.speech.create({
        model: model as 'tts-1' | 'tts-1-hd',
        voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
        input: text,
      });

      // Convert response to buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log(`✅ Speech generated successfully: ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      console.error('❌ Error generating speech:', error);
      throw new Error(`Failed to generate speech: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the appropriate voice for a given language
   * @param language - Language code
   * @returns Voice name for OpenAI TTS
   */
  static getVoiceForLanguage(language: string): string {
    const voice = LANGUAGE_VOICE_MAP[language];
    if (!voice) {
      console.warn(`Voice not found for language ${language}, using default 'alloy'`);
      return 'alloy';
    }
    return voice;
  }

  /**
   * Validate if a language is supported
   * @param language - Language code
   * @returns true if language is supported
   */
  static validateLanguageSupport(language: string): boolean {
    return language in LANGUAGE_VOICE_MAP;
  }

  /**
   * Get all supported languages
   * @returns Array of supported language codes
   */
  static getSupportedLanguages(): string[] {
    return Object.keys(LANGUAGE_VOICE_MAP);
  }
}
