'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PlatformContent } from '@/types';
import { DocumentService } from '@/lib/documentService';
import { Pencil } from 'lucide-react';

interface ContentDisplayProps {
  originalText: string;
  generatedContent: PlatformContent[];
  onBackToDashboard: () => void;
}

// Minimal, safe markdown -> HTML for bold/italic plus line breaks
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function markdownToHtml(markdown: string): string {
  // Escape first to avoid tag injection
  let html = escapeHtml(markdown);
  // Bold: **text** (non-greedy, supports multiline) without lookbehind or 's'
  html = html.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text* (non-greedy, supports multiline)
  html = html.replace(/\*([\s\S]+?)\*/g, '<em>$1</em>');
  // IMPORTANT: keep original newlines/spaces; selection copy container uses white-space: pre-wrap
  return html;
}

export default function ContentDisplay({ originalText, generatedContent, onBackToDashboard }: ContentDisplayProps) {
  // State to track which buttons have been clicked
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  // Accordion state for Original Voice Input (default collapsed)
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [originalMaxHeight, setOriginalMaxHeight] = useState<number>(0);
  const originalRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Measure content height for smooth animation
    if (originalRef.current) {
      const h = originalRef.current.scrollHeight;
      setOriginalMaxHeight(h);
    }
  }, [originalText, showOriginal]);

  // Refinement state per platform tab (ephemeral)
  const [refinedByPlatform, setRefinedByPlatform] = useState<{ [key: string]: { text: string; comment: string } }>({});
  const [isRefining, setIsRefining] = useState<{ [key: string]: boolean }>({});
  const [errorByPlatform, setErrorByPlatform] = useState<{ [key: string]: string | null }>({});
  const [isSaving, setIsSaving] = useState<{ [key: string]: boolean }>({});
  const [refinedSaved, setRefinedSaved] = useState<{ [key: string]: boolean }>({});
  // Edited content state per platform (persisted)
  const [editedByPlatform, setEditedByPlatform] = useState<{ [key: string]: string }>({});
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editPlatformKey, setEditPlatformKey] = useState<string>('');
  const [editText, setEditText] = useState<string>('');
  const [isEditSaving, setIsEditSaving] = useState<boolean>(false);
  const [editError, setEditError] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalPlatformKey, setModalPlatformKey] = useState<string>('');
  const [modalComment, setModalComment] = useState<string>('');

  // Tabs: only for Generated Content
  const tabs = useMemo(() => (
    generatedContent.map(gc => ({
      key: gc.platform.toLowerCase().replace(/\s+/g, '-'),
      label: gc.platform,
      content: gc.content,
    }))
  ), [generatedContent]);

  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.key || '');

  // Sync active tab if content changes
  useEffect(() => {
    if (tabs.length && !tabs.find(t => t.key === activeTab)) {
      setActiveTab(tabs[0].key);
    }
  }, [tabs, activeTab]);

  const active = tabs.find(t => t.key === activeTab) || tabs[0];

  const getOriginalForKey = (key: string) => tabs.find(t => t.key === key)?.content || '';
  const getDisplayForKey = (key: string) => {
    if (editedByPlatform[key]) return editedByPlatform[key];
    if (refinedByPlatform[key]?.text) return refinedByPlatform[key].text;
    return getOriginalForKey(key);
  };

  // Thread support for Twitter: check if thread exists in initial generatedContent
  const twitterThread: string[] | undefined = useMemo(() => {
    const twitter = generatedContent.find(gc => gc.platform === 'Twitter');
    return twitter?.twitterThread;
  }, [generatedContent]);

  const platformSlugForKey = (key: string): 'blog' | 'linkedin' | 'twitter' | 'podcast' => {
    const tab = tabs.find(t => t.key === key);
    const label = (tab?.label || '').toLowerCase();
    if (label.includes('blog')) return 'blog';
    if (label.includes('linkedin')) return 'linkedin';
    if (label.includes('twitter')) return 'twitter';
    return 'podcast';
  };

  const copyToClipboard = async (text: string, platformKey: string) => {
    try {
      const hasClipboard = typeof navigator !== 'undefined' && !!navigator.clipboard;
      const hasWrite = hasClipboard && typeof (navigator.clipboard as Clipboard).write === 'function';
      const hasClipboardItem = typeof window !== 'undefined' && 'ClipboardItem' in window;
      // 1) Try selection-based rich copy (widely accepted by editors like LinkedIn)
      const html = markdownToHtml(text);
      let copied = false;
      try {
        const container = document.createElement('div');
        container.setAttribute('contenteditable', 'true');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.whiteSpace = 'pre-wrap';
        container.innerHTML = html;
        document.body.appendChild(container);

        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(container);
          selection.removeAllRanges();
          selection.addRange(range);
          copied = document.execCommand('copy');
          selection.removeAllRanges();
        }
        document.body.removeChild(container);
      } catch {
        copied = false;
      }

      // 2) If selection copy failed, try ClipboardItem with HTML + plaintext
      if (!copied && hasWrite && hasClipboardItem) {
        try {
          // Wrap with pre-wrap style to preserve spaces/newlines on paste
          const wrapped = `<div style="white-space:pre-wrap">${html}</div>`;
          const htmlBlob = new Blob([wrapped], { type: 'text/html' });
          const textBlob = new Blob([text], { type: 'text/plain' });
          const ClipboardItemCtor = (window as unknown as { ClipboardItem: new (data: Record<string, Blob>) => ClipboardItem }).ClipboardItem;
          const item = new ClipboardItemCtor({ 'text/html': htmlBlob, 'text/plain': textBlob });
          await (navigator.clipboard as Clipboard).write([item]);
          copied = true;
        } catch {
          copied = false;
        }
      }

      // 3) Plain-text fallback (no Unicode styling to avoid font changes/char count issues)
      if (!copied) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedStates(prev => ({ ...prev, [platformKey]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [platformKey]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const downloadContent = (content: string, platform: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${platform}-content.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Platform-specific styling
  const getPlatformStyle = (platform: string) => {
    switch (platform) {
      case 'Blog Post':
        return {
          headerBg: 'from-blue-500 to-blue-600',
          headerIcon: '📝',
          borderColor: 'border-blue-200',
          shadowColor: 'shadow-blue-100'
        };
      case 'LinkedIn':
        return {
          headerBg: 'from-blue-600 to-blue-700',
          headerIcon: '💼',
          borderColor: 'border-blue-200',
          shadowColor: 'shadow-blue-100'
        };
      case 'Twitter':
        return {
          headerBg: 'from-sky-400 to-sky-500',
          headerIcon: '🐦',
          borderColor: 'border-sky-200',
          shadowColor: 'shadow-sky-100'
        };
      case 'Podcast Script':
        return {
          headerBg: 'from-purple-500 to-purple-600',
          headerIcon: '🎙️',
          borderColor: 'border-purple-200',
          shadowColor: 'shadow-purple-100'
        };
      default:
        return {
          headerBg: 'from-gray-500 to-gray-600',
          headerIcon: '📄',
          borderColor: 'border-gray-200',
          shadowColor: 'shadow-gray-100'
        };
    }
  };

  const selectedStyle = getPlatformStyle(active?.label || '');

  // Lazy podcast generation state
  const [podcastLoading, setPodcastLoading] = useState<boolean>(false);
  const [podcastError, setPodcastError] = useState<string>('');
  const [podcastContent, setPodcastContent] = useState<string>('');
  const podcastRequestedRef = React.useRef<boolean>(false);
  const lastPodcastDocIdRef = React.useRef<string | null>(null);

  // Lazy blog generation state
  const [blogLoading, setBlogLoading] = useState<boolean>(false);
  const [blogError, setBlogError] = useState<string>('');
  const [blogContent, setBlogContent] = useState<string>('');
  const blogRequestedRef = React.useRef<boolean>(false);
  const lastBlogDocIdRef = React.useRef<string | null>(null);
  const hasPodcast = useMemo(() => {
    const p = generatedContent.find(gc => gc.platform === 'Podcast Script');
    return !!(podcastContent && podcastContent.trim().length > 0) || !!(p && p.content && p.content.trim().length > 0);
  }, [generatedContent, podcastContent]);
  const hasBlog = useMemo(() => {
    const b = generatedContent.find(gc => gc.platform === 'Blog Post');
    return !!(blogContent && blogContent.trim().length > 0) || !!(b && b.content && b.content.trim().length > 0);
  }, [generatedContent, blogContent]);

  // When user opens Podcast tab and it's missing, generate on demand
  useEffect(() => {
    const isPodcastTab = active?.label === 'Podcast Script';
    if (!isPodcastTab || hasPodcast || podcastLoading || podcastRequestedRef.current) return;
    (async () => {
      try {
        setPodcastLoading(true);
        setPodcastError('');
        podcastRequestedRef.current = true;
        // Derive docId from URL
        const parts = window.location.pathname.split('/');
        const docId = parts[parts.indexOf('docs') + 1];
        if (lastPodcastDocIdRef.current === docId) {
          // Already requested for this document in this session
          setPodcastLoading(false);
          return;
        }
        lastPodcastDocIdRef.current = docId;
        const res = await fetch('/api/generate-podcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: docId })
        });
        if (!res.ok) {
          const j = await res.json().catch(() => null);
          throw new Error(j?.error || `Status ${res.status}`);
        }
        const data = await res.json();
        setPodcastContent(data.podcastScript || '');
        setPodcastLoading(false);
      } catch (e) {
        setPodcastError(e instanceof Error ? e.message : 'Failed to generate');
        setPodcastLoading(false);
        podcastRequestedRef.current = false; // allow retry on next activation
        lastPodcastDocIdRef.current = null;
      }
    })();
  }, [active, hasPodcast, podcastLoading, generatedContent]);

  // When user opens Blog tab and it's missing, generate on demand
  useEffect(() => {
    const isBlogTab = active?.label === 'Blog Post';
    if (!isBlogTab || hasBlog || blogLoading || blogRequestedRef.current) return;
    (async () => {
      try {
        setBlogLoading(true);
        setBlogError('');
        blogRequestedRef.current = true;
        const parts = window.location.pathname.split('/');
        const docId = parts[parts.indexOf('docs') + 1];
        if (lastBlogDocIdRef.current === docId) {
          setBlogLoading(false);
          return;
        }
        lastBlogDocIdRef.current = docId;
        const res = await fetch('/api/generate-blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: docId })
        });
        if (!res.ok) {
          const j = await res.json().catch(() => null);
          throw new Error(j?.error || `Status ${res.status}`);
        }
        const data = await res.json();
        setBlogContent(data.blogPost || '');
        setBlogLoading(false);
      } catch (e) {
        setBlogError(e instanceof Error ? e.message : 'Failed to generate');
        setBlogLoading(false);
        blogRequestedRef.current = false;
        lastBlogDocIdRef.current = null;
      }
    })();
  }, [active, hasBlog, blogLoading, generatedContent]);

  const openCommentModal = (platformKey: string) => {
    setModalPlatformKey(platformKey);
    setModalComment(refinedByPlatform[platformKey]?.comment || '');
    setIsModalOpen(true);
  };

  const closeCommentModal = () => {
    setIsModalOpen(false);
    setModalPlatformKey('');
    setModalComment('');
  };

  const submitRefinement = async () => {
    const key = modalPlatformKey;
    if (!key || !modalComment.trim()) return;

    setIsRefining(prev => ({ ...prev, [key]: true }));
    setErrorByPlatform(prev => ({ ...prev, [key]: null }));
    try {
      // Map key back to platform slug
      const tab = tabs.find(t => t.key === key);
      if (!tab) throw new Error('Invalid platform');
      const platformSlug = tab.label.toLowerCase().includes('blog') ? 'blog'
        : tab.label.toLowerCase().includes('linkedin') ? 'linkedin'
        : tab.label.toLowerCase().includes('twitter') ? 'twitter'
        : 'podcast';

      // Need documentId: embed via dataset on body or window? We'll fetch from URL
      const urlParts = window.location.pathname.split('/');
      const docId = urlParts[urlParts.indexOf('docs') + 1];

      const res = await fetch('/api/refine-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId, platform: platformSlug, comment: modalComment.trim() })
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || `Refine failed ${res.status}`);
      }
      const data = await res.json();
      const refinedText = data.refined as string;

      setRefinedByPlatform(prev => ({ ...prev, [key]: { text: refinedText, comment: modalComment.trim() } }));
      setIsModalOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setErrorByPlatform(prev => ({ ...prev, [modalPlatformKey]: msg }));
    } finally {
      setIsRefining(prev => ({ ...prev, [modalPlatformKey]: false }));
    }
  };

  const resetRefinement = (key: string) => {
    setRefinedByPlatform(prev => {
      const clone: Record<string, { text: string; comment: string }> = { ...prev };
      delete clone[key];
      return clone;
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mb-6 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
          Content Generation Complete! 🎉
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Your voice has been magically transformed into multiple professional content formats while preserving your original message.
        </p>
      </div>

      {/* Back to Dashboard hyperlink */}
      <div className="mb-4">
        <button
          onClick={onBackToDashboard}
          className="text-indigo-600 hover:text-indigo-700 underline font-medium inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="mb-8">
        <button
          type="button"
          onClick={() => setShowOriginal(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
          aria-expanded={showOriginal}
          aria-controls="original-voice-content"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Original Voice Input</h3>
          </div>
          <svg className={`w-5 h-5 text-gray-500 transition-transform ${showOriginal ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div
          id="original-voice-content"
          className="mt-3 overflow-hidden border-2 border-orange-200 rounded-xl shadow-lg bg-gradient-to-r from-orange-50 to-red-50 transition-all duration-300 ease-out"
          style={{ maxHeight: showOriginal ? originalMaxHeight : 0, opacity: showOriginal ? 1 : 0 }}
        >
          <div ref={originalRef} className="p-6">
            <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">{originalText}</p>
          </div>
        </div>
      </div>

      {/* Generated Content - Tabbed */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">✨ Generated Content</h3>
          <p className="text-gray-600">Switch between platforms using the tabs below</p>
        </div>

        {/* Tabs */}
        <div className="w-full overflow-x-auto">
          <div role="tablist" aria-label="Generated content tabs" className="inline-flex min-w-full md:min-w-0 gap-2 border-b border-gray-200 pb-2">
            {tabs.map(t => (
              <button
                key={t.key}
                role="tab"
                aria-selected={t.key === activeTab}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-t-md whitespace-nowrap font-medium transition-colors ${
                  t.key === activeTab
                    ? 'bg-white text-blue-700 border border-gray-200 border-b-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Content Card */}
        {active && (
          <div className="group">
            <div className={`border-2 ${selectedStyle.borderColor} rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300`}>
              {/* Platform Header */}
              <div className={`bg-gradient-to-r ${selectedStyle.headerBg} px-6 py-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{selectedStyle.headerIcon}</span>
                    <h4 className="text-xl font-bold capitalize">{active.label}</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    {refinedByPlatform[active.key] && !editedByPlatform[active.key] ? (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded">Refined{refinedSaved[active.key] ? ' • Saved' : ''}</span>
                    ) : null}
                    <button
                      onClick={() => openCommentModal(active.key)}
                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-md text-sm font-semibold"
                    >
                      Refine this output
                    </button>
                    <button
                      onClick={() => {
                        setEditPlatformKey(active.key);
                        setEditError('');
                        // Seed edit text: prefer edited > refined (unsaved) > original
                        setEditText(getDisplayForKey(active.key));
                        setIsEditOpen(true);
                      }}
                      className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-md"
                      title="Edit content"
                      aria-label="Edit content"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-6 bg-white">
                {/* Twitter thread rendering */}
                {active.label === 'Twitter' && twitterThread && twitterThread.length > 1 ? (
                  <div className="mb-6 space-y-3">
                    {twitterThread.map((tweet, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
                          <span>Tweet {idx + 1}</span>
                          <span>{tweet.length}/280</span>
                        </div>
                        <pre className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base font-medium">{tweet}</pre>
                      </div>
                    ))}
                  </div>
                ) : active.label === 'Twitter with thread' && twitterThread && twitterThread.length > 0 ? (
                  <div className="mb-6 space-y-3">
                    {twitterThread.map((tweet, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
                          <span>Tweet {idx + 1}</span>
                          <span>{tweet.length}/280</span>
                        </div>
                        <pre className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base font-medium">{tweet}</pre>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Podcast lazy generation states */}
                {active.label === 'Podcast Script' && podcastLoading && (
                  <div
                    className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-lg mb-6"
                    role="status"
                    aria-live="polite"
                    aria-busy="true"
                  >
                    <div className="flex items-center justify-center mb-4">
                      <div className="h-10 w-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" aria-label="Loading"></div>
                    </div>
                    <p className="text-center text-sm text-gray-600 mb-6">Generating your podcast script… this may take ~20–40s.</p>

                    {/* Simple waveform bars */}
                    <div className="flex items-end justify-center gap-1 h-16 mb-6">
                      <div className="w-2 bg-purple-200 rounded animate-pulse" style={{ height: '40%' }}></div>
                      <div className="w-2 bg-purple-300 rounded animate-pulse" style={{ height: '70%' }}></div>
                      <div className="w-2 bg-purple-400 rounded animate-pulse" style={{ height: '90%' }}></div>
                      <div className="w-2 bg-purple-300 rounded animate-pulse" style={{ height: '65%' }}></div>
                      <div className="w-2 bg-purple-200 rounded animate-pulse" style={{ height: '45%' }}></div>
                    </div>

                    <div className="space-y-5">
                      <div className="animate-pulse">
                        <div className="h-5 w-40 bg-gray-200 rounded mb-3"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-gray-200 rounded"></div>
                          <div className="h-4 w-11/12 bg-gray-200 rounded"></div>
                          <div className="h-4 w-10/12 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                      <div className="animate-pulse">
                        <div className="h-5 w-44 bg-gray-200 rounded mb-3"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-gray-200 rounded"></div>
                          <div className="h-4 w-11/12 bg-gray-200 rounded"></div>
                          <div className="h-4 w-9/12 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                      <div className="animate-pulse">
                        <div className="h-5 w-36 bg-gray-200 rounded mb-3"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-10/12 bg-gray-200 rounded"></div>
                          <div className="h-4 w-8/12 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {active.label === 'Podcast Script' && podcastError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center justify-between gap-3">
                    <span>{podcastError}</span>
                    <button
                      onClick={async () => {
                        try {
                          setPodcastError('');
                          setPodcastLoading(true);
                          const parts = window.location.pathname.split('/');
                          const docId = parts[parts.indexOf('docs') + 1];
                          const res = await fetch('/api/generate-podcast', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ documentId: docId })
                          });
                          if (!res.ok) {
                            const j = await res.json().catch(() => null);
                            throw new Error(j?.error || `Status ${res.status}`);
                          }
                          const data = await res.json();
                          setPodcastContent(data.podcastScript || '');
                        } catch (e) {
                          setPodcastError(e instanceof Error ? e.message : 'Failed to generate');
                        } finally {
                          setPodcastLoading(false);
                        }
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Blog lazy generation states */}
                {active.label === 'Blog Post' && blogLoading && (
                  <div
                    className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-lg mb-6"
                    role="status"
                    aria-live="polite"
                    aria-busy="true"
                  >
                    <div className="flex items-center justify-center mb-4">
                      <div className="h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" aria-label="Loading"></div>
                    </div>
                    <p className="text-center text-sm text-gray-600 mb-6">Crafting your long-form blog post… this can take ~30–60s.</p>

                    <div className="animate-pulse">
                      {/* Title */}
                      <div className="h-8 w-2/3 bg-gray-200 rounded mb-3"></div>
                      {/* Metadata */}
                      <div className="flex items-center gap-2 mb-6">
                        <div className="h-4 w-20 bg-gray-200 rounded"></div>
                        <div className="h-4 w-16 bg-gray-200 rounded"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                      </div>
                      {/* Paragraphs */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-gray-200 rounded"></div>
                          <div className="h-4 w-11/12 bg-gray-200 rounded"></div>
                          <div className="h-4 w-10/12 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-6 w-40 bg-gray-200 rounded mt-6"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-gray-200 rounded"></div>
                          <div className="h-4 w-10/12 bg-gray-200 rounded"></div>
                          <div className="h-4 w-9/12 bg-gray-200 rounded"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-gray-200 rounded"></div>
                          <div className="h-4 w-11/12 bg-gray-200 rounded"></div>
                          <div className="h-4 w-8/12 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {active.label === 'Blog Post' && blogError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center justify-between gap-3">
                    <span>{blogError}</span>
                    <button
                      onClick={async () => {
                        try {
                          setBlogError('');
                          setBlogLoading(true);
                          const parts = window.location.pathname.split('/');
                          const docId = parts[parts.indexOf('docs') + 1];
                          const res = await fetch('/api/generate-blog', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ documentId: docId })
                          });
                          if (!res.ok) {
                            const j = await res.json().catch(() => null);
                            throw new Error(j?.error || `Status ${res.status}`);
                          }
                          const data = await res.json();
                          setBlogContent(data.blogPost || '');
                        } catch (e) {
                          setBlogError(e instanceof Error ? e.message : 'Failed to generate');
                        } finally {
                          setBlogLoading(false);
                        }
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* When refined exists: show split view; else show only original */}
                {active.label !== 'Twitter' && active.label !== 'Twitter with thread' && refinedByPlatform[active.key] && !editedByPlatform[active.key] ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    <div className="flex flex-col h-full">
                      <div className="text-sm text-gray-500 mb-2">Original</div>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex-1">
                        <pre className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base font-medium">
                          {getOriginalForKey(active.key)}
                        </pre>
                      </div>
                    </div>
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-gray-500">Refined</div>
                        {/* Reset to original temporarily disabled */}
                        {false && (
                          <button
                            onClick={() => resetRefinement(active.key)}
                            className="text-sm text-blue-600 hover:text-blue-700 underline"
                          >
                            Reset to original
                          </button>
                        )}
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 min-h-[120px] flex-1">
                        <pre className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base font-medium">{refinedByPlatform[active.key]?.text}</pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-gray-500 mb-2">Original</div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <pre className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base font-medium">
                        {active.label === 'Podcast Script' && podcastContent ? podcastContent : active.label === 'Blog Post' && blogContent ? blogContent : getDisplayForKey(active.key)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Action Row: left (Copy/Download), right (Save new content) */}
                <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => copyToClipboard(getDisplayForKey(active.key), active.key)}
                      className={`px-6 py-3 rounded-xl transition-all duration-300 font-semibold flex items-center space-x-2 ${
                        copiedStates[active.key]
                          ? 'bg-green-500 text-white cursor-default shadow-lg'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg transform hover:scale-105'
                      }`}
                      disabled={copiedStates[active.key]}
                    >
                      {copiedStates[active.key] ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copy Content</span>
                        </>
                      )}
                    </button>

                    {/* Copy using Unicode bold button disabled; default copy now uses this approach */}
                    {false && (
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(getDisplayForKey(active.key));
                            setCopiedStates(prev => ({ ...prev, [active.key]: true }));
                            setTimeout(() => setCopiedStates(prev => ({ ...prev, [active.key]: false })), 2000);
                          } catch (e) {
                            console.error('Styled copy failed', e);
                          }
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl hover:from-violet-600 hover:to-violet-700 hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold flex items-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6" />
                        </svg>
                        <span>Copy with styling</span>
                      </button>
                    )}

                    <button
                      onClick={() => downloadContent(getDisplayForKey(active.key), active.label)}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download</span>
                    </button>
                  </div>

                  {refinedByPlatform[active.key] && !refinedSaved[active.key] && (
                    <div className="md:ml-auto">
                      <button
                        onClick={async () => {
                          const key = active.key;
                          const refined = refinedByPlatform[key]?.text;
                          if (!refined) return;
                          setIsSaving(prev => ({ ...prev, [key]: true }));
                          try {
                            const urlParts = window.location.pathname.split('/');
                            const docId = urlParts[urlParts.indexOf('docs') + 1];
                            const platform = platformSlugForKey(key);
                            await DocumentService.updateGeneratedPlatform(docId, platform, refined);
                            setRefinedSaved(prev => ({ ...prev, [key]: true }));
                          } catch (e) {
                            console.error(e);
                            alert('Failed to save new content. Please try again.');
                          } finally {
                            setIsSaving(prev => ({ ...prev, [key]: false }));
                          }
                        }}
                        disabled={isSaving[active.key]}
                        className={`px-4 py-2 rounded-md text-sm font-semibold ${isSaving[active.key] ? 'bg-emerald-300 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                      >
                        {isSaving[active.key] ? 'Saving…' : 'Save new content'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline error */}
                {errorByPlatform[active.key] && (
                  <div className="mt-4 text-red-600 text-sm">{errorByPlatform[active.key]}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4">
            <div className="px-5 py-4 border-b border-gray-200">
              <h4 className="text-lg font-semibold">Add comment for {tabs.find(t => t.key === modalPlatformKey)?.label}</h4>
            </div>
            <div className="p-5">
              <label className="block text-sm text-gray-600 mb-2">Tell us how to refine (e.g., &quot;summarize to 2 lines&quot;, &quot;more concise&quot;, &quot;bullet points&quot;)</label>
              <textarea
                value={modalComment}
                onChange={(e) => setModalComment(e.target.value)}
                placeholder="Your instruction..."
                rows={5}
                maxLength={500}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="px-5 pb-5 flex items-center justify-end gap-3">
              <button
                onClick={closeCommentModal}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={submitRefinement}
                disabled={isRefining[modalPlatformKey] || !modalComment.trim()}
                className={`px-4 py-2 rounded-md text-white ${isRefining[modalPlatformKey] ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-60`}
              >
                {isRefining[modalPlatformKey] ? 'Generating…' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Content Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-lg font-semibold">Edit {tabs.find(t => t.key === editPlatformKey)?.label} content</h4>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-5">
              {editError && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{editError}</div>}
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={14}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="px-5 pb-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    setIsEditSaving(true);
                    setEditError('');
                    const key = editPlatformKey;
                    const platform = platformSlugForKey(key);
                    const urlParts = window.location.pathname.split('/');
                    const docId = urlParts[urlParts.indexOf('docs') + 1];
                    await DocumentService.updateGeneratedPlatform(docId, platform, editText.trim());
                    setEditedByPlatform(prev => ({ ...prev, [key]: editText.trim() }));
                    setIsEditOpen(false);
                  } catch (e) {
                    setEditError(e instanceof Error ? e.message : 'Failed to save');
                  } finally {
                    setIsEditSaving(false);
                  }
                }}
                disabled={isEditSaving || !editText.trim()}
                className={`px-4 py-2 rounded-md text-white ${isEditSaving ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-60`}
              >
                {isEditSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center mt-8 mb-12">
        <button
          onClick={onBackToDashboard}
          className="px-10 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold text-lg flex items-center space-x-3"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </button>
      </div>
    </div>
  );
}
