'use client';

import { AnimatePresence } from 'framer-motion';
import { ImageOff, Check } from 'lucide-react';

interface BgOption {
  id: string;
  name: string;
  gradient?: string;
  type: 'none' | 'blur' | 'gradient';
}

const BG_OPTIONS: BgOption[] = [
  { id: 'none', name: 'None', type: 'none' },
  { id: 'blur', name: 'Blur', type: 'blur' },
  { id: 'office', name: 'Office', gradient: 'linear-gradient(135deg, #78350f 0%, #92400e 30%, #b45309 60%, #d97706 100%)', type: 'gradient' },
  { id: 'nature', name: 'Nature', gradient: 'linear-gradient(135deg, #065f46 0%, #047857 30%, #10b981 60%, #6ee7b7 100%)', type: 'gradient' },
  { id: 'abstract', name: 'Abstract', gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #0f172a 50%, #334155 100%)', type: 'gradient' },
  { id: 'city', name: 'City', gradient: 'linear-gradient(135deg, #1e293b 0%, #334155 30%, #475569 60%, #64748b 100%)', type: 'gradient' },
  { id: 'custom', name: 'Custom', type: 'none', gradient: undefined },
];

interface VirtualBackgroundSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBg: string;
  onSelect: (bgId: string) => void;
}

export default function VirtualBackgroundSelector({
  open,
  onOpenChange,
  selectedBg,
  onSelect,
}: VirtualBackgroundSelectorProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[150]" onClick={() => onOpenChange(false)} />
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[160] p-3 bg-slate-900/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
            <ImageOff size={10} className="text-emerald-400" />
          </div>
          <span className="text-xs font-semibold text-white/80">Virtual Background</span>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {BG_OPTIONS.map((option) => (
            <div key={option.id} className="flex flex-col items-center gap-1">
              <button
                onClick={() => onSelect(option.id)}
                disabled={option.id === 'custom'}
                className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 transition-all cursor-pointer ${
                  option.id === 'custom'
                    ? 'opacity-40 cursor-not-allowed ring-1 ring-white/10'
                    : selectedBg === option.id
                      ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-950'
                      : 'ring-1 ring-white/10 hover:ring-white/30'
                }`}
              >
                {option.type === 'none' && option.id !== 'custom' && (
                  <div className="absolute inset-0 rounded-xl bg-slate-800 border-2 border-dashed border-white/20 flex items-center justify-center">
                    <ImageOff size={14} className="text-white/30" />
                  </div>
                )}
                {option.type === 'blur' && (
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-600 via-slate-500 to-slate-700" />
                    <div className="absolute inset-0 backdrop-blur-md" />
                  </div>
                )}
                {option.gradient && (
                  <div className="absolute inset-0 rounded-xl" style={{ background: option.gradient }} />
                )}
                {option.id === 'custom' && (
                  <div className="absolute inset-0 rounded-xl bg-slate-800/80 border border-dashed border-white/15 flex items-center justify-center">
                    <span className="text-[7px] text-white/25">SOON</span>
                  </div>
                )}
                <AnimatePresence>
                  {selectedBg === option.id && option.id !== 'custom' && (
                    <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                      <Check size={9} className="text-white" />
                    </div>
                  )}
                </AnimatePresence>
              </button>
              <span className="text-[9px] text-white/40 font-medium leading-none">
                {option.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export { type BgOption };
