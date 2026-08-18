'use client';

import type { PollData as WSPollData } from '@/hooks/useMeetingRoom';

// ─── Interfaces ───────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  sender: string;
  initials: string;
  color: string;
  text: string;
  time: string;
  isSystem?: boolean;
  isAI?: boolean;
  reactions?: string[];
}

export interface Participant {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: 'Host' | 'Co-host' | 'Presenter' | 'Participant';
  micOn: boolean;
  videoOn: boolean;
  online?: boolean;
  handRaised?: boolean;
  isLocal?: boolean;
}

export interface BreakoutRoom {
  id: string;
  name: string;
  participantIds: string[];
  timerSeconds: number;
}

export interface WaitingParticipant {
  id: string;
  name: string;
  initials: string;
  color: string;
  joinTime: string;
}

export interface PollData {
  id: string;
  question: string;
  options: { label: string; votes: number; percentage: number; voted?: boolean }[];
  totalVotes: number;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor';

// ─── Mock Data ──────────────────────────────────────────────
export const mockParticipants: Participant[] = [
  { id: '1', name: 'Alex Johnson', initials: 'AJ', color: 'bg-blue-500', role: 'Host', micOn: true, videoOn: true, online: true },
  { id: '2', name: 'Sarah Chen', initials: 'SC', color: 'bg-pink-500', role: 'Co-host', micOn: true, videoOn: true, online: true, handRaised: true },
  { id: '3', name: 'Maya Patel', initials: 'MP', color: 'bg-emerald-500', role: 'Participant', micOn: false, videoOn: true, online: true },
  { id: '4', name: 'James Wilson', initials: 'JW', color: 'bg-orange-500', role: 'Participant', micOn: true, videoOn: false, online: true },
  { id: '5', name: 'Emily Zhang', initials: 'EZ', color: 'bg-violet-500', role: 'Participant', micOn: true, videoOn: true, online: true },
  { id: '6', name: 'David Kim', initials: 'DK', color: 'bg-cyan-500', role: 'Participant', micOn: false, videoOn: false, online: false },
  { id: '7', name: 'Lisa Brown', initials: 'LB', color: 'bg-rose-500', role: 'Participant', micOn: true, videoOn: true, online: true },
  { id: '8', name: 'Tom Garcia', initials: 'TG', color: 'bg-amber-500', role: 'Participant', micOn: false, videoOn: true, online: true },
];

export const aiSuggestions = [
  'Summarize this meeting',
  'List action items',
  'Key decisions made',
  'Translate to French',
  'Identify risks',
];

export const aiResponses: { [key: string]: string } = {
  'Summarize this meeting': '## Meeting Summary\n\nThe team discussed sprint planning for Q4. Key topics included backlog prioritization, velocity improvements from last sprint (15% increase), and tech debt allocation. The team agreed to allocate 20% of capacity to tech debt. Action items were assigned to Sarah (backlog grooming), James (velocity report), and Maya (capacity planning).',
  'List action items': '**Action Items:**\n\n1. **Sarah Chen** - Groom and prioritize backlog items by EOD Tuesday\n2. **James Wilson** - Share velocity report with stakeholders\n3. **Maya Patel** - Update capacity planning spreadsheet\n4. **Alex Johnson** - Schedule follow-up with product team\n5. **Emily Zhang** - Create tech debt JIRA epic',
  'Key decisions made': '**Key Decisions:**\n\n1. Sprint velocity target set to 42 story points\n2. 20% capacity allocated to tech debt reduction\n3. Daily standups moved to 9:30 AM\n4. New feature: Real-time collaboration will be prioritized\n5. Code review SLA reduced from 24h to 12h',
  'Translate to French': '## R\u00e9sum\u00e9 de la r\u00e9union\n\nL\'\u00e9quipe a discut\u00e9 de la planification du sprint pour le T4. Les sujets principaux incluaient la prioritisation du backlog, les am\u00e9liorations de v\u00e9locit\u00e9 du dernier sprint (augmentation de 15%), et l\'allocation de la dette technique.',
  'Identify risks': '**Identified Risks:**\n\n1. **High** - Key engineer (David) on PTO next week during critical feature development\n2. **Medium** - Third-party API dependency may cause delays for authentication module\n3. **Medium** - Scope creep risk with 3 new feature requests from stakeholders\n4. **Low** - Testing environment capacity may need scaling for E2E tests',
};

export const reactionEmojis = ['👍', '❤️', '😂', '🎉', '🤔', '👏'];

export const initialBreakoutRooms: BreakoutRoom[] = [
  { id: 'br-1', name: 'Backend Architecture', participantIds: ['2', '3', '4'], timerSeconds: 600 },
  { id: 'br-2', name: 'Frontend UI Review', participantIds: ['5', '7', '8'], timerSeconds: 600 },
  { id: 'br-3', name: 'DevOps & Infra', participantIds: ['1'], timerSeconds: 600 },
];

export const mockWaitingParticipants: WaitingParticipant[] = [
  { id: 'w-1', name: 'Ryan Foster', initials: 'RF', color: 'bg-teal-500', joinTime: '2m ago' },
  { id: 'w-2', name: 'Nina Rossi', initials: 'NR', color: 'bg-fuchsia-500', joinTime: '5m ago' },
];

export const networkQualityConfig: Record<NetworkQuality, { color: string; barColor: string; latency: [number, number]; label: string }> = {
  excellent: { color: 'text-emerald-400', barColor: 'bg-emerald-400', latency: [10, 40], label: 'Excellent' },
  good: { color: 'text-yellow-400', barColor: 'bg-yellow-400', latency: [40, 90], label: 'Good' },
  fair: { color: 'text-orange-400', barColor: 'bg-orange-400', latency: [90, 180], label: 'Fair' },
  poor: { color: 'text-red-400', barColor: 'bg-red-400', latency: [180, 400], label: 'Poor' },
};

// ─── Helpers ──────────────────────────────────────────────────
const colorToGradient: Record<string, string> = {
  'bg-blue-500': 'from-blue-600 via-blue-700 to-slate-900',
  'bg-pink-500': 'from-pink-600 via-pink-700 to-slate-900',
  'bg-green-500': 'from-emerald-600 via-emerald-700 to-slate-900',
  'bg-emerald-500': 'from-emerald-600 via-emerald-700 to-slate-900',
  'bg-orange-500': 'from-orange-600 via-orange-700 to-slate-900',
  'bg-violet-500': 'from-violet-600 via-violet-700 to-slate-900',
  'bg-cyan-500': 'from-cyan-600 via-cyan-700 to-slate-900',
  'bg-rose-500': 'from-rose-600 via-rose-700 to-slate-900',
  'bg-amber-500': 'from-amber-600 via-amber-700 to-slate-900',
};

export function getGradient(color: string) {
  return colorToGradient[color] || 'from-slate-700 via-slate-800 to-slate-900';
}

export function getRoleBadgeClass(role: string) {
  switch (role) {
    case 'Host': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'Co-host': return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
    default: return 'bg-white/10 text-white/50 border-white/10';
  }
}

// Deterministic color from name (for WS-sourced messages)
const nameColors = ['bg-blue-500', 'bg-pink-500', 'bg-emerald-500', 'bg-orange-500', 'bg-violet-500', 'bg-cyan-500', 'bg-rose-500', 'bg-amber-500'];
export function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return nameColors[Math.abs(hash) % nameColors.length];
}

export function nameToInitials(name: string): string {
  return name.split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2);
}

// Map WS ChatMessage to local ChatMessage format
export function wsMsgToLocal(msg: { id: string; senderId: string; senderName: string; content: string; timestamp: string }): ChatMessage {
  const color = nameToColor(msg.senderName);
  return {
    id: msg.id,
    sender: msg.senderName,
    initials: nameToInitials(msg.senderName),
    color,
    text: msg.content,
    time: msg.timestamp,
  };
}

// Map WS PollData to local PollData format
export function wsPollToLocal(poll: WSPollData): PollData {
  return {
    id: poll.id,
    question: poll.question,
    options: poll.options.map(o => ({
      label: o.label,
      votes: o.votes,
      percentage: o.percentage,
    })),
    totalVotes: poll.totalVotes,
  };
}
