'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SpeechRecognitionManager } from '@/lib/speechRecognition';
import { RecordingState } from '@/types';
import { getLanguageByCode } from '@/lib/languages';

interface SessionRecorderProps {
  inputLanguage: string;
  onSessionComplete: (transcript: string, duration: number) => void;
  onCancel: () => void;
}

export default function SessionRecorder({ inputLanguage, onSessionComplete, onCancel }: SessionRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false, // Keep this for now but won't be used
    transcript: '',
    duration: 0
  });

  const [isSupported, setIsSupported] = useState(false);
  const [notes, setNotes] = useState<string>('');
  const speechManager = useRef<SpeechRecognitionManager | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const cumulativeTranscript = useRef<string>('');

  useEffect(() => {
    speechManager.current = new SpeechRecognitionManager();
    setIsSupported(speechManager.current.isSupportedInBrowser());
  }, []);

  useEffect(() => {
    if (recordingState.isRecording /* && !recordingState.isPaused */) {
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
  }, [recordingState.isRecording /* , recordingState.isPaused */]);

  const startRecording = () => {
    if (!speechManager.current) return;

    // Reset cumulative transcript when starting fresh
    cumulativeTranscript.current = '';
    
    // Set the language for speech recognition
    const selectedLanguage = getLanguageByCode(inputLanguage);
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

  // Pause feature commented out for now
  /*
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
  */

  const stopRecording = () => {
    if (!speechManager.current) return;

    speechManager.current.stopRecording();
    setRecordingState(prev => ({ ...prev, isRecording: false }));
  };

  const handleSaveSession = () => {
    if (recordingState.transcript.trim()) {
      onSessionComplete(recordingState.transcript, recordingState.duration);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedLanguage = getLanguageByCode(inputLanguage);

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
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Record New Session</h2>
        <p className="text-gray-600 mt-2">
          Add more content to your document in {selectedLanguage?.nativeName || selectedLanguage?.name}
        </p>
      </div>

      {/* Language Display */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-center">
          <h3 className="font-semibold text-blue-800 mb-2">🌍 Document Language Settings</h3>
          <div className="text-blue-700">
            <span className="text-lg font-medium">
              {selectedLanguage?.nativeName} ({selectedLanguage?.name})
            </span>
          </div>
          <p className="text-sm text-blue-600 mt-1">
            Language settings are fixed for this document
          </p>
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
            {/* Pause feature commented out for now
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
            */}
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
            // recordingState.isPaused 
            //   ? 'bg-yellow-100 text-yellow-800' 
            //   : 'bg-red-100 text-red-800'
            'bg-red-100 text-red-800'
          }`}>
            <div className={`w-3 h-3 rounded-full ${
              // recordingState.isPaused 
              //   ? 'bg-yellow-500' 
              //   : 'bg-red-500 animate-pulse'
              'bg-red-500 animate-pulse'
            }`}></div>
            <span className="font-medium">
              {/* {recordingState.isPaused ? 'Paused - Your input is preserved' : 'Recording'} - {formatTime(recordingState.duration)} */}
              Recording - {formatTime(recordingState.duration)}
            </span>
          </div>
          
          {/* Pause State Message - commented out
          {recordingState.isPaused && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700 text-sm">
                💡 <strong>Paused:</strong> Your speech input is safely preserved. Click &quot;Resume&quot; to continue recording from where you left off.
              </p>
            </div>
          )}
          */}
        </div>
      )}

      {/* Transcript Display */}
      {recordingState.transcript && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Session Content:</h3>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg min-h-[120px]">
            <p className="text-gray-800 whitespace-pre-wrap">
              {recordingState.transcript}
            </p>
          </div>
        </div>
      )}

      {/* Session Notes */}
      <div className="mb-6">
        <label htmlFor="sessionNotes" className="block text-sm font-medium text-gray-700 mb-2">
          Session Notes (Optional)
        </label>
        <textarea
          id="sessionNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add any notes about this session (optional)..."
        />
        <p className="mt-1 text-xs text-gray-500">
          Optional: Add context or notes about this recording session
        </p>
      </div>

      {/* Action Buttons */}
      {recordingState.transcript && !recordingState.isRecording && (
        <div className="flex space-x-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveSession}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            Save Session
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Click &quot;Start Recording&quot; to begin your session</li>
          {/* Pause feature commented out
          <li>• Use &quot;Pause&quot; to take breaks while thinking - your input is preserved</li>
          */}
          <li>• Click &quot;Stop&quot; when you&apos;re finished with this session</li>
          <li>• Add optional notes to provide context for this session</li>
          <li>• Click &quot;Save Session&quot; to add this content to your document</li>
        </ul>
      </div>
    </div>
  );
}
