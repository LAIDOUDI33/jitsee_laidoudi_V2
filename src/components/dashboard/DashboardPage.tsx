'use client';

import { useAppStore } from '@/store/app-store';
import { authFetch } from '@/lib/api';
import {
  Video, Users, Clock, TrendingUp, Calendar, MessageSquare, FileText, Brain,
  ArrowRight, Plus, MoreHorizontal, Mic, Monitor, Globe, Shield, ChevronRight,
  BarChart3, Activity, LayoutDashboard, FolderOpen, CircleDot, Radio,
  Settings, User, LogOut, Search, Bell, BookOpen, Pen, Bot, Puzzle,
  HelpCircle, Webhook, LayoutTemplate, LayoutGrid, UsersRound, MessageCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};
const chartFadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.35 + i * 0.12 } })
};

function RippleButton({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    onClick?.();
  }, [onClick]);
  return (
    <button onClick={handleClick} className={`relative overflow-hidden ${className || ''}`}>
      {children}
      {ripples.map(r => (
        <motion.span
          key={r.id}
          initial={{ scale: 0, opacity: 0.35 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' as const }}
          className='absolute rounded-full bg-white/30 pointer-events-none'
          style={{ left: r.x - 10, top: r.y - 10, width: 20, height: 20 }}
        />
      ))}
    </button>
  );
}

const meetingActivityData = [
  { day: 'Mon', meetings: 4, participants: 18 },
  { day: 'Tue', meetings: 7, participants: 32 },
  { day: 'Wed', meetings: 5, participants: 24 },
  { day: 'Thu', meetings: 9, participants: 45 },
  { day: 'Fri', meetings: 6, participants: 28 },
  { day: 'Sat', meetings: 2, participants: 8 },
  { day: 'Sun', meetings: 1, participants: 5 },
];

const meetingTypesData = [
  { name: 'Video', value: 40 },
  { name: 'Audio', value: 25 },
  { name: 'Webinar', value: 20 },
  { name: 'Town Hall', value: 15 },
];

const PIE_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#38bdf8'];

interface Meeting {
  id: string;
  title: string;
  date: string;
  duration: string;
  participants: number;
  status: 'Active' | 'Ended' | 'Scheduled';
}

const mockMeetings: Meeting[] = [
  { id: '1', title: 'Sprint Planning - Q4', date: 'Today, 10:00 AM', duration: '45 min', participants: 8, status: 'Active' },
  { id: '2', title: 'Design Review', date: 'Today, 2:00 PM', duration: '30 min', participants: 5, status: 'Scheduled' },
  { id: '3', title: 'Client Onboarding - Acme Corp', date: 'Yesterday, 3:00 PM', duration: '1h 12min', participants: 12, status: 'Ended' },
  { id: '4', title: 'Engineering Standup', date: 'Yesterday, 9:30 AM', duration: '15 min', participants: 6, status: 'Ended' },
  { id: '5', title: 'Product Roadmap Discussion', date: 'Dec 18, 11:00 AM', duration: '1h 30min', participants: 15, status: 'Scheduled' },
];

const teamActivities = [
  { user: 'Sarah Chen', initials: 'SC', color: 'bg-pink-500', action: 'started a meeting', target: 'Sprint Planning', time: '5 min ago' },
  { user: 'Alex Rivera', initials: 'AR', color: 'bg-blue-500', action: 'shared a recording', target: 'Client Review Q3', time: '23 min ago' },
  { user: 'Maya Patel', initials: 'MP', color: 'bg-green-500', action: 'joined team', target: 'Engineering', time: '1h ago' },
  { user: 'James Wilson', initials: 'JW', color: 'bg-orange-500', action: 'created an AI summary', target: 'Board Meeting Notes', time: '2h ago' },
  { user: 'Emily Zhang', initials: 'EZ', color: 'bg-violet-500', action: 'scheduled a meeting', target: 'Design Sync', time: '3h ago' },
];

const onlinePeople = [
  { name: 'Sarah Chen', initials: 'SC', color: 'bg-pink-500', status: 'In a meeting' },
  { name: 'Alex Rivera', initials: 'AR', color: 'bg-sky-500', status: 'Available' },
  { name: 'Maya Patel', initials: 'MP', color: 'bg-emerald-500', status: 'Editing document' },
  { name: 'James Wilson', initials: 'JW', color: 'bg-orange-500', status: 'On a call' },
  { name: 'Emily Zhang', initials: 'EZ', color: 'bg-violet-500', status: 'Available' },
  { name: 'David Kim', initials: 'DK', color: 'bg-teal-500', status: 'Away' },
  { name: 'Lisa Park', initials: 'LP', color: 'bg-rose-500', status: 'In a meeting' },
  { name: 'Ryan Foster', initials: 'RF', color: 'bg-amber-500', status: 'Available' },
];

export default function DashboardPage() {
  const { user, setCurrentView, currentView, setMeetingTitle, setCurrentMeetingId } = useAppStore();
  const [gradientPhase, setGradientPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setGradientPhase(p => (p + 1) % 360), 3000);
    return () => clearInterval(interval);
  }, []);

  const { data: meetingsData } = useQuery<{ success: boolean; data: { meetings: Meeting[] } }>({
    queryKey: ['meetings'],
    queryFn: async () => {
      try {
        const res = await authFetch('/api/v1/meetings');
        if (res.ok) {
          const json = await res.json();
          if (json.data?.meetings) return { success: true, data: json.data };
          return json;
        }
      } catch { /* fallback */ }
      return { success: true, data: { meetings: mockMeetings } };
    },
  });
  const meetings = meetingsData?.data?.meetings || mockMeetings;

  useEffect(() => {
    if (!user) {
      useAppStore.getState().setUser({
        id: '1', name: 'Alex Johnson', email: 'alex@alvision.com', role: 'admin',
        organizationId: 'org1', organizationName: 'Alvision Inc.',
      });
    }
  }, []);

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, view: 'dashboard' },
    { label: 'Meetings', icon: <Video size={18} />, view: 'meetings', badge: '3 today' },
    { label: 'Teams', icon: <Users size={18} />, view: 'teams' },
    { label: 'Chat', icon: <MessageSquare size={18} />, view: 'chat', badge: '5' },
    { label: 'Files', icon: <FolderOpen size={18} />, view: 'files' },
    { label: 'Recordings', icon: <CircleDot size={18} />, view: 'recordings' },
    { label: 'AI Assistant', icon: <Brain size={18} />, view: 'ai-assistant', badge: 'AI', badgeVariant: 'secondary' as const },
    { label: 'Knowledge', icon: <BookOpen size={18} />, view: 'knowledge' },
    { label: 'Calendar', icon: <Calendar size={18} />, view: 'calendar' },
    { label: 'Events', icon: <Radio size={18} />, view: 'events' },
    { label: 'Whiteboard', icon: <Pen size={18} />, view: 'whiteboard', badge: 'N', badgeVariant: 'outline' as const },
    { label: 'Analytics', icon: <BarChart3 size={18} />, view: 'analytics', badge: 'N', badgeVariant: 'outline' as const },
    { label: 'Status', icon: <Activity size={18} />, view: 'status' },
    { label: 'People', icon: <UsersRound size={18} />, view: 'people' },
    { label: 'Integrations', icon: <Puzzle size={18} />, view: 'integrations' },
    { label: 'Help Center', icon: <HelpCircle size={18} />, view: 'help-center' },
    { label: 'Webhooks', icon: <Webhook size={18} />, view: 'webhooks' },
    { label: 'Templates', icon: <LayoutTemplate size={18} />, view: 'templates' },
    { label: 'Notifications', icon: <Bell size={18} />, view: 'notifications' },
    { label: 'Breakout Rooms', icon: <LayoutGrid size={18} />, view: 'breakout-rooms' },
  ];

  const bottomNavItems = [
    { label: 'Admin', icon: <Shield size={18} />, view: 'admin', adminOnly: true },
    { label: 'Settings', icon: <Settings size={18} />, view: 'settings' },
    { label: 'Profile', icon: <User size={18} />, view: 'profile' },
  ];

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      Ended: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      Scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return variants[status] || '';
  };

  const handleJoinMeeting = () => {
    setMeetingTitle('Sprint Planning - Q4');
    setCurrentMeetingId('meeting-1');
    setCurrentView('meeting-room');
  };

  const handleNewMeeting = () => {
    setMeetingTitle('New Meeting');
    setCurrentMeetingId('new-' + Date.now());
    setCurrentView('meeting-room');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('') || 'AJ';

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col shrink-0 max-lg:hidden">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Video size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">ALVISION</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view as 'dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
                ${currentView === item.view
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge variant={item.badgeVariant || 'default'} className="text-[10px] px-1.5 py-0">
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}

          <div className="my-2 border-t" />

          {bottomNavItems.map(item => {
            if (item.adminOnly && !user?.role?.includes('admin')) return null;
            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view as 'dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
                  ${currentView === item.view
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'Alex Johnson'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role || 'Admin'}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 lg:px-6 py-3 flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
          <div className="relative hidden sm:block w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search meetings, people..."
              className="w-full h-9 pl-9 pr-4 rounded-lg border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">3</span>
          </Button>
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          {/* Welcome Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 lg:p-8 text-white"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-8 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
              <div className="absolute bottom-4 left-12 w-24 h-24 rounded-full bg-white/20 blur-2xl" />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl lg:text-3xl font-bold mb-2">{getGreeting()}, {user?.name?.split(' ')[0] || 'Alex'}!</h2>
              <p className="text-blue-100 mb-6">Here&apos;s what&apos;s happening with your team today.</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Meetings Today', value: '4', icon: <Video size={16} /> },
                  { label: 'Unread Messages', value: '12', icon: <MessageSquare size={16} /> },
                  { label: 'Pending Actions', value: '5', icon: <Clock size={16} /> },
                  { label: 'New Recordings', value: '3', icon: <Mic size={16} /> },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">{stat.icon}</div>
                    <div>
                      <p className="text-xl font-bold">{stat.value}</p>
                      <p className="text-xs text-blue-200">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="relative">
            {/* Decorative dot pattern behind stats */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden rounded-xl" aria-hidden="true">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            </div>
            <motion.div variants={stagger} initial="hidden" animate="show" className="relative grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Active Meetings', value: '12', icon: <TrendingUp size={20} />, badge: '+8%', badgeColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400', gradientFrom: 'from-emerald-500/20', gradientTo: 'to-emerald-500/0' },
                { title: 'Total Participants', value: '248', icon: <Users size={20} />, gradientFrom: 'from-sky-500/20', gradientTo: 'to-sky-500/0' },
                { title: 'AI Summaries', value: '47', icon: <FileText size={20} />, badge: 'This week', badgeColor: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400', gradientFrom: 'from-violet-500/20', gradientTo: 'to-violet-500/0' },
                { title: 'Recording Hours', value: '156h', icon: <Clock size={20} />, gradientFrom: 'from-amber-500/20', gradientTo: 'to-amber-500/0' },
              ].map((card, idx) => (
                <motion.div key={card.title} variants={fadeUp}>
                  <div className="relative rounded-xl p-[1.5px] bg-gradient-to-br bg-[length:200%_200%] from-primary/30 via-primary/10 to-violet-500/30 transition-all duration-[3000ms]"
                    style={{ backgroundPosition: `${gradientPhase}% ${gradientPhase}%` }}
                  >
                    <Card className="relative overflow-hidden bg-card rounded-xl">
                      <CardContent className="p-4 lg:p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            {card.icon}
                          </div>
                          {card.badge && (
                            <Badge variant="secondary" className={`text-[10px] font-semibold ${card.badgeColor}`}>
                              {card.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-2xl lg:text-3xl font-bold tracking-tight">{card.value}</p>
                        <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
                      </CardContent>
                      {/* Subtle gradient accent at bottom */}
                      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradientFrom} ${card.gradientTo}`} />
                    </Card>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-4">
            <motion.div custom={0} variants={chartFadeUp} initial="hidden" animate="show">
              <Card className="border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Meeting Activity</CardTitle>
                    <Select defaultValue="7d">
                      <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={meetingActivityData}>
                        <defs>
                          <linearGradient id="meetingGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="meetings" stroke="#3b82f6" strokeWidth={2} fill="url(#meetingGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div custom={1} variants={chartFadeUp} initial="hidden" animate="show">
              <Card className="border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Meeting Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center">
                    <ResponsiveContainer width="50%" height="100%">
                      <PieChart>
                        <Pie
                          data={meetingTypesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {meetingTypesData.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-3">
                      {meetingTypesData.map((item, i) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                          <span className="text-sm flex-1">{item.name}</span>
                          <span className="text-sm font-semibold">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Meetings */}
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div variants={fadeUp}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Recent Meetings</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentView('meetings')} className="text-sm">
                      View All <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="px-4 lg:px-6 py-3 font-medium">Meeting</th>
                          <th className="px-4 lg:px-6 py-3 font-medium hidden md:table-cell">Date</th>
                          <th className="px-4 lg:px-6 py-3 font-medium hidden sm:table-cell">Duration</th>
                          <th className="px-4 lg:px-6 py-3 font-medium hidden lg:table-cell">Participants</th>
                          <th className="px-4 lg:px-6 py-3 font-medium">Status</th>
                          <th className="px-4 lg:px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meetings.map((meeting) => (
                          <tr key={meeting.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="px-4 lg:px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <Video size={14} className="text-primary" />
                                </div>
                                <span className="font-medium truncate max-w-[200px]">{meeting.title}</span>
                              </div>
                            </td>
                            <td className="px-4 lg:px-6 py-3.5 text-muted-foreground hidden md:table-cell">{meeting.date}</td>
                            <td className="px-4 lg:px-6 py-3.5 text-muted-foreground hidden sm:table-cell">{meeting.duration}</td>
                            <td className="px-4 lg:px-6 py-3.5 hidden lg:table-cell">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Users size={14} /> {meeting.participants}
                              </div>
                            </td>
                            <td className="px-4 lg:px-6 py-3.5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(meeting.status)}`}>
                                {meeting.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />}
                                {meeting.status}
                              </span>
                            </td>
                            <td className="px-4 lg:px-6 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {meeting.status === 'Active' && (
                                  <Button size="sm" className="h-7 text-xs" onClick={handleJoinMeeting}>Join</Button>
                                )}
                                {meeting.status === 'Ended' && (
                                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCurrentView('recordings')}>
                                    <CircleDot size={12} className="mr-1" /> Recording
                                  </Button>
                                )}
                                {meeting.status === 'Scheduled' && (
                                  <Button variant="outline" size="sm" className="h-7 text-xs">Details</Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* AI Insights + Quick Actions */}
          <div className="grid lg:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="h-full border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <Brain size={16} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <CardTitle className="text-base font-semibold">AI Insights</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { text: '47 meetings summarized this week', icon: <FileText size={14} /> },
                    { text: '12 action items pending', icon: <Clock size={14} /> },
                    { text: '3 meetings need follow-up', icon: <MessageSquare size={14} /> },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                      <div className="text-muted-foreground">{item.icon}</div>
                      <span className="text-sm flex-1">{item.text}</span>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full text-sm text-primary" onClick={() => setCurrentView('ai-assistant')}>
                    View All Insights <ArrowRight size={14} className="ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="lg:col-span-2"
            >
              <Card className="h-full border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
                    {[
                      { label: 'New Meeting', icon: <Plus size={18} />, color: 'text-sky-600 bg-sky-50 dark:bg-sky-900/20 dark:text-sky-400', onClick: handleNewMeeting, isStartMeeting: true },
                      { label: 'Schedule', icon: <Calendar size={18} />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400', onClick: () => setCurrentView('calendar') },
                      { label: 'Join Meeting', icon: <Video size={18} />, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400', onClick: handleJoinMeeting },
                      { label: 'AI Assistant', icon: <Brain size={18} />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400', onClick: () => setCurrentView('ai-assistant') },
                      { label: 'Whiteboard', icon: <Pen size={18} />, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400', onClick: () => setCurrentView('whiteboard') },
                      { label: 'Recordings', icon: <CircleDot size={18} />, color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20 dark:text-pink-400', onClick: () => setCurrentView('recordings') },
                      { label: 'Files', icon: <FolderOpen size={18} />, color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400', onClick: () => setCurrentView('files') },
                      { label: 'Templates', icon: <LayoutTemplate size={18} />, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 dark:text-cyan-400', onClick: () => setCurrentView('templates') },
                    ].map((action, idx) => (
                      action.isStartMeeting ? (
                        <RippleButton key={action.label} onClick={action.onClick} className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/0 hover:border-primary/40 hover:bg-primary/10 transition-all group">
                          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.55 + idx * 0.04 }} className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform shadow-sm`}>{action.icon}</motion.div>
                          <span className="text-sm font-medium">{action.label}</span>
                        </RippleButton>
                      ) : (
                        <motion.button
                          key={action.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.55 + idx * 0.04 }}
                          onClick={action.onClick}
                          className="flex flex-col items-center gap-2.5 p-4 rounded-xl border hover:border-primary/30 hover:bg-muted/50 transition-all group"
                        >
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                            {action.icon}
                          </div>
                          <span className="text-sm font-medium">{action.label}</span>
                        </motion.button>
                      )
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Who's Online + Team Activity */}
          <div className="grid lg:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card className="h-full border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                      Who&apos;s Online
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">{onlinePeople.length} online</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(155,155,155,0.2) transparent' }}>
                    {onlinePeople.map((person, i) => (
                      <motion.div
                        key={person.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.65 + i * 0.05 }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                      >
                        <div className="relative">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className={`${person.color} text-white text-[10px] font-bold`}>{person.initials}</AvatarFallback>
                          </Avatar>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card bg-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{person.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{person.status}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentView('chat')}><MessageCircle size={13} /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setMeetingTitle('Call with ' + person.name); setCurrentMeetingId('new-' + Date.now()); setCurrentView('meeting-room'); }}><Video size={13} /></Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
                <div className="h-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="lg:col-span-2">
              <Card className="h-full border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Team Activity</CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCurrentView('notifications')}>View All <ArrowRight size={12} className="ml-1" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(155,155,155,0.2) transparent' }}>
                    {teamActivities.map((activity, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + i * 0.06 }}
                        className="flex items-center gap-3"
                      >
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className={`${activity.color} text-white text-[10px] font-bold`}>{activity.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{activity.user}</span>{' '}
                            <span className="text-muted-foreground">{activity.action}</span>{' '}
                            <span className="font-medium">{activity.target}</span>
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{activity.time}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
                <div className="h-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-500" />
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
