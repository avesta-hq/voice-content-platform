"use client";

import React, { useEffect, useRef, useState } from "react";
import { SpeechRecognitionManager } from "@/lib/speechRecognition";
import { SUPPORTED_LANGUAGES, getLanguageByCode } from "@/lib/languages";

export default function SocialReplyStudioPage() {
  const [platform, setPlatform] = useState<'linkedin'|'twitter'>('linkedin');
  const [postText, setPostText] = useState<string>("");
  const [intent, setIntent] = useState<string>("");
  const [inputLang, setInputLang] = useState<string>('en');
  const [outputLang, setOutputLang] = useState<string>('en');
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [results, setResults] = useState<{comments: {text:string;rationale?:string}[];reposts:{text:string;rationale?:string}[]} | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<{type:'comment'|'repost'; idx:number} | null>(null);

  const mgrRef = useRef<SpeechRecognitionManager | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cumulativeRef = useRef<string>('');

  useEffect(() => {
    mgrRef.current = new SpeechRecognitionManager();
    const lang = getLanguageByCode(inputLang);
    if (lang) mgrRef.current.setLanguage(lang.speechRecognitionCode);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (mgrRef.current) {
      const lang = getLanguageByCode(inputLang);
      if (lang) mgrRef.current.setLanguage(lang.speechRecognitionCode);
    }
  }, [inputLang]);

  const start = () => {
    if (!mgrRef.current) return;
    cumulativeRef.current = '';
    setIntent("");
    setDuration(0);
    setIsRecording(true);
    timerRef.current = setInterval(() => setDuration((s)=>s+1), 1000);
    mgrRef.current.startRecording(
      (t, isFinal) => {
        if (isFinal) {
          cumulativeRef.current += t;
          setIntent(cumulativeRef.current);
        } else {
          setIntent(cumulativeRef.current + t);
        }
      },
      (err) => { setError(err); setIsRecording(false); },
      () => { setIsRecording(false); }
    );
  };

  const stop = () => {
    mgrRef.current?.stopRecording();
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const canGenerate = postText.trim().length > 0 && intent.trim().length > 0 && !loading;

  const generate = async () => {
    try {
      setLoading(true);
      setError("");
      setResults(null);
      const res = await fetch('/api/engage/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, postText, intentText: intent, languageOut: outputLang })
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      setResults(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Social Reply Studio</h1>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">{error}</div>}
      <div className="bg-white border rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <label className="text-sm text-gray-700">Platform</label>
          <select value={platform} onChange={(e)=>setPlatform(e.target.value as 'linkedin'|'twitter')} className="border rounded px-2 py-1 text-sm">
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">Twitter</option>
          </select>
          <div className="h-6 w-px bg-gray-200" />
          <label className="text-sm text-gray-700">Voice input</label>
          <select value={inputLang} onChange={(e)=>setInputLang(e.target.value)} className="border rounded px-2 py-1 text-sm">
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.nativeName} ({l.name})</option>
            ))}
          </select>
          <label className="text-sm text-gray-700">Output</label>
          <select value={outputLang} onChange={(e)=>setOutputLang(e.target.value)} className="border rounded px-2 py-1 text-sm">
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.nativeName} ({l.name})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Pasted post (required)</label>
          <textarea value={postText} onChange={(e)=>setPostText(e.target.value)} rows={6} className="w-full border rounded p-3" placeholder="Paste the full post text here…" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-gray-700">Your voice intent (required)</label>
            <div className="text-xs text-gray-500">{isRecording ? `Recording • ${duration}s` : 'Idle'}</div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded min-h-[80px] text-sm text-blue-900 whitespace-pre-wrap">{intent || 'Start recording to add your intent…'}</div>
          <div className="mt-2 flex gap-2">
            {!isRecording ? (
              <button disabled={postText.trim().length === 0} onClick={start} className={`px-3 py-2 text-white rounded ${postText.trim().length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>Start</button>
            ) : (
              <button onClick={stop} className="px-3 py-2 bg-red-600 text-white rounded">Stop</button>
            )}
            <button onClick={()=>{ setIntent(''); setDuration(0); }} className="px-3 py-2 border rounded">Clear</button>
          </div>
        </div>

        <div className="pt-2">
          <button disabled={!canGenerate} onClick={generate} className={`px-4 py-2 rounded text-white ${canGenerate ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}>Generate</button>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/90 rounded-xl shadow-xl px-6 py-5 flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-3"></div>
            <div className="text-sm text-gray-700">Generating…</div>
          </div>
        </div>
      )}

      {results && (
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Comment suggestions</h2>
            <ul className="space-y-3">
              {results.comments.map((s, i)=> (
                <li key={i} className="p-3 border rounded">
                  <div className="whitespace-pre-wrap text-gray-900 text-sm">{s.text}</div>
                  {s.rationale && <div className="mt-1 text-xs text-gray-500">Why: {s.rationale}</div>}
                  <div className="mt-2">
                    <button
                      onClick={async ()=>{ await navigator.clipboard.writeText(s.text); setCopiedIdx({type:'comment', idx:i}); setTimeout(()=>setCopiedIdx(null), 1200); }}
                      className="px-2 py-1 text-xs border rounded"
                    >
                      {copiedIdx?.type==='comment' && copiedIdx.idx===i ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Repost suggestions</h2>
            <ul className="space-y-3">
              {results.reposts.map((s, i)=> (
                <li key={i} className="p-3 border rounded">
                  <div className="whitespace-pre-wrap text-gray-900 text-sm">{s.text}</div>
                  {s.rationale && <div className="mt-1 text-xs text-gray-500">Why: {s.rationale}</div>}
                  <div className="mt-2">
                    <button
                      onClick={async ()=>{ await navigator.clipboard.writeText(s.text); setCopiedIdx({type:'repost', idx:i}); setTimeout(()=>setCopiedIdx(null), 1200); }}
                      className="px-2 py-1 text-xs border rounded"
                    >
                      {copiedIdx?.type==='repost' && copiedIdx.idx===i ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}


