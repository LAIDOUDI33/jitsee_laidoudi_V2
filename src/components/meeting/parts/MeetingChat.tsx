'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { type ChatMessage, type Participant, mockParticipants } from './meeting-data';

// ─── Props ─────────────────────────────────────────────────────
export interface MeetingChatProps {
  chatMessages: ChatMessage[];
  typingUserNames: string[];
  onSendMessage: (content: string) => void;
  onSetTyping: (isTyping: boolean) => void;
}

// ─── Component ─────────────────────────────────────────────────
export default function MeetingChat({
  chatMessages,
  typingUserNames,
  onSendMessage,
  onSetTyping,
}: MeetingChatProps) {
  const [chatInput, setChatInput] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionList, setShowMentionList] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Auto-scroll chat ---
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const filteredMentions = useMemo(() => {
    if (!mentionQuery) return mockParticipants.slice(0, 5);
    return mockParticipants.filter(p => p.name.toLowerCase().includes(mentionQuery));
  }, [mentionQuery]);

  const handleSendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
    setShowMentionList(false);
    onSetTyping(false);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, [chatInput, onSendMessage, onSetTyping]);

  const handleChatInputChange = useCallback((value: string) => {
    setChatInput(value);
    onSetTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      onSetTyping(false);
      typingTimerRef.current = null;
    }, 3000);

    const atIndex = value.lastIndexOf('@');
    if (atIndex >= 0) {
      const query = value.slice(atIndex + 1).split(/\s/)[0];
      if (query.length > 0 || atIndex === value.length - 1) {
        setMentionQuery(query.toLowerCase());
        setShowMentionList(true);
        return;
      }
    }
    setShowMentionList(false);
  }, [onSetTyping]);

  const handleMentionSelect = useCallback((name: string) => {
    const atIndex = chatInput.lastIndexOf('@');
    const before = chatInput.slice(0, atIndex);
    setChatInput(`${before}@${name} `);
    setShowMentionList(false);
    chatInputRef.current?.focus();
  }, [chatInput]);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {chatMessages.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-white/30">No messages yet. Start the conversation!</p>
            </div>
          )}
          {chatMessages.map((msg) => (
            <div key={msg.id}>
              {msg.isSystem ? (
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] text-white/30 px-2">{msg.text}</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group"
                >
                  <div className="flex gap-2.5">
                    <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                      <AvatarFallback className={`${msg.color} text-white text-[10px] font-bold`}>{msg.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-white/90">{msg.sender}</span>
                        <span className="text-[10px] text-white/25">{msg.time}</span>
                      </div>
                      <div className="mt-1 bg-white/[0.06] rounded-2xl rounded-tl-sm px-3 py-2 inline-block max-w-full">
                        <p className="text-sm text-white/80 break-words leading-relaxed">{msg.text}</p>
                      </div>
                      {/* Reactions row */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {msg.reactions.map((r, ri) => (
                            <span key={ri} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs hover:bg-white/10 cursor-pointer transition-colors">
                              {r} <span className="text-[10px] text-white/40">{ri + 1}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
          {/* Typing indicator */}
          {typingUserNames.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-white/30">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-white/40"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              <span>{typingUserNames.join(', ')} {typingUserNames.length === 1 ? 'is' : 'are'} typing...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      {/* @Mention dropdown */}
      <AnimatePresence>
        {showMentionList && filteredMentions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-14 left-3 right-3 max-h-40 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
          >
            <ScrollArea className="max-h-40">
              <div className="p-1">
                {filteredMentions.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleMentionSelect(p.name)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className={`${p.color} text-white text-[9px] font-bold`}>{p.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-xs font-medium">{p.name}</span>
                      <span className="text-[10px] text-white/40 ml-2">{p.role}</span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Input */}
      <div className="p-3 border-t border-white/10 bg-white/[0.02]">
        <div className="flex gap-2">
          <Input
            ref={chatInputRef}
            value={chatInput}
            onChange={(e) => handleChatInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !showMentionList && handleSendChat()}
            placeholder="Type a message... (use @ to mention)"
            className="bg-white/5 border-white/10 text-sm h-9 placeholder:text-white/25 focus:border-violet-500/50 rounded-xl"
          />
          <Button size="icon" onClick={handleSendChat} className="h-9 w-9 shrink-0 bg-violet-600 hover:bg-violet-700 rounded-xl">
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
