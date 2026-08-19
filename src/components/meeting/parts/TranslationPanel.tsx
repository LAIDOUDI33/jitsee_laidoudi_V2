'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Languages, Copy, Check, ArrowRight, Loader2, RefreshCw, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { authFetch } from '@/lib/api';

// ─── Constants ──────────────────────────────────────────────────────

const TRANSLATION_LANGUAGES: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'pt': 'Portuguese',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'ru': 'Russian',
  'it': 'Italian',
};

// ─── Types ──────────────────────────────────────────────────────────

interface TranslationPair {
  id: string;
  sourceText: string;
  translatedText: string;
  targetLang: string;
  targetLangName: string;
  timestamp: Date;
}

// ─── Custom Scrollbar ──────────────────────────────────────────────
const scrollbarCSS = `
  .translation-panel-scroll::-webkit-scrollbar { width: 5px; }
  .translation-panel-scroll::-webkit-scrollbar-track { background: transparent; }
  .translation-panel-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 10px; }
  .translation-panel-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
`;

// ─── Component ──────────────────────────────────────────────────────
export default function TranslationPanel() {
  const [sourceText, setSourceText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [history, setHistory] = useState<TranslationPair[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll history
  useEffect(() => {
    if (historyRef.current) {
      const el = historyRef.current.querySelector('[data-radix-scroll-area-viewport]') || historyRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [history]);

  // ── Translate ─────────────────────────────────────────────
  const handleTranslate = useCallback(async () => {
    const trimmed = sourceText.trim();
    if (!trimmed) {
      toast.info('Enter text to translate');
      return;
    }

    setIsTranslating(true);
    setTranslateError(null);

    try {
      const res = await authFetch('/api/v1/ai/translate', {
        method: 'POST',
        body: JSON.stringify({
          text: trimmed,
          targetLanguage,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: { message: 'Translation failed' } }));
        throw new Error(data?.error?.message || `Server error (${res.status})`);
      }

      const data = await res.json();
      const result = data?.data?.translatedText || data?.translatedText || data?.result || '';

      if (!result) throw new Error('Empty translation result');

      setTranslatedText(result);

      // Add to history
      const pair: TranslationPair = {
        id: `tp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sourceText: trimmed,
        translatedText: result,
        targetLang: targetLanguage,
        targetLangName: TRANSLATION_LANGUAGES[targetLanguage] || targetLanguage,
        timestamp: new Date(),
      };
      setHistory((prev) => [...prev.slice(-49), pair]); // keep last 50
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Translation failed';
      setTranslateError(message);
      toast.error('Translation failed', { description: message });
    } finally {
      setIsTranslating(false);
    }
  }, [sourceText, targetLanguage]);

  // ── Copy ──────────────────────────────────────────────────
  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  // ── Clear history ─────────────────────────────────────────
  const handleClearHistory = useCallback(() => {
    setHistory([]);
    toast.info('Translation history cleared');
  }, []);

  // ── Populate from history ─────────────────────────────────
  const handlePopulateFromHistory = useCallback((pair: TranslationPair) => {
    setSourceText(pair.sourceText);
    setTargetLanguage(pair.targetLang);
    setTranslatedText(pair.translatedText);
  }, []);

  return (
    <>
      <style>{scrollbarCSS}</style>
      <div className="flex flex-col h-full">
        {/* ── Header ── */}
        <div className="shrink-0 border-b border-white/10 bg-white/[0.03] backdrop-blur-xl px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <Languages size={14} className="text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Translation</h3>
            </div>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger className="h-7 w-[120px] text-[11px] bg-white/5 border-white/10 text-white/80 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                {Object.entries(TRANSLATION_LANGUAGES).map(([code, name]) => (
                  <SelectItem key={code} value={code} className="text-xs text-white/80">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Source input */}
          <Textarea
            placeholder="Enter text to translate…"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            rows={3}
            className="text-xs bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-lg resize-none focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/30"
          />

          {/* Translate button */}
          <Button
            onClick={handleTranslate}
            disabled={isTranslating || !sourceText.trim()}
            className="w-full mt-2 h-8 text-xs gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
          >
            {isTranslating ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <ArrowRight size={13} />
            )}
            {isTranslating ? 'Translating…' : 'Translate'}
            {!isTranslating && (
              <span className="text-white/60">→ {TRANSLATION_LANGUAGES[targetLanguage]}</span>
            )}
          </Button>
        </div>

        {/* ── Translated result ── */}
        <AnimatePresence>
          {(translatedText || translateError) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-white/10"
            >
              {translateError ? (
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-red-400 font-medium">Translation Error</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleTranslate}
                      className="h-6 px-2 text-[10px] gap-1 text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-md"
                    >
                      <RefreshCw size={10} />
                      Retry
                    </Button>
                  </div>
                  <p className="text-xs text-red-300/80 bg-red-500/10 rounded-lg p-2">{translateError}</p>
                </div>
              ) : (
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-cyan-400 font-medium">
                      {TRANSLATION_LANGUAGES[targetLanguage]} Translation
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(translatedText, 'current')}
                      className="h-6 px-2 text-[10px] gap-1 text-white/50 hover:text-white hover:bg-white/10 rounded-md"
                    >
                      {copiedId === 'current' ? (
                        <Check size={10} className="text-emerald-400" />
                      ) : (
                        <Copy size={10} />
                      )}
                      {copiedId === 'current' ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed bg-cyan-500/5 border border-cyan-500/10 rounded-lg p-2.5">
                    {translatedText}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Recent Translations ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-white/10">
            <span className="text-[11px] font-medium text-white/50">
              Recent Translations {history.length > 0 && `(${history.length})`}
            </span>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                className="h-5 px-1.5 text-[10px] text-white/30 hover:text-red-300 hover:bg-red-500/10 rounded-md"
              >
                <Trash2 size={10} className="mr-0.5" />
                Clear
              </Button>
            )}
          </div>

          <div ref={historyRef} className="flex-1 overflow-hidden">
            <ScrollArea className="h-full translation-panel-scroll">
              <div className="px-4 py-2 space-y-2">
                <AnimatePresence initial={false}>
                  {history.map((pair) => (
                    <motion.div
                      key={pair.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] cursor-pointer transition-colors group"
                      onClick={() => handlePopulateFromHistory(pair)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-cyan-400/70 font-medium">→ {pair.targetLangName}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(pair.translatedText, pair.id);
                          }}
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-opacity"
                        >
                          {copiedId === pair.id ? (
                            <Check size={10} className="text-emerald-400" />
                          ) : (
                            <Copy size={10} />
                          )}
                        </Button>
                      </div>
                      <p className="text-[11px] text-white/60 line-clamp-2 mb-1">{pair.sourceText}</p>
                      <p className="text-[11px] text-slate-300 line-clamp-2">{pair.translatedText}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {history.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-white/20">
                    <Languages size={24} className="mb-2" />
                    <p className="text-[11px]">No translations yet</p>
                    <p className="text-[10px] mt-0.5">Enter text above to get started</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </>
  );
}
