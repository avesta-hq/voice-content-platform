"use client";

import dynamic from 'next/dynamic';
import React from 'react';
import { Loader2 } from 'lucide-react';

// Dynamically import RichTextEditor with no SSR
const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[200px] border rounded-md bg-muted/5">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading editor...</p>
      </div>
    </div>
  ),
});

interface RichTextEditorWrapperProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function RichTextEditorWrapper(props: RichTextEditorWrapperProps) {
  return <RichTextEditor {...props} />;
}

