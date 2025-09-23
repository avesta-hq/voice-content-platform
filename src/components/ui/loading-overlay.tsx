import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ 
  isVisible, 
  message = "Loading...", 
  className 
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      "bg-background/80 backdrop-blur-sm",
      "animate-in fade-in-0 duration-200",
      className
    )}>
      <div className={cn(
        "flex flex-col items-center justify-center",
        "bg-card border rounded-lg shadow-lg",
        "px-6 py-8 mx-4 max-w-sm w-full",
        "animate-in zoom-in-95 duration-200"
      )}>
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm font-medium text-foreground text-center">
          {message}
        </p>
      </div>
    </div>
  );
}

// Additional variants for different use cases
export function LoadingOverlayMinimal({ 
  isVisible, 
  message = "Loading...",
  className 
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      "bg-background/60 backdrop-blur-sm",
      className
    )}>
      <div className="flex items-center gap-3 bg-card/90 border rounded-full px-4 py-3 shadow-lg">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-medium text-foreground">{message}</span>
      </div>
    </div>
  );
}

// For inline loading states
export function LoadingSpinner({ 
  size = "default", 
  className 
}: { 
  size?: "sm" | "default" | "lg"; 
  className?: string; 
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-5 w-5", 
    lg: "h-8 w-8"
  };

  return (
    <Loader2 className={cn(
      "animate-spin text-primary",
      sizeClasses[size],
      className
    )} />
  );
}
