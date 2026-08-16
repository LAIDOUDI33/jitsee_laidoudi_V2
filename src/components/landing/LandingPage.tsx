'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Shield,
  Globe,
  Lock,
  Server,
  Video,
  Brain,
  Users,
  Radio,
  Mic,
  Languages,
  Sparkles,
  FileText,
  CheckSquare,
  Search,
  ShieldCheck,
  Building2,
  Wifi,
  Plug,
  Cloud,
  Activity,
  ArrowRight,
  ArrowUp,
  Check,
  Zap,
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  User,
  MousePointer2,
  Star,
  Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from 'sonner';
import { authFetch } from '@/lib/api';
import { useAppStore } from '@/store/app-store';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  ctaVariant: 'default' | 'outline' | 'ghost';
}

interface Integration {
  name: string;
  description: string;
}

interface StatItem {
  target?: number;
  value: number;
  suffix: string;
  label: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

/* -------------------------------------------------------------------------- */
/*                                 DATA / CONSTS                              */
/* -------------------------------------------------------------------------- */

const TRUST_BADGES = [
  { icon: Shield, label: 'E2E Encrypted' },
  { icon: Globe, label: 'Multi-language AI' },
  { icon: Lock, label: 'Zero-Trust Security' },
  { icon: Server, label: 'On-Premise Ready' },
] as const;

const PLATFORM_FEATURES = [
  {
    icon: Video,
    title: 'Video & Audio Conferencing',
    description:
      'HD 1080p video, adaptive bitrate, noise suppression, background blur. SFU architecture for scalable multi-party calls.',
  },
  {
    icon: Brain,
    title: 'AI Intelligence Suite',
    description:
      'Real-time transcription in 73+ languages, instant translation, AI meeting assistant, automatic summaries, action item extraction.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
      'Channels, threaded chat, file sharing, task management, calendar integration. Everything your team needs in one place.',
  },
  {
    icon: Radio,
    title: 'Enterprise Events',
    description:
      'Webinars, town halls, live streaming, registration, Q&A, polls, engagement analytics. Reach thousands simultaneously.',
  },
] as const;

const AI_FEATURES = [
  {
    icon: Mic,
    title: 'Live Transcription',
    description:
      'Real-time speech-to-text with speaker identification and confidence scores.',
  },
  {
    icon: Languages,
    title: 'Instant Translation',
    description:
      'Cross-language communication. Speak in any language, read in yours.',
  },
  {
    icon: Sparkles,
    title: 'AI Meeting Assistant',
    description:
      'Ask questions during meetings. Get answers from the conversation context.',
  },
  {
    icon: FileText,
    title: 'Smart Summaries',
    description:
      'Automatic meeting summaries with key topics, decisions, risks, and action items.',
  },
  {
    icon: CheckSquare,
    title: 'Action Extraction',
    description:
      'AI identifies commitments, assigns owners, sets deadlines. Integrates with Jira, Trello.',
  },
  {
    icon: Search,
    title: 'Knowledge Search',
    description:
      'Enterprise RAG. Search across all meetings, documents, and chats with permission-aware AI.',
  },
] as const;

const ARCHITECTURE_PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Security',
    description:
      'OAuth 2.0, SAML SSO, MFA, RBAC, zero-trust, audit logging.',
  },
  {
    icon: Building2,
    title: 'Multi-Tenancy',
    description: 'Complete tenant isolation at every layer.',
  },
  {
    icon: Wifi,
    title: 'WebRTC Core',
    description: 'STUN/TURN, DTLS-SRTP, simulcast, adaptive bitrate.',
  },
  {
    icon: Plug,
    title: 'Interoperability',
    description: 'SIP/H.323 gateway for legacy conference systems.',
  },
  {
    icon: Cloud,
    title: 'Deployment',
    description: 'SaaS, private cloud, on-premise, hybrid, sovereign.',
  },
  {
    icon: Activity,
    title: 'Observability',
    description: 'OpenTelemetry, metrics, logs, distributed tracing.',
  },
] as const;

