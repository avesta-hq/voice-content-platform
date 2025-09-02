import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
