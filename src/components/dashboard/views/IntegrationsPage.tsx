'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Check,
  Settings,
  Plug,
  MessageSquare,
  Calendar,
  Kanban,
  GitBranch,
  FileText,
  Users,
  Shield,
  Zap,
  Cloud,
  Palette,
  HardDrive,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type Category = 'All' | 'Communication' | 'Productivity' | 'Dev Tools' | 'Security' | 'Storage';
type ConnectionStatus = 'connected' | 'available';

interface IntegrationItem {
  id: string;
  name: string;
  description: string;
  category: Exclude<Category, 'All'>;
  status: ConnectionStatus;
  initial: string;
  iconBg: string;
}

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const CATEGORIES: Category[] = [
  'All',
  'Communication',
  'Productivity',
  'Dev Tools',
  'Security',
  'Storage',
];

const CATEGORY_COLORS: Record<Exclude<Category, 'All'>, { badge: string; icon: string }> = {
  Communication: { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400', icon: 'text-blue-500' },
  Productivity: { badge: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400', icon: 'text-violet-500' },
  'Dev Tools': { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400', icon: 'text-emerald-500' },
  Security: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400', icon: 'text-amber-500' },
  Storage: { badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400', icon: 'text-rose-500' },
};

const CATEGORY_ICONS: Record<Exclude<Category, 'All'>, React.ComponentType<{ className?: string }>> = {
  Communication: MessageSquare,
  Productivity: FileText,
  'Dev Tools': GitBranch,
  Security: Shield,
  Storage: HardDrive,
};

const INTEGRATIONS: IntegrationItem[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send meeting notifications and summaries directly to your Slack channels.',
    category: 'Communication',
    status: 'connected',
    initial: 'S',
    iconBg: 'bg-purple-500',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Seamless calendar sync and cross-platform meeting interoperability.',
    category: 'Communication',
    status: 'connected',
    initial: 'T',
    iconBg: 'bg-sky-500',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Auto-schedule meetings and sync availability in real-time.',
    category: 'Productivity',
    status: 'connected',
    initial: 'G',
    iconBg: 'bg-blue-500',
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'AI-extracted action items auto-synced to Jira issues and sprints.',
    category: 'Dev Tools',
    status: 'available',
    initial: 'J',
    iconBg: 'bg-blue-600',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Link meeting discussions to pull requests and code reviews.',
    category: 'Dev Tools',
    status: 'available',
    initial: 'G',
    iconBg: 'bg-gray-800 dark:bg-gray-200',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Export meeting notes and summaries directly to Notion databases.',
    category: 'Productivity',
    status: 'available',
    initial: 'N',
    iconBg: 'bg-neutral-800 dark:bg-neutral-200',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Log client calls and sync CRM data with meeting transcripts.',
    category: 'Productivity',
    status: 'available',
    initial: 'S',
    iconBg: 'bg-blue-700',
  },
  {
    id: 'zoom-calendar',
    name: 'Zoom',
    description: 'Bidirectional calendar sync for scheduled Zoom meetings.',
    category: 'Productivity',
    status: 'available',
    initial: 'Z',
    iconBg: 'bg-sky-600',
  },
  {
    id: 'okta',
    name: 'Okta',
    description: 'Enterprise SSO with SAML and OAuth 2.0 for secure authentication.',
    category: 'Security',
    status: 'available',
    initial: 'O',
    iconBg: 'bg-red-600',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automate workflows with 5000+ apps using custom Zaps.',
    category: 'Productivity',
    status: 'available',
    initial: 'Z',
    iconBg: 'bg-orange-500',
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Embed live design previews and annotations in meeting chats.',
    category: 'Dev Tools',
    status: 'available',
    initial: 'F',
    iconBg: 'bg-fuchsia-500',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Auto-upload recordings and transcripts to shared folders.',
    category: 'Storage',
    status: 'available',
    initial: 'D',
    iconBg: 'bg-blue-500',
  },
];

/* -------------------------------------------------------------------------- */
/*                                 ANIMATION                                  */
/* -------------------------------------------------------------------------- */

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

export default function IntegrationsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [filter, setFilter] = useState<'all' | 'installed'>('all');

  const filtered = INTEGRATIONS.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || app.category === category;
    const matchesFilter = filter === 'all' || app.status === 'connected';
    return matchesSearch && matchesCategory && matchesFilter;
  });

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      {/* ── Featured Banner ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 p-6 sm:p-8">
          {/* Decorative blurred shapes */}
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Plug className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Connect your tools in 2 minutes
                </h3>
                <p className="text-sm text-white/80 mt-0.5">
                  Integrate with 50+ apps to streamline your workflow.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/20"
            >
              <Zap className="h-4 w-4 mr-2" />
              Explore All
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} integration{filtered.length !== 1 ? 's' : ''} available
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search integrations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
      </div>

      {/* ── Filter Tabs (All / Installed) ───────────────────────────────── */}
      <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Browse All
        </button>
        <button
          onClick={() => setFilter('installed')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            filter === 'installed'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Check className="h-3.5 w-3.5" />
          Installed
        </button>
      </div>

      {/* ── Category Tabs ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => {
          const CatIcon = cat === 'All' ? LayoutGrid : CATEGORY_ICONS[cat];
          const isActive = category === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <CatIcon className="h-3.5 w-3.5" />
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── Integration Cards Grid ──────────────────────────────────────── */}
      {filtered.length > 0 ? (
        <motion.div
          key={`${category}-${filter}-${search}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filtered.map((app) => {
            const catColor = CATEGORY_COLORS[app.category];
            const isConnected = app.status === 'connected';

            return (
              <motion.div key={app.id} variants={itemVariants}>
                <Card className="group hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-0.5 transition-all duration-300 border-border/50 overflow-hidden relative">
                  <div className="h-0.5 w-full bg-gradient-to-r from-violet-500/60 to-purple-400/60" />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      {/* App icon + info */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${app.iconBg} text-white font-bold text-sm shadow-sm`}
                        >
                          {app.initial}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm truncate">
                              {app.name}
                            </h4>
                            {isConnected && (
                              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {app.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Category badge + action */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                      <Badge
                        variant="secondary"
                        className={`text-[11px] font-medium px-2.5 py-0.5 ${catColor.badge}`}
                      >
                        {app.category}
                      </Badge>

                      {isConnected ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5"
                        >
                          <Settings className="h-3 w-3" />
                          Configure
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8 text-xs gap-1.5"
                        >
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg">No integrations found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Try adjusting your search or filter criteria to find what you&apos;re looking for.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
