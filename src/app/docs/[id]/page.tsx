"use client";
import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DocumentEditor from "@/components/DocumentEditor";
import { UserService } from "@/lib/userService";

export default function DocDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const docId = params?.id as string;

  useEffect(() => {
    if (!UserService.isAuthenticated()) {
      router.replace("/");
    }
  }, [router]);

  if (!UserService.isAuthenticated()) return null;
  if (!docId) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <DocumentEditor
          documentId={docId}
          onBackToDashboard={() => router.push("/docs")}
          onGenerateContent={(id) => router.push(`/docs/${id}/generate-content`)}
          onViewContent={(id) => router.push(`/docs/${id}/view-content`)}
        />
      </div>
    </main>
  );
}
