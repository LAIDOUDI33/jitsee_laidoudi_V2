'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Webhook,
  Plus,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Search,
  Clock,
  Zap,
  Hash,
  Eye,
  EyeOff,
  ArrowRight,
  MessageSquare,
  Mail,
  Calendar,
  Video,
  Sparkles,
  MicOff,
  UsersRound,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  lastTriggered: string;
  responseCode: number | null;
}

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  enabled: boolean;
}

interface EventLogEntry {
  id: string;
  timestamp: string;
  event: string;
  webhookUrl: string;
  status: number;
  responseTime: string;
  retryCount: number;
}

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const WEBHOOK_EVENTS = [
  'meeting.created',
  'meeting.ended',
  'user.joined',
  'recording.ready',
  'ai.summary',
] as const;

const EVENT_COLORS: Record<string, string> = {
  'meeting.created': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  'meeting.ended': 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  'user.joined': 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
  'recording.ready': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  'ai.summary': 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
};

function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'whsec_';
  for (let i = 0; i < 32; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function maskSecret(secret: string): string {
  if (secret.length <= 12) return '••••••••••••';
  return secret.slice(0, 7) + '••••••••••••' + secret.slice(-4);
}

function truncateUrl(url: string, maxLen = 40): string {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen - 3) + '...';
}

const INITIAL_WEBHOOKS: WebhookItem[] = [
  { id: 'wh_1', url: 'https://api.slack.com/webhooks/T03KL/event/X8bN2m', events: ['meeting.created', 'meeting.ended'], secret: 'whsec_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', active: true, lastTriggered: '2 min ago', responseCode: 200 },
  { id: 'wh_2', url: 'https://hooks.notion.so/services/a1b2c3d4-e5f6-7890-abcd', events: ['ai.summary'], secret: 'whsec_q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2', active: true, lastTriggered: '15 min ago', responseCode: 200 },
  { id: 'wh_3', url: 'https://discord.com/api/webhooks/11223344/aBcDeFg', events: ['user.joined', 'meeting.ended'], secret: 'whsec_g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8', active: false, lastTriggered: '3 hours ago', responseCode: 400 },
  { id: 'wh_4', url: 'https://api.github.com/repos/alvision/webhooks/push', events: ['recording.ready', 'ai.summary'], secret: 'whsec_w9x0y1z2a3b4c5d6e7f8g9h0i1j2k3l4', active: true, lastTriggered: '1 hour ago', responseCode: 200 },
  { id: 'wh_5', url: 'https://hooks.zapier.com/hooks/catch/98765/xyzabc', events: ['meeting.created', 'user.joined', 'ai.summary'], secret: 'whsec_m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0', active: true, lastTriggered: '30 sec ago', responseCode: 200 },
  { id: 'wh_6', url: 'https://automate.pipedream.com/api/v1/webhooks/abc', events: ['meeting.ended', 'recording.ready'], secret: 'whsec_c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6', active: false, lastTriggered: '2 days ago', responseCode: 500 },
];

const TEMPLATES: AutomationTemplate[] = [
  { id: 'tpl_1', name: 'Slack Notification on Meeting Start', description: 'Send a message to a Slack channel whenever a new meeting begins with participant info and link.', icon: MessageSquare, iconBg: 'bg-purple-500', enabled: true },
  { id: 'tpl_2', name: 'Email Digest Daily', description: 'Compile a daily summary of all meetings, recordings, and AI notes sent to your inbox every morning.', icon: Mail, iconBg: 'bg-rose-500', enabled: false },
  { id: 'tpl_3', name: 'Google Calendar Sync', description: 'Automatically create and update Google Calendar events when meetings are scheduled in ALVISION.', icon: Calendar, iconBg: 'bg-sky-500', enabled: true },
  { id: 'tpl_4', name: 'Record All Meetings', description: 'Enable cloud recording automatically for every meeting started in your organization.', icon: Video, iconBg: 'bg-emerald-500', enabled: false },
  { id: 'tpl_5', name: 'AI Summary on End', description: 'Generate and distribute AI-powered meeting summaries to all participants when a meeting ends.', icon: Sparkles, iconBg: 'bg-amber-500', enabled: true },
  { id: 'tpl_6', name: 'Auto-Mute Late Joiners', description: 'Automatically mute participants who join more than 5 minutes after the meeting starts.', icon: MicOff, iconBg: 'bg-orange-500', enabled: false },
  { id: 'tpl_7', name: 'Breakout Rooms Auto-Assign', description: 'Intelligently assign participants to breakout rooms based on team and role metadata.', icon: UsersRound, iconBg: 'bg-teal-500', enabled: false },
  { id: 'tpl_8', name: 'Meeting Notes to Notion', description: 'Export formatted meeting notes, action items, and AI summaries directly to a Notion database.', icon: FileText, iconBg: 'bg-neutral-700 dark:bg-neutral-300', enabled: true },
];

