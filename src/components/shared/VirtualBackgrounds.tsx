'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Upload, ImageOff } from 'lucide-react';
import { toast } from 'sonner';

export interface VirtualBgOption {
  id: string;
  name: string;
  css: string;
  type: 'none' | 'blur' | 'gradient' | 'solid';
}

const BACKGROUNDS: VirtualBgOption[] = [
  {
    id: 'none',
    name: 'None',
    css: '',
    type: 'none',
  },
  {
    id: 'blur',
    name: 'Blur',
    css: 'backdrop-blur-xl bg-black/20',
    type: 'blur',
  },
  {
    id: 'office',
    name: 'Office',
    css: 'linear-gradient(135deg, #1a365d 0%, #2d3748 40%, #4a5568 70%, #718096 100%)',
    type: 'gradient',
  },
  {
    id: 'nature',
    name: 'Nature',
    css: 'linear-gradient(135deg, #065f46 0%, #047857 30%, #10b981 60%, #6ee7b7 100%)',
    type: 'gradient',
  },
  {
    id: 'abstract',
    name: 'Abstract',
    css: 'linear-gradient(135deg, #581c87 0%, #7c3aed 30%, #a78bfa 60%, #c084fc 100%)',
    type: 'gradient',
  },
  {
    id: 'dark',
    name: 'Dark',
    css: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 40%, #16213e 70%, #0f3460 100%)',
    type: 'gradient',
  },
  {
    id: 'navy',
    name: 'Navy',
    css: '#1e293b',
    type: 'solid',
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    css: '#374151',
    type: 'solid',
  },
];

interface VirtualBackgroundsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedId: string;
  onApply: (bg: VirtualBgOption) => void;
}

export default function VirtualBackgrounds({ open, onOpenChange, selectedId, onApply }: VirtualBackgroundsProps) {
  const [previewId, setPreviewId] = useState<string>(selectedId);

  const handleApply = () => {
    const bg = BACKGROUNDS.find(b => b.id === previewId);
    if (bg) {
      onApply(bg);
      toast.success(`Background applied: ${bg.name}`);
    }
    onOpenChange(false);
  };

  const handleUpload = () => {
    toast.info('Custom background upload would open a file picker here.');
  };

  const handleOpenChange = (v: boolean) => {
    if (v) setPreviewId(selectedId);
    onOpenChange(v);
  };

  const renderThumbnail = (bg: VirtualBgOption) => {
    if (bg.type === 'none') {
      return (
        <div className="absolute inset-0 rounded-lg bg-slate-800 border-2 border-dashed border-white/20 flex items-center justify-center">
          <ImageOff size={16} className="text-white/30" />
        </div>
      );
    }
    if (bg.type === 'blur') {
      return (
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-600 via-slate-500 to-slate-700" />
          <div className="absolute inset-0 backdrop-blur-md" />
        </div>
      );
    }
    if (bg.type === 'gradient' || bg.type === 'solid') {
      return (
        <div
          className="absolute inset-0 rounded-lg"
          style={{ background: bg.css }}
        />
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden bg-white/[0.03] backdrop-blur-2xl border-white/10 text-white">
        {/* Gradient accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-cyan-500" />

        <DialogHeader className="px-5 pt-4 pb-0">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center">
              <ImageOff size={13} className="text-emerald-400" />
            </div>
            Virtual Backgrounds
          </DialogTitle>
          <DialogDescription className="text-white/40 text-[11px] mt-0.5">
            Choose a background for your video feed
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4">
          {/* Background Grid */}
          <div className="grid grid-cols-4 gap-3">
            {BACKGROUNDS.map((bg, idx) => (
              <motion.button
                key={bg.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPreviewId(bg.id)}
                className={`relative aspect-[4/3] rounded-xl overflow-hidden transition-all cursor-pointer ${
                  previewId === bg.id
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-transparent'
                    : 'ring-1 ring-white/10 hover:ring-white/25'
                }`}
              >
                {renderThumbnail(bg)}
                {/* Selection indicator */}
                <AnimatePresence>
                  {previewId === bg.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg"
                    >
                      <Check size={10} className="text-primary-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>

          {/* Background name label */}
          <div className="mt-3 text-center">
            <p className="text-xs text-white/50">
              Selected: <span className="text-white/80 font-medium">{BACKGROUNDS.find(b => b.id === previewId)?.name}</span>
            </p>
          </div>
        </div>

        <DialogFooter className="px-5 pb-4 pt-0 border-t border-white/5 flex-col gap-2">
          <div className="flex items-center gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1 h-8 text-xs border-white/10 text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
              onClick={handleUpload}
            >
              <Upload size={12} className="mr-1.5" /> Upload Custom
            </Button>
            <Button
              onClick={handleApply}
              disabled={previewId === selectedId}
              className="flex-1 h-8 text-xs bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-500/20 rounded-lg"
            >
              <Check size={12} className="mr-1.5" /> Apply
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
