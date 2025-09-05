import { NextRequest, NextResponse } from 'next/server';
import { hybridStorageService } from '@/lib/hybridStorageService';
import { UserDocument, VoiceSession } from '@/types';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await context.params;
    const body = await request.json();
    const { status } = body as { status: 'draft' | 'completed' };

    if (!status || !['draft', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "draft" or "completed"' },
        { status: 400 }
      );
    }

    // Get current databases
    const draftDb = await hybridStorageService.getDatabase();
    const completedDb = await hybridStorageService.getBlogDatabase();

    if (!draftDb || !completedDb) {
      return NextResponse.json(
        { error: 'Database unavailable' },
        { status: 500 }
      );
    }

    // Initialize arrays if they don't exist
    draftDb.userDocuments = draftDb.userDocuments || [];
    draftDb.voiceSessions = draftDb.voiceSessions || [];
    completedDb.userDocuments = completedDb.userDocuments || [];
    completedDb.voiceSessions = completedDb.voiceSessions || [];

    // Find the document in either database
    let document = (draftDb.userDocuments as UserDocument[]).find(doc => doc.id === documentId);
    let isInDraftDb = true;

    if (!document) {
      document = (completedDb.userDocuments as UserDocument[]).find(doc => doc.id === documentId);
      isInDraftDb = false;
    }

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if document can be marked as completed (must have generated content)
    if (status === 'completed' && !document.hasGeneratedContent) {
      return NextResponse.json(
        { error: 'Document must have generated content to be marked as completed' },
        { status: 400 }
      );
    }

    // Update document status
    const updatedDocument: UserDocument = {
      ...document,
      status,
      updatedAt: new Date().toISOString()
    };

    // Get all sessions for this document
    const sessions = (draftDb.voiceSessions as VoiceSession[])
      .concat(completedDb.voiceSessions as VoiceSession[])
      .filter(session => session.documentId === documentId);

    if (status === 'completed') {
      // Move from draft to completed
      if (isInDraftDb) {
        // Remove from draft database
        draftDb.userDocuments = (draftDb.userDocuments as UserDocument[])
          .filter(doc => doc.id !== documentId);
        draftDb.voiceSessions = (draftDb.voiceSessions as VoiceSession[])
          .filter(session => session.documentId !== documentId);

        // Add to completed database
        completedDb.userDocuments = (completedDb.userDocuments as UserDocument[])
          .filter(doc => doc.id !== documentId) // Remove if already exists
          .concat([updatedDocument]);
        completedDb.voiceSessions = (completedDb.voiceSessions as VoiceSession[])
          .filter(session => session.documentId !== documentId) // Remove if already exists
          .concat(sessions);

        // Save both databases
        await Promise.all([
          hybridStorageService.saveDatabase(draftDb),
          hybridStorageService.saveBlogDatabase(completedDb)
        ]);
      } else {
        // Already in completed database, just update
        const docIndex = (completedDb.userDocuments as UserDocument[])
          .findIndex(doc => doc.id === documentId);
        if (docIndex >= 0) {
          (completedDb.userDocuments as UserDocument[])[docIndex] = updatedDocument;
          await hybridStorageService.saveBlogDatabase(completedDb);
        }
      }
    } else {
      // Move from completed to draft
      if (!isInDraftDb) {
        // Remove from completed database
        completedDb.userDocuments = (completedDb.userDocuments as UserDocument[])
          .filter(doc => doc.id !== documentId);
        completedDb.voiceSessions = (completedDb.voiceSessions as VoiceSession[])
          .filter(session => session.documentId !== documentId);

        // Add to draft database
        draftDb.userDocuments = (draftDb.userDocuments as UserDocument[])
          .filter(doc => doc.id !== documentId) // Remove if already exists
          .concat([updatedDocument]);
        draftDb.voiceSessions = (draftDb.voiceSessions as VoiceSession[])
          .filter(session => session.documentId !== documentId) // Remove if already exists
          .concat(sessions);

        // Save both databases
        await Promise.all([
          hybridStorageService.saveDatabase(draftDb),
          hybridStorageService.saveBlogDatabase(completedDb)
        ]);
      } else {
        // Already in draft database, just update
        const docIndex = (draftDb.userDocuments as UserDocument[])
          .findIndex(doc => doc.id === documentId);
        if (docIndex >= 0) {
          (draftDb.userDocuments as UserDocument[])[docIndex] = updatedDocument;
          await hybridStorageService.saveDatabase(draftDb);
        }
      }
    }

    return NextResponse.json({ 
      document: updatedDocument,
      message: `Document status changed to ${status}` 
    });

  } catch (error) {
    console.error('Error changing document status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to change document status',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