const EVENT_LOG: EventLogEntry[] = [
  { id: 'log_1', timestamp: '2025-01-15 14:32:01', event: 'meeting.created', webhookUrl: 'https://api.slack.com/webhooks/T03KL/event/X8bN2m', status: 200, responseTime: '142ms', retryCount: 0 },
  { id: 'log_2', timestamp: '2025-01-15 14:30:15', event: 'user.joined', webhookUrl: 'https://hooks.zapier.com/hooks/catch/98765/xyzabc', status: 200, responseTime: '98ms', retryCount: 0 },
  { id: 'log_3', timestamp: '2025-01-15 14:28:44', event: 'ai.summary', webhookUrl: 'https://hooks.notion.so/services/a1b2c3d4-e5f6-7890-abcd', status: 200, responseTime: '312ms', retryCount: 0 },
  { id: 'log_4', timestamp: '2025-01-15 14:25:10', event: 'meeting.ended', webhookUrl: 'https://discord.com/api/webhooks/11223344/aBcDeFg', status: 400, responseTime: '45ms', retryCount: 1 },
  { id: 'log_5', timestamp: '2025-01-15 14:20:33', event: 'recording.ready', webhookUrl: 'https://api.github.com/repos/alvision/webhooks/push', status: 200, responseTime: '256ms', retryCount: 0 },
  { id: 'log_6', timestamp: '2025-01-15 13:55:22', event: 'meeting.created', webhookUrl: 'https://hooks.zapier.com/hooks/catch/98765/xyzabc', status: 200, responseTime: '178ms', retryCount: 0 },
  { id: 'log_7', timestamp: '2025-01-15 13:45:08', event: 'user.joined', webhookUrl: 'https://api.slack.com/webhooks/T03KL/event/X8bN2m', status: 200, responseTime: '88ms', retryCount: 0 },
  { id: 'log_8', timestamp: '2025-01-15 13:30:00', event: 'ai.summary', webhookUrl: 'https://hooks.notion.so/services/a1b2c3d4-e5f6-7890-abcd', status: 500, responseTime: '1205ms', retryCount: 3 },
  { id: 'log_9', timestamp: '2025-01-15 13:15:42', event: 'meeting.ended', webhookUrl: 'https://automate.pipedream.com/api/v1/webhooks/abc', status: 500, responseTime: '3022ms', retryCount: 3 },
  { id: 'log_10', timestamp: '2025-01-15 12:58:19', event: 'recording.ready', webhookUrl: 'https://api.github.com/repos/alvision/webhooks/push', status: 200, responseTime: '199ms', retryCount: 0 },
  { id: 'log_11', timestamp: '2025-01-15 12:40:05', event: 'meeting.created', webhookUrl: 'https://hooks.zapier.com/hooks/catch/98765/xyzabc', status: 200, responseTime: '145ms', retryCount: 0 },
  { id: 'log_12', timestamp: '2025-01-15 12:22:31', event: 'user.joined', webhookUrl: 'https://discord.com/api/webhooks/11223344/aBcDeFg', status: 400, responseTime: '52ms', retryCount: 2 },
  { id: 'log_13', timestamp: '2025-01-15 11:55:10', event: 'meeting.ended', webhookUrl: 'https://api.slack.com/webhooks/T03KL/event/X8bN2m', status: 200, responseTime: '167ms', retryCount: 0 },
  { id: 'log_14', timestamp: '2025-01-15 11:30:44', event: 'ai.summary', webhookUrl: 'https://hooks.notion.so/services/a1b2c3d4-e5f6-7890-abcd', status: 200, responseTime: '287ms', retryCount: 0 },
  { id: 'log_15', timestamp: '2025-01-15 11:05:22', event: 'recording.ready', webhookUrl: 'https://automate.pipedream.com/api/v1/webhooks/abc', status: 200, responseTime: '410ms', retryCount: 1 },
];

