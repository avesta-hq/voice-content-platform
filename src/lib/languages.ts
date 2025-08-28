export interface Language {
  code: string;
  name: string;
  nativeName: string;
  speechRecognitionCode: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    speechRecognitionCode: 'gu-IN'
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    speechRecognitionCode: 'en-US'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    speechRecognitionCode: 'hi-IN'
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    speechRecognitionCode: 'es-ES'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    speechRecognitionCode: 'fr-FR'
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    speechRecognitionCode: 'de-DE'
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    speechRecognitionCode: 'it-IT'
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    speechRecognitionCode: 'pt-PT'
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    speechRecognitionCode: 'ru-RU'
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    speechRecognitionCode: 'ja-JP'
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    speechRecognitionCode: 'ko-KR'
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    speechRecognitionCode: 'zh-CN'
  }
];

export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

export function getLanguageBySpeechCode(speechCode: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.speechRecognitionCode === speechCode);
}