const INTEGRATIONS: Integration[] = [
  { name: 'Microsoft 365', description: 'Teams, Outlook, OneDrive, SharePoint sync' },
  { name: 'Google Workspace', description: 'Calendar, Drive, Meet interoperability' },
  { name: 'Jira', description: 'Action items auto-synced to issues' },
  { name: 'Trello', description: 'Meeting tasks pushed to boards' },
  { name: 'Slack', description: 'Cross-platform notifications and commands' },
  { name: 'LDAP / AD', description: 'Enterprise directory authentication' },
  { name: 'SAML IdP', description: 'Single sign-on with Okta, Azure AD, OneLogin' },
  { name: 'CalDAV', description: 'Calendar integration for scheduling' },
];

const STATS: StatItem[] = [
  { value: 99.9, suffix: '%', label: 'Uptime SLA' },
  { value: 256, suffix: '-bit', label: 'Encryption' },
  { value: 73, suffix: '+', label: 'Languages' },
  { value: 10000, suffix: '+', label: 'Concurrent Users' },
];

const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Free',
    price: '$0',
    description: 'For individuals and small teams getting started.',
    features: [
      'Up to 20 participants',
      '45-minute meeting limit',
      'Basic chat & channels',
      '1 team',
      'Screen sharing',
      'Standard video quality',
    ],
    cta: 'Get Started Free',
    ctaVariant: 'outline',
  },
  {
    name: 'Professional',
    price: '$15',
    period: '/user/mo',
    description: 'For growing teams that need AI-powered collaboration.',
    features: [
      'Up to 100 participants',
      'Unlimited meeting duration',
      'Cloud recordings & transcripts',
      'Full AI features suite',
      '10 teams',
      'Priority support',
      'Custom backgrounds & branding',
      'Calendar integrations',
    ],
    highlighted: true,
    cta: 'Start 14-Day Trial',
    ctaVariant: 'default',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For organizations that need full control and compliance.',
    features: [
      'Unlimited participants',
      'Unlimited everything',
      'SSO / SAML / LDAP',
      'On-premise deployment',
      '99.99% SLA',
      'Dedicated support engineer',
      'Full API access',
      'Custom AI model training',
      'Compliance & audit reports',
    ],
    cta: 'Contact Sales',
    ctaVariant: 'outline',
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How does ALVISION handle data encryption?',
    answer:
      'All data is encrypted in transit using TLS 1.3 and at rest using AES-256. We support end-to-end encryption for meeting content, and encryption keys can be managed by your own KMS for maximum control. Zero-knowledge architecture ensures even ALVISION cannot access your meeting content.',
  },
  {
    question: 'Can ALVISION be deployed on-premise?',
    answer:
      'Yes. ALVISION supports SaaS, private cloud, on-premise, hybrid, and sovereign cloud deployments. Our Enterprise tier includes full deployment flexibility with Kubernetes Helm charts, Docker Compose configurations, and dedicated installation support.',
  },
  {
    question: 'What compliance certifications does ALVISION hold?',
    answer:
      'ALVISION is SOC 2 Type II certified, HIPAA compliant, GDPR compliant, and FedRAMP authorized. We undergo annual third-party security audits and penetration testing. Enterprise customers receive detailed compliance documentation and audit logs.',
  },
  {
    question: 'How does the AI transcription and translation work?',
    answer:
      'Our AI engine processes audio in real-time using proprietary speech models optimized for business conversations. Transcription includes speaker identification (diarization), punctuation, and domain-specific terminology. Translation supports 73+ languages with context-aware accuracy. All AI processing can be confined to your own infrastructure.',
  },
  {
    question: 'What is the maximum number of meeting participants?',
    answer:
      'The Free tier supports up to 20 participants, Professional supports up to 100, and Enterprise has no hard limit. Our SFU architecture has been tested with 10,000+ concurrent users in a single meeting. Performance scales linearly with additional media server nodes.',
  },
  {
    question: 'Does ALVISION integrate with existing conference room systems?',
    answer:
      'Yes. ALVISION includes a SIP/H.323 gateway that enables interoperability with legacy conference room systems from Cisco, Poly, Lifesize, and others. This allows traditional room systems to join ALVISION meetings without hardware replacement.',
  },
  {
    question: 'How is multi-tenancy implemented?',
    answer:
      'ALVISION provides complete tenant isolation at every layer: database, application, and network. Each tenant has isolated data stores, dedicated encryption keys, separate caching, and isolated API contexts. Cross-tenant data access is architecturally impossible.',
  },
  {
    question: 'What happens to AI-processed data?',
    answer:
      'AI processing data (transcripts, summaries, action items) belongs entirely to you. We do not use your data to train our models. Data retention policies are fully configurable, and you can request immediate deletion. On-premise deployments ensure data never leaves your infrastructure.',
  },
];

