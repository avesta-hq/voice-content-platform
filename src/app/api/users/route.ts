import { NextRequest, NextResponse } from 'next/server';
import { hybridStorageService } from '@/lib/hybridStorageService';
import { User } from '@/types';

export async function GET() {
  try {
    const users = await hybridStorageService.getUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error reading users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get current database
    const db = await hybridStorageService.getDatabase();
    
    if (!db || !db.users) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }
    
    // Generate new user ID (next available ID)
    const nextId = Math.max(...db.users.map((user: User) => user.id), 0) + 1;
    
    const newUser = {
      id: nextId,
      username: body.username || `user_${nextId}`,
      email: body.email || `user${nextId}@example.com`,
      firstName: body.firstName || 'New',
      lastName: body.lastName || 'User',
      role: body.role || 'user',
      avatar: body.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isActive: true,
      preferences: {
        defaultInputLanguage: body.defaultInputLanguage || 'en',
        defaultOutputLanguage: body.defaultOutputLanguage || 'en',
        theme: body.theme || 'light'
      }
    };
    
    // Add to database
    db.users.push(newUser);
    
    // Save database
    await hybridStorageService.saveDatabase(db);
    
    return NextResponse.json(newUser, { status: 201 });
    
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
