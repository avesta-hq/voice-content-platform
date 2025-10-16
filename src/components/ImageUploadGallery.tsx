"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  FileImage,
} from 'lucide-react';
import type { SessionImage } from '@/types';

interface ImageUploadGalleryProps {
  images: SessionImage[];
  maxImages?: number;
  maxSizeMB?: number;
  onImageAdd: (file: File, width?: number, height?: number) => Promise<void>;
  onImageRemove: (imageId: string) => Promise<void>;
  disabled?: boolean;
}

export default function ImageUploadGallery({
  images,
  maxImages = 5,
  maxSizeMB = 5,
  onImageAdd,
  onImageRemove,
  disabled = false,
}: ImageUploadGalleryProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAddMore = images.length < maxImages;

  /**
   * Validate image file
   */
  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Please upload JPG, PNG, WebP, or GIF images.';
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit.`;
    }

    return null;
  };

  /**
   * Get image dimensions
   */
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };

      img.src = objectUrl;
    });
  };

  /**
   * Handle file upload
   */
  const handleFileUpload = async (file: File) => {
    setError('');

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check if we can add more
    if (!canAddMore) {
      setError(`Maximum ${maxImages} images allowed per session.`);
      return;
    }

    try {
      setUploadingIndex(images.length);

      // Get image dimensions
      let dimensions: { width: number; height: number } | undefined;
      try {
        dimensions = await getImageDimensions(file);
      } catch {
        console.warn('Could not get image dimensions');
      }

      // Call parent handler
      await onImageAdd(file, dimensions?.width, dimensions?.height);

      setUploadingIndex(null);
    } catch (err) {
      setUploadingIndex(null);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    }
  };

  /**
   * Handle file input change
   */
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle drag and drop
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && canAddMore) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || !canAddMore) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  /**
   * Handle image removal
   */
  const handleRemove = async (imageId: string) => {
    setError('');
    setDeletingId(imageId);
    try {
      await onImageRemove(imageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove image');
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileImage className="h-5 w-5 text-primary" />
          <h3 className="text-base sm:text-lg font-semibold">
            Attached Images ({images.length}/{maxImages})
          </h3>
        </div>
        {canAddMore && (
          <Badge variant="secondary" className="text-xs">
            {maxImages - images.length} remaining
          </Badge>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Image Gallery */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Existing Images */}
        {images.map((image, index) => (
          <Card
            key={image.id}
            className="relative group overflow-hidden border-2 hover:border-primary/50 transition-all"
          >
            <div className="aspect-square bg-muted/30 flex items-center justify-center relative">
              <img
                src={image.s3Url}
                alt={image.originalName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Delete Button */}
              {!disabled && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(image.id)}
                  disabled={deletingId === image.id}
                >
                  {deletingId === image.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </Button>
              )}

              {/* Image Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs truncate" title={image.originalName}>
                  {image.originalName}
                </p>
                <p className="text-xs text-gray-300">
                  {formatFileSize(image.fileSize)}
                  {image.width && image.height && (
                    <span className="ml-1">• {image.width}×{image.height}</span>
                  )}
                </p>
              </div>
            </div>
          </Card>
        ))}

        {/* Upload Progress Placeholder */}
        {uploadingIndex !== null && (
          <Card className="border-2 border-dashed border-primary">
            <div className="aspect-square bg-primary/10 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Uploading...</p>
            </div>
          </Card>
        )}

        {/* Upload Button */}
        {canAddMore && !disabled && (
          <Card
            className={`border-2 border-dashed cursor-pointer transition-all ${
              isDragging
                ? 'border-primary bg-primary/10'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="aspect-square flex flex-col items-center justify-center gap-2 p-4">
              <Upload className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-xs text-center text-muted-foreground">
                {isDragging ? 'Drop here' : 'Click or drag'}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || !canAddMore}
      />

      {/* Upload Instructions */}
      {canAddMore && !disabled && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Supported formats: JPG, PNG, WebP, GIF</p>
          <p>• Maximum size: {maxSizeMB}MB per image</p>
          <p>• Maximum {maxImages} images per session</p>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && uploadingIndex === null && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No images attached yet</p>
          <p className="text-xs mt-1">
            {canAddMore ? 'Click the upload box above to add images' : 'Maximum images reached'}
          </p>
        </div>
      )}
    </div>
  );
}