const HERO_STATS = [
  { icon: Building2, value: '10K+', label: 'Organizations' },
  { icon: Clock, value: '500M+', label: 'Meeting Minutes' },
  { icon: Activity, value: '99.99%', label: 'Uptime' },
  { icon: Globe, value: '150+', label: 'Countries' },
] as const;

const TESTIMONIALS = [
  {
    name: 'Sarah Mitchell',
    role: 'VP of Engineering',
    company: 'TechCorp Global',
    initials: 'SM',
    color: 'bg-gradient-to-br from-rose-500 to-pink-600',
    rating: 5,
    text: 'ALVISION transformed our remote meetings. The AI summaries alone save our team 5+ hours per week. The transcription accuracy in our technical discussions is remarkable.',
  },
  {
    name: 'James Chen',
    role: 'CTO',
    company: 'FinanceFlow',
    initials: 'JC',
    color: 'bg-gradient-to-br from-sky-500 to-blue-600',
    rating: 5,
    text: 'Security was our top priority. ALVISION\'s zero-trust architecture and on-premise option gave us the confidence to migrate our entire organization. 3,000+ users, zero incidents.',
  },
  {
    name: 'Priya Sharma',
    role: 'Head of Operations',
    company: 'MediCare Solutions',
    initials: 'PS',
    color: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    rating: 5,
    text: 'HIPAA compliance was non-negotiable. ALVISION delivered on every requirement and their support team went above and beyond during our compliance audit.',
  },
  {
    name: 'Marcus Johnson',
    role: 'CEO',
    company: 'StartupLaunch',
    initials: 'MJ',
    color: 'bg-gradient-to-br from-amber-500 to-orange-600',
    rating: 5,
    text: 'We switched from three different tools to just ALVISION. Video calls, chat, whiteboards, and AI notes — all in one platform. Our team productivity increased by 40%.',
  },
  {
    name: 'Elena Rodriguez',
    role: 'Director of HR',
    company: 'GlobalEdge Inc',
    initials: 'ER',
    color: 'bg-gradient-to-br from-violet-500 to-purple-600',
    rating: 5,
    text: 'The live translation feature is a game-changer for our international offices. Teams in Tokyo, Berlin, and São Paulo now collaborate seamlessly in their native languages.',
  },
  {
    name: 'David Park',
    role: 'Product Manager',
    company: 'DataSync',
    initials: 'DP',
    color: 'bg-gradient-to-br from-cyan-500 to-sky-600',
    rating: 5,
    text: 'The AI action extraction automatically creates Jira tickets from our sprint reviews. What used to take 30 minutes of manual work now happens instantly. Incredible.',
  },
];

/* -------------------------------------------------------------------------- */
/*                              HELPER FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

function generateRoomId(): string {
  const group = () =>
    Array.from({ length: 3 }, () =>
      String.fromCharCode(97 + Math.floor(Math.random() * 26)),
    ).join('');
  return `${group()}-${group()}-${group()}`;
}

/* -------------------------------------------------------------------------- */
/*                          ANIMATED COUNTER COMPONENT                       */
/* -------------------------------------------------------------------------- */

function AnimatedCounter({ target, value, suffix, label }: StatItem) {
  const countTarget = target ?? value;
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000;
    const steps = 60;
    const increment = countTarget / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= countTarget) {
        setCount(countTarget);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, countTarget]);

  const displayValue =
    countTarget % 1 !== 0 ? count.toFixed(1) : Math.round(count).toLocaleString();

  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-bold tracking-tight">
        <span ref={ref}>{displayValue}</span>
        <span className="gradient-text">{suffix}</span>
      </div>
      <p className="mt-2 text-muted-foreground text-sm font-medium">{label}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SECTION ANIMATION                            */
