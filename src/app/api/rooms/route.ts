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
    // Use Meeting model as rooms (meetings ARE rooms in this architecture)
    const rooms = await db.meeting.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        meetingId: true,
        title: true,
        createdAt: true,
        status: true,
      },
    });

    const mapped = rooms.map(r => ({
      id: r.id,
      name: r.meetingId,
      displayName: r.title,
      createdAt: r.createdAt,
      isActive: r.status === 'active',
    }));

    return NextResponse.json({ success: true, rooms: mapped });
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
    const { name, displayName, hostId } = body;

    const roomName = name || generateRoomName();
    const roomDisplayName = displayName || roomName;

    const room = await db.meeting.create({
      data: {
        title: roomDisplayName,
        meetingId: roomName,
        status: 'active',
        host: hostId ? { connect: { id: hostId } } : undefined,
      },
      select: {
        id: true,
        meetingId: true,
        title: true,
        createdAt: true,
      },
    });

    const mapped = {
      id: room.id,
      name: room.meetingId,
      displayName: room.title,
      createdAt: room.createdAt,
    };

    return NextResponse.json({ success: true, room: mapped });
  } catch (error) {
    console.error('Failed to create room:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create room' },
      { status: 500 }
    );
  }
}
