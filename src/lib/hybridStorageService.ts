import { promises as fs } from 'fs';
import path from 'path';
import { s3Service, DatabaseData } from './s3Service';
import { User, UserDocument, VoiceSession } from '@/types';

export interface StorageService {
  getDatabase(): Promise<DatabaseData | null>;
  saveDatabase(data: DatabaseData): Promise<boolean>;
  getUserDocuments(userId: string): Promise<UserDocument[]>;
  getVoiceSessions(documentId: string): Promise<VoiceSession[]>;
  getUsers(): Promise<User[]>;
  healthCheck(): Promise<HealthCheckResult | HybridHealthCheckResult>;
  
  // Blog (completed documents) storage methods
  getBlogDatabase(): Promise<DatabaseData | null>;
  saveBlogDatabase(data: DatabaseData): Promise<boolean>;
  getCompletedDocuments(userId: string): Promise<UserDocument[]>;
}

export interface HealthCheckResult {
  status: string;
  type?: string;
  path?: string;
  configured: boolean;
  error?: string;
}

export interface HybridHealthCheckResult {
  currentStorage: string;
  local: HealthCheckResult;
  s3: { status: string; bucket: string; configured: boolean };
  useS3: boolean;
  environment: string | undefined;
  useS3Local: string | undefined;
}