/* -------------------------------------------------------------------------- */

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

/* -------------------------------------------------------------------------- */
/*                           LANDING PAGE COMPONENT                          */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const setCurrentMeetingId = useAppStore((s) => s.setCurrentMeetingId);
  const [roomName, setRoomName] = useState('');
  const [starting, setStarting] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStartMeeting = useCallback(async () => {
    const roomId = generateRoomId();
    setStarting(true);
    try {
      const res = await authFetch('/api/v1/meetings', {
        method: 'POST',
        body: JSON.stringify({
          roomId,
          title: roomName || `Meeting ${roomId}`,
        }),
      });
      if (!res.ok) throw new Error('Failed to create meeting');
      const result = await res.json();
      const meeting = result.data?.meeting || result;
      toast.success('Meeting created successfully');
      setCurrentMeetingId(meeting.meetingId || meeting.id);
      setCurrentView('meeting-room');
    } catch {
      toast.error('Failed to create meeting. Please try again.');
    } finally {
      setStarting(false);
    }
  }, [roomName, setCurrentView, setCurrentMeetingId]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ------------------------------------------------------------------ */}
      {/*  NAVBAR                                                           */}
      {/* ------------------------------------------------------------------ */}
      <Navbar />

      <main className="flex-1">
        {/* ============================================================== */}
        {/* 1. HERO SECTION                                             */}
        {/* ============================================================== */}
        <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden" id="hero">
          {/* Animated gradient mesh background with floating orbs */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/30" />
            {/* Subtle grid/mesh pattern */}
            <div
              className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, currentColor 0px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, currentColor 0px, transparent 1px, transparent 60px)',
              }}
            />
            {/* Floating orbs */}
            <div className="absolute top-[10%] left-[15%] h-72 w-72 rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-3xl animate-pulse" />
            <div
              className="absolute top-[50%] right-[10%] h-96 w-96 rounded-full bg-cyan-400/15 dark:bg-cyan-500/10 blur-3xl animate-pulse"
              style={{ animationDelay: '1s' }}
            />\n            <div
              className="absolute bottom-[10%] left-[40%] h-64 w-64 rounded-full bg-violet-400/15 dark:bg-violet-500/10 blur-3xl animate-pulse"
              style={{ animationDelay: '2s' }}
            />\n            <div
              className="absolute top-[30%] left-[60%] h-48 w-48 rounded-full bg-sky-300/20 dark:bg-sky-400/10 blur-3xl animate-pulse"
              style={{ animationDelay: '0.5s' }}
            />\n          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left column: Headline + CTA */}
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' as const }}
              >
                <Badge
                  variant="secondary"
                  className="mb-6 px-4 py-1.5 text-sm font-medium"
                >
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                  Enterprise-Grade AI Conferencing
                </Badge>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                  Enterprise Video Conferencing.
                  <br />
                  <span className="gradient-text">Powered by AI.</span>
                </h1>
              </motion.div>

              {/* Subtext */}
              <motion.p
                className="mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' as const }}
              >
                ALVISION unifies HD video meetings, real-time AI transcription,
                translation, intelligent summaries, team collaboration, and
                enterprise-grade security — all in one platform.
              </motion.p>

              {/* Trusted By Section */}
              <motion.div
                className="mt-10 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' as const }}
              >
                <p className="text-xs text-muted-foreground/60 font-medium tracking-wider uppercase mb-4">Trusted by leading enterprises</p>
                <div className="flex items-center justify-center gap-3 sm:gap-6 overflow-x-auto px-4 scrollbar-hide">
                  {['Accenture', 'Deloitte', 'Siemens', 'Bosch', 'Airbus'].map((company, i) => (
                    <span key={company} className="flex items-center gap-3 sm:gap-6">
                      <span className="text-muted-foreground font-medium tracking-wider uppercase text-xs whitespace-nowrap">
                        {company}
                      </span>
                      {i < 4 && <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Center Card with Meeting Controls */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' as const }}
                className="mt-2 w-full max-w-xl"
              >
                <Card className="border-border/50 shadow-xl shadow-black/5 dark:shadow-black/20 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 hover:-translate-y-0.5 hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Enter meeting room name..."
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && handleStartMeeting()
                        }
                        className="flex-1 h-11 rounded-lg border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                      />
                      <div className="relative">
                        {/* Glow effect behind Start Meeting button */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-violet-600 dark:from-primary/20 dark:to-violet-600/20 rounded-lg blur-md opacity-40 -z-10" />
                        <Button
                          onClick={handleStartMeeting}
                          disabled={starting}
                          className="relative h-11 px-6 bg-gradient-to-r from-primary to-violet-600 dark:from-primary/20 dark:to-violet-600/20 hover:from-primary/90 hover:to-violet-500 text-white font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          {starting ? (
                            <span className="flex items-center gap-2">
                              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Creating...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Video className="w-4 h-4" />
                              Start Meeting
                              </span>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-3">
                      <Button
                        variant="outline"
                        className="flex-1 h-10 text-sm relative overflow-hidden group"
                      >
                        <span className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300" />
                        <ChevronRight className="w-4 h-4 mr-1.5 relative z-10" />
                        <span className="relative z-10">Join Meeting</span>
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex-1 h-10 text-sm"
                      >
                        <Calendar className="w-4 h-4 mr-1.5" />
                        Schedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.55, ease: 'easeOut' as const }}
              >
                {TRUST_BADGES.map((badge) => (
                  <div
                    key={badge.label}
                    className="flex items-center gap-2 text-muted-foreground text-sm"
                  >
                    <badge.icon className="w-4 h-4 text-primary/70" />
                    <span className="font-medium">{badge.label}</span>
                  </div>
                ))}
              </motion.div>
              </div>

              {/* Right column: Animated Video Call Illustration (desktop only) */}
              <div className="hidden lg:block relative">
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' as const }}
                  className="relative rounded-2xl bg-white/5 dark:bg-white/[0.03] backdrop-blur-md border border-white/10 dark:border-white/5 p-4 shadow-2xl"
                >
                  {/* 2x2 video grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Sarah Chen', color: 'from-blue-500/30 to-cyan-500/20', active: true, delay: 0.4 },
                      { name: 'James Miller', color: 'from-violet-500/30 to-purple-500/20', active: false, delay: 0.5 },
                      { name: 'Aiko Tanaka', color: 'from-emerald-500/30 to-teal-500/20', active: false, delay: 0.6 },
                      { name: 'Carlos Ruiz', color: 'from-orange-500/30 to-amber-500/20', active: false, delay: 0.7 },
                    ].map((participant) => (
                      <motion.div
                        key={participant.name}
                        initial={{ opacity: 0, scale: 0.85, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: participant.delay, ease: 'easeOut' as const }}
                        className={`relative rounded-xl bg-gradient-to-br ${participant.color} p-4 flex flex-col items-center justify-center gap-2 min-h-[120px] ${participant.active ? 'ring-2 ring-primary/50' : ''}`}
                      >
                        {participant.active && (
                          <motion.div
                            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' as const }}
                          />
                        )}
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${participant.color} border-2 border-white/20 flex items-center justify-center`}>
                          <User className="w-6 h-6 text-white/80" />
                        </div>
                        <span className="text-xs font-medium text-foreground/80">{participant.name}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Floating AI Assistant Bubble */}
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.9, type: 'spring', bounce: 0.4 }}
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-violet-600 px-4 py-2 shadow-lg shadow-primary/30"
                  >
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' as const, delay: 1.2 }}
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                    </motion.div>
                    <span className="text-xs font-semibold text-white">AI Assistant Active</span>
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
              className="flex flex-col items-center mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1.2 }}
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' as const }}
                className="flex flex-col items-center gap-1.5 text-muted-foreground/50"
              >
                <MousePointer2 className="w-5 h-5" />
                <ChevronDown className="w-4 h-4" />
              </motion.div>
              <span className="text-xs text-muted-foreground/40 mt-1 font-medium">Scroll to explore</span>
            </motion.div>
          </div>

          {/* Hero Stats Row */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {HERO_STATS.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + i * 0.1, ease: 'easeOut' as const }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <stat.icon className="w-5 h-5 text-primary/70" />
                    </div>
                    <div>
                      <div className="text-xl lg:text-2xl font-bold tracking-tight">{stat.value}</div>
                      <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 2. PLATFORM OVERVIEW                                         */}
        {/* ============================================================== */}
        <div className="w-16 h-1 bg-primary rounded-full mx-auto" />
        <section id="platform" className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                One Platform.{' '}
                <span className="gradient-text">Every Collaboration Need.</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Four powerful modules working together to eliminate tool sprawl
                and unify your team&rsquo;s communication.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {PLATFORM_FEATURES.map((feature) => (
                <motion.div key={feature.title} variants={staggerItem}>
                  <Card className="h-full group hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20 transition-all duration-300 border-border/50">
                    <CardContent className="p-8">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                        <feature.icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 3. AI PLATFORM SECTION                                       */}
        {/* ============================================================== */}
        <div className="w-16 h-1 bg-primary rounded-full mx-auto" />
        <section id="ai" className="py-24 bg-foreground/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="text-center mb-16"
            >
              <Badge
                variant="secondary"
                className="mb-4 px-4 py-1.5 text-sm font-medium"
              >
                <Brain className="w-3.5 h-3.5 mr-1.5" />
                AI-Native
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                <span className="gradient-text">AI-Native Architecture</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Not an afterthought. AI is built into every layer of ALVISION.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {AI_FEATURES.map((feature) => (
                <motion.div key={feature.title} variants={staggerItem}>
                  <Card className="h-full group hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20 transition-all duration-300 border-border/50">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-5 shadow-lg shadow-violet-500/20">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 4. ARCHITECTURE SECTION                                      */}
        {/* ============================================================== */}
        <div className="w-16 h-1 bg-primary rounded-full mx-auto" />
        <section id="architecture" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                <span className="gradient-text">Enterprise-Grade Architecture</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Built from the ground up to meet the demands of Fortune 500
                organizations.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {ARCHITECTURE_PILLARS.map((pillar) => (
                <motion.div key={pillar.title} variants={staggerItem}>
                  <Card className="h-full group hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20 transition-all duration-300 border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center shrink-0">
                          <pillar.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-1">
                            {pillar.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {pillar.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 5. INTEGRATIONS SECTION                                      */}
        {/* ============================================================== */}
        <div className="w-16 h-1 bg-primary rounded-full mx-auto" />
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Connects to Your{' '}
                <span className="gradient-text">Existing Stack</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Seamless integrations with the tools your teams already use.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {INTEGRATIONS.map((integration) => (
                <motion.div key={integration.name} variants={staggerItem}>
                  <Card className="h-full hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 border-border/50">
                    <CardContent className="p-5 text-center">
                      <div className="w-10 h-10 mx-auto rounded-lg bg-muted flex items-center justify-center mb-3">
                        <Plug className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-sm">{integration.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {integration.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 6. STATS SECTION                                             */}
        {/* ============================================================== */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-12">
                {STATS.map((stat) => (
                  <AnimatedCounter
                    key={stat.label}
                    value={stat.value}
                    suffix={stat.suffix}
                    label={stat.label}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 7. PRICING SECTION                                           */}
        {/* ============================================================== */}
        <div className="w-16 h-1 bg-primary rounded-full mx-auto" />
        <section id="pricing" className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Simple, Transparent{' '}
                <span className="gradient-text">Pricing</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Start free. Scale as your team grows. No hidden fees.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
            >
              {PRICING_TIERS.map((tier) => (
                <motion.div key={tier.name} variants={staggerItem}>
                  {tier.highlighted ? (
                    <div className="relative rounded-xl p-[2px] bg-gradient-to-r from-blue-500 via-cyan-500 to-violet-500 animate-[spin_4s_linear_infinite]"
                      style={{ backgroundSize: '200% 200%', animation: 'pricing-border-rotate 4s linear infinite' }}
                    >
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 via-cyan-500 to-violet-500 animate-[spin_4s_linear_infinite] blur-sm opacity-50" />
                      <Card className="relative h-full rounded-xl shadow-xl shadow-blue-500/10 dark:border-border/30 dark:bg-card/50">
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                          <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 px-4 py-1">
                            Most Popular
                          </Badge>
                        </div>
                        <CardContent className="p-8">
                          <h3 className="text-xl font-bold">{tier.name}</h3>
                          <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold tracking-tight">
                              {tier.price}
                            </span>
                            {tier.period && (
                              <span className="text-muted-foreground text-sm">
                                {tier.period}
                              </span>
                            )}
                          </div>
                          <p className="mt-3 text-sm text-muted-foreground">
                            {tier.description}
                          </p>
                          <div className="mt-6 mb-8 space-y-3">
                            {tier.features.map((feature) => (
                              <div
                                key={feature}
                                className="flex items-start gap-3 text-sm"
                              >
                                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                          <Button
                            variant={tier.ctaVariant}
                            className="w-full h-11 font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/25"
                          >
                            {tier.cta}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Card className="h-full hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 border-border/50 dark:border-border/30 dark:bg-card/50">
                      <CardContent className="p-8">
                        <h3 className="text-xl font-bold">{tier.name}</h3>
                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-4xl font-extrabold tracking-tight">
                            {tier.price}
                          </span>
                          {tier.period && (
                            <span className="text-muted-foreground text-sm">
                              {tier.period}
                            </span>
                          )}
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                          {tier.description}
                        </p>
                        <div className="mt-6 mb-8 space-y-3">
                          {tier.features.map((feature) => (
                            <div
                              key={feature}
                              className="flex items-start gap-3 text-sm"
                            >
                              <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                        <Button
                          variant={tier.ctaVariant}
                          className="w-full h-11 font-semibold"
                        >
                          {tier.cta}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 8. FAQ SECTION                                               */}
        {/* ============================================================== */}
        <div className="w-16 h-1 bg-primary rounded-full mx-auto" />
        <section id="faq" className="py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Frequently Asked{' '}
                <span className="gradient-text">Questions</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to know about ALVISION.
              </p>
            </motion.div>

            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
            >
              <Accordion type="single" collapsible className="w-full">
                {FAQ_ITEMS.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`faq-${index}`}
                  >
                    <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 9. TESTIMONIALS SECTION                                       */}
        {/* ============================================================== */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="text-center mb-14"
            >
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" /> Trusted by 10,000+ organizations
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Loved by Teams Worldwide
              </h2>
              <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
                See why enterprises from Fortune 500 to fast-growing startups choose ALVISION for their collaboration needs.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {TESTIMONIALS.map((t, idx) => (
                <motion.div key={t.name} variants={staggerItem}>
                  <Card className="h-full border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${idx % 3 === 0 ? 'from-rose-500 to-pink-500' : idx % 3 === 1 ? 'from-sky-500 to-blue-500' : 'from-emerald-500 to-teal-500'}`} />
                    <CardContent className="p-6 pt-7">
                      <Quote className="h-8 w-8 text-muted-foreground/20 mb-3" />
                      <p className="text-sm leading-relaxed text-foreground/80 mb-5">{t.text}</p>
                      <div className="flex items-center gap-1 mb-4">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                          {t.initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.role}, {t.company}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 10. CTA SECTION                                               */}
        {/* ============================================================== */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-12 md:p-16 text-center"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 h-full w-full -z-0">
                <div className="absolute top-[-20%] right-[-10%] h-80 w-80 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute bottom-[-20%] left-[-10%] h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
              </div>

              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
                  Ready to Transform Your
                  <br className="hidden sm:block" /> Collaboration?
                </h2>
                <p className="mt-4 text-emerald-100 text-lg max-w-xl mx-auto">
                  Join thousands of enterprises already using ALVISION to
                  collaborate smarter and more securely.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-lg shadow-black/10 px-8 h-12 text-base"
                    onClick={handleStartMeeting}
                  >
                    Start Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 hover:text-white font-semibold px-8 h-12 text-base"
                  >
                    Contact Sales
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-40 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center hover:bg-primary/90 hover:shadow-xl transition-all"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Animated pricing border keyframes */}
      <style jsx global>{`
        @keyframes pricing-border-rotate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* ------------------------------------------------------------------ */}
      {/*  FOOTER                                                           */}
      {/* ------------------------------------------------------------------ */}
      <Footer />
    </div>
  );
}
