import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface UserDocument {
  id: string;
  userId: number;
  title: string;
  inputLanguage: string;
  outputLanguage: string;
  createdAt: string;
  updatedAt: string;
  sessions: string[];
  totalDuration: number;
  wordCount: number;
}

interface VoiceSession {
  id: string;
  documentId: string;
  sessionNumber: number;
  transcript: string;
  duration: number;
  timestamp: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    
    const document = (db.userDocuments || []).find((doc: UserDocument) => doc.id === id);
    
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
    
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    
    const documentIndex = (db.userDocuments || []).findIndex((doc: UserDocument) => doc.id === id);
    
    if (documentIndex === -1) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    db.userDocuments[documentIndex] = {
      ...db.userDocuments[documentIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    
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
    
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    
    const documentIndex = (db.userDocuments || []).findIndex((doc: UserDocument) => doc.id === id);
    
    if (documentIndex === -1) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    db.userDocuments[documentIndex] = {
      ...db.userDocuments[documentIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    
    return NextResponse.json(db.userDocuments[documentIndex]);
  } catch (error) {
    console.error('Error patching userDocument:', error);
    return NextResponse.json({ error: 'Failed to patch document' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    
    const documentIndex = (db.userDocuments || []).findIndex((doc: UserDocument) => doc.id === id);
    
    if (documentIndex === -1) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    // Remove the document
    db.userDocuments.splice(documentIndex, 1);
    
    // Also remove related voice sessions
    db.voiceSessions = (db.voiceSessions || []).filter((session: VoiceSession) => session.documentId !== id);
    
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    
    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting userDocument:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
