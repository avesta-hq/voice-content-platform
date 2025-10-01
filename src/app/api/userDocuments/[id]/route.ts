import { NextRequest, NextResponse } from 'next/server';
import { hybridStorageService } from '@/lib/hybridStorageService';
import { UserDocument } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Try draft DB first
    const db = await hybridStorageService.getDatabase();
    
    if (db && db.userDocuments) {
      const document = (db.userDocuments || []).find((doc: UserDocument) => doc.id === id);
      if (document) {
        return NextResponse.json(document);
      }
    }

    // Fallback to completed DB (blog.json)
    const blogDb = await hybridStorageService.getBlogDatabase();
    if (blogDb && blogDb.userDocuments) {
      const document = (blogDb.userDocuments || []).find((doc: UserDocument) => doc.id === id);
      if (document) {
        return NextResponse.json(document);
      }
    }

    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  } catch (error) {
    console.error('Error reading userDocument:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Try draft database first
    const draftDb = await hybridStorageService.getDatabase();
    
    if (!draftDb) {
      return NextResponse.json({ error: 'Draft database not found' }, { status: 500 });
    }
    
    // Initialize userDocuments array if it doesn't exist
    draftDb.userDocuments = draftDb.userDocuments || [];
    
    const draftDocumentIndex = draftDb.userDocuments.findIndex((doc: UserDocument) => doc.id === id);
    
    if (draftDocumentIndex !== -1) {
      // Document found in draft database - update it
      draftDb.userDocuments[draftDocumentIndex] = {
        ...draftDb.userDocuments[draftDocumentIndex],
        ...body,
        updatedAt: new Date().toISOString()
      };
      
      // Save draft database
      await hybridStorageService.saveDatabase(draftDb);
      
      return NextResponse.json(draftDb.userDocuments[draftDocumentIndex]);
    }
    
    // Document not found in draft database, try completed database (blog.json)
    const completedDb = await hybridStorageService.getBlogDatabase();
    
    if (!completedDb) {
      return NextResponse.json({ error: 'Completed database not found' }, { status: 500 });
    }
    
    // Initialize userDocuments array if it doesn't exist
    completedDb.userDocuments = completedDb.userDocuments || [];
    
    const completedDocumentIndex = completedDb.userDocuments.findIndex((doc: UserDocument) => doc.id === id);
    
    if (completedDocumentIndex !== -1) {
      // Document found in completed database - update it
      completedDb.userDocuments[completedDocumentIndex] = {
        ...completedDb.userDocuments[completedDocumentIndex],
        ...body,
        updatedAt: new Date().toISOString()
      };
      
      // Save completed database
      await hybridStorageService.saveBlogDatabase(completedDb);
      
      return NextResponse.json(completedDb.userDocuments[completedDocumentIndex]);
    }
    
    // Document not found in either database
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    
  } catch (error) {
    console.error('Error updating userDocument:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Try draft database first
    const draftDb = await hybridStorageService.getDatabase();
    
    if (!draftDb) {
      return NextResponse.json({ error: 'Draft database not found' }, { status: 500 });
    }
    
    // Initialize userDocuments array if it doesn't exist
    draftDb.userDocuments = draftDb.userDocuments || [];
    
    const draftDocumentIndex = draftDb.userDocuments.findIndex((doc: UserDocument) => doc.id === id);
    
    if (draftDocumentIndex !== -1) {
      // Document found in draft database - update it
      const existing = draftDb.userDocuments[draftDocumentIndex];
      let nextGeneratedContent = existing.generatedContent;
      if (body && typeof body === 'object' && 'generatedContent' in body && body.generatedContent) {
        nextGeneratedContent = { ...(existing.generatedContent || {}), ...body.generatedContent };
      }

      draftDb.userDocuments[draftDocumentIndex] = {
        ...existing,
        ...body,
        ...(nextGeneratedContent ? { generatedContent: nextGeneratedContent } : {}),
        updatedAt: new Date().toISOString()
      };
      
      // Save draft database
      await hybridStorageService.saveDatabase(draftDb);
      
      return NextResponse.json(draftDb.userDocuments[draftDocumentIndex]);
    }
    
    // Document not found in draft database, try completed database (blog.json)
    const completedDb = await hybridStorageService.getBlogDatabase();
    
    if (!completedDb) {
      return NextResponse.json({ error: 'Completed database not found' }, { status: 500 });
    }
    
    // Initialize userDocuments array if it doesn't exist
    completedDb.userDocuments = completedDb.userDocuments || [];
    
    const completedDocumentIndex = completedDb.userDocuments.findIndex((doc: UserDocument) => doc.id === id);
    
    if (completedDocumentIndex !== -1) {
      // Document found in completed database - update it
      const existing = completedDb.userDocuments[completedDocumentIndex];
      let nextGeneratedContent = existing.generatedContent;
      if (body && typeof body === 'object' && 'generatedContent' in body && body.generatedContent) {
        nextGeneratedContent = { ...(existing.generatedContent || {}), ...body.generatedContent };
      }

      completedDb.userDocuments[completedDocumentIndex] = {
        ...existing,
        ...body,
        ...(nextGeneratedContent ? { generatedContent: nextGeneratedContent } : {}),
        updatedAt: new Date().toISOString()
      };
      
      // Save completed database
      await hybridStorageService.saveBlogDatabase(completedDb);
      
      return NextResponse.json(completedDb.userDocuments[completedDocumentIndex]);
    }
    
    // Document not found in either database
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    
  } catch (error) {
    console.error('Error updating userDocument:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Try draft database first
    const draftDb = await hybridStorageService.getDatabase();
    
    if (!draftDb) {
      return NextResponse.json({ error: 'Draft database not found' }, { status: 500 });
    }
    
    // Initialize userDocuments array if it doesn't exist
    draftDb.userDocuments = draftDb.userDocuments || [];
    
    const draftDocumentIndex = draftDb.userDocuments.findIndex((doc: UserDocument) => doc.id === id);
    
    if (draftDocumentIndex !== -1) {
      // Document found in draft database - delete it
      draftDb.userDocuments.splice(draftDocumentIndex, 1);
      
      // Save draft database
      await hybridStorageService.saveDatabase(draftDb);
      
      return NextResponse.json({ message: 'Document deleted successfully' });
    }
    
    // Document not found in draft database, try completed database (blog.json)
    const completedDb = await hybridStorageService.getBlogDatabase();
    
    if (!completedDb) {
      return NextResponse.json({ error: 'Completed database not found' }, { status: 500 });
    }
    
    // Initialize userDocuments array if it doesn't exist
    completedDb.userDocuments = completedDb.userDocuments || [];
    
    const completedDocumentIndex = completedDb.userDocuments.findIndex((doc: UserDocument) => doc.id === id);
    
    if (completedDocumentIndex !== -1) {
      // Document found in completed database - delete it
      completedDb.userDocuments.splice(completedDocumentIndex, 1);
      
      // Save completed database
      await hybridStorageService.saveBlogDatabase(completedDb);
      
      return NextResponse.json({ message: 'Document deleted successfully' });
    }
    
    // Document not found in either database
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    
  } catch (error) {
    console.error('Error deleting userDocument:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
