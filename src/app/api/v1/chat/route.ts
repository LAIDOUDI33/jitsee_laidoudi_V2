import { NextRequest, NextResponse } from 'next/server'

// ── Types ───────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  channelId: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  avatar?: string
  status?: 'sent' | 'delivered' | 'read'
  isBot?: boolean
  reactions?: Record<string, number>
}

// ── In-memory message store (fallback when WebSocket service is not available) ──

const messageStore: ChatMessage[] = []

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
]

for (const dm of demoMessages) {
  messageStore.push({
    ...dm,
    timestamp: new Date(Date.now() - Math.random() * 3600_000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
  })
}

const MAX_MESSAGES = 500

// ── GET: fetch messages for a channel ───────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const channel = searchParams.get('channel') || 'c1'
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

  const channelMessages = messageStore
    .filter(m => m.channelId === channel)
    .slice(-limit)

  return NextResponse.json({
    channel,
    messages: channelMessages,
    total: messageStore.filter(m => m.channelId === channel).length,
  })
}

// ── POST: send a new message ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { channelId, senderId, senderName, content, avatar, isBot } = body

    if (!channelId || !content || !senderName) {
      return NextResponse.json(
        { error: 'Missing required fields: channelId, senderName, content' },
        { status: 400 }
      )
    }

    const msg: ChatMessage = {
      id: `http-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      channelId,
      senderId: senderId || 'anonymous',
      senderName,
      content: content.slice(0, 5000), // safety limit
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      avatar: avatar || undefined,
      status: 'sent',
      isBot: isBot || false,
      reactions: {},
    }

    messageStore.push(msg)

    // Trim old messages
    if (messageStore.length > MAX_MESSAGES) {
      messageStore.splice(0, messageStore.length - MAX_MESSAGES)
    }

    return NextResponse.json({ message: msg }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
