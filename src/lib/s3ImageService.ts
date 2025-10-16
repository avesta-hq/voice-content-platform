import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  DeleteObjectsCommand, 
  ListObjectsV2Command,
  GetObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Interface for image upload parameters
 */
export interface UploadImageParams {
  userId: number;
  documentId: string;
  sessionId: string;
  file: Buffer;
  fileName: string;
  fileType: string;
  fileSize: number;
  order: number;
}

/**
 * Interface for image upload result
 */
export interface ImageUploadResult {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  s3Path: string;
  s3Url: string;
}

/**
 * Interface for session image metadata
 */
export interface SessionImage {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  order: number;
  s3Path: string;
  s3Url: string;
  width?: number;
  height?: number;
  caption?: string;
}

/**
 * Upload configuration for client-side validation
 */
export interface UploadConfig {
  maxSizeMB: number;
  maxImagesPerSession: number;
  allowedTypes: string[];
}

/**
 * S3 Image Service
 * Handles all image operations for session attachments
 * Uses signed URLs for secure access
 */
class S3ImageService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;
  private imagesFolder: string;
  private signedUrlExpiry: number;
  private maxImageSizeMB: number;
  private maxImagesPerSession: number;
  private allowedTypes: string[];

  constructor() {
    // Initialize S3 client
    this.region = process.env.S3_REGION || 'us-east-1';
    this.bucketName = process.env.S3_BUCKET_NAME || '';
    
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    });
    
    // Configuration
    this.imagesFolder = process.env.S3_IMAGES_FOLDER || 'session-images';
    this.signedUrlExpiry = Number(process.env.S3_SIGNED_URL_EXPIRY) || 3600;
    this.maxImageSizeMB = Number(process.env.MAX_IMAGE_SIZE_MB) || 5;
    this.maxImagesPerSession = Number(process.env.MAX_IMAGES_PER_SESSION) || 5;
    this.allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(',');
  }

  /**
   * Check if S3 is properly configured
   */
  isConfigured(): boolean {
    return !!(
      this.bucketName && 
      process.env.S3_ACCESS_KEY_ID && 
      process.env.S3_SECRET_ACCESS_KEY
    );
  }

  /**
   * Validate image file before upload
   */
  validateImage(fileType: string, fileSize: number): void {
    // Check file type
    if (!this.allowedTypes.includes(fileType)) {
      throw new Error(`Invalid file type. Allowed types: ${this.allowedTypes.join(', ')}`);
    }

    // Check file size
    const maxSizeBytes = this.maxImageSizeMB * 1024 * 1024;
    if (fileSize > maxSizeBytes) {
      throw new Error(`File size exceeds ${this.maxImageSizeMB}MB limit`);
    }

    // Check if file is not empty
    if (fileSize === 0) {
      throw new Error('File is empty');
    }
  }

  /**
   * Generate S3 path for image
   * Pattern: session-images/user-{userId}/doc-{docId}/session-{sessionId}/img-{timestamp}.{ext}
   */
  private generateS3Path(
    userId: number, 
    documentId: string, 
    sessionId: string, 
    extension: string
  ): string {
    const timestamp = Date.now();
    return `${this.imagesFolder}/user-${userId}/doc-${documentId}/session-${sessionId}/img-${timestamp}.${extension}`;
  }

  /**
   * Extract file extension from filename
   */
  private getFileExtension(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext || 'jpg';
  }

  /**
   * Sanitize filename to prevent issues
   */
  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  }

  /**
   * Upload image to S3
   */
  async uploadImage(params: UploadImageParams): Promise<ImageUploadResult> {
    if (!this.isConfigured()) {
      throw new Error('S3 is not properly configured. Check environment variables.');
    }

    const { userId, documentId, sessionId, file, fileName, fileType, fileSize, order } = params;

    // Validate image
    this.validateImage(fileType, fileSize);

    // Generate S3 path
    const extension = this.getFileExtension(fileName);
    const s3Path = this.generateS3Path(userId, documentId, sessionId, extension);
    const sanitizedFileName = this.sanitizeFileName(fileName);

    try {
      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Path,
        Body: file,
        ContentType: fileType,
        Metadata: {
          userId: userId.toString(),
          documentId: documentId,
          sessionId: sessionId,
          originalName: sanitizedFileName,
          uploadedAt: new Date().toISOString(),
          order: order.toString(),
        },
      });

      await this.s3Client.send(command);
      console.log(`✅ Image uploaded to S3: ${s3Path}`);

      // Generate signed URL for immediate access
      const s3Url = await this.getSignedUrl(s3Path);

      const imageId = `img_${Date.now()}`;

      return {
        id: imageId,
        fileName: `img-${Date.now()}.${extension}`,
        originalName: fileName,
        fileSize: fileSize,
        fileType: fileType,
        s3Path,
        s3Url,
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload image to S3');
    }
  }

  /**
   * Get signed URL for an image (for secure access)
   */
  async getSignedUrl(s3Path: string, expiresIn?: number): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('S3 is not properly configured');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Path,
      });

      const signedUrl = await getSignedUrl(
        this.s3Client,
        command,
        { expiresIn: expiresIn || this.signedUrlExpiry }
      );

      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  /**
   * Delete a single image from S3
   */
  async deleteImage(s3Path: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('S3 is not properly configured');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Path,
      });

      await this.s3Client.send(command);
      console.log(`✅ Deleted image from S3: ${s3Path}`);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error('Failed to delete image from S3');
    }
  }

  /**
   * Delete all images for a session
   */
  async deleteSessionImages(userId: number, documentId: string, sessionId: string): Promise<void> {
    const prefix = `${this.imagesFolder}/user-${userId}/doc-${documentId}/session-${sessionId}/`;
    await this.deleteImagesWithPrefix(prefix);
    console.log(`✅ Deleted all images for session: ${sessionId}`);
  }

  /**
   * Delete all images for a document (all sessions)
   */
  async deleteDocumentImages(userId: number, documentId: string): Promise<void> {
    const prefix = `${this.imagesFolder}/user-${userId}/doc-${documentId}/`;
    await this.deleteImagesWithPrefix(prefix);
    console.log(`✅ Deleted all images for document: ${documentId}`);
  }

  /**
   * Delete all images for a user
   */
  async deleteUserImages(userId: number): Promise<void> {
    const prefix = `${this.imagesFolder}/user-${userId}/`;
    await this.deleteImagesWithPrefix(prefix);
    console.log(`✅ Deleted all images for user: ${userId}`);
  }

  /**
   * Helper: Delete all objects with a given prefix
   */
  private async deleteImagesWithPrefix(prefix: string): Promise<void> {
    if (!this.isConfigured()) {
      console.warn('S3 not configured, skipping image deletion');
      return;
    }

    try {
      // List all objects with the prefix
      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const listResponse = await this.s3Client.send(listCommand);

      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        console.log(`No images found with prefix: ${prefix}`);
        return;
      }

      // Delete all found objects
      const objectsToDelete = listResponse.Contents.map(obj => ({ Key: obj.Key! }));

      const deleteCommand = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: objectsToDelete,
          Quiet: false,
        },
      });

      await this.s3Client.send(deleteCommand);
      console.log(`✅ Deleted ${objectsToDelete.length} images with prefix: ${prefix}`);
    } catch (error) {
      console.error(`Error deleting images with prefix ${prefix}:`, error);
      throw new Error('Failed to delete images from S3');
    }
  }

  /**
   * List all images for a session
   */
  async listSessionImages(userId: number, documentId: string, sessionId: string): Promise<string[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const prefix = `${this.imagesFolder}/user-${userId}/doc-${documentId}/session-${sessionId}/`;

      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const response = await this.s3Client.send(command);
      return response.Contents?.map(obj => obj.Key!) || [];
    } catch (error) {
      console.error('Error listing images:', error);
      return [];
    }
  }

  /**
   * Refresh signed URLs for session images
   * Call this to regenerate expired URLs
   */
  async refreshSessionImageUrls(images: SessionImage[]): Promise<SessionImage[]> {
    if (!this.isConfigured() || !images || images.length === 0) {
      return images;
    }

    try {
      const refreshed = await Promise.all(
        images.map(async (image) => {
          try {
            const newUrl = await this.getSignedUrl(image.s3Path);
            return { ...image, s3Url: newUrl };
          } catch (error) {
            console.error(`Failed to refresh URL for ${image.s3Path}:`, error);
            return image; // Return original if refresh fails
          }
        })
      );
      return refreshed;
    } catch (error) {
      console.error('Error refreshing image URLs:', error);
      return images;
    }
  }

  /**
   * Get configuration for client-side validation
   */
  getUploadConfig(): UploadConfig {
    return {
      maxSizeMB: this.maxImageSizeMB,
      maxImagesPerSession: this.maxImagesPerSession,
      allowedTypes: this.allowedTypes,
    };
  }
}

// Export singleton instance
export const s3ImageService = new S3ImageService();

