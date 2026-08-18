'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Check,
  Plug,
  LayoutGrid,
  MessageSquare,
  FileText,
  GitBranch,
  Shield,
  HardDrive,
  Unplug,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// ── Types ──────────────────────────────────────────────────────────────

type Category = 'All' | 'Communication' | 'Productivity' | 'Dev Tools' | 'Security' | 'Storage';

interface IntegrationDef {
  id: string;
  name: string;
  description: string;
  category: Exclude<Category, 'All'>;
  initial: string;
  iconBg: string;
}

interface ConnectedIntegration {
  name: string;
  connectedAt: string;
  status: 'connected';
}

// ── Catalog (static) ───────────────────────────────────────────────────

const CATEGORIES: Category[] = ['All', 'Communication', 'Productivity', 'Dev Tools', 'Security', 'Storage'];

const INTEGRATIONS: IntegrationDef[] = [
  { id: 'slack', name: 'Slack', description: 'Send meeting notifications and summaries directly to your Slack channels.', category: 'Communication', initial: 'S', iconBg: 'bg-purple-600' },
  { id: 'teams', name: 'Microsoft Teams', description: 'Seamless calendar sync and cross-platform meeting interoperability.', category: 'Communication', initial: 'T', iconBg: 'bg-teal-600' },
  { id: 'google-calendar', name: 'Google Calendar', description: 'Auto-schedule meetings and sync availability in real-time.', category: 'Productivity', initial: 'G', iconBg: 'bg-red-500' },
  { id: 'zoom', name: 'Zoom', description: 'Bidirectional calendar sync for scheduled Zoom meetings.', category: 'Productivity', initial: 'Z', iconBg: 'bg-sky-600' },
  { id: 'salesforce', name: 'Salesforce', description: 'Log client calls and sync CRM data with meeting transcripts.', category: 'Productivity', initial: 'S', iconBg: 'bg-cyan-700' },
  { id: 'jira', name: 'Jira', description: 'AI-extracted action items auto-synced to Jira issues and sprints.', category: 'Dev Tools', initial: 'J', iconBg: 'bg-rose-600' },
  { id: 'notion', name: 'Notion', description: 'Export meeting notes and summaries directly to Notion databases.', category: 'Productivity', initial: 'N', iconBg: 'bg-neutral-700' },
  { id: 'github', name: 'GitHub', description: 'Link meeting discussions to pull requests and code reviews.', category: 'Dev Tools', initial: 'G', iconBg: 'bg-gray-700' },
  { id: 'gitlab', name: 'GitLab', description: 'Integrate meeting artifacts with GitLab merge requests and CI.', category: 'Dev Tools', initial: 'G', iconBg: 'bg-orange-600' },
  { id: 'pagerduty', name: 'PagerDuty', description: 'Escalate critical meeting alerts and on-call incident triggers.', category: 'Security', initial: 'P', iconBg: 'bg-emerald-600' },
  { id: 'zapier', name: 'Zapier', description: 'Automate workflows with 5000+ apps using custom Zaps.', category: 'Productivity', initial: 'Z', iconBg: 'bg-orange-500' },
  { id: 'webhooks', name: 'Webhooks', description: 'Custom HTTP callbacks for any ALVISION event.', category: 'Dev Tools', initial: 'W', iconBg: 'bg-teal-500' },
];

const CATEGORY_COLORS: Record<Exclude<Category, 'All'>, string> = {
  Communication: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  Productivity: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'Dev Tools': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  Security: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  Storage: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

const CATEGORY_ICONS: Record<Exclude<Category, 'All'>, React.ComponentType<{ className?: string }>> = {
  Communication: MessageSquare,
  Productivity: FileText,
  'Dev Tools': GitBranch,
  Security: Shield,
  Storage: HardDrive,
};

const STORAGE_KEY = 'alvision-integrations';

// ── Animation ──────────────────────────────────────────────────────────

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } } };

// ── Main Component ────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [connected, setConnected] = useState<Record<string, ConnectedIntegration>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: ConnectedIntegration[] = JSON.parse(raw);
        const map: Record<string, ConnectedIntegration> = {};
        for (const c of parsed) map[c.name] = c;
        return map;
      }
    } catch {
      // ignore
    }
    return {};
  });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [filter, setFilter] = useState<'all' | 'connected'>('all');

  const saveConnections = useCallback((map: Record<string, ConnectedIntegration>) => {
    setConnected(map);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.values(map)));
  }, []);

  const handleConnect = (integration: IntegrationDef) => {
    const entry: ConnectedIntegration = { name: integration.name, connectedAt: new Date().toISOString(), status: 'connected' };
    saveConnections({ ...connected, [integration.name]: entry });
  };

  const handleDisconnect = (name: string) => {
    const next = { ...connected };
    delete next[name];
    saveConnections(next);
  };

  const connectedCount = Object.keys(connected).length;

  const filtered = INTEGRATIONS.filter((app) => {
    const isConn = !!connected[app.name];
    const matchesSearch = app.name.toLowerCase().includes(search.toLowerCase()) || app.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === 'All' || app.category === category;
    const matchesFilter = filter === 'all' || isConn;
    return matchesSearch && matchesCat && matchesFilter;
  });

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600">
            <Plug className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {connectedCount} of {INTEGRATIONS.length} connected
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search integrations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${filter === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Browse All
        </button>
        <button
          onClick={() => setFilter('connected')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${filter === 'connected' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Check className="h-3.5 w-3.5" />
          Connected
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => {
          const CatIcon = cat === 'All' ? LayoutGrid : CATEGORY_ICONS[cat];
          const isActive = category === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive ? 'bg-emerald-600 text-white shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <CatIcon className="h-3.5 w-3.5" />
              {cat}
            </button>
          );
        })}
      </div>

      {/* Cards Grid */}
      {filtered.length > 0 ? (
        <motion.div key={`${category}-${filter}-${search}`} variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((app) => {
            const isConn = !!connected[app.name];
            const catColor = CATEGORY_COLORS[app.category];
            return (
              <motion.div key={app.id} variants={itemVariants}>
                <Card className="group hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-300 border-border/50 overflow-hidden relative">
                  <div className={`h-0.5 w-full bg-gradient-to-r ${isConn ? 'from-emerald-500/60 to-teal-400/60' : 'from-muted to-muted'}`} />
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3.5">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${app.iconBg} text-white font-bold text-sm shadow-sm`}>
                        {app.initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm truncate">{app.name}</h4>
                          {isConn && <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{app.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                      <Badge variant="outline" className={`text-[11px] font-medium px-2.5 py-0.5 ${catColor}`}>
                        {app.category}
                      </Badge>
                      {isConn ? (
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20" onClick={() => handleDisconnect(app.name)}>
                          <Unplug className="h-3 w-3" />
                          Disconnect
                        </Button>
                      ) : (
                        <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleConnect(app)}>
                          <Plug className="h-3 w-3" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">No integrations found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">Try adjusting your search or filter criteria.</p>
        </motion.div>
      )}
    </motion.div>
  );
}
