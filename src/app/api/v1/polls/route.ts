import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/api-auth';
import { inputSanitize, SecurityError, validateUuid } from '@/lib/security';

// ─── GET: List polls for a meeting ─────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get('meetingId');

    if (!meetingId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'meetingId query parameter is required' } },
        { status: 400 }
      );
    }

    const validatedMeetingId = validateUuid(meetingId, 'meetingId');

    // Verify user has access to the meeting
    const meeting = await db.meeting.findUnique({
      where: { id: validatedMeetingId },
      select: { id: true, hostId: true },
    });
    if (!meeting) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Meeting not found' } },
        { status: 404 }
      );
    }

    const isParticipant = await db.meetingParticipant.count({
      where: { meetingId: validatedMeetingId, userId: user.id },
    });
    if (meeting.hostId !== user.id && isParticipant === 0 && user.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this meeting' } },
        { status: 403 }
      );
    }

    const polls = await db.poll.findMany({
      where: { meetingId: validatedMeetingId },
      orderBy: { createdAt: 'desc' },
    });

    // Parse JSON fields and compute display data
    const enriched = polls.map(poll => {
      const options: string[] = JSON.parse(poll.options);
      const results: Record<string, number> = JSON.parse(poll.results);
      const votes: Record<string, number[]> = JSON.parse(poll.votes);
      const totalVotes = Object.keys(votes).length;

      const displayOptions = options.map((label, idx) => {
        const count = results[String(idx)] || 0;
        return {
          label,
          votes: count,
          percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
        };
      });

      // Check if current user has voted
      const userVoteIndices = votes[user.id] || [];
      const userVotedOptions = userVoteIndices.map((i: number) => options[i] || '');

      return {
        id: poll.id,
        meetingId: poll.meetingId,
        question: poll.question,
        options: displayOptions,
        totalVotes,
        status: poll.status,
        multiSelect: poll.multiSelect,
        createdBy: poll.createdBy,
        createdAt: poll.createdAt,
        userVoted: userVoteIndices.length > 0,
        userVotedOptions,
      };
    });

    return NextResponse.json({ success: true, data: { polls: enriched } });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    if (error instanceof SecurityError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 400 }
      );
    }
    console.error('List polls error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch polls' } },
      { status: 500 }
    );
  }
}

// ─── POST: Create a new poll ────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { meetingId, question, options, multiSelect } = body;

    // Validate inputs
    const validatedMeetingId = validateUuid(meetingId, 'meetingId');
    const sanitizedQuestion = inputSanitize(question, 500, 'question');

    if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'options must be an array of 2-6 strings' } },
        { status: 400 }
      );
    }

    // Sanitize each option
    const sanitizedOptions: string[] = [];
    for (let i = 0; i < options.length; i++) {
      const opt = inputSanitize(options[i], 200, `option[${i}]`);
      sanitizedOptions.push(opt);
    }

    // Verify meeting exists and user is host or cohost
    const meeting = await db.meeting.findUnique({
      where: { id: validatedMeetingId },
      select: { id: true, hostId: true },
    });
    if (!meeting) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Meeting not found' } },
        { status: 404 }
      );
    }

    // Only host, cohost, or superadmin can create polls
    const participant = await db.meetingParticipant.findUnique({
      where: { meetingId_userId: { meetingId: validatedMeetingId, userId: user.id } },
    });
    const isHost = meeting.hostId === user.id;
    const isCohost = participant?.role === 'cohost';
    if (!isHost && !isCohost && user.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only the host or co-host can create polls' } },
        { status: 403 }
      );
    }

    // Initialize results and votes as empty
    const results: Record<string, number> = {};
    sanitizedOptions.forEach((_, idx) => { results[String(idx)] = 0; });

    const poll = await db.poll.create({
      data: {
        meetingId: validatedMeetingId,
        question: sanitizedQuestion,
        options: JSON.stringify(sanitizedOptions),
        results: JSON.stringify(results),
        votes: JSON.stringify({}),
        multiSelect: !!multiSelect,
        status: 'active',
        createdBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        poll: {
          id: poll.id,
          meetingId: poll.meetingId,
          question: poll.question,
          options: sanitizedOptions.map((label) => ({ label, votes: 0, percentage: 0 })),
          totalVotes: 0,
          status: poll.status,
          multiSelect: poll.multiSelect,
          createdBy: poll.createdBy,
          createdAt: poll.createdAt,
        },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    if (error instanceof SecurityError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 400 }
      );
    }
    console.error('Create poll error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create poll' } },
      { status: 500 }
    );
  }
}

