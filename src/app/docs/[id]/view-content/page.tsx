"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ContentDisplay from "@/components/ContentDisplay";
import { DocumentService } from "@/lib/documentService";
import { UserService } from "@/lib/userService";
import { PlatformContent } from "@/types";

export default function ViewContentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const docId = params?.id as string;
  const [originalText, setOriginalText] = useState("");
  const [content, setContent] = useState<PlatformContent[] | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!UserService.isAuthenticated()) {
      router.replace("/");
      return;
    }

    const run = async () => {
      try {
        setIsLoading(true);
        const doc = await DocumentService.getDocumentWithSessions(docId);
        const combined = doc.sessions
          .sort((a, b) => a.sessionNumber - b.sessionNumber)
          .map((s) => s.transcript)
          .join(" ");
        setOriginalText(combined);

        if (doc.generatedContent) {
          setContent([
            { platform: "Blog Post", content: doc.generatedContent.blog, formatted: true },
            { platform: "LinkedIn", content: doc.generatedContent.linkedin, formatted: true },
            { platform: "Twitter", content: doc.generatedContent.twitter, formatted: true },
            { platform: "Podcast Script", content: doc.generatedContent.podcast, formatted: true },
          ]);
        } else {
          setContent(null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    if (docId) run();
  }, [docId, router]);

  if (!UserService.isAuthenticated()) return null;

  // Loading skeleton UI
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4">
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
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        {!content ? (
          <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Saved Content</h2>
            <p className="text-gray-600 mb-4">Generate content for this document to view it here.</p>
            <button
              onClick={() => router.replace(`/docs/${docId}/generate-content`)}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Generate Content
            </button>
            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>
        ) : (
          <ContentDisplay
            originalText={originalText}
            generatedContent={content}
            onBackToDashboard={() => router.push("/docs")}
          />
        )}
      </div>
    </main>
  );
}
