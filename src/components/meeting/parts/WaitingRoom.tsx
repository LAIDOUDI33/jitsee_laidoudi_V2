'use client';

import { useState } from 'react';
import { DoorOpen, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { type WaitingParticipant, mockWaitingParticipants } from './meeting-data';

// ─── Props ─────────────────────────────────────────────────────
export interface WaitingRoomProps {
  onAdmitAll?: () => void;
}

// ─── Component ─────────────────────────────────────────────────
export default function WaitingRoom({ onAdmitAll }: WaitingRoomProps) {
  const [waitingParticipants, setWaitingParticipants] = useState<WaitingParticipant[]>(mockWaitingParticipants);

  const handleAdmitParticipant = (id: string) => {
    const wp = waitingParticipants.find(w => w.id === id);
    setWaitingParticipants(prev => prev.filter(w => w.id !== id));
    toast.success(`${wp?.name} admitted to the meeting`);
  };

  const handleDenyParticipant = (id: string) => {
    const wp = waitingParticipants.find(w => w.id === id);
    setWaitingParticipants(prev => prev.filter(w => w.id !== id));
    toast.success(`${wp?.name} was denied entry`);
  };

  const handleAdmitAll = () => {
    waitingParticipants.forEach(wp => handleAdmitParticipant(wp.id));
    onAdmitAll?.();
    toast.success('All participants admitted');
  };

  if (waitingParticipants.length === 0) return null;

  return (
    <div className="border-t border-white/10">
      <div className="px-3 py-2 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <DoorOpen size={11} className="text-amber-400" />
          <span className="text-xs font-semibold">Waiting Room ({waitingParticipants.length})</span>
        </div>
        <Button size="sm" onClick={handleAdmitAll} className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 rounded-md px-2">
          Admit All
        </Button>
      </div>
      <div className="p-2 space-y-1">
        {waitingParticipants.map(wp => (
          <motion.div
            key={wp.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5"
          >
            <Avatar className="w-6 h-6 shrink-0">
              <AvatarFallback className={`${wp.color} text-white text-[8px] font-bold`}>{wp.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-medium truncate block">{wp.name}</span>
              <span className="text-[9px] text-white/25">Joined {wp.joinTime}</span>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                size="sm"
                onClick={() => handleAdmitParticipant(wp.id)}
                className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 rounded-md px-2"
              >
                <UserPlus size={10} className="mr-0.5" /> Admit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDenyParticipant(wp.id)}
                className="h-6 text-[10px] rounded-md px-2"
              >
                Deny
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
