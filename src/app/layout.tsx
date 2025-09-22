import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "Voice Content Platform",
  description:
    "Voice-to-content: multi-session recording, AI content generation, and S3-backed storage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Gujarati:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`antialiased`}>
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-foreground font-semibold hover:text-primary transition-colors text-sm sm:text-base">
              <span className="hidden sm:inline">Voice Content Platform</span>
              <span className="sm:hidden">VCP</span>
            </Link>
            <TopNav />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
