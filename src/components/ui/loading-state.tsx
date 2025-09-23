import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from './card';

interface LoadingStateProps {
  message?: string;
  submessage?: string;
  variant?: 'default' | 'minimal' | 'card' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingState = ({ 
  message = 'Loading...', 
  submessage,
  variant = 'default',
  size = 'md',
  className 
}: LoadingStateProps) => {
  const sizeClasses = {
    sm: { spinner: 'h-4 w-4', text: 'text-sm', subtext: 'text-xs' },
    md: { spinner: 'h-6 w-6', text: 'text-base', subtext: 'text-sm' },
    lg: { spinner: 'h-8 w-8', text: 'text-lg', subtext: 'text-base' },
  };

  const sizes = sizeClasses[size];

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center justify-center gap-3', className)}>
        <Loader2 className={cn('animate-spin text-primary', sizes.spinner)} />
        <span className={cn('text-foreground font-medium', sizes.text)}>{message}</span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className={cn('animate-spin text-primary', sizes.spinner)} />
        <span className={cn('text-muted-foreground', sizes.text)}>{message}</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={cn('border-dashed border-2 border-muted-foreground/20', className)}>
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
            <div className="relative bg-background rounded-full p-3 border-2 border-primary/30">
              <Loader2 className={cn('animate-spin text-primary', sizes.spinner)} />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className={cn('font-semibold text-foreground', sizes.text)}>{message}</p>
            {submessage && (
              <p className={cn('text-muted-foreground', sizes.subtext)}>{submessage}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div className={cn('flex flex-col items-center justify-center space-y-4 py-8', className)}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-primary/20 to-primary/30 rounded-full p-4 shadow-lg">
          <Loader2 className={cn('animate-spin text-primary', sizes.spinner)} />
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className={cn('font-semibold text-foreground', sizes.text)}>{message}</p>
        {submessage && (
          <p className={cn('text-muted-foreground', sizes.subtext)}>{submessage}</p>
        )}
      </div>
    </div>
  );
};

// Enhanced skeleton loading components that match actual content structure
export const DocumentSkeleton = () => (
  <Card className="cursor-pointer animate-pulse">
    <CardHeader className="pb-2">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          {/* Document title skeleton */}
          <div className="h-5 bg-muted rounded w-3/4"></div>
          {/* Date skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-muted/60 rounded"></div>
            <div className="h-4 bg-muted/60 rounded w-24"></div>
          </div>
        </div>
        {/* Delete button skeleton */}
        <div className="h-8 w-8 bg-muted/60 rounded"></div>
      </div>
    </CardHeader>
    <CardContent className="space-y-3 pt-2">
      {/* Language flow skeleton */}
      <div className="p-3 bg-muted/20 rounded-lg border border-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted/60 rounded-full"></div>
            <div className="h-4 bg-muted/60 rounded w-16"></div>
          </div>
          <div className="h-4 w-4 bg-muted/60 rounded"></div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted/60 rounded-full"></div>
            <div className="h-4 bg-muted/60 rounded w-16"></div>
          </div>
        </div>
      </div>
      
      {/* Stats grid skeleton */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-muted/20 rounded-md">
          <div className="h-5 bg-muted/60 rounded w-8 mx-auto mb-1"></div>
          <div className="h-3 bg-muted/40 rounded w-12 mx-auto"></div>
        </div>
        <div className="text-center p-2 bg-muted/20 rounded-md">
          <div className="h-5 bg-muted/60 rounded w-8 mx-auto mb-1"></div>
          <div className="h-3 bg-muted/40 rounded w-12 mx-auto"></div>
        </div>
        <div className="text-center p-2 bg-muted/20 rounded-md">
          <div className="h-5 bg-muted/60 rounded w-8 mx-auto mb-1"></div>
          <div className="h-3 bg-muted/40 rounded w-12 mx-auto"></div>
        </div>
      </div>
      
      {/* Action buttons skeleton */}
      <div className="flex gap-2">
        <div className="h-8 bg-muted/60 rounded flex-1"></div>
        <div className="h-8 bg-muted/60 rounded flex-1"></div>
        <div className="h-8 bg-muted/60 rounded flex-1"></div>
      </div>
      
      {/* Status toggle skeleton */}
      <div className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
        <div className="space-y-1 flex-1">
          <div className="h-4 bg-muted/60 rounded w-24"></div>
          <div className="h-3 bg-muted/40 rounded w-32"></div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <div className="h-3 bg-muted/60 rounded w-8"></div>
          <div className="h-5 w-8 bg-muted/60 rounded-full"></div>
          <div className="h-3 bg-muted/60 rounded w-8"></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const DocumentGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <DocumentSkeleton key={i} />
    ))}
  </div>
);

