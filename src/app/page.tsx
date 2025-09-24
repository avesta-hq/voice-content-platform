"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { UserService } from "@/lib/userService";
import { PageTransition } from "@/components/animations/page-transitions";
import { HoverScale, FloatingElement, TypewriterText, SlideInView } from "@/components/animations/interactive-elements";

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
    <PageTransition>
      <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-background dark:to-muted/20 py-8 relative overflow-hidden">
        {/* Floating background elements */}
        <FloatingElement delay={0} className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl" />
        <FloatingElement delay={1} className="absolute top-40 right-20 w-32 h-32 bg-amber-300/10 rounded-full blur-2xl" />
        <FloatingElement delay={2} className="absolute bottom-20 left-1/4 w-24 h-24 bg-orange-400/10 rounded-full blur-xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <SlideInView direction="up" className="text-center mb-12">
            <div className="space-y-6">
              <HoverScale scale={1.02}>
                <TypewriterText 
                  text="Voice Content Platform"
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-primary to-orange-600 bg-clip-text text-transparent dark:from-white dark:via-primary dark:to-orange-400"
                  speed={80}
                />
              </HoverScale>
              
              <SlideInView direction="up" delay={0.3}>
                <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Transform your voice into professional blog posts, social media content, and podcast scripts with 
                  <span className="text-primary font-semibold"> AI-powered technology</span>.
                </p>
              </SlideInView>
              
              <SlideInView direction="up" delay={0.6}>
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">AI-Powered</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Multi-Platform</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Voice-First</span>
                  </div>
                </div>
              </SlideInView>
            </div>
          </SlideInView>
          
          <SlideInView direction="up" delay={0.9}>
            <HoverScale scale={1.01}>
              <LoginForm onLoginSuccess={() => router.replace("/docs")} />
            </HoverScale>
          </SlideInView>
        </div>
      </main>
    </PageTransition>
  );
}
