'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Hand, MicOff, VideoOff, ChevronDown, Star, Crown, MonitorUp, MessageCircle, Mic, SmilePlus, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { type Participant, type ParticipantPermissions, mockParticipants } from './meeting-data';
import WaitingRoom from './WaitingRoom';

// ─── Props ─────────────────────────────────────────────────────
export interface ParticipantListProps {
  effectiveHandRaisedIds: Set<string>;
  onlineCount: number;
  spotlightedParticipant: string | null;
  onSpotlightChange: (id: string | null) => void;
  cohosts: Set<string>;
  onCohostToggle: (id: string) => void;
  onMuteAll: () => void;
  participantPermissions: Record<string, ParticipantPermissions>;
  onPermissionsChange: (id: string, perms: ParticipantPermissions) => void;
  isHost: boolean;
}

// ─── Permissions Dialog ─────────────────────────────────────────
function PermissionsPanel({
  participant,
  permissions,
  onPermissionsChange,
  open,
  onOpenChange,
}: {
  participant: Participant;
  permissions: ParticipantPermissions;
  onPermissionsChange: (perms: ParticipantPermissions) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const togglePerm = (key: keyof ParticipantPermissions) => {
    const next = { ...permissions, [key]: !permissions[key] };
    onPermissionsChange(next);
    const labels: Record<keyof ParticipantPermissions, string> = {
      canShareScreen: 'Share Screen',
      canChat: 'Chat',
      canUnmute: 'Unmute',
      canUseReactions: 'Reactions',
    };
    toast.success(`${participant.name}: ${labels[key]} ${next[key] ? 'enabled' : 'disabled'}`);
  };

  const permItems: { key: keyof ParticipantPermissions; label: string; icon: React.ReactNode }[] = [
    { key: 'canShareScreen', label: 'Can Share Screen', icon: <MonitorUp size={16} /> },
    { key: 'canChat', label: 'Can Chat', icon: <MessageCircle size={16} /> },
    { key: 'canUnmute', label: 'Can Unmute', icon: <Mic size={16} /> },
    { key: 'canUseReactions', label: 'Can Use Reactions', icon: <SmilePlus size={16} /> },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Participant Permissions</DialogTitle>
          <DialogDescription className="text-white/50">
            Manage permissions for {participant.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 mb-4 px-3 py-2 rounded-xl bg-white/5">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarFallback className={`${participant.color} text-white text-sm font-bold`}>{participant.initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-white">{participant.name}</p>
              <p className="text-xs text-white/40">{participant.role}</p>
            </div>
          </div>
          <div className="space-y-3">
            {permItems.map(({ key, label, icon }) => (
              <div key={key} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-white/60">{icon}</span>
                  <Label className="text-sm text-white/80 cursor-pointer">{label}</Label>
                </div>
                <Switch
                  checked={permissions[key]}
                  onCheckedChange={() => togglePerm(key)}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 text-white/70 hover:text-white hover:bg-white/10"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Component ─────────────────────────────────────────────────
export default function ParticipantList({
  effectiveHandRaisedIds,
  onlineCount,
  spotlightedParticipant,
  onSpotlightChange,
  cohosts,
  onCohostToggle,
  onMuteAll,
  participantPermissions,
  onPermissionsChange,
  isHost,
}: ParticipantListProps) {
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantRoles, setParticipantRoles] = useState<Record<string, Participant['role']>>(
    Object.fromEntries(mockParticipants.map(p => [p.id, p.role]))
  );
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<string | null>(null);
  const [permissionsOpen, setPermissionsOpen] = useState<string | null>(null);
  const [muteAllDialogOpen, setMuteAllDialogOpen] = useState(false);

  // --- Close role dropdown on outside click ---
  useEffect(() => {
    if (!roleDropdownOpen) return;
    const handleClick = () => setRoleDropdownOpen(null);
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [roleDropdownOpen]);

  // --- Default permissions ---
  const getPermissions = useCallback((id: string): ParticipantPermissions => {
    return participantPermissions[id] || { canShareScreen: true, canChat: true, canUnmute: true, canUseReactions: true };
  }, [participantPermissions]);

  const handlePermissionsChange = useCallback((id: string, perms: ParticipantPermissions) => {
    onPermissionsChange(id, perms);
  }, [onPermissionsChange]);

  // --- Sorting: spotlighted first, then co-hosts, then rest ---
  const filteredParticipants = useMemo(() => {
    let list = mockParticipants;
    if (participantSearch.trim()) {
      list = list.filter(p => p.name.toLowerCase().includes(participantSearch.toLowerCase()));
    }
    return [...list].sort((a, b) => {
      // Spotlighted first
      if (a.id === spotlightedParticipant && b.id !== spotlightedParticipant) return -1;
      if (b.id === spotlightedParticipant && a.id !== spotlightedParticipant) return 1;
      // Co-hosts next
      const aIsCohost = cohosts.has(a.id) || a.role === 'Co-host';
      const bIsCohost = cohosts.has(b.id) || b.role === 'Co-host';
      if (aIsCohost && !bIsCohost) return -1;
      if (!aIsCohost && bIsCohost) return 1;
      return 0;
    });
  }, [participantSearch, spotlightedParticipant, cohosts]);

  const handleChangeRole = (participantId: string, newRole: Participant['role']) => {
    setParticipantRoles(prev => ({ ...prev, [participantId]: newRole }));
    setRoleDropdownOpen(null);
    const p = mockParticipants.find(pp => pp.id === participantId);
    toast.success(`Changed ${p?.name || 'participant'} role to ${newRole}`);
  };

  const handleSpotlight = (participantId: string) => {
    if (spotlightedParticipant === participantId) {
      onSpotlightChange(null);
      const p = mockParticipants.find(pp => pp.id === participantId);
      toast.success(`Removed spotlight from ${p?.name || 'participant'}`);
    } else {
      onSpotlightChange(participantId);
      const p = mockParticipants.find(pp => pp.id === participantId);
      toast.success(`Spotlighted ${p?.name || 'participant'}`);
    }
    setRoleDropdownOpen(null);
  };

  const handleCohostToggle = (participantId: string) => {
    onCohostToggle(participantId);
    setRoleDropdownOpen(null);
  };

  const handleMuteAllConfirm = () => {
    onMuteAll();
    setMuteAllDialogOpen(false);
  };

  // Permissions dialog participant
  const permsParticipant = useMemo(
    () => (permissionsOpen ? mockParticipants.find(p => p.id === permissionsOpen) || null : null),
    [permissionsOpen]
  );

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
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs outline-none placeholder:text-white/25 focus:border-emerald-500/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {isHost && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMuteAllDialogOpen(true)}
              className="h-6 text-[10px] border-white/10 hover:bg-white/10 text-white/60 hover:text-white rounded-md px-2"
            >
              <MicOff size={11} className="mr-1" /> Mute All
            </Button>
          )}
          {isHost && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.success('All cameras turned off')}
              className="h-6 text-[10px] border-white/10 hover:bg-white/10 text-white/60 hover:text-white rounded-md px-2"
            >
              <VideoOff size={11} className="mr-1" /> Video Off All
            </Button>
          )}
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
            const currentRole = cohosts.has(p.id) ? 'Co-host' : (participantRoles[p.id] || p.role);
            const isCohost = cohosts.has(p.id) || p.role === 'Co-host';
            const isSpotlighted = spotlightedParticipant === p.id;
            const isSelf = p.id === '1';

            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group ${
                  p.online === false ? 'opacity-50' : ''
                } ${isSpotlighted ? 'bg-amber-500/5 border border-amber-500/20' : ''}`}
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-medium truncate">{p.name}</span>
                    {/* Spotlight golden star */}
                    {isSpotlighted && (
                      <motion.span
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="text-amber-400"
                        title="Spotlighted"
                      >
                        <Star size={12} fill="currentColor" />
                      </motion.span>
                    )}
                    {/* Co-host crown */}
                    {isCohost && (
                      <span className="text-teal-400" title="Co-host">
                        <Crown size={12} fill="currentColor" />
                      </span>
                    )}
                    {/* You badge */}
                    {isSelf && <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300">You</span>}
                    {/* Co-host badge */}
                    {isCohost && !isSelf && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-teal-500/20 text-teal-300">Co-host</span>
                    )}
                  </div>
                  <span className="text-[10px] text-white/30">{isSelf ? 'Host' : currentRole}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!p.micOn && <MicOff size={12} className="text-red-400" />}
                  {!p.videoOn && <VideoOff size={12} className="text-white/30" />}
                  {/* More (permissions) button */}
                  {isHost && !isSelf && (
                    <button
                      onClick={() => setPermissionsOpen(p.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded flex items-center justify-center hover:bg-white/10"
                      title="Permissions"
                    >
                      <MoreHorizontal size={12} className="text-white/40" />
                    </button>
                  )}
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
                          className="absolute right-0 top-full mt-1 w-44 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                        >
                          <div className="p-1">
                            {/* Host-only actions */}
                            {isHost && !isSelf && (
                              <>
                                <button
                                  onClick={() => handleSpotlight(p.id)}
                                  className={`w-full px-3 py-1.5 text-left text-[11px] rounded-lg transition-colors flex items-center gap-2 ${
                                    isSpotlighted ? 'bg-amber-500/15 text-amber-300' : 'text-white/60 hover:bg-white/5 hover:text-white'
                                  }`}
                                >
                                  <Star size={12} className={isSpotlighted ? 'fill-amber-400 text-amber-400' : ''} />
                                  {isSpotlighted ? 'Remove Spotlight' : 'Spotlight'}
                                </button>
                                <button
                                  onClick={() => handleCohostToggle(p.id)}
                                  className={`w-full px-3 py-1.5 text-left text-[11px] rounded-lg transition-colors flex items-center gap-2 ${
                                    isCohost ? 'bg-teal-500/15 text-teal-300' : 'text-white/60 hover:bg-white/5 hover:text-white'
                                  }`}
                                >
                                  <Crown size={12} className={isCohost ? 'fill-teal-400 text-teal-400' : ''} />
                                  {isCohost ? 'Remove Co-host' : 'Make Co-host'}
                                </button>
                              </>
                            )}
                            {/* Role change */}
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

      {/* Permissions Dialog */}
      {permsParticipant && (
        <PermissionsPanel
          participant={permsParticipant}
          permissions={getPermissions(permsParticipant.id)}
          onPermissionsChange={(perms) => handlePermissionsChange(permsParticipant.id, perms)}
          open={permissionsOpen === permsParticipant.id}
          onOpenChange={(open) => { if (!open) setPermissionsOpen(null); }}
        />
      )}

      {/* Mute All Confirmation Dialog */}
      <AlertDialog open={muteAllDialogOpen} onOpenChange={setMuteAllDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Mute All Participants?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              This will mute all participants in the meeting. Participants will need to unmute themselves to speak.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white/70 hover:text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMuteAllConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Mute All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
