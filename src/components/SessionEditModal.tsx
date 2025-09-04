"use client";

import React, { useEffect, useRef, useState } from 'react';
import { VoiceSession } from '@/types';
import { SpeechRecognitionManager } from '@/lib/speechRecognition';
import { getLanguageByCode } from '@/lib/languages';

interface SessionEditModalProps {
  open: boolean;
  session: VoiceSession;
  inputLanguage: string;
  onClose: () => void;
  onSaved: (updated: VoiceSession) => void;
}

export default function SessionEditModal({ open, session, inputLanguage, onClose, onSaved }: SessionEditModalProps) {
  const [isSupported, setIsSupported] = useState(false);
  const speechManager = useRef<SpeechRecognitionManager | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [newTranscript, setNewTranscript] = useState('');
  const [error, setError] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cumulative = useRef<string>('');

  useEffect(() => {
    speechManager.current = new SpeechRecognitionManager();
    setIsSupported(speechManager.current.isSupportedInBrowser());
  }, []);

  useEffect(() => {
    if (!open) {
      // Cleanup when closing
      stopRecording();
      setRecordedDuration(0);
      setNewTranscript('');
      setError('');
    }
  }, [open]);

  const startRecording = () => {
    if (!speechManager.current) return;

    const selected = getLanguageByCode(inputLanguage);
    if (selected) {
      speechManager.current.setLanguage(selected.speechRecognitionCode);
    }

    cumulative.current = '';
    setNewTranscript('');
    setRecordedDuration(0);
    setIsRecording(true);

    timerRef.current = setInterval(() => setRecordedDuration(prev => prev + 1), 1000);

    speechManager.current.startRecording(
      (partial, isFinal) => {
        if (isFinal) {
          cumulative.current += partial;
          setNewTranscript(cumulative.current);
        } else {
          setNewTranscript(cumulative.current + partial);
        }
      },
      (err) => {
        console.error('Speech error:', err);
        setError('Speech recognition error');
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );
  };

  const stopRecording = () => {
    if (!speechManager.current) return;
    speechManager.current.stopRecording();
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    try {
      const appended = newTranscript.trim();
      if (!appended) {
        onClose();
        return;
      }
      const merged = session.transcript + (session.transcript.endsWith(' ') || session.transcript.length === 0 ? '' : ' ') + appended;

      const res = await fetch(`/api/voiceSessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...session,
          transcript: merged,
          duration: session.duration + recordedDuration,
          timestamp: new Date().toISOString(),
        })
      });
      if (!res.ok) throw new Error(`Failed to save session: ${res.status}`);
      const updated: VoiceSession = await res.json();
      onSaved(updated);
      onClose();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h4 className="text-lg font-semibold">Edit Session {session.sessionNumber}</h4>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        {!isSupported ? (
          <div className="p-5">
            <p className="text-red-600">Speech recognition is not supported in this browser.</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}

            <div>
              <div className="text-sm text-gray-600 mb-1">Current content</div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <p className="whitespace-pre-wrap text-gray-800 text-sm">{session.transcript}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">New input (live)</div>
                <div className="text-xs text-gray-500">{isRecording ? 'Recording ' : 'Idle '}• {formatTime(recordedDuration)}</div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded min-h-[80px]">
                <p className="whitespace-pre-wrap text-blue-900 text-sm">{newTranscript || 'Start speaking to add more...'}</p>
              </div>
              <div className="mt-3 flex gap-3">
                {!isRecording ? (
                  <button onClick={startRecording} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Start</button>
                ) : (
                  <button onClick={stopRecording} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Stop</button>
                )}
                <button onClick={() => { setNewTranscript(''); cumulative.current=''; setRecordedDuration(0); }} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Clear</button>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">Preview to save</div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded min-h-[80px]">
                <p className="whitespace-pre-wrap text-gray-800 text-sm">{(session.transcript + (newTranscript ? (session.transcript.endsWith(' ') || session.transcript.length===0 ? '' : ' ') + newTranscript : ''))}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={!newTranscript.trim()} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">Save</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
