import { NextRequest, NextResponse } from 'next/server';
import { hybridStorageService } from '@/lib/hybridStorageService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get current database using hybrid storage
    const db = await hybridStorageService.getDatabase();
    
    if (!db) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }
    
    const document = (db.userDocuments || []).find((doc: any) => doc.id === id);
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    return NextResponse.json(document);
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
    
    // Get current database using hybrid storage
    const db = await hybridStorageService.getDatabase();
    
    if (!db || !db.userDocuments) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }
    
    const documentIndex = db.userDocuments.findIndex((doc: any) => doc.id === id);
    
    if (documentIndex === -1) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    db.userDocuments[documentIndex] = {
      ...db.userDocuments[documentIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    // Save database using hybrid storage
    await hybridStorageService.saveDatabase(db);
    
    return NextResponse.json(db.userDocuments[documentIndex]);
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
    
    // Get current database using hybrid storage
    const db = await hybridStorageService.getDatabase();
    
    if (!db || !db.userDocuments) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }
    
    const documentIndex = db.userDocuments.findIndex((doc: any) => doc.id === id);
    
    if (documentIndex === -1) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    db.userDocuments[documentIndex] = {
      ...db.userDocuments[documentIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    // Save database using hybrid storage
    await hybridStorageService.saveDatabase(db);
    
    return NextResponse.json(db.userDocuments[documentIndex]);
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
    
    // Get current database using hybrid storage
    const db = await hybridStorageService.getDatabase();
    
    if (!db || !db.userDocuments) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }
    
    const documentIndex = db.userDocuments.findIndex((doc: any) => doc.id === id);
    
    if (documentIndex === -1) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    // Remove the document
    const deletedDocument = db.userDocuments.splice(documentIndex, 1)[0];
    
    // Save database using hybrid storage
    await hybridStorageService.saveDatabase(db);
    
    return NextResponse.json({ message: 'Document deleted successfully', deletedDocument });
  } catch (error) {
    console.error('Error deleting userDocument:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
