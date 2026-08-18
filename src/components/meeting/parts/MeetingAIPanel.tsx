'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { type ChatMessage, aiSuggestions, aiResponses } from './meeting-data';

// ─── AI Typing Indicator ──────────────────────────────────────
function AITypingIndicator() {
  return (
    <div className="flex gap-2.5 border-l-2 border-violet-500/50 pl-3">
      <Avatar className="w-7 h-7 shrink-0">
        <AvatarFallback className="bg-violet-500 text-white text-[10px] font-bold">AI</AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1.5 py-2.5">
        <motion.span
          className="w-2 h-2 rounded-full bg-violet-400"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
        />
        <motion.span
          className="w-2 h-2 rounded-full bg-violet-400"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
        />
        <motion.span
          className="w-2 h-2 rounded-full bg-violet-400"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
        />
      </div>
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────────────
export interface MeetingAIPanelProps {
  userName: string;
}

// ─── Component ─────────────────────────────────────────────────
export default function MeetingAIPanel({
  userName,
}: MeetingAIPanelProps) {
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const aiEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { aiEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages, aiTyping]);

  const handleAISuggestion = useCallback((suggestion: string) => {
    const userMsg: ChatMessage = {
      id: `ai-user-${Date.now()}`,
      sender: userName || 'You',
      initials: (userName || 'Y').split(' ').map(n => n[0]).join(''),
      color: 'bg-blue-500',
      text: suggestion,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setAiMessages(prev => [...prev, userMsg]);
    setAiTyping(true);
    setTimeout(() => {
      setAiTyping(false);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ALVISION AI',
        initials: 'AI',
        color: 'bg-violet-500',
        text: aiResponses[suggestion] || "I'm analyzing the meeting content. Based on the discussion so far, here are my insights...",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAI: true,
      };
      setAiMessages(prev => [...prev, aiMsg]);
    }, 2000);
  }, [userName]);

  const handleSendAI = useCallback(() => {
    if (!aiInput.trim()) return;
    handleAISuggestion(aiInput.trim());
    setAiInput('');
  }, [aiInput, handleAISuggestion]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02] flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
          <Sparkles size={14} className="text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">AI Meeting Assistant</h3>
          <p className="text-[10px] text-white/30">Powered by ALVISION</p>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {aiMessages.length === 0 && !aiTyping && (
            <div className="py-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center mx-auto mb-4 border border-violet-500/20"
              >
                <Sparkles size={28} className="text-violet-400" />
              </motion.div>
              <p className="text-center text-sm text-white/40 mb-5">Ask me anything about this meeting</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {aiSuggestions.map((suggestion) => (
                  <motion.button
                    key={suggestion}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAISuggestion(suggestion)}
                    className="px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/30 transition-all"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {aiMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${msg.isAI ? 'border-l-2 border-violet-500/50 pl-3 ml-0.5' : ''}`}
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
                  <div className={`mt-1 text-sm text-white/75 break-words whitespace-pre-wrap leading-relaxed ${
                    msg.isAI ? 'bg-violet-500/5 rounded-xl px-3 py-2' : 'bg-white/[0.06] rounded-2xl rounded-tl-sm px-3 py-2 inline-block'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {aiTyping && <AITypingIndicator />}

          {aiMessages.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
              {aiSuggestions.slice(0, 3).map((suggestion) => (
                <motion.button
                  key={suggestion}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAISuggestion(suggestion)}
                  className="px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 hover:bg-violet-500/20 transition-all"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          )}

          <div ref={aiEndRef} />
        </div>
      </ScrollArea>
      <div className="p-3 border-t border-white/10 bg-white/[0.02]">
        <div className="flex gap-2">
          <Input
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendAI()}
            placeholder="Ask AI something..."
            className="bg-white/5 border-white/10 text-sm h-9 placeholder:text-white/25 focus:border-violet-500/50 rounded-xl"
          />
          <Button size="icon" onClick={handleSendAI} className="h-9 w-9 shrink-0 bg-violet-600 hover:bg-violet-700 rounded-xl">
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
