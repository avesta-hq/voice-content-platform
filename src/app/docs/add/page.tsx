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
    <DocumentCreationForm
      onDocumentCreated={(id) => router.replace(`/docs/${id}`)}
      onCancel={() => router.push("/docs")}
    />
  );
}
