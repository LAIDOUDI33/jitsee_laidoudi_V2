'use client';

import { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  Shuffle,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Send,
  Timer,
  Users,
  Settings2,
  Volume2,
  ArrowRight,
  MoreHorizontal,
  UserMinus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type RoomStatus = 'not-started' | 'in-progress' | 'completed';

type TimerMode = 'idle' | 'running' | 'paused';

interface Participant {
  id: string;
  name: string;
  color: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
}

interface BreakoutRoom {
  id: string;
  name: string;
  status: RoomStatus;
  participants: string[];
  elapsedSeconds: number;
  timerMode: TimerMode;
  chat: ChatMessage[];
}

interface RoomSettings {
  maxParticipants: number;
  timeLimitMinutes: number;
  autoClose: boolean;
}

interface BreakoutContextType {
  participants: Participant[];
  rooms: BreakoutRoom[];
  unassignedIds: string[];
  settings: RoomSettings;
  getParticipant: (id: string) => Participant | undefined;
}

/* -------------------------------------------------------------------------- */
/*                                 CONSTANTS                                  */
/* -------------------------------------------------------------------------- */

const AVATAR_COLORS = [
  'bg-amber-500', 'bg-orange-500', 'bg-emerald-500', 'bg-rose-500',
  'bg-sky-500', 'bg-violet-500', 'bg-teal-500', 'bg-fuchsia-500',
  'bg-lime-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
  'bg-red-500', 'bg-yellow-500', 'bg-green-500',
];

const INITIAL_PARTICIPANTS: Participant[] = [
  { id: 'p1', name: 'Sarah Chen', color: AVATAR_COLORS[0] },
  { id: 'p2', name: 'Alex Rivera', color: AVATAR_COLORS[1] },
  { id: 'p3', name: 'Jordan Kim', color: AVATAR_COLORS[2] },
  { id: 'p4', name: 'Maya Patel', color: AVATAR_COLORS[3] },
  { id: 'p5', name: "Liam O'Brien", color: AVATAR_COLORS[4] },
  { id: 'p6', name: 'Ava Thompson', color: AVATAR_COLORS[5] },
  { id: 'p7', name: 'Noah Garcia', color: AVATAR_COLORS[6] },
  { id: 'p8', name: 'Emma Wilson', color: AVATAR_COLORS[7] },
  { id: 'p9', name: 'James Lee', color: AVATAR_COLORS[8] },
  { id: 'p10', name: 'Olivia Brown', color: AVATAR_COLORS[9] },
  { id: 'p11', name: 'Lucas Martinez', color: AVATAR_COLORS[10] },
  { id: 'p12', name: 'Sophia Davis', color: AVATAR_COLORS[11] },
  { id: 'p13', name: 'Ethan Moore', color: AVATAR_COLORS[12] },
  { id: 'p14', name: 'Isabella Taylor', color: AVATAR_COLORS[13] },
  { id: 'p15', name: 'Mason Anderson', color: AVATAR_COLORS[14] },
];

const MOCK_CHAT: ChatMessage[] = [
  { id: 'm1', sender: 'Sarah Chen', text: "Let's start by reviewing the action items from last sprint.", time: '2:31 PM' },
  { id: 'm2', sender: 'Alex Rivera', text: 'Good idea. I have the updated metrics ready to share.', time: '2:32 PM' },
  { id: 'm3', sender: 'Jordan Kim', text: 'Should we also discuss the new feature requirements?', time: '2:33 PM' },
  { id: 'm4', sender: 'Maya Patel', text: 'Yes, the product team sent over the PRD this morning.', time: '2:34 PM' },
];

const INITIAL_ROOMS: BreakoutRoom[] = [
  {
    id: 'room-1', name: 'Room Alpha', status: 'not-started',
    participants: ['p1', 'p2', 'p3', 'p4'], elapsedSeconds: 0, timerMode: 'idle', chat: MOCK_CHAT,
  },
  {
    id: 'room-2', name: 'Room Beta', status: 'in-progress',
    participants: ['p5', 'p6', 'p7'], elapsedSeconds: 347, timerMode: 'running', chat: MOCK_CHAT.slice(0, 2),
  },
  {
    id: 'room-3', name: 'Room Gamma', status: 'not-started',
    participants: ['p8', 'p9', 'p10'], elapsedSeconds: 0, timerMode: 'idle', chat: MOCK_CHAT.slice(0, 1),
  },
  {
    id: 'room-4', name: 'Room Delta', status: 'completed',
    participants: ['p11', 'p12'], elapsedSeconds: 600, timerMode: 'idle', chat: MOCK_CHAT.slice(1, 3),
  },
];

const ROOM_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa'];

/* -------------------------------------------------------------------------- */
/*                                 HELPERS                                    */
/* -------------------------------------------------------------------------- */

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const STATUS_CONFIG: Record<RoomStatus, { label: string; color: string; dotClass: string }> = {
  'not-started': {
    label: 'Not Started',
    color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-500/15 dark:text-zinc-400 border-zinc-500/20',
    dotClass: 'bg-zinc-400',
  },
  'in-progress': {
    label: 'In Progress',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-500/20',
    dotClass: 'bg-amber-500',
  },
  completed: {
    label: 'Completed',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-500/20',
    dotClass: 'bg-emerald-500',
  },
};

/* -------------------------------------------------------------------------- */
/*                                 ANIMATION                                  */
/* -------------------------------------------------------------------------- */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

/* -------------------------------------------------------------------------- */
/*                              CONTEXT                                       */
/* -------------------------------------------------------------------------- */

const BreakoutContext = createContext<BreakoutContextType | null>(null);

function useBreakout() {
  const ctx = useContext(BreakoutContext);
  if (!ctx) throw new Error('useBreakout must be used within BreakoutRoomsPage');
  return ctx;
}

/* -------------------------------------------------------------------------- */
/*                        AVATAR STACK COMPONENT                            */
/* -------------------------------------------------------------------------- */

function AvatarStack({ participantIds, max = 4 }: { participantIds: string[]; max?: number }) {
  const { getParticipant } = useBreakout();
  const visible = participantIds.slice(0, max);
  const remaining = participantIds.length - max;

  return (
    <div className="flex items-center">
      {visible.map((pid, i) => {
        const p = getParticipant(pid);
        if (!p) return null;
        return (
          <TooltipProvider key={pid} delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-card -ml-[6px] first:ml-0 transition-transform hover:scale-110 hover:z-10 cursor-pointer"
                  style={{ backgroundColor: p.color, zIndex: visible.length - i }}
                >
                  {getInitials(p.name)}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {p.name}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
      {remaining > 0 && (
        <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold bg-muted text-muted-foreground ring-2 ring-card -ml-[6px]">
          +{remaining}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                       UNASSIGNED POOL COMPONENT                            */
/* -------------------------------------------------------------------------- */

function UnassignedPool({ unassignedIds, onAssignClick }: { unassignedIds: string[]; onAssignClick: (pid: string) => void }) {
  const { getParticipant } = useBreakout();

  if (unassignedIds.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
          Unassigned ({unassignedIds.length})
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <AnimatePresence>
          {unassignedIds.map((pid) => {
            const p = getParticipant(pid);
            if (!p) return null;
            return (
              <motion.button
                key={pid}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onAssignClick(pid)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-card hover:bg-amber-500/10 hover:border-amber-500/50 transition-all duration-200 shrink-0 cursor-pointer group"
              >
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: p.color }}
                >
                  {getInitials(p.name)}
                </div>
                <span className="text-xs font-medium whitespace-nowrap">{p.name}</span>
                <ArrowRight className="h-3 w-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                       ROOM DETAIL DIALOG                                   */
/* -------------------------------------------------------------------------- */

function RoomDetailDialog({ room, open, onClose, onRemoveParticipant, onReassign }: {
  room: BreakoutRoom | null;
  open: boolean;
  onClose: () => void;
  onRemoveParticipant: (roomId: string, pid: string) => void;
  onReassign: (pid: string, toRoomId: string) => void;
}) {
  const { rooms, getParticipant } = useBreakout();
  const { settings } = useBreakout();

  if (!room) return null;
  const statusCfg = STATUS_CONFIG[room.status];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <LayoutGrid className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span>{room.name}</span>
              <Badge variant="secondary" className={`text-[10px] font-medium px-2 py-0 border ${statusCfg.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass} mr-1`} />
                {statusCfg.label}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1">
          {/* Timer */}
          <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Elapsed Time</span>
            </div>
            <span className="text-lg font-mono font-bold tabular-nums">
              {formatTime(room.elapsedSeconds)}
            </span>
          </div>

          {/* Settings summary */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Room Settings</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Max Participants</span>
              <span className="font-medium">{settings.maxParticipants > 0 ? settings.maxParticipants : 'Unlimited'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Time Limit</span>
              <span className="font-medium">{settings.timeLimitMinutes > 0 ? `${settings.timeLimitMinutes} min` : 'No limit'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Auto-Close</span>
              <span className="font-medium">{settings.autoClose ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>

          {/* Participants list */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Participants ({room.participants.length})
            </p>
            <div className="space-y-1.5">
              <AnimatePresence>
                {room.participants.map((pid) => {
                  const p = getParticipant(pid);
                  if (!p) return null;
                  return (
                    <motion.div
                      key={pid}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                          style={{ backgroundColor: p.color }}
                        >
                          {getInitials(p.name)}
                        </div>
                        <span className="text-sm font-medium truncate">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {rooms.filter((r) => r.id !== room.id).map((r) => (
                              <DropdownMenuItem key={r.id} onClick={() => onReassign(pid, r.id)}>
                                Move to {r.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => onRemoveParticipant(room.id, pid)}
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Chat History Mock */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Chat History</p>
            <div className="bg-muted/30 rounded-lg p-3 space-y-2.5 max-h-40 overflow-y-auto">
              {room.chat.map((msg) => (
                <div key={msg.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{msg.sender}</span>
                    <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{msg.text}</p>
                </div>
              ))}
              {room.chat.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">No messages yet</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*                       BROADCAST MESSAGE DIALOG                             */
/* -------------------------------------------------------------------------- */

function BroadcastDialog({ open, onClose, targetRoom, rooms, onSend }: {
  open: boolean;
  onClose: () => void;
  targetRoom: BreakoutRoom | null;
  rooms: BreakoutRoom[];
  onSend: (message: string, roomId: string | null) => void;
}) {
  const [message, setMessage] = useState('');
  const [sendToRoom, setSendToRoom] = useState<string | null>(targetRoom?.id ?? null);

  const handleSend = () => {
    if (!message.trim()) return;
    onSend(message.trim(), sendToRoom);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <Volume2 className="h-5 w-5 text-amber-500" />
            Broadcast Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Send To</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={sendToRoom === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSendToRoom(null)}
                className={sendToRoom === null ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0' : ''}
              >
                All Rooms
              </Button>
              {rooms.map((r) => (
                <Button
                  key={r.id}
                  variant={sendToRoom === r.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSendToRoom(r.id)}
                  className={sendToRoom === r.id ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0' : ''}
                >
                  {r.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Message</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30 focus-visible:ring-offset-2 resize-none"
              placeholder="Type your broadcast message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
              }}
            />
          </div>

          {message.trim() && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Preview</p>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Broadcast{sendToRoom ? ` → ${rooms.find((r) => r.id === sendToRoom)?.name}` : ' → All Rooms'}
                  </span>
                </div>
                <p className="text-sm">{message.trim()}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
            onClick={handleSend}
            disabled={!message.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*                        ROOM SETTINGS DIALOG                                */
/* -------------------------------------------------------------------------- */

function RoomSettingsDialog({ open, onClose, settings, onSave }: {
  open: boolean;
  onClose: () => void;
  settings: RoomSettings;
  onSave: (settings: RoomSettings) => void;
}) {
  const [localSettings, setLocalSettings] = useState<RoomSettings>(settings);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <Settings2 className="h-5 w-5 text-amber-500" />
            Room Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Max Participants Per Room</Label>
            <Input
              type="number"
              min={0}
              max={50}
              value={localSettings.maxParticipants}
              onChange={(e) => setLocalSettings({ ...localSettings, maxParticipants: Math.max(0, parseInt(e.target.value) || 0) })}
              placeholder="0 = unlimited"
            />
            <p className="text-xs text-muted-foreground">Set to 0 for unlimited participants</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Time Limit (minutes)</Label>
            <Input
              type="number"
              min={0}
              max={180}
              value={localSettings.timeLimitMinutes}
              onChange={(e) => setLocalSettings({ ...localSettings, timeLimitMinutes: Math.max(0, parseInt(e.target.value) || 0) })}
              placeholder="0 = no limit"
            />
            <p className="text-xs text-muted-foreground">Set to 0 for no time limit</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Auto-Close on Time Expire</Label>
              <p className="text-xs text-muted-foreground">Automatically close rooms when time runs out</p>
            </div>
            <Switch
              checked={localSettings.autoClose}
              onCheckedChange={(checked) => setLocalSettings({ ...localSettings, autoClose: checked })}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
            onClick={() => { onSave(localSettings); onClose(); }}
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*                           MAIN COMPONENT                                   */
/* -------------------------------------------------------------------------- */

export default function BreakoutRoomsPage() {
  const [rooms, setRooms] = useState<BreakoutRoom[]>(INITIAL_ROOMS);
  const [participants] = useState<Participant[]>(INITIAL_PARTICIPANTS);
  const [settings, setSettings] = useState<RoomSettings>({ maxParticipants: 6, timeLimitMinutes: 10, autoClose: true });
  const [globalTimerMode, setGlobalTimerMode] = useState<TimerMode>('idle');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<BreakoutRoom | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const assignedIds = new Set(rooms.flatMap((r) => r.participants));
  const unassignedIds = participants.map((p) => p.id).filter((id) => !assignedIds.has(id));

  const getParticipant = useCallback(
    (id: string) => participants.find((p) => p.id === id),
    [participants]
  );

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || null;

  // Timer interval
  useEffect(() => {
    if (globalTimerMode === 'running') {
      timerRef.current = setInterval(() => {
        setRooms((prev) =>
          prev.map((r) => {
            if (r.timerMode === 'running') {
              const newElapsed = r.elapsedSeconds + 1;
              let newStatus: RoomStatus = r.status === 'not-started' ? 'in-progress' : r.status;
              if (settings.autoClose && settings.timeLimitMinutes > 0 && newElapsed >= settings.timeLimitMinutes * 60) {
                newStatus = 'completed';
              }
              return {
                ...r,
                elapsedSeconds: newElapsed,
                status: newStatus,
                timerMode: newStatus === 'completed' ? 'idle' : 'running',
              };
            }
            return r;
          })
        );
      }, 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [globalTimerMode, settings.autoClose, settings.timeLimitMinutes]);

  // Handlers
  const handleAssignToRoom = useCallback(
    (pid: string) => {
      const target = rooms.find((r) => {
        if (r.status === 'completed') return false;
        if (settings.maxParticipants > 0 && r.participants.length >= settings.maxParticipants) return false;
        return true;
      });
      if (!target) { toast.error('All rooms are full or completed'); return; }
      setRooms((prev) => prev.map((r) => r.id === target.id ? { ...r, participants: [...r.participants, pid] } : r));
      const p = getParticipant(pid);
      toast.success(`${p?.name} assigned to ${target.name}`);
    },
    [rooms, settings.maxParticipants, getParticipant]
  );

  const handleRemoveParticipant = useCallback(
    (roomId: string, pid: string) => {
      setRooms((prev) => prev.map((r) => r.id === roomId ? { ...r, participants: r.participants.filter((id) => id !== pid) } : r));
      const p = getParticipant(pid);
      toast.success(`${p?.name} returned to unassigned pool`);
    },
    [getParticipant]
  );

  const handleReassign = useCallback(
    (pid: string, toRoomId: string) => {
      const toRoom = rooms.find((r) => r.id === toRoomId);
      if (!toRoom) return;
      setRooms((prev) =>
        prev.map((r) => {
          if (r.participants.includes(pid)) return { ...r, participants: r.participants.filter((id) => id !== pid) };
          if (r.id === toRoomId) return { ...r, participants: [...r.participants, pid] };
          return r;
        })
      );
      const p = getParticipant(pid);
      toast.success(`${p?.name} moved to ${toRoom.name}`);
    },
    [rooms, getParticipant]
  );

  const handleAutoAssign = useCallback(() => {
    if (unassignedIds.length === 0) { toast.info('No unassigned participants to assign'); return; }
    const shuffled = [...unassignedIds].sort(() => Math.random() - 0.5);
    let updatedRooms = [...rooms];
    let assigned = 0;
    for (const pid of shuffled) {
      const target = updatedRooms.find((r) => {
        if (r.status === 'completed') return false;
        if (settings.maxParticipants > 0 && r.participants.length >= settings.maxParticipants) return false;
        return true;
      });
      if (target) {
        updatedRooms = updatedRooms.map((r) => r.id === target.id ? { ...r, participants: [...r.participants, pid] } : r);
        assigned++;
      }
    }
    setRooms(updatedRooms);
    toast.success(`Auto-assigned ${assigned} participant${assigned !== 1 ? 's' : ''} to rooms`);
  }, [unassignedIds, rooms, settings.maxParticipants]);

  const handleCreateRoom = useCallback(() => {
    const num = rooms.length + 1;
    const name = ROOM_NAMES[num - 1] || `Room ${num}`;
    const newRoom: BreakoutRoom = {
      id: `room-${Date.now()}`, name, status: 'not-started',
      participants: [], elapsedSeconds: 0, timerMode: 'idle', chat: [],
    };
    setRooms((prev) => [...prev, newRoom]);
    toast.success(`Created ${name}`);
  }, [rooms.length]);

  const handleDeleteRoom = useCallback(
    (roomId: string) => {
      const room = rooms.find((r) => r.id === roomId);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      if (selectedRoomId === roomId) setSelectedRoomId(null);
      toast.success(`Deleted ${room?.name}`);
    },
    [rooms, selectedRoomId]
  );

  const handleTimerToggle = useCallback((roomId: string) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId) return r;
        const newMode: TimerMode = r.timerMode === 'running' ? 'paused' : 'running';
        return {
          ...r, timerMode: newMode,
          status: r.status === 'completed' ? r.status : (newMode === 'running' ? 'in-progress' as RoomStatus : r.status),
        };
      })
    );
  }, []);

  const handleTimerReset = useCallback((roomId: string) => {
    setRooms((prev) => prev.map((r) => r.id === roomId ? { ...r, elapsedSeconds: 0, timerMode: 'idle' as TimerMode, status: 'not-started' as RoomStatus } : r));
    toast.success('Timer reset');
  }, []);

  const handleGlobalTimerToggle = useCallback(() => {
    setGlobalTimerMode((prev) => {
      const next: TimerMode = prev === 'running' ? 'paused' : 'running';
      if (next === 'running') {
        setRooms((prevRooms) =>
          prevRooms.map((r) => r.status !== 'completed' ? { ...r, timerMode: 'running' as TimerMode, status: 'in-progress' as RoomStatus } : r)
        );
      } else {
        setRooms((prevRooms) => prevRooms.map((r) => r.timerMode === 'running' ? { ...r, timerMode: 'paused' as TimerMode } : r));
      }
      return next;
    });
  }, []);

  const handleGlobalTimerReset = useCallback(() => {
    setGlobalTimerMode('idle');
    setRooms((prev) => prev.map((r) => ({ ...r, elapsedSeconds: 0, timerMode: 'idle' as TimerMode, status: 'not-started' as RoomStatus })));
    toast.success('All timers reset');
  }, []);

  const handleBroadcast = useCallback(
    (message: string, roomId: string | null) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const chatMsg: ChatMessage = { id: `broadcast-${Date.now()}`, sender: 'Host (You)', text: message, time: timeStr };
      setRooms((prev) => prev.map((r) => (!roomId || r.id === roomId ? { ...r, chat: [...r.chat, chatMsg] } : r)));
      const target = roomId ? rooms.find((r) => r.id === roomId)?.name : 'All Rooms';
      toast.success(`Message sent to ${target}`);
    },
    [rooms]
  );

  const handleSaveSettings = useCallback((newSettings: RoomSettings) => {
    setSettings(newSettings);
    toast.success('Settings saved');
  }, []);

  const anyRunning = rooms.some((r) => r.timerMode === 'running');
  const maxElapsed = Math.max(...rooms.map((r) => r.elapsedSeconds), 0);

  const contextValue: BreakoutContextType = {
    participants, rooms, unassignedIds, settings, getParticipant,
  };

  return (
    <BreakoutContext.Provider value={contextValue}>
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
              <LayoutGrid className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Breakout Rooms</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Manage rooms, assign participants, and control timers.</p>
              <div className='h-1 w-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500/50 mt-2' />
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Global timer display */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm">
              <Timer className={`h-4 w-4 ${anyRunning ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <span className="text-sm font-mono font-bold tabular-nums">{formatTime(maxElapsed)}</span>
              {settings.timeLimitMinutes > 0 && (
                <span className="text-xs text-muted-foreground">/ {formatTime(settings.timeLimitMinutes * 60)}</span>
              )}
              {anyRunning && <span className="h-2 w-2 rounded-full bg-amber-500 animate-breathe" />}
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleAutoAssign}>
              <Shuffle className="h-4 w-4" />
              Auto-Assign
            </Button>
            <Button
              size="sm"
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-500/20"
              onClick={handleCreateRoom}
            >
              <Plus className="h-4 w-4" />
              Create Room
            </Button>
          </div>
        </motion.div>

        {/* Global Timer Controls */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <Button
            variant={globalTimerMode === 'running' ? 'default' : 'outline'}
            size="sm"
            className={`gap-2 ${globalTimerMode === 'running' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0' : ''}`}
            onClick={handleGlobalTimerToggle}
          >
            {globalTimerMode === 'running' ? <><Pause className="h-3.5 w-3.5" /> Pause All</> : <><Play className="h-3.5 w-3.5" /> Start All</>}
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleGlobalTimerReset}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { setBroadcastTarget(null); setBroadcastOpen(true); }}>
            <Send className="h-3.5 w-3.5" />
            Broadcast to All
          </Button>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => setSettingsOpen(true)}>
              <Settings2 className="h-3.5 w-3.5" />
              Settings
            </Button>
          </div>
        </motion.div>

        {/* Unassigned Participants Pool */}
        <UnassignedPool unassignedIds={unassignedIds} onAssignClick={handleAssignToRoom} />

        {/* Room Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
        >
          <AnimatePresence>
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                index={rooms.indexOf(room)}
                onRoomClick={setSelectedRoomId}
                onBroadcast={(rid) => { setBroadcastTarget(rooms.find((x) => x.id === rid) || null); setBroadcastOpen(true); }}
                onTimerToggle={handleTimerToggle}
                onTimerReset={handleTimerReset}
              />
            ))}
          </AnimatePresence>

          {/* Create room card */}
          <motion.div variants={itemVariants}>
            <Card
              className="border-dashed border-2 border-border/40 bg-muted/20 hover:bg-muted/40 hover:border-amber-500/30 transition-all duration-300 cursor-pointer flex items-center justify-center min-h-[180px]"
              onClick={handleCreateRoom}
            >
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <span className="text-sm font-medium text-muted-foreground/70">Create New Room</span>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap"
        >
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-zinc-400" />
            {rooms.filter((r) => r.status === 'not-started').length} Not Started
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-breathe" />
            {rooms.filter((r) => r.status === 'in-progress').length} In Progress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {rooms.filter((r) => r.status === 'completed').length} Completed
          </span>
          <Separator orientation="vertical" className="h-3" />
          <span>{participants.length} total · {assignedIds.size} assigned · {unassignedIds.length} unassigned</span>
        </motion.div>
      </div>

      {/* Dialogs */}
      <RoomDetailDialog
        room={selectedRoom}
        open={!!selectedRoomId}
        onClose={() => setSelectedRoomId(null)}
        onRemoveParticipant={handleRemoveParticipant}
        onReassign={handleReassign}
      />
      <BroadcastDialog
        open={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        targetRoom={broadcastTarget}
        rooms={rooms}
        onSend={handleBroadcast}
      />
      <RoomSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </BreakoutContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*                       ROOM CARD COMPONENT (after context)                  */
/* -------------------------------------------------------------------------- */

function RoomCard({ room, index, onRoomClick, onBroadcast, onTimerToggle, onTimerReset }: {
  room: BreakoutRoom;
  index: number;
  onRoomClick: (id: string) => void;
  onBroadcast: (roomId: string) => void;
  onTimerToggle: (roomId: string) => void;
  onTimerReset: (roomId: string) => void;
}) {
  const { settings } = useBreakout();
  const statusCfg = STATUS_CONFIG[room.status];
  const isOverTime = settings.timeLimitMinutes > 0 && room.elapsedSeconds >= settings.timeLimitMinutes * 60;

  return (
    <motion.div variants={itemVariants}>
      <Card
        className="group relative overflow-hidden border border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 cursor-pointer before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-amber-500/60 before:to-orange-500/60"
        onClick={() => onRoomClick(room.id)}
      >

        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm truncate">{room.name}</h3>
                <Badge variant="secondary" className={`text-[10px] font-medium px-2 py-0 border ${statusCfg.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass} mr-1`} />
                  {statusCfg.label}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); onBroadcast(room.id); }}
                    >
                      <Send className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Broadcast Message</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTimerToggle(room.id); }}>
                    {room.timerMode === 'running' ? <><Pause className="h-4 w-4 mr-2" /> Pause Timer</> : <><Play className="h-4 w-4 mr-2" /> Start Timer</>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTimerReset(room.id); }}>
                    <RotateCcw className="h-4 w-4 mr-2" /> Reset Timer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Participants */}
          <div className="flex items-center justify-between mb-3">
            <AvatarStack participantIds={room.participants} />
            <Badge variant="outline" className="text-[10px] font-medium ml-2">
              <Users className="h-3 w-3 mr-1" />
              {room.participants.length}{settings.maxParticipants > 0 ? `/${settings.maxParticipants}` : ''}
            </Badge>
          </div>

          {/* Timer section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className={`h-3.5 w-3.5 ${room.timerMode === 'running' ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-mono tabular-nums ${isOverTime ? 'text-red-500 font-semibold' : room.timerMode === 'running' ? 'text-foreground' : 'text-muted-foreground'}`}>
                {formatTime(room.elapsedSeconds)}
              </span>
              {room.timerMode === 'running' && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-breathe" />
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onTimerToggle(room.id); }}>
                {room.timerMode === 'running' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onTimerReset(room.id); }}>
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          {settings.timeLimitMinutes > 0 && (
            <div className="mt-2">
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${isOverTime ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}
                  initial={false}
                  animate={{ width: `${Math.min((room.elapsedSeconds / (settings.timeLimitMinutes * 60)) * 100, 100)}%` }}
                  transition={{ duration: 0.5, ease: 'linear' }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
