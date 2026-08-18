'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Hand, MicOff, VideoOff, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { type Participant, mockParticipants } from './meeting-data';
import WaitingRoom from './WaitingRoom';

// ─── Props ─────────────────────────────────────────────────────
export interface ParticipantListProps {
  effectiveHandRaisedIds: Set<string>;
  onlineCount: number;
}

// ─── Component ─────────────────────────────────────────────────
export default function ParticipantList({
  effectiveHandRaisedIds,
  onlineCount,
}: ParticipantListProps) {
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantRoles, setParticipantRoles] = useState<Record<string, Participant['role']>>(
    Object.fromEntries(mockParticipants.map(p => [p.id, p.role]))
  );
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<string | null>(null);

  // --- Close role dropdown on outside click ---
  useEffect(() => {
    if (!roleDropdownOpen) return;
    const handleClick = () => setRoleDropdownOpen(null);
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [roleDropdownOpen]);

  const filteredParticipants = useMemo(() => {
    if (!participantSearch.trim()) return mockParticipants;
    return mockParticipants.filter(p => p.name.toLowerCase().includes(participantSearch.toLowerCase()));
  }, [participantSearch]);

  const handleChangeRole = (participantId: string, newRole: Participant['role']) => {
    setParticipantRoles(prev => ({ ...prev, [participantId]: newRole }));
    setRoleDropdownOpen(null);
    const p = mockParticipants.find(pp => pp.id === participantId);
    toast.success(`Changed ${p?.name || 'participant'} role to ${newRole}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search bar + action buttons */}
      <div className="px-3 py-2.5 border-b border-white/10 bg-white/[0.02]">
        <div className="relative mb-2">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={participantSearch}
            onChange={(e) => setParticipantSearch(e.target.value)}
            placeholder="Search participants..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs outline-none placeholder:text-white/25 focus:border-violet-500/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.success('All participants muted')}
            className="h-6 text-[10px] border-white/10 hover:bg-white/10 text-white/60 hover:text-white rounded-md px-2"
          >
            <MicOff size={11} className="mr-1" /> Mute All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.success('All cameras turned off')}
            className="h-6 text-[10px] border-white/10 hover:bg-white/10 text-white/60 hover:text-white rounded-md px-2"
          >
            <VideoOff size={11} className="mr-1" /> Video Off All
          </Button>
        </div>
      </div>

      {/* Hand Raised Queue */}
      {effectiveHandRaisedIds.size > 0 && (
        <div className="px-3 py-2 border-b border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Hand size={11} className="text-amber-400" />
            <span className="text-[10px] font-semibold text-amber-300">Raised Hands ({effectiveHandRaisedIds.size})</span>
          </div>
          <div className="space-y-0.5">
            {mockParticipants.filter(p => effectiveHandRaisedIds.has(p.id)).map(p => (
              <div key={`hr-${p.id}`} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-500/10">
                <Avatar className="w-6 h-6 shrink-0">
                  <AvatarFallback className={`${p.color} text-white text-[8px] font-bold`}>{p.initials}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-amber-200 flex-1 truncate">{p.name}</span>
                <Button
                  size="sm"
                  onClick={() => toast.success(`Lowered ${p.name}'s hand`)}
                  className="h-5 text-[9px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-md px-1.5"
                >
                  Lower
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-2 border-b border-white/10">
        <h3 className="text-xs font-semibold text-white/50">{filteredParticipants.length} Participants ({onlineCount} online)</h3>
      </div>
      <ScrollArea className="flex-1 max-h-96 overflow-y-auto">
        <div className="p-1.5 space-y-0.5">
          {filteredParticipants.map((p) => {
            const currentRole = participantRoles[p.id] || p.role;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group ${
                  p.online === false ? 'opacity-50' : ''
                }`}
              >
                <div className="relative">
                  <Avatar className="w-9 h-9 shrink-0">
                    <AvatarFallback className={`${p.color} text-white text-xs font-bold`}>{p.initials}</AvatarFallback>
                  </Avatar>
                  {/* Online indicator */}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${p.online !== false ? 'bg-emerald-400' : 'bg-white/20'}`} />
                  {/* Hand raised badge */}
                  {effectiveHandRaisedIds.has(p.id) && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                      <Hand size={8} className="text-white" />
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium truncate">{p.name}</span>
                    {p.id === '1' && <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-300">You</span>}
                  </div>
                  <span className="text-[10px] text-white/30">{currentRole}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!p.micOn && <MicOff size={12} className="text-red-400" />}
                  {!p.videoOn && <VideoOff size={12} className="text-white/30" />}
                  <div className="relative">
                    <button
                      onClick={() => setRoleDropdownOpen(roleDropdownOpen === p.id ? null : p.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded flex items-center justify-center hover:bg-white/10"
                    >
                      <ChevronDown size={12} className="text-white/40" />
                    </button>
                    <AnimatePresence>
                      {roleDropdownOpen === p.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute right-0 top-full mt-1 w-36 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                        >
                          <div className="p-1">
                            {(['Host', 'Co-host', 'Presenter', 'Participant'] as const).map(role => (
                              <button
                                key={role}
                                onClick={() => handleChangeRole(p.id, role)}
                                className={`w-full px-3 py-1.5 text-left text-[11px] rounded-lg transition-colors ${currentRole === role ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                              >
                                {role}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Waiting Room */}
      <WaitingRoom />
    </div>
  );
}
