"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { DocumentService } from "@/lib/documentService";
import { UserService } from "@/lib/userService";
import ContentProcessor from "@/components/ContentProcessor";
import { Document } from "@/types";

interface ContentItem {
  platform: string;
  content: string;
}

export default function GenerateContentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const docId = params?.id as string;
  const [error, setError] = useState<string>("");
  const [document, setDocument] = useState<Document | null>(null);
  const hasRunRef = useRef<boolean>(false);

  // Move handleProcessingComplete outside useEffect so it's accessible
  const handleProcessingComplete = async (content: ContentItem[]) => {
    try {
      // Convert ContentProcessor format to expected format
      const twitterContent = content.find((c: ContentItem) => c.platform === 'Twitter')?.content || '';
      const twitterThreadContent = content.find((c: ContentItem) => c.platform === 'Twitter with Thread')?.content || '';
      
      // Extract Twitter thread from the thread content if it contains numbered tweets or double newlines
      let twitterThread: string[] = [];
      if (twitterThreadContent) {
        // First try to split by double newlines (our new format)
        const threadParts = twitterThreadContent.split('\n\n').filter((part: string) => part.trim());
        if (threadParts.length > 1) {
          twitterThread = threadParts.map((part: string) => part.trim()).filter(Boolean);
        } else if (twitterThreadContent.includes('Thread 🧵') || twitterThreadContent.includes('/')) {
          // Fallback: Split by numbered tweets (1/, 2/, 3/, etc.) and clean up
          const numberedParts = twitterThreadContent.split(/\n*\d+\/\s*/).filter((part: string) => part.trim());
          if (numberedParts.length > 1) {
            // Remove the "Thread 🧵" prefix if it exists
            twitterThread = numberedParts.map((part: string) => part.replace(/^Thread 🧵\s*/, '').trim()).filter(Boolean);
          }
        }
      }
      
      const formattedContent = {
        blog: content.find((c: ContentItem) => c.platform === 'Blog Post')?.content || '',
        linkedin: content.find((c: ContentItem) => c.platform === 'LinkedIn')?.content || '',
        twitter: twitterContent,
        podcast: content.find((c: ContentItem) => c.platform === 'Podcast Script')?.content || '',
        inputLanguage: document?.inputLanguage || 'en',
        outputLanguage: document?.outputLanguage || 'en',
        twitterThread: twitterThread.length > 0 ? twitterThread : [],
      };

      await DocumentService.saveGeneratedContent(docId, formattedContent);

      await fetch(`/api/userDocuments/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requiresRegeneration: false }),
      });

      router.replace(`/docs/${docId}/view-content`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  useEffect(() => {
    if (!UserService.isAuthenticated()) {
      router.replace("/");
      return;
    }

    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const run = async () => {
      try {
        const doc = await DocumentService.getDocumentWithSessions(docId);
        setDocument(doc);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    };

    if (docId) run();
  }, [docId, router]);

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto p-6 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (document) {
    // Helper function to strip HTML but preserve emojis and text
    const stripHtmlKeepEmojis = (html: string): string => {
      return html
        .replace(/<br\s*\/?>/gi, '\n')           // Convert <br> to newlines
        .replace(/<\/p>/gi, '\n')                // Convert </p> to newlines
        .replace(/<\/li>/gi, '\n')               // Convert </li> to newlines
        .replace(/<\/h[1-6]>/gi, '\n')           // Convert heading ends to newlines
        .replace(/<[^>]*>/g, '')                 // Remove all other HTML tags
        .replace(/&nbsp;/g, ' ')                 // Convert &nbsp; to space
        .replace(/&amp;/g, '&')                  // Convert &amp; to &
        .replace(/&lt;/g, '<')                   // Convert &lt; to <
        .replace(/&gt;/g, '>')                   // Convert &gt; to >
        .replace(/&quot;/g, '"')                 // Convert &quot; to "
        .replace(/&#39;/g, "'")                  // Convert &#39; to '
        .replace(/\n\s*\n\s*\n/g, '\n\n')        // Normalize multiple newlines to double
        .replace(/[ \t]+/g, ' ')                 // Normalize spaces/tabs to single space
        .trim();
    };

    // Build combined transcript with emoji support
    const combinedTranscript = document.sessions
      .sort((a: { sessionNumber: number }, b: { sessionNumber: number }) => a.sessionNumber - b.sessionNumber)
      .map((s: { title?: string; transcript: string; richContent?: string }, idx: number) => {
        const indexLabel = `${idx + 1}.`;
        const title = (s.title && s.title.trim()) || `Section ${idx + 1}`;
        
        // Use richContent if available (has emojis!), otherwise fall back to plain transcript
        const raw = s.richContent 
          ? stripHtmlKeepEmojis(s.richContent)  // Extract text + emojis from HTML
          : (s.transcript || '').trim();         // Fallback to plain text
        
        const chunks = raw.split(/\n{2,}/);
        const description = chunks[0] || '';
        const rest = chunks.slice(1).join('\n');
        const bullets = rest ? rest.split(/\n+/).filter(Boolean) : [];
        const bulletText = bullets.length ? bullets.map((b: string) => `- ${b}`).join('\n') : '';
        return [
          `${indexLabel} ${title}`,
          description,
          bulletText
        ].filter(Boolean).join('\n');
      })
      .join("\n\n");

    return (
      <ContentProcessor
        originalText={combinedTranscript}
        languageSettings={{
          inputLanguage: document.inputLanguage,
          outputLanguage: document.outputLanguage,
        }}
        onProcessingComplete={handleProcessingComplete}
      />
    );
  }

  return null;
}
