import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/server/auth'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function seed() {
  console.log('Seeding database...')

  const hash = await hashPassword('admin123')
  console.log('Password hash length:', hash.length)

  const org = await prisma.organization.create({
    data: { name: 'Alvision Inc.', domain: 'alvision.ai', plan: 'enterprise', maxUsers: 500, maxMeetingRooms: 100 },
  })
  console.log('Org created:', org.id)

  const sarah = await prisma.user.create({
    data: { email: 'sarah@alvision.ai', name: 'Sarah Chen', passwordHash: hash, role: 'superadmin', isActive: true, organizationId: org.id },
  })
  console.log('Superadmin created:', sarah.id)

  const alex = await prisma.user.create({
    data: { email: 'alex@alvision.ai', name: 'Alex Rivera', passwordHash: hash, role: 'orgadmin', isActive: true, organizationId: org.id },
  })

  const mike = await prisma.user.create({
    data: { email: 'mike@alvision.ai', name: 'Mike Johnson', passwordHash: hash, role: 'teamadmin', isActive: true, organizationId: org.id },
  })

  const jane = await prisma.user.create({
    data: { email: 'jane@alvision.ai', name: 'Jane Wilson', passwordHash: hash, role: 'participant', isActive: true, organizationId: org.id },
  })

  const org2 = await prisma.organization.create({
    data: { name: 'TechCorp', domain: 'techcorp.com', plan: 'pro', maxUsers: 100, maxMeetingRooms: 50 },
  })

  const tom = await prisma.user.create({
    data: { email: 'tom@techcorp.com', name: 'Tom Baker', passwordHash: hash, role: 'orgadmin', isActive: true, organizationId: org2.id },
  })

  const mtg1 = await prisma.meeting.create({
    data: { title: 'Sprint Planning', meetingId: randomUUID(), hostId: sarah.id, organizationId: org.id, status: 'active', startTime: new Date(Date.now() - 3600000) },
  })

  const mtg2 = await prisma.meeting.create({
    data: { title: 'Q4 Review', meetingId: randomUUID(), hostId: alex.id, organizationId: org.id, status: 'ended', startTime: new Date(Date.now() - 86400000 * 3), endTime: new Date(Date.now() - 86400000 * 3 + 3600000) },
  })

  const mtg3 = await prisma.meeting.create({
    data: { title: 'Design Review', meetingId: randomUUID(), hostId: mike.id, organizationId: org.id, status: 'scheduled', startTime: new Date(Date.now() + 86400000) },
  })

  for (const mtg of [mtg1, mtg2, mtg3]) {
    for (const u of [sarah, alex, mike, jane]) {
      await prisma.meetingParticipant.create({
        data: { meetingId: mtg.id, userId: u.id, role: mtg.hostId === u.id ? 'host' : 'participant' },
      })
    }
  }

  await prisma.auditLog.createMany({
    data: [
      { action: 'USER_LOGIN', resource: 'Auth', userId: sarah.id, details: 'Successful login', ipAddress: '192.168.1.100' },
      { action: 'MEETING_CREATED', resource: 'Meeting', resourceId: mtg1.id, userId: sarah.id, details: 'Created Sprint Planning' },
      { action: 'MEETING_ENDED', resource: 'Meeting', resourceId: mtg2.id, userId: alex.id, details: 'Q4 Review ended' },
      { action: 'USER_CREATED', resource: 'User', resourceId: jane.id, userId: sarah.id, details: 'Invited Jane Wilson' },
      { action: 'ORG_SETTINGS_UPDATED', resource: 'Organization', resourceId: org.id, userId: sarah.id, details: 'Updated settings' },
      { action: 'SECURITY_ALERT', resource: 'Security', userId: null, details: 'Failed login attempt', ipAddress: '10.0.0.55' },
    ],
  })

  const team = await prisma.team.create({
    data: { name: 'Engineering', organizationId: org.id },
  })

  await prisma.teamMember.createMany({
    data: [
      { teamId: team.id, userId: sarah.id, role: 'admin' },
      { teamId: team.id, userId: alex.id, role: 'member' },
      { teamId: team.id, userId: mike.id, role: 'member' },
      { teamId: team.id, userId: jane.id, role: 'member' },
    ],
  })

  const conv = await prisma.aiConversation.create({
    data: { userId: sarah.id, title: 'Meeting Summary Help' },
  })

  await prisma.aiConversationMessage.createMany({
    data: [
      { conversationId: conv.id, role: 'user', content: 'Can you summarize my last meeting?' },
      { conversationId: conv.id, role: 'assistant', content: 'The team discussed feature prioritization, resource allocation, and tech debt reduction.' },
    ],
  })

  // ── Sample notifications for superadmin ───────────────────────────
  const now = Date.now()
  await prisma.notification.createMany({
    data: [
      {
        userId: sarah.id,
        type: 'meeting-invite',
        title: 'Design Review Invitation',
        description: 'Mike Johnson invited you to Design Review tomorrow at 10:00 AM.',
        actionUrl: `/meeting/${mtg3.meetingId}`,
        metadata: JSON.stringify({ meetingId: mtg3.id, inviterName: 'Mike Johnson' }),
        createdAt: new Date(now - 15 * 60 * 1000), // 15 min ago
      },
      {
        userId: sarah.id,
        type: 'meeting-soon',
        title: 'Sprint Planning starts soon',
        description: 'Your meeting "Sprint Planning" is starting in 10 minutes.',
        actionUrl: `/meeting/${mtg1.meetingId}`,
        metadata: JSON.stringify({ meetingId: mtg1.id }),
        createdAt: new Date(now - 50 * 60 * 1000), // 50 min ago
      },
      {
        userId: sarah.id,
        type: 'recording-ready',
        title: 'Q4 Review recording is ready',
        description: 'The recording from your meeting "Q4 Review" is now available for download.',
        actionUrl: `/meeting/${mtg2.meetingId}`,
        metadata: JSON.stringify({ meetingId: mtg2.id, duration: 3600 }),
        read: true,
        createdAt: new Date(now - 3 * 86400000), // 3 days ago
      },
      {
        userId: sarah.id,
        type: 'ai-summary',
        title: 'AI summary available for Sprint Planning',
        description: 'Key topics: feature roadmap, sprint velocity, team capacity planning.',
        actionUrl: `/meeting/${mtg1.meetingId}`,
        metadata: JSON.stringify({ meetingId: mtg1.id }),
        createdAt: new Date(now - 2 * 86400000), // 2 days ago
        read: true,
      },
      {
        userId: sarah.id,
        type: 'member-joined',
        title: 'Jane Wilson joined Alvision Inc.',
        description: 'A new member has joined your organization.',
        metadata: JSON.stringify({ newUserId: jane.id }),
        createdAt: new Date(now - 5 * 86400000), // 5 days ago
        read: true,
      },
      {
        userId: sarah.id,
        type: 'security-alert',
        title: 'Unusual login detected',
        description: 'A login attempt was detected from IP 10.0.0.55. If this was not you, please review your security settings.',
        pinned: true,
        createdAt: new Date(now - 30 * 60 * 1000), // 30 min ago
      },
      {
        userId: sarah.id,
        type: 'system-update',
        title: 'Platform updated to v2.4.0',
        description: 'New features: speaker view, waiting rooms, and improved AI summaries.',
        createdAt: new Date(now - 7 * 86400000), // 7 days ago
        read: true,
      },
      {
        userId: sarah.id,
        type: 'file-shared',
        title: 'Alex Rivera shared a file',
        description: 'Q4-roadmap.pdf was shared in Sprint Planning.',
        metadata: JSON.stringify({ fileName: 'Q4-roadmap.pdf', meetingId: mtg1.id }),
        createdAt: new Date(now - 4 * 86400000), // 4 days ago
        read: true,
      },
      {
        userId: sarah.id,
        type: 'mention',
        title: 'You were mentioned in a meeting',
        description: 'Mike Johnson mentioned you during Sprint Planning: "@Sarah can you follow up on the API integration?"',
        metadata: JSON.stringify({ meetingId: mtg1.id, mentionedBy: 'Mike Johnson' }),
        createdAt: new Date(now - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        userId: sarah.id,
        type: 'maintenance',
        title: 'Scheduled maintenance window',
        description: 'ALVISION will undergo maintenance on Saturday from 2:00 AM to 4:00 AM UTC.',
        pinned: true,
        createdAt: new Date(now - 10 * 86400000), // 10 days ago
        read: true,
      },
    ],
  })
  console.log('Notifications seeded for superadmin')

  console.log('Seed complete!')
}

seed().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
