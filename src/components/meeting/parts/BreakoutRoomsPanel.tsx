'use client';

import { useState, useEffect } from 'react';
import { X, Plus, ArrowRight, Clock, LayoutGrid, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { type BreakoutRoom, type Participant, mockParticipants, initialBreakoutRooms } from './meeting-data';

// ─── Component ─────────────────────────────────────────────────
export default function BreakoutRoomsPanel() {
  const [breakoutRooms, setBreakoutRooms] = useState<BreakoutRoom[]>(initialBreakoutRooms);
  const [breakoutTimerActive, setBreakoutTimerActive] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingRoomName, setEditingRoomName] = useState('');

  // --- Breakout Rooms countdown timer ---
  useEffect(() => {
    if (!breakoutTimerActive) return;
    const interval = setInterval(() => {
      setBreakoutRooms(prev => {
        const allDone = prev.every(r => r.timerSeconds <= 0);
        if (allDone) { setBreakoutTimerActive(false); return prev; }
        return prev.map(r => r.timerSeconds > 0 ? { ...r, timerSeconds: r.timerSeconds - 1 } : r);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [breakoutTimerActive]);

  const getTimerColor = (seconds: number) => {
    if (seconds <= 60) return 'text-red-400';
    if (seconds <= 180) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Global min timer across all rooms
  const globalMinTimer = breakoutRooms.length > 0 ? Math.min(...breakoutRooms.map(r => r.timerSeconds)) : 0;

  const handleCreateBreakoutRoom = () => {
    if (breakoutRooms.length >= 8) { toast.error('Maximum 8 breakout rooms allowed'); return; }
    const newRoom: BreakoutRoom = {
      id: `br-${Date.now()}`,
      name: `Room ${breakoutRooms.length + 1}`,
      participantIds: [],
      timerSeconds: 600,
    };
    setBreakoutRooms(prev => [...prev, newRoom]);
    toast.success(`Created ${newRoom.name}`);
  };

  const handleDeleteBreakoutRoom = (roomId: string) => {
    setBreakoutRooms(prev => prev.filter(r => r.id !== roomId));
    toast.success('Room removed');
  };

  const handleRenameBreakoutRoom = (roomId: string) => {
    if (!editingRoomName.trim()) { setEditingRoomId(null); return; }
    setBreakoutRooms(prev => prev.map(r => r.id === roomId ? { ...r, name: editingRoomName.trim() } : r));
    setEditingRoomId(null);
    toast.success('Room renamed');
  };

  const handleAutoAssign = () => {
    const assignableIds = mockParticipants.filter(p => p.online !== false).map(p => p.id);
    const shuffled = [...assignableIds].sort(() => Math.random() - 0.5);
    const newRooms = breakoutRooms.map((room, i) => ({
      ...room,
      participantIds: shuffled.slice(
        Math.floor(i * shuffled.length / breakoutRooms.length),
        Math.floor((i + 1) * shuffled.length / breakoutRooms.length)
      ),
    }));
    setBreakoutRooms(newRooms);
    setBreakoutTimerActive(true);
    toast.success('Participants auto-assigned to rooms');
  };

  const handleCloseAllRooms = () => {
    setBreakoutRooms([]);
    setBreakoutTimerActive(false);
    toast.success('All breakout rooms closed');
  };

  const handleJoinBreakoutRoom = (roomName: string) => {
    toast.success(`Joining ${roomName}...`);
  };

  const handleStartTimer = () => {
    setBreakoutTimerActive(true);
    if (!breakoutTimerActive) setBreakoutRooms(prev => prev.map(r => ({ ...r, timerSeconds: 600 })));
    toast.success('Timer started');
  };

  const handleResetTimer = () => {
    setBreakoutRooms(prev => prev.map(r => ({ ...r, timerSeconds: 600 })));
    setBreakoutTimerActive(false);
    toast.success('Timer reset');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Breakout Rooms</h3>
          <Badge variant="secondary" className="h-5 text-[10px] bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-violet-500/20">
            {breakoutRooms.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          {breakoutRooms.length > 0 && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono ${getTimerColor(globalMinTimer)}`}>
              <Clock size={11} />
              {formatCountdown(globalMinTimer)}
            </div>
          )}
          <Button
            size="sm"
            onClick={handleCreateBreakoutRoom}
            disabled={breakoutRooms.length >= 8}
            className="h-7 text-xs bg-violet-600 hover:bg-violet-700 rounded-lg disabled:opacity-40"
          >
            <Plus size={12} className="mr-1" /> Create Room
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      {breakoutRooms.length > 0 && (
        <div className="px-3 py-2 border-b border-white/10 bg-white/[0.01] flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAutoAssign}
            className="h-7 text-[11px] border-white/10 hover:bg-white/10 text-white/70 hover:text-white rounded-lg"
          >
            <Shuffle size={12} className="mr-1" /> Auto-assign
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={breakoutTimerActive ? handleResetTimer : handleStartTimer}
            className="h-7 text-[11px] border-white/10 hover:bg-white/10 text-white/70 hover:text-white rounded-lg"
          >
            <Clock size={12} className="mr-1" /> {breakoutTimerActive ? 'Reset Timer' : 'Start Timer'}
          </Button>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="destructive"
            onClick={handleCloseAllRooms}
            className="h-7 text-[11px] rounded-lg"
          >
            <X size={12} className="mr-1" /> Close All
          </Button>
        </div>
      )}

      {/* Rooms List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2.5">
          <AnimatePresence>
            {breakoutRooms.map((room) => {
              const participants = room.participantIds
                .map(id => mockParticipants.find(p => p.id === id))
                .filter(Boolean) as Participant[];

              return (
                <motion.div
                  key={room.id}
                  layout
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="border border-border/50 rounded-lg p-3 bg-gradient-to-r from-primary/5 to-transparent hover:shadow-md hover:shadow-primary/5 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex-1 min-w-0">
                      {editingRoomId === room.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            value={editingRoomName}
                            onChange={(e) => setEditingRoomName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameBreakoutRoom(room.id);
                              if (e.key === 'Escape') setEditingRoomId(null);
                            }}
                            onBlur={() => handleRenameBreakoutRoom(room.id)}
                            autoFocus
                            className="bg-white/10 border border-white/20 rounded-md px-2 py-0.5 text-xs outline-none focus:border-violet-500/50 w-full"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingRoomId(room.id); setEditingRoomName(room.name); }}
                          className="text-sm font-semibold text-left truncate hover:text-violet-300 transition-colors"
                        >
                          {room.name}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {/* Timer */}
                      <span className={`text-[11px] font-mono ${getTimerColor(room.timerSeconds)}`}>{formatCountdown(room.timerSeconds)}</span>
                      <button
                        onClick={() => handleDeleteBreakoutRoom(room.id)}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Participant avatar stack */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {participants.slice(0, 4).map((p) => (
                          <Avatar key={p.id} className="w-7 h-7 ring-2 ring-slate-950">
                            <AvatarFallback className={`${p.color} text-white text-[9px] font-bold`}>{p.initials}</AvatarFallback>
                          </Avatar>
                        ))}
                        {participants.length > 4 && (
                          <div className="w-7 h-7 rounded-full bg-white/10 ring-2 ring-slate-950 flex items-center justify-center text-[9px] font-medium text-white/60">
                            +{participants.length - 4}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-white/40 ml-2.5">{participants.length} {participants.length === 1 ? 'person' : 'people'}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleJoinBreakoutRoom(room.name)}
                      className="h-7 text-[11px] bg-white/10 hover:bg-white/20 text-white rounded-lg"
                    >
                      Join <ArrowRight size={12} className="ml-1" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {breakoutRooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                <LayoutGrid size={24} className="text-white/20" />
              </div>
              <p className="text-sm text-white/40 mb-1">No breakout rooms</p>
              <p className="text-[11px] text-white/20">Create a room to split participants into groups</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
