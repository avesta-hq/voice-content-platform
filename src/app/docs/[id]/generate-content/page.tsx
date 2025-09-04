"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { DocumentService } from "@/lib/documentService";
import { UserService } from "@/lib/userService";

export default function GenerateContentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const docId = params?.id as string;
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const hasRunRef = useRef<boolean>(false);

  useEffect(() => {
    if (!UserService.isAuthenticated()) {
      router.replace("/");
      return;
    }

    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const run = async () => {
      try {
        setIsLoading(true);
        const document = await DocumentService.getDocumentWithSessions(docId);
        const combinedTranscript = document.sessions
          .sort((a, b) => a.sessionNumber - b.sessionNumber)
          .map((s) => s.transcript)
          .join(" ");

        const res = await fetch("/api/generate-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: combinedTranscript,
            inputLanguage: document.inputLanguage,
            outputLanguage: document.outputLanguage,
          }),
        });

        if (!res.ok) throw new Error(`Generate failed ${res.status}`);
        const content = await res.json();

        await DocumentService.saveGeneratedContent(docId, {
          blog: content.blogPost,
          linkedin: content.linkedinPost,
          twitter: content.twitterPost,
          podcast: content.podcastScript,
          inputLanguage: document.inputLanguage,
          outputLanguage: document.outputLanguage,
          twitterThread: content.twitterThread,
        });

        await fetch(`/api/userDocuments/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requiresRegeneration: false }),
        });

        router.replace(`/docs/${docId}/view-content`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    if (docId) run();
  }, [docId]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
            <div className="flex items-center justify-center mb-6">
              <div className="h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-6 w-1/3 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-11/12 bg-gray-200 rounded"></div>
                <div className="h-4 w-10/12 bg-gray-200 rounded"></div>
                <div className="h-4 w-9/12 bg-gray-200 rounded"></div>
              </div>
            </div>
            {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Finalizing…</h2>
            <p className="text-gray-600">Redirecting to view content.</p>
            {error && (
              <p className="text-red-600 mt-4">{error}</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