// Content display skeleton for view content pages
export const ContentDisplaySkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-6">
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-muted/60 rounded"></div>
        <div className="h-4 bg-muted/60 rounded w-20"></div>
        <div className="h-4 w-4 bg-muted/60 rounded"></div>
        <div className="h-4 bg-muted/60 rounded w-24"></div>
      </div>

      {/* Hero section skeleton */}
      <div className="text-center space-y-6 py-8">
        <div className="w-20 h-20 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
          <div className="w-10 h-10 bg-primary/40 rounded-full"></div>
        </div>
        <div className="space-y-3">
          <div className="h-10 bg-muted rounded w-80 mx-auto"></div>
          <div className="h-6 bg-muted/60 rounded w-96 mx-auto"></div>
        </div>
      </div>

      {/* Original voice input skeleton */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-muted/60 rounded"></div>
              <div className="h-4 bg-muted rounded w-36"></div>
            </div>
            <div className="w-6 h-6 bg-muted/60 rounded"></div>
          </div>
        </CardHeader>
      </Card>

      {/* Generated content section skeleton */}
      <div className="space-y-6">
        {/* Section header skeleton */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-8 bg-muted/60 rounded"></div>
            <div className="h-8 bg-muted rounded w-64"></div>
          </div>
          <div className="h-5 bg-muted/60 rounded w-80 mx-auto"></div>
        </div>

        {/* Platform tabs skeleton */}
        <div className="bg-muted/30 p-1 rounded-lg">
          <div className="flex justify-between">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex-1 mx-1 p-3 rounded-md transition-all ${i === 0 ? 'bg-background shadow-sm' : 'bg-transparent'}`}>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-muted/60 rounded"></div>
                  <div className="h-3 sm:h-4 bg-muted/60 rounded w-12 sm:w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active tab content skeleton */}
        <Card className="border-l-4 border-l-primary/20">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 bg-primary/40 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-muted rounded w-32"></div>
                  <div className="h-4 bg-muted/60 rounded w-24"></div>
                </div>
              </div>
              <div className="h-6 bg-primary/20 rounded-full w-24"></div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 sm:p-6 space-y-5">
              {/* Content area skeleton */}
              <div className="relative overflow-hidden rounded-lg border min-h-[300px]">
                {/* Top accent stripe */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary/30"></div>
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Content title skeleton */}
                  <div className="h-7 bg-muted rounded w-2/3"></div>
                  {/* Content paragraphs skeleton */}
                  <div className="space-y-3">
                    <div className="h-4 bg-muted/60 rounded w-full"></div>
                    <div className="h-4 bg-muted/60 rounded w-11/12"></div>
                    <div className="h-4 bg-muted/60 rounded w-4/5"></div>
                    <div className="h-4 bg-muted/60 rounded w-full"></div>
                    <div className="h-4 bg-muted/60 rounded w-3/4"></div>
                    <div className="h-4 bg-muted/60 rounded w-5/6"></div>
                    <div className="h-4 bg-muted/60 rounded w-4/5"></div>
                    <div className="h-4 bg-muted/60 rounded w-full"></div>
                    <div className="h-4 bg-muted/60 rounded w-2/3"></div>
                  </div>
                </div>
                {/* Stats footer skeleton */}
                <div className="px-5 sm:px-6 py-3 border-t bg-background/50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <div className="flex gap-4">
                      <div className="h-4 bg-muted/60 rounded w-16"></div>
                      <div className="h-4 bg-muted/60 rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-muted/60 rounded w-36"></div>
                  </div>
                </div>
              </div>
              
              {/* Action buttons skeleton */}
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="h-9 bg-primary/20 rounded w-32"></div>
                <div className="h-9 bg-muted/60 rounded w-20"></div>
                <div className="h-9 bg-muted/60 rounded w-36"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

// Form skeleton for create/edit pages
export const FormSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-muted/60 rounded-full mx-auto"></div>
      <div className="h-7 bg-muted rounded w-48 mx-auto"></div>
      <div className="h-5 bg-muted/60 rounded w-80 mx-auto"></div>
    </div>
    
    <Card>
      <CardContent className="p-6 space-y-6">
        {/* Form fields skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-muted/60 rounded w-24"></div>
          <div className="h-12 bg-muted/30 rounded border"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 bg-muted/60 rounded w-32"></div>
            <div className="h-12 bg-muted/30 rounded border"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted/60 rounded w-28"></div>
            <div className="h-12 bg-muted/30 rounded border"></div>
          </div>
        </div>
        
        {/* Action buttons skeleton */}
        <div className="flex gap-3 pt-4">
          <div className="h-12 bg-muted/60 rounded flex-1"></div>
          <div className="h-12 bg-muted/60 rounded flex-1"></div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Document editor skeleton for document editor page
export const DocumentEditorSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {/* Header skeleton */}
    <div className="flex items-center justify-between mb-8">
      <div className="space-y-3">
        {/* Back button skeleton */}
        <div className="h-9 bg-muted/60 rounded w-32"></div>
        {/* Title skeleton */}
        <div className="h-9 bg-muted rounded w-80"></div>
      </div>
      {/* Action buttons skeleton */}
      <div className="flex space-x-3">
        <div className="h-10 bg-muted/60 rounded w-24"></div>
        <div className="h-10 bg-muted/60 rounded w-32"></div>
        <div className="h-10 bg-muted/60 rounded w-28"></div>
      </div>
    </div>

    {/* Document info grid skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 text-center">
            <div className="h-8 bg-muted/60 rounded w-12 mx-auto mb-2"></div>
            <div className="h-4 bg-muted/40 rounded w-16 mx-auto"></div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Language info skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted/60 rounded"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted/60 rounded w-20"></div>
              <div className="h-5 bg-muted rounded w-24"></div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted/60 rounded"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted/60 rounded w-20"></div>
              <div className="h-5 bg-muted rounded w-24"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Sessions section skeleton */}
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded w-40"></div>
            <div className="h-4 bg-muted/60 rounded w-64"></div>
          </div>
          <div className="h-9 bg-muted/60 rounded w-24"></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session items skeleton */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 bg-muted/60 rounded-full"></div>
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-muted rounded w-48"></div>
                <div className="h-4 bg-muted/60 rounded w-32"></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-muted/60 rounded"></div>
              <div className="h-8 w-8 bg-muted/60 rounded"></div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>

    {/* Combined content preview skeleton */}
    <Card>
      <CardHeader>
        <div className="h-6 bg-muted rounded w-48"></div>
        <div className="h-4 bg-muted/60 rounded w-80"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 bg-muted/60 rounded w-full"></div>
          <div className="h-4 bg-muted/60 rounded w-11/12"></div>
          <div className="h-4 bg-muted/60 rounded w-4/5"></div>
          <div className="h-4 bg-muted/60 rounded w-full"></div>
          <div className="h-4 bg-muted/60 rounded w-3/4"></div>
          <div className="h-4 bg-muted/60 rounded w-5/6"></div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Quick loading states for common scenarios
export const LoadingDocuments = () => (
  <LoadingState 
    message="Loading your documents..." 
    submessage="Fetching your latest content"
    variant="default"
    size="md"
  />
);

export const LoadingContent = () => (
  <LoadingState 
    message="Generating content..." 
    submessage="This may take a few moments"
    variant="card"
    size="lg"
  />
);

export const LoadingSave = () => (
  <LoadingState 
    message="Saving changes..." 
    variant="minimal"
    size="sm"
  />
);
