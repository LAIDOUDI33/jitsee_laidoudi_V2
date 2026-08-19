'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reactionEmojis } from './meeting-data';

type FloatingEmoji = {
  id: string;
  emoji: string;
  x: number;
};

interface ReactionsBarProps {
  handRaised: boolean;
  onSendReaction: (emoji: string) => void;
  onToggleHand: () => void;
  onFloatingEmoji?: (emoji: FloatingEmoji) => void;
}

export default function ReactionsBar({
  handRaised,
  onSendReaction,
  onToggleHand,
  onFloatingEmoji,
}: ReactionsBarProps) {
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const barRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!reactionsOpen) return;
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setReactionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [reactionsOpen]);

  const handleReactionClick = (emoji: string) => {
    onSendReaction(emoji);

    // Create a floating emoji
    const id = `float-${Date.now()}-${Math.random()}`;
    const rect = barRef.current?.getBoundingClientRect();
    const barCenterX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const x = barCenterX - 20 + (Math.random() - 0.5) * 100;
    const floatEmoji: FloatingEmoji = { id, emoji, x };

    setFloatingEmojis(prev => [...prev, floatEmoji]);
    onFloatingEmoji?.(floatEmoji);
    setReactionsOpen(false);
  };

  const removeFloatingEmoji = (id: string) => {
    setFloatingEmojis(prev => prev.filter(e => e.id !== id));
  };

  return (
    <>
      {/* Floating emoji animations */}
      <div className="fixed inset-0 pointer-events-none z-[101]">
        <AnimatePresence>
          {floatingEmojis.map(fe => (
            <motion.div
              key={fe.id}
              className="fixed text-4xl pointer-events-none"
              style={{ left: fe.x, bottom: 80 }}
              initial={{ y: 0, opacity: 1, scale: 0.5 }}
              animate={{ y: -200, opacity: 0, scale: 1.2 }}
              transition={{ duration: 2, ease: 'easeOut' as const }}
              onAnimationComplete={() => removeFloatingEmoji(fe.id)}
            >
              {fe.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bar */}
      <div
        ref={barRef}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1"
      >
        <AnimatePresence>
          {reactionsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-black/70 backdrop-blur-xl border border-white/10 mr-1"
            >
              {reactionEmojis.map((emoji) => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => handleReactionClick(emoji)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-lg"
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reaction button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setReactionsOpen(!reactionsOpen)}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors border backdrop-blur-xl ${
            reactionsOpen
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              : 'bg-black/60 border-white/10 text-white/80 hover:bg-black/70'
          }`}
          aria-label="Reactions"
        >
          <span className="text-xl">❤️</span>
        </motion.button>

        {/* Hand raise button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleHand}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors border backdrop-blur-xl ml-1 ${
            handRaised
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
              : 'bg-black/60 border-white/10 text-white/80 hover:bg-black/70'
          }`}
          aria-label={handRaised ? 'Lower hand' : 'Raise hand'}
        >
          <span className="text-xl">✋</span>
        </motion.button>
      </div>
    </>
  );
}
