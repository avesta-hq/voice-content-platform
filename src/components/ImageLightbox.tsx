"use client";

import React, { useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import type { SessionImage } from '@/types';

interface ImageLightboxProps {
  images: SessionImage[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

export default function ImageLightbox({
  images,
  initialIndex,
  open,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [isZoomed, setIsZoomed] = React.useState(false);
  const [slideDirection, setSlideDirection] = React.useState<'left' | 'right' | null>(null);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  // Update current index when initial index changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setSlideDirection(null);
  }, [initialIndex]);

  // Reset zoom when image changes
  useEffect(() => {
    setIsZoomed(false);
  }, [currentIndex]);

  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  // Navigation handlers with slide animation
  const goToPrevious = useCallback(() => {
    if (hasPrevious && !isTransitioning) {
      setIsTransitioning(true);
      setSlideDirection('right');
      setTimeout(() => {
        setCurrentIndex((prev) => prev - 1);
        setIsTransitioning(false);
      }, 300);
    }
  }, [hasPrevious, isTransitioning]);

  const goToNext = useCallback(() => {
    if (hasNext && !isTransitioning) {
      setIsTransitioning(true);
      setSlideDirection('left');
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setIsTransitioning(false);
      }, 300);
    }
  }, [hasNext, isTransitioning]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          setIsZoomed((prev) => !prev);
          break;
      }
    };

    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, goToPrevious, goToNext, onClose]);

  // Download image
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImage.s3Url;
    link.download = currentImage.originalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (!currentImage) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] sm:max-w-[95vw] md:max-w-[92vw] lg:max-w-[90vw] xl:max-w-[85vw] max-h-[98vh] w-full h-full p-0 bg-[#f7f7f7] border-none overflow-hidden [&>button]:hidden">
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">
          Image Viewer - {currentImage.originalName}
        </DialogTitle>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-white/95 to-transparent p-4 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            {/* Image Info */}
            <div className="flex items-center gap-3 text-gray-900">
              <div>
                <h3 className="font-semibold text-sm sm:text-base truncate max-w-[200px] sm:max-w-[400px]">
                  {currentImage.originalName}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                  <span>{formatFileSize(currentImage.fileSize)}</span>
                  {currentImage.width && currentImage.height && (
                    <>
                      <span>•</span>
                      <span>{currentImage.width} × {currentImage.height}</span>
                    </>
                  )}
                  {hasMultiple && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary" className="text-xs">
                        {currentIndex + 1} / {images.length}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsZoomed(!isZoomed)}
                className="text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                title={isZoomed ? 'Zoom Out (Z)' : 'Zoom In (Z)'}
              >
                {isZoomed ? (
                  <ZoomOut className="h-4 w-4" />
                ) : (
                  <ZoomIn className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                title="Download Image"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Image Container with Slide Animation */}
        <div className="relative w-full h-full flex items-center justify-center p-4 pt-20 pb-20 overflow-hidden">
          <div
            className={`relative max-w-full max-h-full transition-all duration-500 ease-out ${
              isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
            } ${
              isTransitioning && slideDirection === 'left'
                ? 'animate-slide-out-left'
                : isTransitioning && slideDirection === 'right'
                ? 'animate-slide-out-right'
                : 'animate-slide-in'
            }`}
            onClick={() => !isTransitioning && setIsZoomed(!isZoomed)}
          >
            <img
              src={currentImage.s3Url}
              alt={currentImage.originalName}
              className="max-w-full max-h-[calc(98vh-10rem)] w-auto h-auto object-contain select-none"
              draggable={false}
              style={{
                opacity: isTransitioning ? 0 : 1,
                transition: 'opacity 0.3s ease-in-out',
              }}
            />
          </div>
        </div>

        {/* Navigation Controls */}
        {hasMultiple && (
          <>
            {/* Previous Button */}
            <button
              onClick={goToPrevious}
              disabled={!hasPrevious || isTransitioning}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-50 h-32 w-16 sm:h-36 sm:w-20 md:h-40 md:w-24 bg-white hover:bg-primary disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200 shadow-lg border-r-2 border-gray-300 flex items-center justify-center group"
              title="Previous Image (←)"
            >
              <ChevronLeft className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-gray-700 group-hover:text-white" strokeWidth={3} />
            </button>

            {/* Next Button */}
            <button
              onClick={goToNext}
              disabled={!hasNext || isTransitioning}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-50 h-32 w-16 sm:h-36 sm:w-20 md:h-40 md:w-24 bg-white hover:bg-primary disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200 shadow-lg border-l-2 border-gray-300 flex items-center justify-center group"
              title="Next Image (→)"
            >
              <ChevronRight className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-gray-700 group-hover:text-white" strokeWidth={3} />
            </button>
          </>
        )}

        {/* Thumbnail Strip (for multiple images) */}
        {hasMultiple && images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-white/95 to-transparent p-4 border-t border-gray-200/50">
            <div className="flex items-center justify-center gap-2 overflow-x-auto max-w-full pb-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? 'border-primary scale-110 ring-2 ring-primary/50'
                      : 'border-gray-300 hover:border-primary/50 opacity-70 hover:opacity-100'
                  }`}
                  title={image.originalName}
                >
                  <img
                    src={image.s3Url}
                    alt={image.originalName}
                    className="w-full h-full object-cover"
                  />
                  {index === currentIndex && (
                    <div className="absolute inset-0 bg-primary/20"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Help Text (bottom-right) */}
        <div className="absolute bottom-4 right-4 z-40 text-xs text-gray-600 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-md hidden sm:block border border-gray-300 shadow-lg">
          <div className="space-y-1">
            {hasMultiple && (
              <div>← → Navigate</div>
            )}
            <div>Z Zoom</div>
            <div>Esc Close</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

