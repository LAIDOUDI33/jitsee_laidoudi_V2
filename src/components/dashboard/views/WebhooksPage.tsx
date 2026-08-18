'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Webhook,
  Plus,
  Trash2,
  Search,
  Clock,
  Zap,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { authFetch } from '@/lib/api';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  createdAt: string;
  lastTriggeredAt: string | null;
  successCount: number;
  failureCount: number;
}

interface WebhooksData {
  webhooks: WebhookItem[];
  availableEvents: string[];
}

// ── Animation ──────────────────────────────────────────────────────────

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } } };

// ── Event label helper ─────────────────────────────────────────────────

function eventLabel(event: string) {
  return event
    .split('.')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function truncateUrl(url: string, max = 40) {
  if (url.length <= max) return url;
  return url.slice(0, max - 3) + '...';
}

function timeAgo(date: string | null) {
  if (!date) return 'Never';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Main Component ────────────────────────────────────────────────────

export default function WebhooksPage() {
  const [data, setData] = useState<WebhooksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Test webhook
  const [testing, setTesting] = useState<string | null>(null);

  // Secret visibility
  const [visibleSecret, setVisibleSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/v1/webhooks');
      if (!res.ok) throw new Error('Failed to fetch webhooks');
      const json = await res.json();
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await authFetch('/api/v1/webhooks', {
        method: 'POST',
        body: JSON.stringify({ name: newName, url: newUrl, events: newEvents }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create');
      toast.success('Webhook created');
      setCreateOpen(false);
      setNewName('');
      setNewUrl('');
      setNewEvents([]);
      fetchWebhooks();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create webhook');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (wh: WebhookItem) => {
    try {
      const res = await authFetch('/api/v1/webhooks', {
        method: 'PUT',
        body: JSON.stringify({ id: wh.id, isActive: !wh.isActive }),
      });
      if (!res.ok) throw new Error();
      setData((prev) =>
        prev
          ? {
              ...prev,
              webhooks: prev.webhooks.map((w) => (w.id === wh.id ? { ...w, isActive: !w.isActive } : w)),
            }
          : prev
      );
    } catch {
      toast.error('Failed to toggle webhook');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await authFetch(`/api/v1/webhooks?id=${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Webhook deleted');
      setDeleteId(null);
      fetchWebhooks();
    } catch {
      toast.error('Failed to delete webhook');
    } finally {
      setDeleting(false);
    }
  };

  const handleTest = async (wh: WebhookItem) => {
    setTesting(wh.id);
    try {
      const res = await fetch(wh.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-ALVISION-Test': 'true' },
        body: JSON.stringify({
          event: 'test.ping',
          webhookId: wh.id,
          timestamp: new Date().toISOString(),
          message: 'Test webhook from ALVISION',
        }),
      });
      if (res.ok) {
        toast.success(`Test sent — ${res.status} OK`);
      } else {
        toast.error(`Test failed — ${res.status}`);
      }
    } catch {
      toast.error('Test failed — unreachable URL');
    } finally {
      setTesting(null);
    }
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(secret);
    setTimeout(() => setCopiedSecret(null), 2000);
  };

  const filtered = (data?.webhooks || []).filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.url.toLowerCase().includes(search.toLowerCase())
  );

  // ── Skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={fetchWebhooks}>
          <RefreshCw className="h-4 w-4 mr-2" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600">
            <Webhook className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
            <p className="text-sm text-muted-foreground">
              {data?.webhooks.length ?? 0} webhook{(data?.webhooks.length ?? 0) !== 1 ? 's' : ''} configured
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search webhooks..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create
          </Button>
        </div>
      </motion.div>

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <motion.div variants={item} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <Webhook className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">No webhooks yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Create a webhook to receive real-time event notifications from ALVISION.
          </p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Webhook
          </Button>
        </motion.div>
      )}

      {/* Webhook List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence>
          {filtered.map((wh) => (
            <motion.div key={wh.id} variants={item} layout>
              <Card className="group hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-300 border-border/50 overflow-hidden relative">
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${wh.isActive ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-muted'}`} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{wh.name}</h3>
                        <Badge variant={wh.isActive ? 'default' : 'secondary'} className={`text-[10px] shrink-0 ${wh.isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground'}`}>
                          {wh.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-mono" title={wh.url}>
                        {truncateUrl(wh.url)}
                      </p>
                    </div>
                    <Switch checked={wh.isActive} onCheckedChange={() => handleToggle(wh)} />
                  </div>

                  {/* Events */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {wh.events.slice(0, 3).map((ev) => (
                      <Badge key={ev} variant="outline" className="text-[10px] bg-teal-500/5 text-teal-600 border-teal-500/20">
                        {eventLabel(ev)}
                      </Badge>
                    ))}
                    {wh.events.length > 3 && (
                      <Badge variant="outline" className="text-[10px]">+{wh.events.length - 3}</Badge>
                    )}
                  </div>

                  {/* Secret */}
                  <div className="flex items-center gap-2 mt-3 p-2 rounded-md bg-muted/50">
                    <span className="text-[11px] text-muted-foreground shrink-0">Secret:</span>
                    <span className="text-[11px] font-mono text-muted-foreground truncate flex-1">
                      {visibleSecret === wh.id ? wh.secret : '••••••••••••••••'}
                    </span>
                    <button
                      onClick={() => setVisibleSecret(visibleSecret === wh.id ? null : wh.id)}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      {visibleSecret === wh.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                    <button onClick={() => copySecret(wh.secret)} className="text-muted-foreground hover:text-foreground shrink-0">
                      {copiedSecret === wh.secret ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>

                  {/* Stats + Actions */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(wh.lastTriggeredAt)}</span>
                      <span className="text-emerald-600">{wh.successCount} ok</span>
                      <span className="text-red-500">{wh.failureCount} fail</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleTest(wh)} disabled={testing === wh.id}>
                        {testing === wh.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        <span className="ml-1">Test</span>
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => setDeleteId(wh.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-emerald-500" />
              Create Webhook
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="wh-name">Name</Label>
              <Input id="wh-name" placeholder="e.g., Slack Notifications" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wh-url">Endpoint URL</Label>
              <Input id="wh-url" placeholder="https://example.com/webhook" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Events</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-md border p-3">
                {(data?.availableEvents || []).map((ev) => (
                  <label key={ev} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={newEvents.includes(ev)}
                      onCheckedChange={(checked) => {
                        if (checked) setNewEvents([...newEvents, ev]);
                        else setNewEvents(newEvents.filter((e) => e !== ev));
                      }}
                    />
                    <span className="text-xs">{eventLabel(ev)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newName || !newUrl || newEvents.length === 0}>
              {creating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              This webhook will be permanently removed. Events will no longer be sent to this endpoint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