// ─── PUT: Vote on a poll ────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { pollId, optionIndices } = body;

    const validatedPollId = validateUuid(pollId, 'pollId');

    if (!Array.isArray(optionIndices) || optionIndices.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'optionIndices must be a non-empty array' } },
        { status: 400 }
      );
    }

    // Fetch poll
    const poll = await db.poll.findUnique({
      where: { id: validatedPollId },
    });
    if (!poll) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Poll not found' } },
        { status: 404 }
      );
    }

    if (poll.status === 'ended') {
      return NextResponse.json(
        { success: false, error: { code: 'POLL_ENDED', message: 'This poll has ended' } },
        { status: 400 }
      );
    }

    // Verify user has access to the meeting
    const isParticipant = await db.meetingParticipant.count({
      where: { meetingId: poll.meetingId, userId: user.id },
    });
    const meeting = await db.meeting.findUnique({
      where: { id: poll.meetingId },
      select: { hostId: true },
    });
    if (!meeting || (meeting.hostId !== user.id && isParticipant === 0 && user.role !== 'superadmin')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this poll' } },
        { status: 403 }
      );
    }

    const options: string[] = JSON.parse(poll.options);
    const results: Record<string, number> = JSON.parse(poll.results);
    const votes: Record<string, number[]> = JSON.parse(poll.votes);

    // Validate option indices are in range
    const validIndices = optionIndices.every(
      (i: number) => Number.isInteger(i) && i >= 0 && i < options.length
    );
    if (!validIndices) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid option indices' } },
        { status: 400 }
      );
    }

    // For single-select, only allow one option
    if (!poll.multiSelect && optionIndices.length > 1) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'This poll allows only one choice' } },
        { status: 400 }
      );
    }

    // Check if user already voted
    const existingVote = votes[user.id];
    if (existingVote) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_VOTED', message: 'You have already voted on this poll' } },
        { status: 400 }
      );
    }

    // Apply vote
    votes[user.id] = optionIndices;
    for (const idx of optionIndices) {
      results[String(idx)] = (results[String(idx)] || 0) + 1;
    }

    await db.poll.update({
      where: { id: validatedPollId },
      data: {
        results: JSON.stringify(results),
        votes: JSON.stringify(votes),
      },
    });

    // Compute display data
    const totalVotes = Object.keys(votes).length;
    const displayOptions = options.map((label, idx) => {
      const count = results[String(idx)] || 0;
      return {
        label,
        votes: count,
        percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        poll: {
          id: poll.id,
          meetingId: poll.meetingId,
          question: poll.question,
          options: displayOptions,
          totalVotes,
          status: poll.status,
          multiSelect: poll.multiSelect,
          userVoted: true,
        },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    if (error instanceof SecurityError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 400 }
      );
    }
    console.error('Vote on poll error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to vote on poll' } },
      { status: 500 }
    );
  }
}

// ─── PATCH: End a poll (host only) ──────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { pollId } = body;

    const validatedPollId = validateUuid(pollId, 'pollId');

    const poll = await db.poll.findUnique({
      where: { id: validatedPollId },
    });
    if (!poll) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Poll not found' } },
        { status: 404 }
      );
    }

    // Verify host/cohost
    const meeting = await db.meeting.findUnique({
      where: { id: poll.meetingId },
      select: { hostId: true },
    });
    const participant = await db.meetingParticipant.findUnique({
      where: { meetingId_userId: { meetingId: poll.meetingId, userId: user.id } },
    });
    const isHost = meeting?.hostId === user.id;
    const isCohost = participant?.role === 'cohost';
    if (!isHost && !isCohost && user.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only the host or co-host can end polls' } },
        { status: 403 }
      );
    }

    const updated = await db.poll.update({
      where: { id: validatedPollId },
      data: { status: 'ended' },
    });

    // Compute display data
    const options: string[] = JSON.parse(updated.options);
    const results: Record<string, number> = JSON.parse(updated.results);
    const votes: Record<string, number[]> = JSON.parse(updated.votes);
    const totalVotes = Object.keys(votes).length;

    const displayOptions = options.map((label, idx) => {
      const count = results[String(idx)] || 0;
      return {
        label,
        votes: count,
        percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        poll: {
          id: updated.id,
          meetingId: updated.meetingId,
          question: updated.question,
          options: displayOptions,
          totalVotes,
          status: 'ended',
          multiSelect: updated.multiSelect,
        },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    if (error instanceof SecurityError) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 400 }
      );
    }
    console.error('End poll error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to end poll' } },
      { status: 500 }
    );
  }
}
