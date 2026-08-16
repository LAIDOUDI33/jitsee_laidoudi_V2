'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Trash2, GripVertical, Loader2, Star, Eye } from 'lucide-react';
import { toast } from 'sonner';
export interface PollOption {
  id: string;
  label: string;
}
export type PollType = 'single' | 'multiple' | 'rating';
export interface PollConfig {
  question: string;
  type: PollType;
  options: PollOption[];
  anonymous: boolean;
  showResults: boolean;
  timer: number;
}
interface PollBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatePoll: (config: PollConfig) => void;
}
let optionIdCounter = 0;
function makeOption(label = ''): PollOption {
  return { id: `opt-${++optionIdCounter}`, label };
}
const TIMER_OPTIONS = [
  { value: '0', label: 'No limit' },
  { value: '30', label: '30 seconds' },
  { value: '60', label: '1 minute' },
  { value: '120', label: '2 minutes' },
  { value: '300', label: '5 minutes' },
];
export default function PollBuilder({ open, onOpenChange, onCreatePoll }: PollBuilderProps) {
  const [question, setQuestion] = useState('');
  const [pollType, setPollType] = useState<PollType>('single');
  const [options, setOptions] = useState<PollOption[]>([makeOption('Option 1'), makeOption('Option 2')]);
  const [anonymous, setAnonymous] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [timer, setTimer] = useState('0');
  const [creating, setCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const addOption = useCallback(() => {
    if (options.length >= 10) { toast.warning('Maximum 10 options allowed'); return; }
    setOptions(prev => [...prev, makeOption(`Option ${prev.length + 1}`)]);
  }, [options.length]);
  const removeOption = useCallback((id: string) => {
    if (options.length <= 2) { toast.warning('Minimum 2 options required'); return; }
    setOptions(prev => prev.filter(o => o.id !== id));
  }, [options.length]);
  const updateOption = useCallback((id: string, label: string) => {
    setOptions(prev => prev.map(o => o.id === id ? { ...o, label } : o));
  }, []);
  const resetForm = useCallback(() => {
    setQuestion('');
    setPollType('single');
    setOptions([makeOption('Option 1'), makeOption('Option 2')]);
    setAnonymous(false);
    setShowResults(true);
    setTimer('0');
    setCreating(false);
  }, []);
  const handleCreate = useCallback(async () => {
    if (!question.trim()) { toast.error('Please enter a question'); return; }
    const validOptions = options.filter(o => o.label.trim());
    if (validOptions.length < 2) { toast.error('At least 2 non-empty options required'); return; }
    setCreating(true);
    await new Promise(r => setTimeout(r, 600));
    onCreatePoll({
      question: question.trim(),
      type: pollType,
      options: validOptions,
      anonymous,
      showResults,
      timer: parseInt(timer),
    });
    toast.success('Poll created and shared!');
    resetForm();
    onOpenChange(false);
  }, [question, pollType, options, anonymous, showResults, timer, onCreatePoll, onOpenChange, resetForm]);
  const typeLabels: Record<PollType, string> = { single: 'Single Choice', multiple: 'Multiple Choice', rating: 'Rating (1-5 ★)' };
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[540px] p-0 gap-0 overflow-hidden bg-white/[0.03] backdrop-blur-2xl border-white/10 text-white">
        {/* Gradient accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-cyan-500" />
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center">
              <Star size={14} className="text-emerald-400" />
            </div>
            Create Poll
          </DialogTitle>
          <DialogDescription className="text-white/40 text-xs mt-1">
            Ask a question and collect responses from participants
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-5">
          {/* Question Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60">Question</label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to ask?"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl resize-none min-h-[72px] focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/40"
              maxLength={300}
            />
            <p className="text-[10px] text-white/25 text-right">{question.length}/300</p>
          </div>
          {/* Poll Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60">Poll Type</label>
            <RadioGroup
              value={pollType}
              onValueChange={(v) => setPollType(v as PollType)}
              className="grid grid-cols-3 gap-2"
            >
              {(['single', 'multiple', 'rating'] as PollType[]).map((t) => (
                <label
                  key={t}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border cursor-pointer transition-all text-xs font-medium ${
                    pollType === t
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white/70'
                  }`}
                >
                  <RadioGroupItem value={t} className="sr-only" />
                  {t === 'rating' ? <Star size={12} /> : t === 'multiple' ? <span className="text-[10px]">☑</span> : <span className="text-[10px]">◉</span>}
                  {typeLabels[t]}
                </label>
              ))}
            </RadioGroup>
          </div>
          {/* Options (not for rating) */}
          {pollType !== 'rating' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-white/60">
                  Options <Badge variant="secondary" className="ml-1.5 text-[10px] bg-white/10 text-white/50 h-4 px-1.5 rounded-md border-0">{options.length}/10</Badge>
                </label>
                <Button
                  variant="ghost" size="sm" className="h-6 text-[11px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2"
                  onClick={addOption}
                  disabled={options.length >= 10}
                >
                  <Plus size={12} className="mr-1" /> Add Option
                </Button>
              </div>
              <div className="space-y-1.5">
                <AnimatePresence initial={false}>
                  {options.map((opt, idx) => (
                    <motion.div
                      key={opt.id}
                      layout
                      initial={{ opacity: 0, x: -16, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: 16, height: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="flex items-center gap-1.5"
                    >
                      <GripVertical size={14} className="text-white/15 shrink-0 cursor-grab" />
                      <span className="text-[10px] text-white/25 w-4 shrink-0 text-center font-mono">{idx + 1}</span>
                      <Input
                        value={opt.label}
                        onChange={(e) => updateOption(opt.id, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/20 rounded-lg h-8 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/40"
                      />
                      <Button
                        variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/30 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                        onClick={() => removeOption(opt.id)}
                        disabled={options.length <= 2}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
          {/* Rating preview for rating type */}
          {pollType === 'rating' && (
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <p className="text-xs text-white/40 mb-2">Rating scale preview:</p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={28} className="text-white/15" />
                ))}
              </div>
              <p className="text-[10px] text-white/25 mt-2">Participants will rate from 1 to 5 stars</p>
            </div>
          )}
          {/* Settings Row */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-white/60">Settings</label>
            <div className="bg-white/[0.03] rounded-xl border border-white/5 divide-y divide-white/5">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-white/80">Anonymous voting</p>
                  <p className="text-[10px] text-white/30">Hide voter identities</p>
                </div>
                <Switch checked={anonymous} onCheckedChange={setAnonymous} />
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-white/80">Show results after voting</p>
                  <p className="text-[10px] text-white/30">Participants see live results</p>
                </div>
                <Switch checked={showResults} onCheckedChange={setShowResults} />
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-white/80">Timer</p>
                  <p className="text-[10px] text-white/30">Auto-close poll after time</p>
                </div>
                <Select value={timer} onValueChange={setTimer}>
                  <SelectTrigger className="w-[130px] h-8 text-xs bg-white/5 border-white/10 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/10">
                    {TIMER_OPTIONS.map(t => (
                      <SelectItem key={t.value} value={t.value} className="text-white/80 focus:bg-white/10 focus:text-white">{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {/* Preview Section */}
          <div className="space-y-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white/70 transition-colors"
            >
              <Eye size={12} />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <AnimatePresence>
              {showPreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 space-y-3">
                    <p className="text-xs font-medium text-white/60">Preview</p>
                    {pollType === 'rating' ? (
                      <div className="text-center py-3">
                        <p className="text-sm text-white/80 mb-2">{question || 'Your question...'}</p>
                        <div className="flex gap-2 justify-center">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} size={24} className="text-amber-400/40" />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-white/80">{question || 'Your question...'}</p>
                        <div className="space-y-1.5">
                          {options.filter(o => o.label.trim()).map((opt, i) => (
                            <div key={opt.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                              <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" />
                              <span className="text-xs text-white/60">{opt.label || `Option ${i + 1}`}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {anonymous && <Badge variant="outline" className="text-[10px] border-white/10 text-white/40 rounded-md">🔒 Anonymous</Badge>}
                      {showResults && <Badge variant="outline" className="text-[10px] border-white/10 text-white/40 rounded-md">📊 Live Results</Badge>}
                      {timer !== '0' && <Badge variant="outline" className="text-[10px] border-white/10 text-white/40 rounded-md">⏱ {TIMER_OPTIONS.find(t => t.value === timer)?.label}</Badge>}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <DialogFooter className="px-6 pb-5 pt-2 border-t border-white/5">
          <Button variant="ghost" className="text-white/50 hover:text-white hover:bg-white/10" onClick={() => { resetForm(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !question.trim()}
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-500/20 rounded-xl"
          >
            {creating ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Star size={14} className="mr-1.5" />}
            {creating ? 'Creating...' : 'Create Poll'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
