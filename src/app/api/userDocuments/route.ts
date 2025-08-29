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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    
    if (userId) {
      const userDocuments = (db.userDocuments || []).filter((doc: UserDocument) => doc.userId === parseInt(userId));
      return NextResponse.json(userDocuments);
    }
    
    return NextResponse.json(db.userDocuments || []);
  } catch (error) {
    console.error('Error reading userDocuments:', error);
    return NextResponse.json({ error: 'Failed to fetch user documents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    
    const newDocument = {
      id: Date.now().toString(),
      ...body
    };
    
    db.userDocuments = db.userDocuments || [];
    db.userDocuments.push(newDocument);
    
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    
    return NextResponse.json(newDocument, { status: 201 });
  } catch (error) {
    console.error('Error creating userDocument:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
