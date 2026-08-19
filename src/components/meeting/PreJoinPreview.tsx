'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Copy,
  Check,
  PhoneOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface PreJoinPreviewProps {
  meetingTitle: string;
  meetingId: string;
  onJoin: (opts: {
    name: string;
    micOn: boolean;
    cameraOn: boolean;
    audioDeviceId?: string;
    videoDeviceId?: string;
  }) => void;
  onCancel: () => void;
}

function getInitials(n: string): string {
  return n
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function PreJoinPreview({
  meetingTitle,
  meetingId,
  onJoin,
  onCancel,
}: PreJoinPreviewProps) {
  const user = useAppStore((s) => s.user);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioDeviceIdRef = useRef('');
  const videoDeviceIdRef = useRef('');

  const [name, setName] = useState(user?.name || 'You');
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDeviceId, setAudioDeviceId] = useState('');
  const [videoDeviceId, setVideoDeviceId] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const meetingLink = typeof window !== 'undefined' ? `${window.location.origin}/meeting/${meetingId}` : '';

  // Keep refs in sync with state for use in effects
  useEffect(() => {
    audioDeviceIdRef.current = audioDeviceId;
  }, [audioDeviceId]);
  useEffect(() => {
    videoDeviceIdRef.current = videoDeviceId;
  }, [videoDeviceId]);

  // Initialize: enumerate devices and start camera preview
  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Try to start camera first (this grants permission and gives device labels)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraReady(true);

        // Enumerate devices (now with labels since we have permission)
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;

        const audio = devices.filter((d) => d.kind === 'audioinput');
        const video = devices.filter((d) => d.kind === 'videoinput');
        setAudioDevices(audio);
        setVideoDevices(video);
        if (audio.length > 0) {
          setAudioDeviceId(audio[0].deviceId);
          audioDeviceIdRef.current = audio[0].deviceId;
        }
        if (video.length > 0) {
          setVideoDeviceId(video[0].deviceId);
          videoDeviceIdRef.current = video[0].deviceId;
        }
      } catch {
        if (cancelled) return;
        setCameraReady(false);

        // Still try to enumerate what we can
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          if (cancelled) return;
          const audio = devices.filter((d) => d.kind === 'audioinput');
          const video = devices.filter((d) => d.kind === 'videoinput');
          setAudioDevices(audio);
          setVideoDevices(video);
        } catch {
          // Ignore
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Restart stream when mic/camera toggled
  useEffect(() => {
    // Skip on initial mount (handled by init effect above)
    if (cameraReady === false && micOn === true && cameraOn === true) return;

    let cancelled = false;

    async function restart() {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      if (!cameraOn && !micOn) {
        if (!cancelled) setCameraReady(false);
        return;
      }

      try {
        const aId = audioDeviceIdRef.current;
        const vId = videoDeviceIdRef.current;
        const constraints: MediaStreamConstraints = {
          audio: micOn
            ? aId
              ? { deviceId: { exact: aId } }
              : true
            : false,
          video: cameraOn
            ? vId
              ? { deviceId: { exact: vId } }
              : true
            : false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraReady(true);
      } catch {
        if (!cancelled) setCameraReady(false);
      }
    }

    restart();

    return () => {
      cancelled = true;
    };
  }, [micOn, cameraOn, cameraReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingLink);
      setLinkCopied(true);
      toast.success('Meeting link copied!');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleJoin = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    onJoin({ name, micOn, cameraOn, audioDeviceId, videoDeviceId });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 bg-slate-950 text-white flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        className="w-full max-w-lg flex flex-col items-center gap-6"
      >
        {/* Branding */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex items-center gap-2"
        >
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-bold tracking-tight">ALVISION</span>
        </motion.div>

        {/* Meeting Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-1"
        >
          <h1 className="text-2xl font-semibold tracking-tight">{meetingTitle}</h1>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <span className="truncate max-w-[280px]">{meetingLink}</span>
            <button
              onClick={handleCopyLink}
              className="hover:text-white transition-colors shrink-0"
              aria-label="Copy meeting link"
            >
              {linkCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </motion.div>

        {/* Camera Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="relative w-full aspect-video max-w-md rounded-2xl overflow-hidden bg-slate-900 border border-slate-800"
        >
          {cameraOn && cameraReady ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="h-24 w-24 rounded-full bg-slate-800 flex items-center justify-center">
                <span className="text-3xl font-semibold text-slate-400">
                  {getInitials(name)}
                </span>
              </div>
            </div>
          )}
          {/* Mic indicator overlay */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-medium">
            {micOn ? (
              <Mic size={12} className="text-emerald-400" />
            ) : (
              <MicOff size={12} className="text-red-400" />
            )}
            <span className={micOn ? 'text-emerald-400' : 'text-red-400'}>
              {micOn ? 'Mic on' : 'Mic off'}
            </span>
          </div>
        </motion.div>

        {/* Controls Row — Toggle Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex items-center gap-3"
        >
          {/* Mic Toggle */}
          <button
            onClick={() => setMicOn(!micOn)}
            className={`relative h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              micOn
                ? 'bg-slate-800 hover:bg-slate-700 text-white ring-2 ring-emerald-500/50'
                : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 ring-2 ring-red-500/50'
            }`}
            aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
          >
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          {/* Camera Toggle */}
          <button
            onClick={() => setCameraOn(!cameraOn)}
            className={`relative h-12 w-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              cameraOn
                ? 'bg-slate-800 hover:bg-slate-700 text-white ring-2 ring-emerald-500/50'
                : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 ring-2 ring-red-500/50'
            }`}
            aria-label={cameraOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
        </motion.div>

        {/* Device Selectors */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-md space-y-3"
        >
          {/* Audio Device Selector */}
          {audioDevices.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Microphone</label>
              <Select value={audioDeviceId} onValueChange={(val) => setAudioDeviceId(val)}>
                <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-slate-200 text-sm">
                  <SelectValue placeholder="Select microphone" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {audioDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Video Device Selector */}
          {videoDevices.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Camera</label>
              <Select value={videoDeviceId} onValueChange={(val) => setVideoDeviceId(val)}>
                <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-slate-200 text-sm">
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {videoDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Your Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50"
            />
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="w-full max-w-md flex flex-col sm:flex-row gap-3"
        >
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 h-12 bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <PhoneOff size={16} />
            Cancel
          </Button>
          <Button
            onClick={handleJoin}
            className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold text-base shadow-lg shadow-emerald-500/25 transition-all duration-200"
          >
            Join Now
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
