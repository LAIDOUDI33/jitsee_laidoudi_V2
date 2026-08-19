'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Send, Paperclip, Reply, MoreHorizontal, Copy, Pin, Trash2,
  Monitor, Link2, FileText, Image as ImageIcon, FileArchive, File, Download, X, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Popover, PopoverTrigger, PopoverContent,
} from '@/components/ui/popover';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { type ChatMessage, mockParticipants } from './meeting-data';

// ─── Enhanced Data Types ──────────────────────────────────────
const REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉', '🤔'] as const;
type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

interface Reactor {
  name: string;
  initials: string;
  color: string;
}

interface MessageReaction {
  emoji: ReactionEmoji;
  count: number;
  hasReacted: boolean;
  reactors: Reactor[];
}

interface FileAttachment {
  name: string;
  size: number;
  type: 'pdf' | 'image' | 'archive' | 'document' | 'other';
}

interface LinkAttachment {
  url: string;
  title: string;
}

interface ReplyInfo {
  messageId: string;
  sender: string;
  text: string;
}

interface EnhancedMessage extends ChatMessage {
  fileAttachment?: FileAttachment;
  linkAttachment?: LinkAttachment;
  replyTo?: ReplyInfo;
  replyCount?: number;
  isPinned?: boolean;
}

// ─── Mock enriched data ───────────────────────────────────────
const MOCK_CURRENT_USER = 'Alex Johnson';

// Seed some initial reactions and replies for demonstration
const INITIAL_REACTIONS: Record<string, MessageReaction[]> = {
  'msg-2': [
    { emoji: '👍', count: 3, hasReacted: true, reactors: [
      { name: 'Alex Johnson', initials: 'AJ', color: 'bg-emerald-500' },
      { name: 'Sarah Chen', initials: 'SC', color: 'bg-rose-500' },
      { name: 'Maya Patel', initials: 'MP', color: 'bg-amber-500' },
    ]},
    { emoji: '🎉', count: 1, hasReacted: false, reactors: [
      { name: 'James Wilson', initials: 'JW', color: 'bg-orange-500' },
    ]},
  ],
};

const INITIAL_REPLIES: Record<string, ReplyInfo> = {
  'msg-5': { messageId: 'msg-3', sender: 'Sarah Chen', text: 'I agree, we should prioritize the backend API first.' },
  'msg-7': { messageId: 'msg-5', sender: 'Maya Patel', text: 'Can we schedule a follow-up for this?' },
};

const INITIAL_REPLY_COUNTS: Record<string, number> = {
  'msg-3': 2,
  'msg-5': 1,
};

const MOCK_FILES: Record<string, FileAttachment> = {
  'msg-file-1': { name: 'Q4-Roadmap.pdf', size: 2458624, type: 'pdf' },
};

const MOCK_LINKS: Record<string, LinkAttachment> = {
  'msg-link-1': { url: 'https://docs.alvision.dev/whitepaper', title: 'ALVISION Technical Whitepaper' },
};

const INITIAL_PINS: Set<string> = new Set(['msg-3']);

// ─── Helper Functions ─────────────────────────────────────────
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileIcon(type: FileAttachment['type'], size = 16) {
  const props = { size, strokeWidth: 1.5 };
  switch (type) {
    case 'pdf': return <FileText {...props} className="text-rose-400" />;
    case 'image': return <ImageIcon {...props} className="text-amber-400" />;
    case 'archive': return <FileArchive {...props} className="text-emerald-400" />;
    default: return <File {...props} className="text-teal-400" />;
  }
}

