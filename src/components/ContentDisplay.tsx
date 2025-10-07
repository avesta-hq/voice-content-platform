'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PlatformContent } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { 
  Copy, 
  CheckCircle2, 
  Home, 
  ChevronDown, 
  ChevronUp,
  Mic,
  Sparkles,
  AlertTriangle,
  FileText,
  MessageSquare,
  Twitter,
  Linkedin,
  Rss,
  Loader2,
  Play,
  Edit3,
  Zap,
  X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ContentDisplayProps {
  originalText: string;
  generatedContent: PlatformContent[];
  onBackToDashboard: () => void;
  documentId?: string;
  documentTitle?: string;
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
  
  // Headers: # Title, ## Subtitle, ### Section
  html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-3 pb-2 border-b border-current/20">$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-8 mb-4 pb-2 border-b-2 border-current/30">$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-6 pb-3 border-b-2 border-current/40">$1</h1>');
  
  // Bold: **text** (non-greedy, supports multiline)
  html = html.replace(/\*\*([\s\S]+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  
  // Italic: *text* (non-greedy, supports multiline)
  html = html.replace(/\*([\s\S]+?)\*/g, '<em class="italic">$1</em>');
  
  // Lists: - item or * item
  html = html.replace(/^[\-\*] (.+$)/gm, '<li class="ml-4 mb-1">• $1</li>');
  
  // Wrap consecutive list items in ul
  html = html.replace(/(<li[^>]*>.*<\/li>\s*)+/g, '<ul class="space-y-1 my-4">$&</ul>');
  
  // IMPORTANT: keep original newlines/spaces; selection copy container uses white-space: pre-wrap
  return html;
}

export default function ContentDisplay({ originalText, generatedContent, onBackToDashboard, documentId, documentTitle }: ContentDisplayProps) {
  const params = useParams();
  const docId = documentId || (params?.id as string);
  
  // Client-side only state to prevent hydration issues
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
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

  // State for dynamic content (needed before useMemo)
  const [podcastContent, setPodcastContent] = useState<string>('');
  const [blogContent, setBlogContent] = useState<string>('');

  // Define helper functions first before using them in useMemo
  const getOriginalForKey = (key: string) => {
    const tab = tabs.find(t => t.key === key);
    if (!tab) return '';
    
    // Check for dynamically loaded content first
    if (tab.label === 'Podcast Script' && podcastContent) {
      return podcastContent;
    }
    if (tab.label === 'Blog Post' && blogContent) {
      return blogContent;
    }
    
    // Fall back to original content
    return tab.content || '';
  };
  
  const getDisplayForKey = (key: string) => {
    if (editedByPlatform[key]) {
      return editedByPlatform[key];
    }
    if (refinedByPlatform[key]?.text) {
      return refinedByPlatform[key].text;
    }
    return getOriginalForKey(key);
  };

  // Memoize the display content to ensure proper re-rendering when refined content changes
  const displayContent = useMemo(() => {
    const content: { [key: string]: string } = {};
    tabs.forEach(tab => {
      content[tab.key] = getDisplayForKey(tab.key);
    });
    return content;
  }, [tabs, editedByPlatform, refinedByPlatform, podcastContent, blogContent]);

  // Sync active tab if content changes
  useEffect(() => {
    if (tabs.length && !tabs.find(t => t.key === activeTab)) {
      setActiveTab(tabs[0].key);
    }
  }, [tabs, activeTab]);

  const active = tabs.find(t => t.key === activeTab) || tabs[0];

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
      // Only run clipboard operations on client side
      if (typeof window === 'undefined') return;
      
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
  const podcastRequestedRef = React.useRef<boolean>(false);
  const lastPodcastDocIdRef = React.useRef<string | null>(null);

  // Lazy blog generation state
  const [blogLoading, setBlogLoading] = useState<boolean>(false);
  const [blogError, setBlogError] = useState<string>('');
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
        // Use the documentId from props/params
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
        // Use the documentId from props/params
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

  const openEditModal = (platformKey: string) => {
    setEditPlatformKey(platformKey);
    // Get current content for editing
    const currentContent = editedByPlatform[platformKey] || getDisplayForKey(platformKey);
    setEditText(currentContent);
    setIsEditOpen(true);
  };

  const openRefinementModal = (platformKey: string) => {
    openCommentModal(platformKey);
  };

  const closeCommentModal = () => {
    setIsModalOpen(false);
    setModalPlatformKey('');
    setModalComment('');
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditPlatformKey('');
    setEditText('');
    setEditError('');
  };

  const saveEditedContent = async () => {
    if (!editPlatformKey || !editText.trim() || !docId) return;
    
    setIsEditSaving(true);
    setEditError('');
    
    try {
      // Map platform key to the expected field names in the database
      const platformFieldMap: { [key: string]: string } = {
        'blog': 'blog',
        'linkedin': 'linkedin', 
        'twitter': 'twitter',
        'twitter-with-thread': 'twitterThread',
        'podcast': 'podcast'
      };
      
      const fieldName = platformFieldMap[editPlatformKey] || editPlatformKey;
      
      // Prepare the update payload for the server
      const updatePayload: { generatedContent: Record<string, string | string[]>; updatedAt: string } = {
        generatedContent: {},
        updatedAt: new Date().toISOString()
      };
      
      // Handle Twitter Thread specially - it should be stored as an array
      if (fieldName === 'twitterThread') {
        const threadParts = editText.trim().split('\n\n').filter(part => part.trim());
        updatePayload.generatedContent[fieldName] = threadParts;
      } else {
        updatePayload.generatedContent[fieldName] = editText.trim();
      }
      
      // Save the edited content to the server
      const response = await fetch(`/api/userDocuments/${docId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to save content: ${response.status}`);
      }
      
      // Update local state for immediate UI consistency
      setEditedByPlatform(prev => ({
        ...prev,
        [editPlatformKey]: editText.trim()
      }));
      
      closeEditModal();
    } catch (error) {
      console.error('Error saving edited content:', error);
      setEditError(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setIsEditSaving(false);
    }
  };

  const saveRefinedContent = async (platformKey: string) => {
    if (!refinedByPlatform[platformKey] || !docId) return;
    
    setIsSaving(prev => ({ ...prev, [platformKey]: true }));
    setErrorByPlatform(prev => ({ ...prev, [platformKey]: null }));
    
    try {
      const refinedContent = refinedByPlatform[platformKey];
      
      // Map platform key to the expected field names in the database
      const platformFieldMap: { [key: string]: string } = {
        'blog': 'blog',
        'linkedin': 'linkedin', 
        'twitter': 'twitter',
        'twitter-with-thread': 'twitterThread', // Twitter thread updates the twitterThread field
        'podcast': 'podcast'
      };
      
      const fieldName = platformFieldMap[platformKey] || platformKey;
      
      // Prepare the update payload for the server
      const updatePayload: { generatedContent: Record<string, string | string[]>; updatedAt: string } = {
        generatedContent: {},
        updatedAt: new Date().toISOString()
      };
      
      // Handle Twitter Thread specially - it should be stored as an array
      if (fieldName === 'twitterThread') {
        // Split the refined content by double newlines to recreate the thread array
        const threadParts = refinedContent.text.split('\n\n').filter(part => part.trim());
        updatePayload.generatedContent[fieldName] = threadParts;
      } else {
        updatePayload.generatedContent[fieldName] = refinedContent.text;
      }
      
      // Save the refined content to the server
      const response = await fetch(`/api/userDocuments/${docId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to save content: ${response.status}`);
      }
      
      // Mark as saved locally
      setRefinedSaved(prev => ({ ...prev, [platformKey]: true }));
      
      // Also update the local edited content for immediate UI consistency
      setEditedByPlatform(prev => ({
        ...prev,
        [platformKey]: refinedContent.text
      }));
      
    } catch (error) {
      console.error('Error saving refined content:', error);
      setErrorByPlatform(prev => ({ 
        ...prev, 
        [platformKey]: error instanceof Error ? error.message : 'Failed to save refined content'
      }));
    } finally {
      setIsSaving(prev => ({ ...prev, [platformKey]: false }));
    }
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

      // Use the documentId from props/params

      // Determine the current visible content for this tab
      const currentVisible = tab.label.toLowerCase().includes('thread') && twitterThread && twitterThread.length > 0
        ? twitterThread.join('\n\n')
        : getDisplayForKey(key);

      const res = await fetch('/api/refine-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId, platform: platformSlug, comment: modalComment.trim(), thread: tab.label.toLowerCase().includes('thread'), currentOutput: currentVisible })
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || `Refine failed ${res.status}`);
      }
      const data = await res.json();
      const refinedText = data.refined as string;

      // Replace any prior unsaved refinement for this platform
      setRefinedByPlatform(prev => ({
        ...prev,
        [key]: { text: refinedText, comment: modalComment.trim() }
      }));
      
      // Clear comment box to avoid stacking multiple commands
      setModalComment('');
      // Reset the saved state so user can save the new refinement
      setRefinedSaved(prev => ({ ...prev, [key]: false }));
      
      // Close modal after successful refinement
      closeCommentModal();
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
    // Also reset the saved state when resetting refinement
    setRefinedSaved(prev => ({ ...prev, [key]: false }));
  };

  // Helper function to get platform icons with branding
  const getPlatformIcon = (platform: string, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const platformLower = platform.toLowerCase();
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5', 
      lg: 'w-6 h-6'
    };
    
    if (platformLower.includes('twitter')) return <Twitter className={`${sizeClasses[size]} text-[#1DA1F2]`} />;
    if (platformLower.includes('linkedin')) return <Linkedin className={`${sizeClasses[size]} text-[#0A66C2]`} />;
    if (platformLower.includes('blog')) return <FileText className={`${sizeClasses[size]} text-[#FF6B35]`} />;
    if (platformLower.includes('podcast')) return <Play className={`${sizeClasses[size]} text-[#9146FF]`} />;
    return <MessageSquare className={`${sizeClasses[size]} text-primary`} />;
  };

  // Helper function to get platform branding colors
  const getPlatformBranding = (platform: string) => {
    const platformLower = platform.toLowerCase();
    
    // Check for Twitter Thread specifically
    if (platformLower.includes('twitter') && platformLower.includes('thread')) {
      return {
        primary: '#1DA1F2',
        secondary: '#E8F5FE',
        accent: '#1A91DA',
        name: 'Twitter Thread',
        shortName: 'Thread'
      };
    }
    // Regular Twitter
    if (platformLower.includes('twitter')) {
      return {
        primary: '#1DA1F2',
        secondary: '#E8F5FE',
        accent: '#1A91DA',
        name: 'Twitter',
        shortName: 'Twitter'
      };
    }
    if (platformLower.includes('linkedin')) {
      return {
        primary: '#0A66C2',
        secondary: '#E7F3FF',
        accent: '#004182',
        name: 'LinkedIn',
        shortName: 'LinkedIn'
      };
    }
    if (platformLower.includes('blog')) {
      return {
        primary: '#FF6B35',
        secondary: '#FFF4F1',
        accent: '#E55A2B',
        name: 'Blog',
        shortName: 'Blog'
      };
    }
    if (platformLower.includes('podcast')) {
      return {
        primary: '#9146FF',
        secondary: '#F4F0FF',
        accent: '#7C3AED',
        name: 'Podcast',
        shortName: 'Podcast'
      };
    }
    
    // Handle any long platform names by truncating intelligently
    const cleanName = platform.replace(/\s+/g, ' ').trim();
    const shortName = cleanName.length > 10 ? cleanName.substring(0, 8) + '...' : cleanName;
    
    return {
      primary: 'hsl(var(--primary))',
      secondary: 'hsl(var(--muted))',
      accent: 'hsl(var(--primary))',
      name: cleanName,
      shortName: shortName
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex justify-start">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={onBackToDashboard}
                  className="flex items-center gap-1 cursor-pointer hover:text-primary"
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">Content View</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Enhanced Header Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="text-left">
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  {documentTitle}
                </h1>
                <p className="text-muted-foreground text-lg">
                  Professional content optimized for each platform
                </p>
              </div>
      </div>
          </div>
      </div>

        {/* Ultra-Compact Original Voice Input Card */}
        <Card className="border-primary/20">
          <CardHeader className="py-3 px-4">
            <Button
              variant="ghost"
          onClick={() => setShowOriginal(v => !v)}
              className="w-full justify-between p-0 h-auto hover:bg-transparent"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                  <Mic className="w-3 h-3 text-primary-foreground" />
            </div>
                <div className="text-left">
                  <CardTitle className="text-base font-medium">Original Voice Input</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">View transcript</CardDescription>
          </div>
          </div>
              {showOriginal ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          </CardHeader>
          {showOriginal && (
            <CardContent className="pt-0 px-4 pb-4">
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {originalText}
                </p>
        </div>
            </CardContent>
          )}
        </Card>

        {/* Enhanced Platform Content Section */}
      <div className="space-y-6">
          {/* Ultra-Modern Platform Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="space-y-4 mb-6">
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold tracking-tight">Platform Content</h2>
                <p className="text-muted-foreground">
                  Choose a platform to view optimized content
                </p>
        </div>

              {/* Modern Full-Width Horizontal Tabs */}
              <div className="bg-muted/30 p-1 rounded-lg">
                <div className="flex justify-between">
                  {tabs.map(t => {
                    const branding = getPlatformBranding(t.label);
                    const isActive = t.key === activeTab;
                    return (
                      <Button
                key={t.key}
                        variant="ghost"
                onClick={() => setActiveTab(t.key)}
                        className={`flex-1 px-3 sm:px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-md transition-all duration-200 min-w-0 ${
                          isActive 
                            ? 'bg-background shadow-sm' 
                            : 'hover:bg-background/50'
                        }`}
                        style={{
                          color: isActive ? branding.primary : 'hsl(var(--muted-foreground))'
                        }}
                      >
                        <div 
                          className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center flex-shrink-0"
                        >
                          {getPlatformIcon(t.label, 'sm')}
                    </div>
                        <span className="font-medium text-xs sm:text-sm text-center leading-tight">
                          {branding.shortName}
                        </span>
                      </Button>
                    );
                  })}
                    </div>
                        </div>
                      </div>

            {/* Platform-Branded Tab Content */}
            {tabs.map(tab => {
              const branding = getPlatformBranding(tab.label);
              return (
                <TabsContent key={tab.key} value={tab.key} className="mt-0">
                  <Card 
                    className="overflow-hidden"
                    style={{
                      borderColor: branding.primary + '40'
                    }}
                  >
                    <CardHeader 
                      className="border-b py-4 sm:py-5"
                      style={{
                        background: `linear-gradient(135deg, ${branding.secondary} 0%, ${branding.secondary}80 100%)`
                      }}
                    >
                      <div className="px-4 sm:px-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
                              style={{ backgroundColor: branding.primary + '20' }}
                            >
                              {getPlatformIcon(tab.label, 'md')}
                            </div>
                            <div>
                              <CardTitle 
                                className="text-xl flex items-center gap-2"
                                style={{ color: branding.primary }}
                              >
                                {branding.name} Content
                              </CardTitle>
                              <CardDescription className="text-sm">
                                Optimized for {branding.name.toLowerCase()} audience and format
                              </CardDescription>
                            </div>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className="text-xs w-fit px-3 py-1"
                            style={{ 
                              backgroundColor: branding.primary + '20',
                              color: branding.accent
                            }}
                          >
                            Ready to publish
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {/* Content Display Area */}
                      <div className="p-4 sm:p-6 space-y-5">
                         <div 
                           className="relative overflow-hidden rounded-lg border min-h-[200px]"
                           style={{
                             backgroundColor: branding.secondary + '40',
                             borderColor: branding.primary + '30'
                           }}
                         >
                           {/* Decorative Header Accent */}
                           <div 
                             className="absolute top-0 left-0 right-0 h-1"
                             style={{ backgroundColor: branding.primary }}
                           />
                           
                           {/* Content Container */}
                           <div className="p-4 sm:p-5 md:p-6">
                             {/* Loading State for Podcast/Blog Generation */}
                             {((tab.label === 'Podcast Script' && podcastLoading) || 
                               (tab.label === 'Blog Post' && blogLoading)) ? (
                               <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                 <Loader2 
                                   className="w-8 h-8 animate-spin" 
                                   style={{ color: branding.primary }} 
                                 />
                                 <div className="text-center space-y-2">
                                   <p className="font-medium" style={{ color: branding.primary }}>
                                     Generating {tab.label === 'Podcast Script' ? 'Podcast' : 'Blog'} Content...
                                   </p>
                                   <p className="text-sm text-muted-foreground">
                                     AI is creating optimized content for {branding.name}
                                   </p>
                                 </div>
                               </div>
                             ) : (
                               <div 
                                 key={`${tab.key}-${refinedByPlatform[tab.key]?.text ? 'refined' : 'original'}-${editedByPlatform[tab.key] ? 'edited' : 'default'}`}
                                 className="prose prose-sm max-w-none leading-relaxed whitespace-pre-wrap"
                                 style={{ 
                                   color: 'hsl(var(--foreground))',
                                   '--tw-prose-headings': branding.primary,
                                   '--tw-prose-bold': branding.accent,
                                   '--tw-prose-links': branding.primary
                                 } as React.CSSProperties}
                                 dangerouslySetInnerHTML={{ __html: markdownToHtml(displayContent[tab.key] || getDisplayForKey(tab.key)) }}
                               />
                             )}
                          </div>
                           
                           {/* Content Stats Footer */}
                           {!((tab.label === 'Podcast Script' && podcastLoading) || 
                               (tab.label === 'Blog Post' && blogLoading)) && (
                             <div 
                               className="px-5 sm:px-6 py-3 border-t bg-background/50"
                               style={{ borderColor: branding.primary + '20' }}
                             >
                               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                                 <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                                   <span>{(displayContent[tab.key] || getDisplayForKey(tab.key)).split(' ').length} words</span>
                                   <span>{(displayContent[tab.key] || getDisplayForKey(tab.key)).length} characters</span>
                            </div>
                                 <div className="flex items-center gap-1">
                                   <CheckCircle2 className="w-3 h-3" style={{ color: branding.primary }} />
                                   <span style={{ color: branding.primary }} className="font-medium text-xs">
                                     Optimized for {branding.name}
                                   </span>
                            </div>
                          </div>
                        </div>
                           )}
                        </div>
                      </div>
                        
                        {/* Action Buttons */}
                        {!((tab.label === 'Podcast Script' && podcastLoading) || 
                            (tab.label === 'Blog Post' && blogLoading)) && (
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 px-3 sm:px-0 sm:ml-2 md:ml-4">
                            <Button
                              onClick={() => copyToClipboard(displayContent[tab.key] || getDisplayForKey(tab.key), tab.key)}
                              size="sm"
                              className="flex items-center justify-center gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2.5 h-10 w-auto sm:flex-none sm:min-w-[130px] font-medium"
                              style={{
                                backgroundColor: branding.primary,
                                color: 'white'
                              }}
                            >
                            {copiedStates[tab.key] ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">Copied!</span>
                            </>
                          ) : (
                            <>
                                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">Copy Content</span>
                            </>
                          )}
                          </Button>
                          
                          <Button
                            onClick={() => openEditModal(tab.key)}
                            variant="outline"
                            size="sm"
                            className="flex items-center justify-center gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2.5 h-10 w-auto sm:flex-none sm:min-w-[100px] font-medium transition-all duration-200 hover:shadow-md"
                            style={{
                              borderColor: branding.primary + '50',
                              color: branding.primary,
                              backgroundColor: 'transparent'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = branding.primary + '10';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">Edit</span>
                          </Button>
                          
                          <Button
                            onClick={() => openRefinementModal(tab.key)}
                            variant="outline"
                            size="sm"
                            className="flex items-center justify-center gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2.5 h-10 w-auto sm:flex-none sm:min-w-[130px] font-medium transition-all duration-200 hover:shadow-md"
                            style={{
                              borderColor: branding.primary + '50',
                              color: branding.primary,
                              backgroundColor: 'transparent'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = branding.primary + '10';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">Refine with AI</span>
                          </Button>

                          {/* Save New Content Button - Show when there's refined content that hasn't been saved */}
                          {refinedByPlatform[tab.key] && !refinedSaved[tab.key] && (
                            <Button
                              onClick={() => saveRefinedContent(tab.key)}
                              disabled={isSaving[tab.key]}
                              size="sm"
                              className="flex items-center justify-center gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2.5 h-10 w-auto sm:flex-none sm:min-w-[140px] font-medium transition-all duration-200"
                              style={{
                                backgroundColor: branding.accent || '#10B981',
                                color: 'white'
                              }}
                            >
                              {isSaving[tab.key] ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 animate-spin" />
                                  <span className="truncate">Saving...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="truncate">Save New Content</span>
                                </>
                              )}
                            </Button>
                          )}

                    </div>
                        )}

                        {/* Status Messages */}
                        {refinedSaved[tab.key] && (
                          <Alert className="border-green-200 bg-green-50 mx-0">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800 text-sm">
                              Refinement saved successfully!
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {errorByPlatform[tab.key] && (
                          <Alert variant="destructive" className="mx-0">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              {errorByPlatform[tab.key]}
                            </AlertDescription>
                          </Alert>
                        )}
                        {/* Podcast/Blog Generation Errors */}
                        {tab.label === 'Podcast Script' && podcastError && (
                          <Alert variant="destructive" className="mx-0">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              Failed to generate podcast content: {podcastError}
                            </AlertDescription>
                          </Alert>
                        )}
                        {tab.label === 'Blog Post' && blogError && (
                          <Alert variant="destructive" className="mx-0">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              Failed to generate blog content: {blogError}
                            </AlertDescription>
                          </Alert>
                        )}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
            </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={closeEditModal}>
        <DialogContent className="w-[95vw] max-w-4xl h-[90vh] sm:h-[80vh] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Edit3 className="h-4 w-4 sm:h-5 sm:w-5" />
              Edit Content
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <Label htmlFor="edit-content" className="text-sm font-medium">Content</Label>
              <Textarea
                id="edit-content"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[200px] sm:min-h-[300px] resize-none text-sm sm:text-base"
                placeholder="Edit your content here..."
              />
            </div>
            {editError && (
              <Alert variant="destructive" className="text-sm">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={closeEditModal} 
                disabled={isEditSaving}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={saveEditedContent} 
                disabled={isEditSaving || !editText.trim()}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {isEditSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refinement Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeCommentModal}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
              Refine with AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refinement-comment" className="text-sm font-medium">
                How would you like to refine this content?
              </Label>
              <Textarea
                id="refinement-comment"
                value={modalComment}
                onChange={(e) => setModalComment(e.target.value)}
                className="min-h-[80px] sm:min-h-[100px] resize-none text-sm sm:text-base"
                placeholder="E.g., 'Make it more professional', 'Add more technical details', 'Shorten it'..."
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={closeCommentModal} 
                disabled={isRefining[modalPlatformKey]}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={submitRefinement} 
                disabled={isRefining[modalPlatformKey] || !modalComment.trim()}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {isRefining[modalPlatformKey] ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Refining...
                  </>
                ) : (
                  'Refine Content'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
