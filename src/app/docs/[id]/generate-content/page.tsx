"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { DocumentService } from "@/lib/documentService";
import { UserService } from "@/lib/userService";
import ContentProcessor from "@/components/ContentProcessor";

export default function GenerateContentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const docId = params?.id as string;
  const [error, setError] = useState<string>("");
  const [document, setDocument] = useState<any>(null);
  const hasRunRef = useRef<boolean>(false);

  // Move handleProcessingComplete outside useEffect so it's accessible
  const handleProcessingComplete = async (content: any[]) => {
    try {
      // Convert ContentProcessor format to expected format
      const twitterContent = content.find((c: any) => c.platform === 'Twitter')?.content || '';
      const twitterThreadContent = content.find((c: any) => c.platform === 'Twitter with Thread')?.content || '';
      
      // Extract Twitter thread from the thread content if it contains numbered tweets
      let twitterThread: string[] = [];
      if (twitterThreadContent && (twitterThreadContent.includes('Thread 🧵') || twitterThreadContent.includes('/'))) {
        // Split by numbered tweets (1/, 2/, 3/, etc.) and clean up
        const threadParts = twitterThreadContent.split(/\n*\d+\/\s*/).filter(part => part.trim());
        if (threadParts.length > 1) {
          // Remove the "Thread 🧵" prefix if it exists
          twitterThread = threadParts.map(part => part.replace(/^Thread 🧵\s*/, '').trim()).filter(Boolean);
        }
      }
      
      const formattedContent = {
        blog: content.find((c: any) => c.platform === 'Blog Post')?.content || '',
        linkedin: content.find((c: any) => c.platform === 'LinkedIn')?.content || '',
        twitter: twitterContent,
        podcast: content.find((c: any) => c.platform === 'Podcast Script')?.content || '',
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
    // Build combined transcript
    const combinedTranscript = document.sessions
      .sort((a: any, b: any) => a.sessionNumber - b.sessionNumber)
      .map((s: any, idx: number) => {
        const indexLabel = `${idx + 1}.`;
        const title = (s.title && s.title.trim()) || `Section ${idx + 1}`;
        const raw = (s.transcript || '').trim();
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
