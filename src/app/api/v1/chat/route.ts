import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { inputSanitize, validateUuid } from '@/lib/security';

// ── Types ───────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  avatar?: string;
  status?: 'sent' | 'delivered' | 'read';
  isBot?: boolean;
  reactions?: Record<string, number>;
}

// ── In-memory message store (fallback when WebSocket service is not available) ──

const messageStore: ChatMessage[] = [];

// Seed demo data
const demoMessages: Omit<ChatMessage, 'timestamp'>[] = [
  { id: 'msg1', channelId: 'c1', senderId: 'u6', senderName: 'Alex Turner', content: 'Good morning team! Quick update on the roadmap.', status: 'read', reactions: { '👍': 2 } },
  { id: 'msg2', channelId: 'c1', senderId: 'u1', senderName: 'Sarah Chen', content: 'Morning! The new build is deployed to staging. Can everyone test?', status: 'read', reactions: { '🚀': 3 } },
  { id: 'msg3', channelId: 'c1', senderId: 'u2', senderName: 'Mike Johnson', content: 'Testing now. The video quality improvements are noticeable!', status: 'read' },
  { id: 'msg4', channelId: 'c1', senderId: 'u5', senderName: 'Lisa Park', content: 'Confirmed! The AI summaries are much better too. Great work on the prompt engineering.', status: 'read', reactions: { '❤️': 1, '🔥': 2 } },
  { id: 'msg5', channelId: 'c1', senderId: 'u3', senderName: 'Emily Davis', content: 'The new UI is clean. One small thing - the participant grid could use better spacing on mobile.', status: 'delivered' },
  { id: 'msg6', channelId: 'c2', senderId: 'u2', senderName: 'Mike Johnson', content: 'PR ready for review: refactor/auth-service', status: 'read' },
  { id: 'msg7', channelId: 'c2', senderId: 'u1', senderName: 'Sarah Chen', content: 'Looking at it now. The JWT handling looks clean.', status: 'read' },
  { id: 'msg8', channelId: 'c5', senderId: 'u6', senderName: 'Alex Turner', content: 'Team offsite next Friday — please RSVP by Wednesday.', status: 'read', reactions: { '👍': 4 } },
  { id: 'msg9', channelId: 'c3', senderId: 'u5', senderName: 'Lisa Park', content: 'Check out this article on WebRTC optimisation.', status: 'read' },
];

for (const dm of demoMessages) {
  messageStore.push({
    ...dm,
    timestamp: new Date(Date.now() - Math.random() * 3600_000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
  });
}

const MAX_MESSAGES = 500;

// ── GET: fetch messages for a channel ───────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel') || 'c1';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const channelMessages = messageStore
      .filter(m => m.channelId === channel)
      .slice(-limit);

    return NextResponse.json({
      success: true,
      data: {
        channel,
        messages: channelMessages,
        total: messageStore.filter(m => m.channelId === channel).length,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch messages' } },
      { status: 500 }
    );
  }
}

// ── POST: send a new message ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const { channelId } = body;

    // Validate channelId
    if (!channelId || typeof channelId !== 'string' || channelId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required field: channelId' } },
        { status: 400 }
      );
    }

    // Sanitize content — senderId and senderName are FORCED from auth
    const content = inputSanitize(body.content, 5000, 'content');

    // Force senderId and senderName from authenticated user to prevent impersonation
    const msg: ChatMessage = {
      id: `http-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      channelId: channelId.trim(),
      senderId: user.id,        // FORCED from auth — ignore client-provided senderId
      senderName: user.name,    // FORCED from auth — ignore client-provided senderName
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      avatar: user.avatar || undefined,
      status: 'sent',
      isBot: false,
      reactions: {},
    };

    messageStore.push(msg);

    // Trim old messages
    if (messageStore.length > MAX_MESSAGES) {
      messageStore.splice(0, messageStore.length - MAX_MESSAGES);
    }

    return NextResponse.json({ success: true, data: { message: msg } }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request body' } },
      { status: 400 }
    );
  }
}