/* -------------------------------------------------------------------------- */
/*                                 ANIMATION                                  */
/* -------------------------------------------------------------------------- */

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

/* -------------------------------------------------------------------------- */
/*                           STATUS HELPERS                                   */
/* -------------------------------------------------------------------------- */

function StatusBadge({ code }: { code: number }) {
  const color =
    code >= 200 && code < 300
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
      : code >= 400 && code < 500
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
        : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400';
  return (
    <Badge variant="secondary" className={`text-[11px] font-mono font-medium px-2 py-0.5 ${color}`}>
      {code}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>(INITIAL_WEBHOOKS);
  const [templates, setTemplates] = useState<AutomationTemplate[]>(TEMPLATES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [newSecret, setNewSecret] = useState(() => generateSecret());
  const [secretVisible, setSecretVisible] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [logSearch, setLogSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const activeCount = webhooks.filter((w) => w.active).length;

  const handleCopy = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const toggleWebhook = useCallback((id: string) => {
    setWebhooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w))
    );
  }, []);

  const deleteWebhook = useCallback((id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    setDeleteConfirmId(null);
  }, []);

  const toggleTemplate = useCallback((id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  }, []);

  const toggleEvent = useCallback((event: string) => {
    setNewEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  }, []);

  const handleCreateWebhook = useCallback(() => {
    if (!newUrl.trim() || newEvents.length === 0) return;
    const webhook: WebhookItem = {
      id: `wh_${Date.now()}`,
      url: newUrl.trim(),
      events: [...newEvents],
      secret: newSecret,
      active: true,
      lastTriggered: 'Never',
      responseCode: null,
    };
    setWebhooks((prev) => [webhook, ...prev]);
    setDialogOpen(false);
    setNewUrl('');
    setNewEvents([]);
    setNewSecret(generateSecret());
    setSecretVisible(false);
  }, [newUrl, newEvents, newSecret]);

  const filteredLogs = EVENT_LOG.filter(
    (entry) =>
      entry.event.toLowerCase().includes(logSearch.toLowerCase()) ||
      entry.webhookUrl.toLowerCase().includes(logSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/20">
            <Webhook className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Webhooks & Automation</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage webhooks, automation templates, and delivery logs.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" />
            {activeCount} Active
          </Badge>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md shadow-violet-500/20">
                <Plus className="h-4 w-4" />
                Create Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-violet-500" />
                  Create New Webhook
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-2">
                {/* URL Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Endpoint URL</label>
                  <Input
                    placeholder="https://example.com/webhook"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* Events Checkboxes */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Events</label>
                  <div className="grid grid-cols-1 gap-2">
                    {WEBHOOK_EVENTS.map((event) => (
                      <label
                        key={event}
                        className="flex items-center gap-3 rounded-lg border border-border/50 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={newEvents.includes(event)}
                          onCheckedChange={() => toggleEvent(event)}
                        />
                        <Badge variant="secondary" className={`text-[11px] font-mono ${EVENT_COLORS[event]}`}>
                          {event}
                        </Badge>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Secret */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Signing Secret</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => setNewSecret(generateSecret())}
                    >
                      <RefreshCw className="h-3 w-3" />
                      Regenerate
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={secretVisible ? newSecret : maskSecret(newSecret)}
                      className="h-9 font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => setSecretVisible(!secretVisible)}
                    >
                      {secretVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => handleCopy('new', newSecret)}
                    >
                      {copiedId === 'new' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button
                    onClick={handleCreateWebhook}
                    disabled={!newUrl.trim() || newEvents.length === 0}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                  >
                    Create Webhook
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* ── Gradient accent line ──────────────────────────────────────── */}
      <div className="h-[2px] rounded-full bg-gradient-to-r from-violet-500 to-purple-500 opacity-60" />

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="webhooks" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Webhook className="h-3.5 w-3.5" />
            Webhooks
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
              {webhooks.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Zap className="h-3.5 w-3.5" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="event-log" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Clock className="h-3.5 w-3.5" />
            Event Log
          </TabsTrigger>
        </TabsList>

        {/* ── Webhooks Tab ─────────────────────────────────────────────── */}
        <TabsContent value="webhooks">
          <motion.div
            key="webhooks-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            <AnimatePresence>
              {webhooks.map((wh) => (
                <motion.div key={wh.id} variants={itemVariants} exit={{ opacity: 0, scale: 0.95 }} layout>
                  <Card className="group hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-0.5 transition-all duration-300 border-border/50 overflow-hidden">
                    {/* Top accent line */}
                    <div className={`h-[2px] w-full ${wh.active ? 'bg-gradient-to-r from-violet-500 to-purple-500' : 'bg-muted'}`} />
                    <CardContent className="p-5 space-y-4">
                      {/* URL + Status row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-mono truncate text-foreground/80" title={wh.url}>
                            {truncateUrl(wh.url, 48)}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {wh.events.map((ev) => (
                              <Badge key={ev} variant="secondary" className={`text-[10px] font-mono px-2 py-0.5 ${EVENT_COLORS[ev]}`}>
                                {ev}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Switch
                          checked={wh.active}
                          onCheckedChange={() => toggleWebhook(wh.id)}
                        />
                      </div>

                      <Separator className="opacity-50" />

                      {/* Secret row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="text-xs font-mono text-muted-foreground truncate">
                            {maskSecret(wh.secret)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => handleCopy(wh.id, wh.secret)}
                        >
                          {copiedId === wh.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {wh.lastTriggered}
                          </span>
                          {wh.responseCode && <StatusBadge code={wh.responseCode} />}
                        </div>

                        {deleteConfirmId === wh.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-7 text-[11px] px-2"
                              onClick={() => deleteWebhook(wh.id)}
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] px-2"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() => setDeleteConfirmId(wh.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </TabsContent>

        {/* ── Templates Tab ────────────────────────────────────────────── */}
        <TabsContent value="templates">
          <motion.div
            key="templates-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {templates.map((tpl) => {
              const Icon = tpl.icon;
              return (
                <motion.div key={tpl.id} variants={itemVariants}>
                  <Card className="group hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-0.5 transition-all duration-300 border-border/50 overflow-hidden">
                    <div className={`h-[2px] w-full ${tpl.enabled ? 'bg-gradient-to-r from-violet-500 to-purple-500' : 'bg-muted'}`} />
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tpl.iconBg} text-white shadow-sm`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm leading-snug">{tpl.name}</h4>
                            <Switch
                              checked={tpl.enabled}
                              onCheckedChange={() => toggleTemplate(tpl.id)}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {tpl.description}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5 mt-1 group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-purple-600 group-hover:text-white group-hover:border-transparent transition-all duration-300"
                          >
                            Use Template
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </TabsContent>

        {/* ── Event Log Tab ────────────────────────────────────────────── */}
        <TabsContent value="event-log">
          <div className="space-y-4">
            {/* Search & Auto-refresh bar */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events or URLs..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <RefreshCw className={`h-3.5 w-3.5 ${autoRefresh ? 'animate-spin text-violet-500' : ''}`} />
                  Auto-refresh
                </span>
              </div>
            </div>

            {/* Log entries */}
            <motion.div
              key="event-log-list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-2 max-h-[600px] overflow-y-auto pr-1"
              style={{ scrollbarWidth: 'thin' }}
            >
              {filteredLogs.length > 0 ? (
                filteredLogs.map((entry) => (
                  <motion.div key={entry.id} variants={itemVariants}>
                    <Card className="border-border/50 hover:bg-muted/30 hover:shadow-sm hover:shadow-violet-500/5 transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          {/* Timestamp */}
                          <span className="text-[11px] font-mono text-muted-foreground shrink-0 sm:w-36">
                            {entry.timestamp}
                          </span>
                          {/* Event badge */}
                          <Badge
                            variant="secondary"
                            className={`text-[11px] font-mono font-medium px-2.5 py-0.5 shrink-0 w-fit ${EVENT_COLORS[entry.event] ?? 'bg-muted text-muted-foreground'}`}
                          >
                            {entry.event}
                          </Badge>
                          {/* URL */}
                          <span className="text-xs font-mono text-muted-foreground truncate flex-1 min-w-0" title={entry.webhookUrl}>
                            {truncateUrl(entry.webhookUrl, 44)}
                          </span>
                          {/* Status & meta */}
                          <div className="flex items-center gap-3 shrink-0">
                            <StatusBadge code={entry.status} />
                            <span className="text-[11px] text-muted-foreground font-mono w-14 text-right">
                              {entry.responseTime}
                            </span>
                            {entry.retryCount > 0 && (
                              <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                                retry ×{entry.retryCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
                    <Search className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">No matching events</h3>
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your search query.</p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
