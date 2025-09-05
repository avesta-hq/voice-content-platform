import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { User, UserDocument, VoiceSession } from '@/types';

export interface S3Config {
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  bucketName: string;
}

export interface DatabaseData {
  users?: User[];
  userDocuments?: UserDocument[];
  voiceSessions?: VoiceSession[];
}

export class S3Service {
  private client!: S3Client;
  private bucketName!: string;
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = this.validateConfiguration();
    
    if (this.isConfigured) {
      this.client = new S3Client({
        region: process.env.S3_REGION,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
      });
      this.bucketName = process.env.S3_BUCKET_NAME!;
    }
  }

  private validateConfiguration(): boolean {
    const requiredVars = [
      'S3_ACCESS_KEY_ID',
      'S3_SECRET_ACCESS_KEY', 
      'S3_REGION',
      'S3_BUCKET_NAME'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn(`S3 Service: Missing environment variables: ${missingVars.join(', ')}`);
      return false;
    }

    return true;
  }

  async uploadJson(key: string, data: DatabaseData): Promise<boolean> {
    if (!this.isConfigured) {
      throw new Error('S3 Service not configured properly');
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: JSON.stringify(data, null, 2),
        ContentType: 'application/json',
      });

      await this.client.send(command);
      console.log(`S3: Successfully uploaded ${key}`);
      return true;
    } catch (error) {
      console.error(`S3: Error uploading ${key}:`, error);
      throw new Error(`Failed to upload ${key} to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadJson(key: string): Promise<DatabaseData | null> {
    if (!this.isConfigured) {
      throw new Error('S3 Service not configured properly');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        throw new Error(`No data found for key: ${key}`);
      }

      const bodyContents = await response.Body.transformToString();
      const data = JSON.parse(bodyContents) as DatabaseData;
      
      console.log(`S3: Successfully downloaded ${key}`);
      return data;
    } catch (error) {
      // Normalize AWS error shape and detect missing key without treating it as fatal
      const err = error as { Code?: string; code?: string; name?: string; message?: string };
      const code = err?.Code || err?.code || err?.name;
      const message = err?.message || (error instanceof Error ? error.message : String(error));
      if (code === 'NoSuchKey' || message.includes('NoSuchKey')) {
        console.log(`S3: Key ${key} not found, returning null`);
        return null;
      }

      console.error(`S3: Error downloading ${key}:`, error);
      throw new Error(`Failed to download ${key} from S3: ${message}`);
    }
  }

  async updateJson(key: string, data: DatabaseData): Promise<boolean> {
    // For JSON files, update is the same as upload (overwrite)
    return this.uploadJson(key, data);
  }

  async deleteJson(key: string): Promise<boolean> {
    if (!this.isConfigured) {
      throw new Error('S3 Service not configured properly');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);
      console.log(`S3: Successfully deleted ${key}`);
      return true;
    } catch (error) {
      console.error(`S3: Error deleting ${key}:`, error);
      throw new Error(`Failed to delete ${key} from S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listKeys(prefix?: string): Promise<string[]> {
    if (!this.isConfigured) {
      throw new Error('S3 Service not configured properly');
    }

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const response = await this.client.send(command);
      const keys = response.Contents?.map(obj => obj.Key!) || [];
      
      console.log(`S3: Listed ${keys.length} keys with prefix: ${prefix || 'none'}`);
      return keys;
    } catch (error) {
      console.error(`S3: Error listing keys:`, error);
      throw new Error(`Failed to list S3 keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.downloadJson(key);
      return true;
    } catch {
      return false;
    }
  }

  // Database-specific methods
  async getDatabase(): Promise<DatabaseData | null> {
    return this.downloadJson('db.json');
  }

  async saveDatabase(data: DatabaseData): Promise<boolean> {
    return this.uploadJson('db.json', data);
  }

  async getUserDocuments(userId: string): Promise<UserDocument[]> {
    const db = await this.getDatabase();
    return (db?.userDocuments || []).filter((doc: UserDocument) => String(doc.userId) === String(userId));
  }

  async getVoiceSessions(documentId: string): Promise<VoiceSession[]> {
    // Read from both draft (db.json) and completed (blog.json) and merge
    const [db, blogDb] = await Promise.all([
      this.getDatabase(),
      this.getBlogDatabase()
    ]);
    const fromDraft = (db?.voiceSessions || []).filter((session: VoiceSession) => session.documentId === documentId);
    const fromCompleted = (blogDb?.voiceSessions || []).filter((session: VoiceSession) => session.documentId === documentId);
    return [...fromDraft, ...fromCompleted];
  }

  async getUsers(): Promise<User[]> {
    const db = await this.getDatabase();
    return db?.users || [];
  }

  // Blog (completed documents) database methods
  async getBlogDatabase(): Promise<DatabaseData | null> {
    const blogData = await this.downloadJson('blog.json');
    if (!blogData) {
      // Create empty blog.json if it doesn't exist
      const emptyDb: DatabaseData = {
        userDocuments: [],
        voiceSessions: [],
        users: []
      };
      await this.saveBlogDatabase(emptyDb);
      return emptyDb;
    }
    return blogData;
  }

  async saveBlogDatabase(data: DatabaseData): Promise<boolean> {
    return this.uploadJson('blog.json', data);
  }

  async getCompletedDocuments(userId: string): Promise<UserDocument[]> {
    const blogDb = await this.getBlogDatabase();
    return (blogDb?.userDocuments || []).filter((doc: UserDocument) => String(doc.userId) === String(userId));
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; bucket: string; configured: boolean }> {
    return {
      status: this.isConfigured ? 'healthy' : 'misconfigured',
      bucket: this.bucketName || 'not configured',
      configured: this.isConfigured
    };
  }
}

// Singleton instance
export const s3Service = new S3Service();
