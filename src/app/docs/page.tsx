"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import DocumentDashboard from "@/components/DocumentDashboard";
import { UserService } from "@/lib/userService";

export default function DocsPage() {
  const router = useRouter();

  useEffect(() => {
    if (!UserService.isAuthenticated()) {
      router.replace("/");
    }
  }, [router]);

  if (!UserService.isAuthenticated()) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <DocumentDashboard
          onCreateNew={() => router.push("/docs/add")}
          onEditDocument={(id) => router.push(`/docs/${id}`)}
          onGenerateContent={(id) => router.push(`/docs/${id}/generate-content`)}
          onViewContent={(id) => router.push(`/docs/${id}/view-content`)}
        />
      </div>
    </main>
  );
}
