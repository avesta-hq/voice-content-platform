"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import ContentDisplay from "@/components/ContentDisplay";
import { DocumentService } from "@/lib/documentService";
import { UserService } from "@/lib/userService";
import { PlatformContent } from "@/types";
import { ContentDisplaySkeleton } from "@/components/ui/loading-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Zap } from "lucide-react";

export default function ViewContentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const docId = params?.id as string;
  const [originalText, setOriginalText] = useState("");
  const [content, setContent] = useState<PlatformContent[] | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const hasLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!UserService.isAuthenticated()) {
      router.replace("/");
      return;
    }

    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const run = async () => {
      try {
        setIsLoading(true);
        const doc = await DocumentService.getDocumentWithSessions(docId);
        const combined = doc.sessions
          .sort((a, b) => a.sessionNumber - b.sessionNumber)
          .map((s, idx) => {
            const indexLabel = `${idx + 1}.`;
            const title = (s.title && s.title.trim()) || `Section ${idx + 1}`;
            const raw = (s.transcript || '').trim();
            const chunks = raw.split(/\n{2,}/);
            const description = chunks[0] || '';
            const rest = chunks.slice(1).join('\n');
            const bullets = rest ? rest.split(/\n+/).filter(Boolean) : [];
            const bulletText = bullets.length ? bullets.map((b) => `- ${b}`).join('\n') : '';
            return [
              `${indexLabel} ${title}`,
              description,
              bulletText
            ].filter(Boolean).join('\n');
          })
          .join("\n\n");
        setOriginalText(combined);

        if (doc.generatedContent) {
          const items: PlatformContent[] = [
            { platform: "LinkedIn", content: doc.generatedContent.linkedin, formatted: true },
            { platform: "Twitter", content: doc.generatedContent.twitter, formatted: true },
            { platform: "Podcast Script", content: doc.generatedContent.podcast, formatted: true },
            { platform: "Blog Post", content: doc.generatedContent.blog, formatted: true },
          ];
          if (doc.generatedContent.twitterThread && doc.generatedContent.twitterThread.length > 0) {
            items.splice(2, 0, { platform: "Twitter with thread", content: doc.generatedContent.twitterThread.join("\n\n"), formatted: true, twitterThread: doc.generatedContent.twitterThread });
          }
          setContent(items);
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
  }, [docId]);

  if (!UserService.isAuthenticated()) return null;

  // Loading skeleton UI
  if (isLoading) {
    return <ContentDisplaySkeleton />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8">
      <div className="container mx-auto px-4">
        {!content ? (
          <div className="max-w-2xl mx-auto">
            <Card className="text-center">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl">No Saved Content</CardTitle>
                <CardDescription>
                  Generate content for this document to view it here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => router.replace(`/docs/${docId}/generate-content`)}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <Zap className="h-4 w-4" />
                  Generate Content
                </Button>
                {error && (
                  <Alert className="border-destructive bg-destructive/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-destructive">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
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
