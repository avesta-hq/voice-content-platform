import { NextRequest, NextResponse } from 'next/server';
import { hybridStorageService } from '@/lib/hybridStorageService';
import { User } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const users = await hybridStorageService.getUsers();
    const user = users.find((u: User) => u.id === userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();
    const { phoneNumber } = body;

    // Validate phone number if provided
    if (phoneNumber) {
      // E.164 format validation
      const e164Regex = /^\+?[1-9]\d{1,14}$/;
      if (!e164Regex.test(phoneNumber)) {
        return NextResponse.json(
          { error: 'Invalid phone number format. Please use E.164 format (e.g., +1234567890)' },
          { status: 400 }
        );
      }
    }

    // Get current database
    const db = await hybridStorageService.getDatabase();
    const blogDb = await hybridStorageService.getBlogDatabase();

    if (!db || !db.users) {
      return NextResponse.json({ error: 'Database not found' }, { status: 500 });
    }

    // Find and update user
    const userIndex = db.users.findIndex((u: User) => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user with new phone number
    db.users[userIndex] = {
      ...db.users[userIndex],
      phoneNumber: phoneNumber || db.users[userIndex].phoneNumber,
      lastLogin: new Date().toISOString(),
    };

    // Update blog database if it exists
    if (blogDb && blogDb.users) {
      const blogUserIndex = blogDb.users.findIndex((u: User) => u.id === userId);
      if (blogUserIndex !== -1) {
        blogDb.users[blogUserIndex] = {
          ...blogDb.users[blogUserIndex],
          phoneNumber: phoneNumber || blogDb.users[blogUserIndex].phoneNumber,
          lastLogin: new Date().toISOString(),
        };
      }
    }

    // Save both databases
    await Promise.all([
      hybridStorageService.saveDatabase(db),
      ...(blogDb ? [hybridStorageService.saveBlogDatabase(blogDb)] : []),
    ]);

    return NextResponse.json(db.users[userIndex], { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
