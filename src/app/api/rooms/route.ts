import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { inputSanitizeOptional } from '@/lib/security';
import { randomUUID } from 'crypto';

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
    const user = await requireAuth();

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

    return NextResponse.json({ success: true, data: { rooms: mapped } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Failed to fetch rooms:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch rooms' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();

    // Sanitize inputs
    const roomName = inputSanitizeOptional(body.name, 100) || generateRoomName();
    const roomDisplayName = inputSanitizeOptional(body.displayName, 200) || roomName;

    // Force hostId from authenticated user — ignore client-provided hostId
    const room = await db.meeting.create({
      data: {
        title: roomDisplayName,
        meetingId: randomUUID(),
        status: 'active',
        host: { connect: { id: user.id } },
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

    return NextResponse.json({ success: true, data: { room: mapped } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Failed to create room:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create room' } },
      { status: 500 }
    );
  }
}
