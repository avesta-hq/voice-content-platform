import { NextRequest, NextResponse } from 'next/server';
import { hybridStorageService } from '@/lib/hybridStorageService';
import { UserDocument } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    const userDocuments = await hybridStorageService.getUserDocuments(userId);
    return NextResponse.json(userDocuments);
  } catch (error) {
    console.error('Error reading userDocuments:', error);
    return NextResponse.json({ error: 'Failed to fetch user documents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get current database
    const db = await hybridStorageService.getDatabase() || { userDocuments: [] };
    
    // Check for duplicate title per user
    const existingDoc = db.userDocuments?.find((doc: UserDocument) => 
      String(doc.userId) === String(body.userId) && doc.title.toLowerCase() === body.title.toLowerCase()
    );

    if (existingDoc) {
      return NextResponse.json({ error: 'Document with this title already exists for this user' }, { status: 400 });
    }

    const newDocument: UserDocument = {
      id: Date.now().toString(),
      userId: body.userId, // Keep as number
      title: body.title,
      inputLanguage: body.inputLanguage || 'en',
      outputLanguage: body.outputLanguage || 'en',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalDuration: 0,
      totalSessions: 0,
      wordCount: 0,
      sessions: [] // Ensure sessions array is always present
    };

    // Add to database
    db.userDocuments = db.userDocuments || [];
    db.userDocuments.push(newDocument);

    // Save database
    await hybridStorageService.saveDatabase(db);

    return NextResponse.json(newDocument, { status: 201 });

  } catch (error) {
    console.error('Error creating userDocument:', error);
    return NextResponse.json({ error: 'Failed to create user document' }, { status: 500 });
  }
}