export class LocalFileService implements StorageService {
  private dbPath: string;
  private blogPath: string;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'db.json');
    this.blogPath = path.join(process.cwd(), 'blog.json');
  }

  async getDatabase(): Promise<DatabaseData | null> {
    try {
      const dbContent = await fs.readFile(this.dbPath, 'utf-8');
      return JSON.parse(dbContent) as DatabaseData;
    } catch (error) {
      console.error('Local: Error reading database:', error);
      throw new Error('Failed to read local database');
    }
  }

  async saveDatabase(data: DatabaseData): Promise<boolean> {
    try {
      await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2));
      console.log('Local: Database saved successfully');
      return true;
    } catch (error) {
      console.error('Local: Error saving database:', error);
      throw new Error('Failed to save local database');
    }
  }

  async getUserDocuments(userId: string): Promise<UserDocument[]> {
    const db = await this.getDatabase();
    return (db?.userDocuments || []).filter((doc: UserDocument) => String(doc.userId) === String(userId));
  }

  async getVoiceSessions(documentId: string): Promise<VoiceSession[]> {
    // Read from both draft (db.json) and completed (blog.json) and merge
    const [db, blogDb] = await Promise.all([
      this.getDatabase(),
      this.getBlogDatabase().catch(() => null)
    ]);

    const fromDraft = (db?.voiceSessions || []).filter((session: VoiceSession) => session.documentId === documentId);
    const fromCompleted = (blogDb?.voiceSessions || []).filter((session: VoiceSession) => session.documentId === documentId);
    return [...fromDraft, ...fromCompleted];
  }

  async getUsers(): Promise<User[]> {
    const db = await this.getDatabase();
    return db?.users || [];
  }

  async getBlogDatabase(): Promise<DatabaseData | null> {
    try {
      const blogContent = await fs.readFile(this.blogPath, 'utf-8');
      return JSON.parse(blogContent) as DatabaseData;
    } catch (error) {
      // If blog.json doesn't exist, create empty structure
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        const emptyDb: DatabaseData = {
          userDocuments: [],
          voiceSessions: [],
          users: []
        };
        await this.saveBlogDatabase(emptyDb);
        return emptyDb;
      }
      console.error('Local: Error reading blog database:', error);
      throw new Error('Failed to read local blog database');
    }
  }

  async saveBlogDatabase(data: DatabaseData): Promise<boolean> {
    try {
      await fs.writeFile(this.blogPath, JSON.stringify(data, null, 2));
      console.log('Local: Blog database saved successfully');
      return true;
    } catch (error) {
      console.error('Local: Error saving blog database:', error);
      throw new Error('Failed to save local blog database');
    }
  }

  async getCompletedDocuments(userId: string): Promise<UserDocument[]> {
    const blogDb = await this.getBlogDatabase();
    return (blogDb?.userDocuments || []).filter((doc: UserDocument) => String(doc.userId) === String(userId));
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      await fs.access(this.dbPath);
      return {
        status: 'healthy',
        type: 'local',
        path: this.dbPath,
        configured: true
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        type: 'local',
        path: this.dbPath,
        configured: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export class HybridStorageService implements StorageService {
  private localService: LocalFileService;
  private s3Service: typeof s3Service;
  private useS3: boolean;

  constructor() {
    this.localService = new LocalFileService();
    this.s3Service = s3Service;
    this.useS3 = this.shouldUseS3();
    
    console.log(`Hybrid Storage: Using ${this.useS3 ? 'S3' : 'Local File'} storage`);
  }

  private shouldUseS3(): boolean {
    // Use S3 if explicitly enabled or in production
    const useS3Local = process.env.USE_S3_LOCAL === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    
    return useS3Local || isProduction;
  }

  async getDatabase(): Promise<DatabaseData | null> {
    if (this.useS3) {
      try {
        return await this.s3Service.getDatabase();
      } catch (error) {
        console.warn('S3 failed, falling back to local:', error);
        return await this.localService.getDatabase();
      }
    } else {
      return await this.localService.getDatabase();
    }
  }

  async saveDatabase(data: DatabaseData): Promise<boolean> {
    if (this.useS3) {
      try {
        return await this.s3Service.saveDatabase(data);
      } catch (error) {
        console.warn('S3 save failed, falling back to local:', error);
        return await this.localService.saveDatabase(data);
      }
    } else {
      return await this.localService.saveDatabase(data);
    }
  }

  async getUserDocuments(userId: string): Promise<UserDocument[]> {
    if (this.useS3) {
      try {
        return await this.s3Service.getUserDocuments(userId);
      } catch (error) {
        console.warn('S3 getUserDocuments failed, falling back to local:', error);
        return await this.localService.getUserDocuments(userId);
      }
    } else {
      return await this.localService.getUserDocuments(userId);
    }
  }

  async getVoiceSessions(documentId: string): Promise<VoiceSession[]> {
    if (this.useS3) {
      try {
        return await this.s3Service.getVoiceSessions(documentId);
      } catch (error) {
        console.warn('S3 getVoiceSessions failed, falling back to local:', error);
        return await this.localService.getVoiceSessions(documentId);
      }
    } else {
      return await this.localService.getVoiceSessions(documentId);
    }
  }

  async getUsers(): Promise<User[]> {
    if (this.useS3) {
      try {
        return await this.s3Service.getUsers();
      } catch (error) {
        console.warn('S3 getUsers failed, falling back to local:', error);
        return await this.localService.getUsers();
      }
    } else {
      return await this.localService.getUsers();
    }
  }

  async getBlogDatabase(): Promise<DatabaseData | null> {
    if (this.useS3) {
      try {
        return await this.s3Service.getBlogDatabase();
      } catch (error) {
        console.warn('S3 getBlogDatabase failed, falling back to local:', error);
        return await this.localService.getBlogDatabase();
      }
    } else {
      return await this.localService.getBlogDatabase();
    }
  }

  async saveBlogDatabase(data: DatabaseData): Promise<boolean> {
    if (this.useS3) {
      try {
        return await this.s3Service.saveBlogDatabase(data);
      } catch (error) {
        console.warn('S3 saveBlogDatabase failed, falling back to local:', error);
        return await this.localService.saveBlogDatabase(data);
      }
    } else {
      return await this.localService.saveBlogDatabase(data);
    }
  }

  async getCompletedDocuments(userId: string): Promise<UserDocument[]> {
    if (this.useS3) {
      try {
        return await this.s3Service.getCompletedDocuments(userId);
      } catch (error) {
        console.warn('S3 getCompletedDocuments failed, falling back to local:', error);
        return await this.localService.getCompletedDocuments(userId);
      }
    } else {
      return await this.localService.getCompletedDocuments(userId);
    }
  }

  async healthCheck(): Promise<HybridHealthCheckResult> {
    const localHealth = await this.localService.healthCheck();
    const s3Health = await this.s3Service.healthCheck();
    
    return {
      currentStorage: this.useS3 ? 'S3' : 'Local',
      local: localHealth,
      s3: s3Health,
      useS3: this.useS3,
      environment: process.env.NODE_ENV,
      useS3Local: process.env.USE_S3_LOCAL
    };
  }

  // Method to manually switch storage mode
  setStorageMode(useS3: boolean): void {
    this.useS3 = useS3;
    console.log(`Hybrid Storage: Switched to ${this.useS3 ? 'S3' : 'Local File'} storage`);
  }

  // Get current storage mode
  getCurrentStorageMode(): string {
    return this.useS3 ? 'S3' : 'Local File';
  }
}

// Export singleton instance
export const hybridStorageService = new HybridStorageService();
