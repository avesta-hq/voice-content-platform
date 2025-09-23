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
    <DocumentDashboard
      onCreateNew={() => router.push("/docs/add")}
      onEditDocument={(id) => router.push(`/docs/${id}`)}
      onGenerateContent={(id) => router.push(`/docs/${id}/generate-content`)}
      onViewContent={(id) => router.push(`/docs/${id}/view-content`)}
    />
  );
}
