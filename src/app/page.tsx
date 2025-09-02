"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { UserService } from "@/lib/userService";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    // Defer auth decision to client to avoid SSR/login flash
    const isAuthed = UserService.isAuthenticated();
    setAuthed(isAuthed);
    setReady(true);
    if (isAuthed) {
      router.replace("/docs");
    }
  }, [router]);

  // Until we know, render nothing to avoid showing both screens
  if (!ready) return null;
  if (authed) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Voice Content Platform</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your voice into professional blog posts, social media content, and podcast scripts.
          </p>
        </div>
        <LoginForm onLoginSuccess={() => router.replace("/docs")} />
      </div>
    </main>
  );
}
