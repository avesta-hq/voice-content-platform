"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import DocumentCreationForm from "@/components/DocumentCreationForm";
import { UserService } from "@/lib/userService";

export default function AddDocPage() {
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
        <DocumentCreationForm
          onDocumentCreated={(id) => router.replace(`/docs/${id}`)}
          onCancel={() => router.push("/docs")}
        />
      </div>
    </main>
  );
}
