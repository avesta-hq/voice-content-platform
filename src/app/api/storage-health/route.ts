import { NextRequest, NextResponse } from 'next/server';
import { hybridStorageService } from '@/lib/hybridStorageService';
import type { DatabaseData } from '@/lib/s3Service';

export async function GET(_: NextRequest) {
  try {
    // This will trigger auto-creation of blog.json if it doesn't exist
    const [draftDb, completedDb, healthCheck] = await Promise.all([
      hybridStorageService.getDatabase(),
      hybridStorageService.getBlogDatabase(), // This ensures blog.json exists
      hybridStorageService.healthCheck()
    ]);

    return NextResponse.json({
      status: 'healthy',
      storage: healthCheck,
      databases: {
        draft: {
          exists: !!draftDb,
          documents: draftDb?.userDocuments?.length || 0,
          sessions: draftDb?.voiceSessions?.length || 0
        },
        completed: {
          exists: !!completedDb,
          documents: completedDb?.userDocuments?.length || 0,
          sessions: completedDb?.voiceSessions?.length || 0
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Storage health check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Storage health check failed',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body as { action?: string };

    if (action === 'initialize') {
      // Force initialization of both databases
      const [draftDb, completedDb] = await Promise.all([
        hybridStorageService.getDatabase(),
        hybridStorageService.getBlogDatabase()
      ]);

      // Ensure they have the proper structure
      const ensureStructure = (db: DatabaseData | null): DatabaseData => ({
        userDocuments: (db?.userDocuments || []) as DatabaseData['userDocuments'],
        voiceSessions: (db?.voiceSessions || []) as DatabaseData['voiceSessions'],
        users: (db?.users || []) as DatabaseData['users']
      });

      const normalizedDraft = ensureStructure(draftDb);
      const normalizedCompleted = ensureStructure(completedDb);

      // Save both to ensure they exist with proper structure
      await Promise.all([
        hybridStorageService.saveDatabase(normalizedDraft),
        hybridStorageService.saveBlogDatabase(normalizedCompleted)
      ]);

      return NextResponse.json({
        status: 'initialized',
        message: 'Both draft and completed databases initialized successfully',
        databases: {
          draft: {
            documents: (normalizedDraft.userDocuments || []).length,
            sessions: (normalizedDraft.voiceSessions || []).length
          },
          completed: {
            documents: (normalizedCompleted.userDocuments || []).length,
            sessions: (normalizedCompleted.voiceSessions || []).length
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use action: "initialize"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Storage initialization error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Storage initialization failed',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}