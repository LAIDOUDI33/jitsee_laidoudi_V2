'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  ArrowLeft,
  Mic,
  Video,
  Monitor,
  Hand,
  CircleDot,
  Maximize,
  CornerDownLeft,
  CornerUpLeft,
} from 'lucide-react';

// ── Platform detection ─────────────────────────────────────────────────

function usePlatform(): 'mac' | 'windows' {
  if (typeof navigator === 'undefined') return 'mac';
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? 'mac' : 'windows';
}

// ── Types ──────────────────────────────────────────────────────────────

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

// ── Kbd component ──────────────────────────────────────────────────────

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className='inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md border border-border/80 bg-background shadow-sm font-mono text-xs font-medium text-foreground'>
      {children}
    </kbd>
  );
}

// ── Shortcut row ───────────────────────────────────────────────────────

function ShortcutRow({ shortcut, modKey }: { shortcut: Shortcut; modKey: string }) {
  const resolvedKeys = shortcut.keys.map(k =>
    k === 'Cmd/Ctrl' ? modKey : k
  );

  return (
    <div className='flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors group'>
      <span className='text-sm text-muted-foreground group-hover:text-foreground transition-colors'>
        {shortcut.description}
      </span>
      <div className='flex items-center gap-1 shrink-0 ml-4'>
        {resolvedKeys.map((key, i) => (
          <span key={i} className='flex items-center gap-1'>
            {i > 0 && <span className='text-[10px] text-muted-foreground mx-0.5'>+</span>}
            <Kbd>{key}</Kbd>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────

interface KeyboardShortcutsOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Component ──────────────────────────────────────────────────────────

export default function KeyboardShortcutsOverlay({ open, onOpenChange }: KeyboardShortcutsOverlayProps) {
  const platform = usePlatform();
  const modKey = platform === 'mac' ? '⌘' : 'Ctrl';

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Escape key closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, handleClose]);

  const groups = useMemo<ShortcutGroup[]>(() => [
    {
      title: 'General',
      shortcuts: [
        { keys: ['Cmd/Ctrl', 'K'], description: 'Search' },
        { keys: ['Cmd/Ctrl', '/'], description: 'This help' },
        { keys: ['Esc'], description: 'Close dialog / Go back' },
      ],
    },
    {
      title: 'Meeting',
      shortcuts: [
        { keys: ['Alt', 'M'], description: 'Toggle mute' },
        { keys: ['Alt', 'V'], description: 'Toggle camera' },
        { keys: ['Alt', 'S'], description: 'Share screen' },
        { keys: ['Alt', 'H'], description: 'Raise hand' },
        { keys: ['Alt', 'R'], description: 'Toggle recording' },
        { keys: ['Alt', 'F'], description: 'Fullscreen' },
      ],
    },
    {
      title: 'Navigation',
      shortcuts: [
        { keys: ['Alt', '1'], description: 'Switch sidebar sections' },
        { keys: ['Alt', '2'], description: 'Switch sidebar sections' },
        { keys: ['Alt', '3'], description: 'Switch sidebar sections' },
        { keys: ['Alt', '4'], description: 'Switch sidebar sections' },
        { keys: ['Alt', '5'], description: 'Switch sidebar sections' },
        { keys: ['Alt', '6'], description: 'Switch sidebar sections' },
        { keys: ['Alt', '7'], description: 'Switch sidebar sections' },
        { keys: ['Alt', '8'], description: 'Switch sidebar sections' },
        { keys: ['Alt', '9'], description: 'Switch sidebar sections' },
      ],
    },
    {
      title: 'Chat',
      shortcuts: [
        { keys: ['Enter'], description: 'Send message' },
        { keys: ['Shift', 'Enter'], description: 'New line' },
      ],
    },
  ], []);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className='fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm'
            onClick={handleClose}
            aria-hidden='true'
          />

          {/* Centered card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' as const }}
            className='fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none'
            onClick={handleClose}
          >
            <div
              className='bg-card border border-border/60 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden pointer-events-auto'
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className='flex items-center justify-between px-6 py-4 border-b border-border/50'>
                <div className='flex items-center gap-3'>
                  <div className='w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20'>
                    <span className='text-white text-sm font-bold'>⌨</span>
                  </div>
                  <div>
                    <h2 className='text-base font-semibold'>Keyboard Shortcuts</h2>
                    <p className='text-[11px] text-muted-foreground'>{platform === 'mac' ? 'macOS shortcuts shown' : 'Windows shortcuts shown'}</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className='w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors'
                  aria-label='Close'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>

              {/* Scrollable content */}
              <div className='overflow-y-auto max-h-[calc(85vh-73px)] p-4' style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(155,155,155,0.3) transparent' }}>
                <div className='space-y-5'>
                  {groups.map((group) => (
                    <div key={group.title}>
                      <h3 className='text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 mb-2'>
                        {group.title}
                      </h3>
                      <div className='space-y-0.5'>
                        {group.shortcuts.map((shortcut, si) => (
                          <ShortcutRow
                            key={`${group.title}-${si}`}
                            shortcut={shortcut}
                            modKey={modKey}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer hint */}
                <div className='mt-6 pt-4 border-t border-border/50 text-center'>
                  <p className='text-xs text-muted-foreground'>
                    Press{' '}
                    <Kbd>?</Kbd>{' '}
                    or{' '}
                    <Kbd>{modKey}</Kbd>+<Kbd>/</Kbd>{' '}
                    to toggle this panel
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