function parseMessageText(text: string): React.ReactNode {
  // Tokenize: preserve URLs, code blocks, bold, italic, and plain text
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let keyIdx = 0;

  // First, split on URLs
  const urlMatches = [...text.matchAll(urlRegex)];
  if (urlMatches.length === 0) {
    return <RichTextSpan key={0} text={text} />;
  }

  for (const match of urlMatches) {
    const before = text.slice(lastIndex, match.index);
    if (before) {
      parts.push(<RichTextSpan key={`t-${keyIdx++}`} text={before} />);
    }
    parts.push(
      <a
        key={`u-${keyIdx++}`}
        href={match[1]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {match[1]}
      </a>
    );
    lastIndex = match.index! + match[0].length;
  }

  const after = text.slice(lastIndex);
  if (after) {
    parts.push(<RichTextSpan key={`t-${keyIdx++}`} text={after} />);
  }

  return <>{parts}</>;
}

function RichTextSpan({ text }: { text: string }) {
  // Parse **bold**, *italic*, `code` within a text segment
  const regex = /\*\*(.+?)\*\*|(?<!\*)\*(?!(?:\*))(.+?)(?<!\*)\*(?!\*)|`(.+?)`/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let keyIdx = 0;

  const matches = [...text.matchAll(regex)];
  if (matches.length === 0) return <>{text}</>;

  for (const m of matches) {
    if (m.index! > lastIdx) {
      parts.push(<span key={`p-${keyIdx++}`}>{text.slice(lastIdx, m.index)}</span>);
    }
    if (m[1]) {
      parts.push(<strong key={`b-${keyIdx++}`} className="font-semibold text-white/90">{m[1]}</strong>);
    } else if (m[2]) {
      parts.push(<em key={`i-${keyIdx++}`} className="italic text-white/70">{m[2]}</em>);
    } else if (m[3]) {
      parts.push(
        <code key={`c-${keyIdx++}`} className="bg-white/10 text-amber-300 px-1 py-0.5 rounded text-xs font-mono">
          {m[3]}
        </code>
      );
    }
    lastIdx = m.index! + m[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(<span key={`p-${keyIdx++}`}>{text.slice(lastIdx)}</span>);
  }

  return <>{parts}</>;
}

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
  const [messageReactions, setMessageReactions] = useState<Record<string, MessageReaction[]>>(INITIAL_REACTIONS);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyInfo | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<Set<string>>(INITIAL_PINS);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [localMessages, setLocalMessages] = useState<EnhancedMessage[]>([]);
  const [localReplyCounts, setLocalReplyCounts] = useState<Record<string, number>>(INITIAL_REPLY_COUNTS);
  const [localReplies, setLocalReplies] = useState<Record<string, ReplyInfo>>(INITIAL_REPLIES);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Merge incoming messages with local enriched data
  const displayMessages = useMemo(() => {
    const existingIds = new Set(localMessages.map(m => m.id));
    const newMsgs = chatMessages
      .filter(m => !existingIds.has(m.id))
      .map(m => {
        const base: EnhancedMessage = { ...m };
        // Check if this is a mock file/link message
        if (MOCK_FILES[m.id]) base.fileAttachment = MOCK_FILES[m.id];
        if (MOCK_LINKS[m.id]) base.linkAttachment = MOCK_LINKS[m.id];
        if (INITIAL_REPLIES[m.id]) base.replyTo = INITIAL_REPLIES[m.id];
        return base;
      });
    return [...localMessages, ...newMsgs];
  }, [chatMessages, localMessages]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages.length]);

  const filteredMentions = useMemo(() => {
    if (!mentionQuery) return mockParticipants.slice(0, 5);
    return mockParticipants.filter(p => p.name.toLowerCase().includes(mentionQuery));
  }, [mentionQuery]);

  const handleSendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    const content = chatInput.trim();

    // Create the message to add locally
    const newMsg: EnhancedMessage = {
      id: `local-${Date.now()}`,
      sender: MOCK_CURRENT_USER,
      initials: 'AJ',
      color: 'bg-emerald-500',
      text: content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // If replying, attach reply info
    if (replyingTo) {
      newMsg.replyTo = replyingTo;
      // Increment reply count on parent
      setLocalReplyCounts(prev => ({
        ...prev,
        [replyingTo.messageId]: (prev[replyingTo.messageId] || 0) + 1,
      }));
      setReplyingTo(null);
    }

    // Check if inserting a link
    if (showLinkInput && linkUrl.trim()) {
      newMsg.linkAttachment = {
        url: linkUrl.trim(),
        title: linkUrl.trim().replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
      };
      setShowLinkInput(false);
      setLinkUrl('');
    }

    setLocalMessages(prev => [...prev, newMsg]);
    onSendMessage(content);
    setChatInput('');
    setShowMentionList(false);
    onSetTyping(false);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, [chatInput, onSendMessage, onSetTyping, replyingTo, showLinkInput, linkUrl]);

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

  // --- Reaction handlers ---
  const handleReaction = useCallback((msgId: string, emoji: ReactionEmoji) => {
    setMessageReactions(prev => {
      const existing = prev[msgId] || [];
      const idx = existing.findIndex(r => r.emoji === emoji);
      if (idx >= 0) {
        if (existing[idx].hasReacted) {
          const updated = {
            ...existing[idx],
            count: existing[idx].count - 1,
            hasReacted: false,
            reactors: existing[idx].reactors.filter(r => r.name === MOCK_CURRENT_USER),
          };
          const newArr = [...existing];
          if (updated.count <= 0) {
            newArr.splice(idx, 1);
          } else {
            newArr[idx] = updated;
          }
          return { ...prev, [msgId]: newArr };
        } else {
          const updated = {
            ...existing[idx],
            count: existing[idx].count + 1,
            hasReacted: true,
            reactors: [...existing[idx].reactors, { name: MOCK_CURRENT_USER, initials: 'AJ', color: 'bg-emerald-500' }],
          };
          const newArr = [...existing];
          newArr[idx] = updated;
          return { ...prev, [msgId]: newArr };
        }
      } else {
        return {
          ...prev,
          [msgId]: [...existing, {
            emoji,
            count: 1,
            hasReacted: true,
            reactors: [{ name: MOCK_CURRENT_USER, initials: 'AJ', color: 'bg-emerald-500' }],
          }],
        };
      }
    });
  }, []);

  // --- Action handlers ---
  const handleReply = useCallback((msg: EnhancedMessage) => {
    setReplyingTo({ messageId: msg.id, sender: msg.sender, text: msg.text });
    chatInputRef.current?.focus();
  }, []);

  const handleCopyText = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Message copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy message');
    });
  }, []);

  const handlePinMessage = useCallback((msgId: string) => {
    setPinnedMessages(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
        toast.info('Message unpinned');
      } else {
        next.add(msgId);
        toast.success('Message pinned');
      }
      return next;
    });
  }, []);

  const handleDeleteMessage = useCallback((msgId: string) => {
    setLocalMessages(prev => prev.filter(m => m.id !== msgId));
    toast.success('Message deleted');
  }, []);

  // --- File handling ---
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let fileType: FileAttachment['type'] = 'other';
    if (file.type.startsWith('image/')) fileType = 'image';
    else if (file.type === 'application/pdf') fileType = 'pdf';
    else if (file.type.includes('zip') || file.type.includes('archive') || file.type.includes('compressed')) fileType = 'archive';
    else if (file.type.includes('document') || file.type.includes('text') || file.name.match(/\.(docx?|xlsx?|pptx?|txt|csv)$/i)) fileType = 'document';

    const newMsg: EnhancedMessage = {
      id: `local-file-${Date.now()}`,
      sender: MOCK_CURRENT_USER,
      initials: 'AJ',
      color: 'bg-emerald-500',
      text: `Shared a file`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fileAttachment: {
        name: file.name,
        size: file.size,
        type: fileType,
      },
    };

    if (replyingTo) {
      newMsg.replyTo = replyingTo;
      setLocalReplyCounts(prev => ({
        ...prev,
        [replyingTo.messageId]: (prev[replyingTo.messageId] || 0) + 1,
      }));
      setReplyingTo(null);
    }

    setLocalMessages(prev => [...prev, newMsg]);
    setAttachmentMenuOpen(false);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [replyingTo]);

  const handleInsertLink = useCallback(() => {
    setShowLinkInput(true);
    setAttachmentMenuOpen(false);
    chatInputRef.current?.focus();
  }, []);

  const handleSendLink = useCallback(() => {
    if (!linkUrl.trim()) {
      setShowLinkInput(false);
      setLinkUrl('');
      return;
    }
    handleSendChat();
  }, [linkUrl, handleSendChat]);

  return (
    <div className="flex flex-col h-full relative">
      {/* Pinned message banner */}
      {pinnedMessages.size > 0 && (
        <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
          <Pin size={11} className="text-amber-400 shrink-0" />
          <span className="text-[10px] text-amber-300 truncate">{
            displayMessages.find(m => pinnedMessages.has(m.id))?.text || 'Pinned message'
          }</span>
          <button
            onClick={() => {
              const id = [...pinnedMessages][0];
              handlePinMessage(id);
            }}
            className="ml-auto text-amber-400/60 hover:text-amber-300 shrink-0"
          >
            <X size={10} />
          </button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {displayMessages.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-white/30">No messages yet. Start the conversation!</p>
            </div>
          )}
          {displayMessages.map((msg) => (
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
                  className="group relative"
                  onMouseEnter={() => setHoveredMsgId(msg.id)}
                  onMouseLeave={() => setHoveredMsgId(null)}
                >
                  <div className={`flex gap-2.5 ${msg.replyTo ? 'ml-3 border-l-2 border-emerald-500/30 pl-3' : ''}`}>
                    <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                      <AvatarFallback className={`${msg.color} text-white text-[10px] font-bold`}>{msg.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-white/90">{msg.sender}</span>
                        <span className="text-[10px] text-white/25">{msg.time}</span>
                        {msg.isPinned && (
                          <Pin size={10} className="text-amber-400" />
                        )}
                        {/* Actions menu */}
                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center transition-colors">
                                <MoreHorizontal size={13} className="text-white/50" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              side="right"
                              align="start"
                              className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white/80 min-w-[160px] p-1"
                            >
                              <DropdownMenuItem
                                onClick={() => handleReply(msg)}
                                className="text-xs gap-2 focus:bg-white/10 focus:text-white rounded-md cursor-pointer"
                              >
                                <Reply size={13} className="text-teal-400" /> Reply
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCopyText(msg.text)}
                                className="text-xs gap-2 focus:bg-white/10 focus:text-white rounded-md cursor-pointer"
                              >
                                <Copy size={13} className="text-emerald-400" /> Copy Text
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handlePinMessage(msg.id)}
                                className="text-xs gap-2 focus:bg-white/10 focus:text-white rounded-md cursor-pointer"
                              >
                                <Pin size={13} className="text-amber-400" />
                                {pinnedMessages.has(msg.id) ? 'Unpin Message' : 'Pin Message'}
                              </DropdownMenuItem>
                              {msg.sender === MOCK_CURRENT_USER && (
                                <>
                                  <DropdownMenuSeparator className="bg-white/10" />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    variant="destructive"
                                    className="text-xs gap-2 focus:bg-rose-500/20 focus:text-rose-300 rounded-md cursor-pointer"
                                  >
                                    <Trash2 size={13} /> Delete Message
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Reply reference */}
                      {msg.replyTo && (
                        <div className="mt-1 flex items-start gap-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1.5 max-w-[90%]">
                          <Reply size={10} className="text-emerald-400 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] font-medium text-emerald-400">{msg.replyTo.sender}</span>
                            <p className="text-[11px] text-white/40 truncate mt-0.5">{msg.replyTo.text}</p>
                          </div>
                        </div>
                      )}

                      {/* Message bubble */}
                      {msg.fileAttachment ? (
                        <FileAttachmentCard file={msg.fileAttachment} />
                      ) : msg.linkAttachment ? (
                        <LinkAttachmentCard link={msg.linkAttachment} />
                      ) : (
                        <div className="mt-1 bg-white/[0.06] rounded-2xl rounded-tl-sm px-3 py-2 inline-block max-w-full">
                          <p className="text-sm text-white/80 break-words leading-relaxed">
                            {parseMessageText(msg.text)}
                          </p>
                        </div>
                      )}

                      {/* Reactions */}
                      {(messageReactions[msg.id]?.length ?? 0) > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {messageReactions[msg.id]!.map((r) => (
                            <motion.button
                              key={r.emoji}
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleReaction(msg.id, r.emoji as ReactionEmoji)}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors cursor-pointer ${
                                r.hasReacted
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                              }`}
                            >
                              <span>{r.emoji}</span>
                              {/* Avatar stack for reactions with 2+ */}
                              {r.count >= 2 && r.reactors.length >= 2 && (
                                <div className="flex -space-x-1">
                                  {r.reactors.slice(0, 3).map((reactor, i) => (
                                    <div
                                      key={i}
                                      className={`w-3.5 h-3.5 rounded-full ${reactor.color} flex items-center justify-center ring-1 ring-slate-900`}
                                    >
                                      <span className="text-[5px] text-white font-bold leading-none">{reactor.initials}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <span className="text-[10px] opacity-70">{r.count}</span>
                            </motion.button>
                          ))}
                        </div>
                      )}

                      {/* Thread reply count indicator */}
                      {localReplyCounts[msg.id] != null && localReplyCounts[msg.id]! > 0 && !msg.replyTo && (
                        <button
                          onClick={() => {
                            const replyMsg = displayMessages.find(m => m.replyTo?.messageId === msg.id);
                            if (replyMsg) {
                              const el = document.querySelector(`[data-msg-id="${replyMsg.id}"]`);
                              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }}
                          className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-400/70 hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          <MessageSquare size={10} />
                          {localReplyCounts[msg.id]} {localReplyCounts[msg.id] === 1 ? 'reply' : 'replies'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hover toolbar: Reply + Reaction picker */}
                  <AnimatePresence>
                    {hoveredMsgId === msg.id && !msg.isSystem && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.7, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.7, y: 4 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 400 }}
                        className="absolute -bottom-3 left-10 flex items-center gap-0.5 bg-slate-800/95 backdrop-blur-md border border-white/15 rounded-full px-1 py-0.5 shadow-xl z-20"
                      >
                        {/* Reply button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReply(msg); }}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-sm hover:bg-white/10 hover:scale-110 transition-all cursor-pointer"
                          title="Reply"
                        >
                          <Reply size={13} className="text-teal-400" />
                        </button>
                        {/* Reaction picker popover */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="w-7 h-7 flex items-center justify-center rounded-full text-sm hover:bg-white/10 hover:scale-110 transition-all cursor-pointer"
                            >
                              <span className="text-sm">😊</span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="bg-slate-900/95 backdrop-blur-xl border-white/15 rounded-xl p-2 w-auto min-w-0"
                            side="top"
                            align="start"
                            sideOffset={8}
                          >
                            <div className="flex gap-1">
                              {REACTION_EMOJIS.map((emoji) => {
                                const hasReacted = messageReactions[msg.id]?.find(r => r.emoji === emoji)?.hasReacted;
                                return (
                                  <motion.button
                                    key={emoji}
                                    whileHover={{ scale: 1.3 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, emoji); }}
                                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg hover:bg-white/10 transition-colors cursor-pointer ${hasReacted ? 'bg-emerald-500/20 ring-1 ring-emerald-500/40' : ''}`}
                                  >
                                    {emoji}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                        {/* Quick reactions */}
                        {REACTION_EMOJIS.slice(0, 3).map((emoji) => {
                          const hasReacted = messageReactions[msg.id]?.find(r => r.emoji === emoji)?.hasReacted;
                          return (
                            <button
                              key={emoji}
                              onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, emoji); }}
                              className={`w-7 h-7 flex items-center justify-center rounded-full text-sm hover:scale-125 transition-transform cursor-pointer ${hasReacted ? 'bg-emerald-500/20' : 'hover:bg-white/10'}`}
                            >
                              {emoji}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
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

      {/* Link input bar */}
      <AnimatePresence>
        {showLinkInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-white/10 bg-white/[0.02]"
          >
            <div className="flex gap-2 px-3 py-2">
              <Link2 size={14} className="text-teal-400 mt-2 shrink-0" />
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendLink(); if (e.key === 'Escape') { setShowLinkInput(false); setLinkUrl(''); } }}
                placeholder="Paste a URL..."
                className="bg-white/5 border-white/10 text-xs h-8 placeholder:text-white/25 focus:border-teal-500/50 rounded-lg"
                autoFocus
              />
              <Button
                size="icon"
                onClick={handleSendLink}
                className="h-8 w-8 shrink-0 bg-teal-600 hover:bg-teal-700 rounded-lg"
              >
                <Send size={12} />
              </Button>
              <button
                onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}
                className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={13} className="text-white/50" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply preview bar */}
      <AnimatePresence>
        {replyingTo && !showLinkInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-emerald-500/20 bg-emerald-500/5"
          >
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-1 h-6 rounded-full bg-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-medium text-emerald-400">Replying to {replyingTo.sender}</span>
                <p className="text-[11px] text-white/40 truncate">{replyingTo.text}</p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="h-6 w-6 rounded-md hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors"
              >
                <X size={12} className="text-white/50" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Input */}
      <div className="p-3 border-t border-white/10 bg-white/[0.02]">
        <div className="flex gap-2 items-center">
          {/* Attachment button */}
          <DropdownMenu open={attachmentMenuOpen} onOpenChange={setAttachmentMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-white/40 hover:text-white/70 hover:bg-white/10 rounded-xl"
              >
                <Paperclip size={15} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white/80 min-w-[180px] p-1"
            >
              <DropdownMenuItem
                onClick={() => {
                  setAttachmentMenuOpen(false);
                  fileInputRef.current?.click();
                }}
                className="text-xs gap-2.5 focus:bg-white/10 focus:text-white rounded-md cursor-pointer py-2"
              >
                <FileText size={14} className="text-emerald-400" /> Upload File
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setAttachmentMenuOpen(false);
                  toast.info('Screen sharing started');
                }}
                className="text-xs gap-2.5 focus:bg-white/10 focus:text-white rounded-md cursor-pointer py-2"
              >
                <Monitor size={14} className="text-teal-400" /> Share Screen
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={handleInsertLink}
                className="text-xs gap-2.5 focus:bg-white/10 focus:text-white rounded-md cursor-pointer py-2"
              >
                <Link2 size={14} className="text-amber-400" /> Insert Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.gif,.svg,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
            onChange={handleFileSelect}
          />

          <Input
            ref={chatInputRef}
            value={chatInput}
            onChange={(e) => handleChatInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !showMentionList) handleSendChat();
              if (e.key === 'Escape' && replyingTo) setReplyingTo(null);
            }}
            placeholder="Type a message... (use @ to mention)"
            className="bg-white/5 border-white/10 text-sm h-9 placeholder:text-white/25 focus:border-teal-500/50 rounded-xl"
          />
          <Button
            size="icon"
            onClick={handleSendChat}
            className="h-9 w-9 shrink-0 bg-teal-600 hover:bg-teal-700 rounded-xl"
          >
            <Send size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────

function FileAttachmentCard({ file }: { file: FileAttachment }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-1 bg-white/[0.06] border border-white/10 rounded-xl p-3 max-w-[280px] inline-flex flex-col gap-2"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
          {getFileIcon(file.type, 18)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-white/80 truncate">{file.name}</p>
          <p className="text-[10px] text-white/40">{formatFileSize(file.size)}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-[10px] text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 w-fit rounded-lg gap-1.5 px-2.5"
        onClick={() => toast.success('Download started')}
      >
        <Download size={11} /> Download
      </Button>
    </motion.div>
  );
}

function LinkAttachmentCard({ link }: { link: LinkAttachment }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 bg-white/[0.06] border border-white/10 rounded-xl p-3 max-w-[280px] flex items-center gap-2.5 hover:bg-white/[0.1] transition-colors group/link block"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-9 h-9 rounded-lg bg-teal-500/15 flex items-center justify-center shrink-0">
          <Link2 size={16} className="text-teal-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-white/80 group-hover/link:text-teal-300 transition-colors truncate">{link.title}</p>
          <p className="text-[10px] text-white/40 truncate">{link.url}</p>
        </div>
      </a>
    </motion.div>
  );
}
