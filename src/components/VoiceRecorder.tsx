'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SpeechRecognitionManager } from '@/lib/speechRecognition';
import { RecordingState, LanguageSettings } from '@/types';
import { getLanguageByCode, SUPPORTED_LANGUAGES } from '@/lib/languages';

interface VoiceRecorderProps {
  languageSettings: LanguageSettings;
  onLanguageSettingsChange: (settings: LanguageSettings) => void;
  onTranscriptComplete: (transcript: string) => void;
}

export default function VoiceRecorder({ languageSettings, onLanguageSettingsChange, onTranscriptComplete }: VoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    transcript: '',
    duration: 0
  });

  const [isSupported, setIsSupported] = useState(false);
  const speechManager = useRef<SpeechRecognitionManager | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cumulativeTranscript = useRef<string>(''); // Store all speech input

  useEffect(() => {
    speechManager.current = new SpeechRecognitionManager();
    setIsSupported(speechManager.current.isSupportedInBrowser());
  }, []);

  useEffect(() => {
    if (recordingState.isRecording && !recordingState.isPaused) {
      intervalRef.current = setInterval(() => {
        setRecordingState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [recordingState.isRecording, recordingState.isPaused]);

  const startRecording = () => {
    if (!speechManager.current) return;

    // Reset cumulative transcript when starting fresh
    cumulativeTranscript.current = '';
    
    // Set the language for speech recognition
    const selectedLanguage = getLanguageByCode(languageSettings.inputLanguage);
    if (selectedLanguage) {
      speechManager.current.setLanguage(selectedLanguage.speechRecognitionCode);
    }
    
    setRecordingState({
      isRecording: true,
      isPaused: false,
      transcript: '',
      duration: 0
    });

    speechManager.current.startRecording(
      (transcript, isFinal) => {
        if (isFinal) {
          // Add final transcript to cumulative
          cumulativeTranscript.current += transcript;
          setRecordingState(prev => ({
            ...prev,
            transcript: cumulativeTranscript.current
          }));
        } else {
          // Show interim + cumulative transcript
          setRecordingState(prev => ({
            ...prev,
            transcript: cumulativeTranscript.current + transcript
          }));
        }
      },
      (error) => {
        console.error('Speech recognition error:', error);
        setRecordingState(prev => ({ ...prev, isRecording: false }));
      },
      () => {
        setRecordingState(prev => ({ ...prev, isRecording: false }));
      }
    );
  };

  const pauseRecording = () => {
    if (!speechManager.current) return;

    // When pausing, ensure we keep the current transcript
    speechManager.current.pauseRecording();
    setRecordingState(prev => ({ ...prev, isPaused: true }));
  };

  const resumeRecording = () => {
    if (!speechManager.current) return;

    // When resuming, continue from where we left off
    speechManager.current.resumeRecording();
    setRecordingState(prev => ({ ...prev, isPaused: false }));
  };

  const stopRecording = () => {
    if (!speechManager.current) return;

    speechManager.current.stopRecording();
    setRecordingState(prev => ({ ...prev, isRecording: false }));
  };

  const handleDone = () => {
    if (recordingState.transcript.trim()) {
      onTranscriptComplete(recordingState.transcript);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedInputLanguage = getLanguageByCode(languageSettings.inputLanguage);
  const selectedOutputLanguage = getLanguageByCode(languageSettings.outputLanguage);

  if (!isSupported) {
    return (
      <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">
          Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Voice Input & Language Selection
      </h2>

      {/* Language Selection */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-3">🌍 Language Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input Language */}
          <div>
            <label htmlFor="inputLanguage" className="block text-sm font-medium text-blue-700 mb-2">
              🎤 Input Language (Speech)
            </label>
            <select
              id="inputLanguage"
              value={languageSettings.inputLanguage}
              onChange={(e) => onLanguageSettingsChange({
                ...languageSettings,
                inputLanguage: e.target.value
              })}
              className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {SUPPORTED_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.nativeName} ({language.name})
                </option>
              ))}
            </select>
          </div>

          {/* Output Language */}
          <div>
            <label htmlFor="outputLanguage" className="block text-sm font-medium text-green-700 mb-2">
              📝 Output Language (Content)
            </label>
            <select
              id="outputLanguage"
              value={languageSettings.outputLanguage}
              onChange={(e) => onLanguageSettingsChange({
                ...languageSettings,
                outputLanguage: e.target.value
              })}
              className="w-full p-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {SUPPORTED_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.nativeName} ({language.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Language Display */}
        <div className="mt-4 p-3 bg-white border border-blue-300 rounded-md">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <div className="text-center">
                <span className="text-gray-600">Input:</span>
                <div className="font-medium text-blue-700">
                  {selectedInputLanguage?.nativeName} ({selectedInputLanguage?.name})
                </div>
              </div>
              <div className="text-gray-400">→</div>
              <div className="text-center">
                <span className="text-gray-600">Output:</span>
                <div className="font-medium text-green-700">
                  {selectedOutputLanguage?.nativeName} ({selectedOutputLanguage?.name})
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recording Controls */}
      <div className="flex justify-center space-x-4 mb-6">
        {!recordingState.isRecording ? (
          <button
            onClick={startRecording}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Recording
          </button>
        ) : (
          <>
            {recordingState.isPaused ? (
              <button
                onClick={resumeRecording}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Resume
              </button>
            ) : (
              <button
                onClick={pauseRecording}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Pause
              </button>
            )}
            <button
              onClick={stopRecording}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Stop
            </button>
          </>
        )}
      </div>

      {/* Recording Status */}
      {recordingState.isRecording && (
        <div className="text-center mb-6">
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
            recordingState.isPaused 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-3 h-3 rounded-full ${
              recordingState.isPaused 
                ? 'bg-yellow-500' 
                : 'bg-red-500 animate-pulse'
            }`}></div>
            <span className="font-medium">
              {recordingState.isPaused ? 'Paused - Your input is preserved' : 'Recording'} - {formatTime(recordingState.duration)}
            </span>
          </div>
          
          {/* Pause State Message */}
          {recordingState.isPaused && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700 text-sm">
                💡 <strong>Paused:</strong> Your speech input is safely preserved. Click &quot;Resume&quot; to continue recording from where you left off.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Transcript Display */}
      {recordingState.transcript && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Input:</h3>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg min-h-[120px]">
            <p className="text-gray-800 whitespace-pre-wrap">
              {recordingState.transcript}
            </p>
          </div>
        </div>
      )}

      {/* Done Button */}
      {recordingState.transcript && !recordingState.isRecording && (
        <div className="text-center">
          <button
            onClick={handleDone}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Done - Process Content
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Select your input and output languages above</li>
          <li>• Click &quot;Start Recording&quot; to begin voice input in {selectedInputLanguage?.name}</li>
          <li>• Use &quot;Pause&quot; to take breaks while thinking - your input is preserved</li>
          <li>• Click &quot;Done&quot; when you&apos;re finished with your input</li>
          <li>• Your original speech will be preserved exactly as spoken</li>
          <li>• Content will be generated in {selectedOutputLanguage?.name}</li>
        </ul>
      </div>
    </div>
  );
}
