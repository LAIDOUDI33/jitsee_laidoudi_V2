import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function generateRoomName(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'meet-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET() {
  try {
    const rooms = await db.meetingRoom.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        displayName: true,
        createdAt: true,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, rooms });
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, displayName, hostName, hostEmail } = body;

    const roomName = name || generateRoomName();
    const roomDisplayName = displayName || roomName;

    // Check if room name already exists
    const existing = await db.meetingRoom.findUnique({
      where: { name: roomName },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Room name already exists. Please try another name.' },
        { status: 400 }
      );
    }

    const room = await db.meetingRoom.create({
      data: {
        name: roomName,
        displayName: roomDisplayName,
        hostName: hostName || null,
        hostEmail: hostEmail || null,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, room });
  } catch (error) {
    console.error('Failed to create room:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create room' },
      { status: 500 }
    );
  }
}
