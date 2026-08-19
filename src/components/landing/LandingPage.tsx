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
  Trophy,
  Mail,
  MessageSquare,
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
    description: 'OAuth 2.0, SAML SSO, MFA, RBAC, zero-trust, audit logging.',
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

const COMPARISON_FEATURES = [
  { feature: 'AI Meeting Summaries', alvision: true, zoom: true, teams: true, meet: false },
  { feature: 'Real-time Translation (10+ langs)', alvision: true, zoom: false, teams: false, meet: false },
  { feature: 'Live Transcription', alvision: true, zoom: true, teams: true, meet: true },
  { feature: 'Smart Action Items Extraction', alvision: true, zoom: false, teams: false, meet: false },
  { feature: 'Virtual Backgrounds', alvision: true, zoom: true, teams: true, meet: true },
  { feature: 'Breakout Rooms', alvision: true, zoom: true, teams: true, meet: false },
  { feature: 'Real-time Reactions', alvision: true, zoom: true, teams: true, meet: true },
  { feature: 'Meeting Polls', alvision: true, zoom: true, teams: true, meet: true },
  { feature: 'Whiteboard', alvision: true, zoom: true, teams: true, meet: false },
  { feature: 'E2E Encryption', alvision: true, zoom: true, teams: true, meet: true },
  { feature: 'On-Premise Deployment', alvision: true, zoom: true, teams: false, meet: false },
  { feature: 'SAML/OIDC SSO', alvision: true, zoom: true, teams: true, meet: false },
  { feature: 'Custom Branding', alvision: true, zoom: true, teams: false, meet: false },
  { feature: 'AI Meeting Assistant Q&A', alvision: true, zoom: true, teams: false, meet: false },
  { feature: 'Pre-Join Device Test', alvision: true, zoom: true, teams: true, meet: true },
  { feature: 'PWA / Offline Support', alvision: true, zoom: false, teams: false, meet: false },
];

const COMPARISON_HEADERS = [
  { key: 'alvision', name: 'ALVISION', highlight: true },
  { key: 'zoom', name: 'Zoom', highlight: false },
  { key: 'teams', name: 'Teams', highlight: false },
  { key: 'meet', name: 'Google Meet', highlight: false },
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

const COMPANY_LOGOS = [
  'Acme Corp', 'TechStart', 'GlobalBank', 'EduLearn', 'HealthPlus', 'MediaFlow',
] as const;

const SOCIAL_PROOF_STATS = [
  { icon: Video, target: 10000, suffix: '+', label: 'Daily Meetings', format: false, decimal: false },
  { icon: Users, target: 500000, suffix: '+', label: 'Active Users', format: true, decimal: false },
  { icon: Zap, target: 99.9, suffix: '%', label: 'Uptime', format: false, decimal: true },
] as const;

const TYPEWRITER_WORDS = ['for Teams', 'for Enterprise', 'for Education', 'for Everyone'];

const CAROUSEL_TESTIMONIALS = [
  {
    name: 'Sarah Mitchell',
    role: 'VP of Engineering',
    company: 'TechCorp Global',
    initials: 'SM',
    color: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    rating: 5,
    text: 'ALVISION transformed our remote meetings. The AI summaries alone save our team 5+ hours per week. The transcription accuracy in our technical discussions is remarkable.',
  },
  {
    name: 'James Chen',
    role: 'CTO',
    company: 'FinanceFlow',
    initials: 'JC',
    color: 'bg-gradient-to-br from-amber-500 to-orange-600',
    rating: 5,
    text: "Security was our top priority. ALVISION's zero-trust architecture and on-premise option gave us the confidence to migrate our entire organization. 3,000+ users, zero incidents.",
  },
  {
    name: 'Marcus Johnson',
    role: 'CEO',
    company: 'StartupLaunch',
    initials: 'MJ',
    color: 'bg-gradient-to-br from-teal-500 to-emerald-600',
    rating: 5,
    text: 'We switched from three different tools to just ALVISION. Video calls, chat, whiteboards, and AI notes — all in one platform. Our team productivity increased by 40%.',
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
/*                        TYPEWRITER TEXT COMPONENT                          */
/* -------------------------------------------------------------------------- */

function TypewriterText({ words }: { words: readonly string[] }) {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [words]);

  return (
    <span className="relative inline-flex overflow-hidden h-[1.3em] align-text-bottom">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[wordIndex]}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="inline-block"
        >
          {words[wordIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                       FLOATING GEOMETRIC SHAPES                           */
/* -------------------------------------------------------------------------- */

function FloatingShape({
  type,
  size,
  className,
  delay = 0,
  duration = 20,
}: {
  type: 'circle' | 'hexagon';
  size: number;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 1 }}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        animate={{
          y: [0, -20, 10, -15, 0],
          x: [0, 10, -8, 12, 0],
          rotate: type === 'hexagon' ? [0, 15, -10, 20, 0] : [0, 5, -5, 3, 0],
        }}
        transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        {type === 'circle' ? (
          <circle cx="50" cy="50" r="40" />
        ) : (
          <polygon points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5" />
        )}
      </motion.svg>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         MOCK BROWSER WINDOW                               */
/* -------------------------------------------------------------------------- */

function MockBrowserWindow() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
      className="relative w-full max-w-[560px]"
    >
      <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 rounded-3xl blur-2xl" />
      <div className="relative rounded-2xl border border-border/60 dark:border-border/40 bg-white dark:bg-slate-900 shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 dark:bg-slate-800/80 border-b border-border/40">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
          </div>
          <div className="flex-1 mx-2">
            <div className="h-7 rounded-lg bg-muted dark:bg-slate-700/60 flex items-center px-3 gap-2">
              <Lock className="w-3 h-3 text-emerald-500" />
              <span className="text-xs text-muted-foreground truncate">app.alvision.com/dashboard</span>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex gap-3">
            <div className="w-12 shrink-0 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-8 rounded-lg ${i === 1 ? 'bg-emerald-500/20 dark:bg-emerald-500/15' : 'bg-muted/50 dark:bg-slate-800/50'}`}
                />
              ))}
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 rounded bg-muted/70 dark:bg-slate-800/70" />
                <div className="h-8 w-24 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Video, label: 'Active', val: '24' },
                  { icon: Users, label: 'Online', val: '1.2K' },
                  { icon: MessageSquare, label: 'Messages', val: '847' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 p-3 border border-emerald-100/50 dark:border-emerald-900/30"
                  >
                    <stat.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1.5" />
                    <div className="text-lg font-bold text-foreground">{stat.val}</div>
                    <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-muted/30 dark:bg-slate-800/40 p-3 border border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-3 w-24 rounded bg-muted/70 dark:bg-slate-700/60" />
                  <div className="h-3 w-16 rounded bg-emerald-500/20 dark:bg-emerald-500/15" />
                </div>
                <div className="flex items-end gap-1 h-12">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-sm bg-gradient-to-t from-emerald-500 to-teal-400 dark:from-emerald-600 dark:to-teal-500"
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 0.6, delay: 0.5 + i * 0.05, ease: 'easeOut' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
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
/*                    SOCIAL PROOF COUNTER COMPONENT                         */
/* -------------------------------------------------------------------------- */

function SocialProofCounter({
  icon: Icon,
  target,
  suffix,
  label,
  format = false,
  decimal = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  target: number;
  suffix: string;
  label: string;
  format?: boolean;
  decimal?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 2500;
    const steps = 80;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, target]);

  const display = decimal
    ? count.toFixed(1)
    : format
      ? `${Math.round(count / 1000)}K`
      : Math.round(count).toLocaleString();

  return (
    <div ref={ref} className="text-center">
      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
        <span>{display}</span>
        <span className="gradient-text">{suffix}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground font-medium">{label}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                       TESTIMONIAL CAROUSEL CARD                           */
/* -------------------------------------------------------------------------- */

function TestimonialCard({
  t,
}: {
  t: (typeof CAROUSEL_TESTIMONIALS)[number];
}) {
  return (
    <div className="w-[340px] sm:w-[400px] lg:w-[440px] shrink-0 px-2">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="h-full rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 dark:bg-white/[0.03] dark:border-white/[0.06] p-6 sm:p-8 shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-xl hover:bg-white/[0.08] dark:hover:bg-white/[0.05] transition-all duration-300"
      >
        <Quote className="h-8 w-8 text-emerald-500/30 mb-4" />
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <p className="text-sm sm:text-base leading-relaxed text-foreground/85 mb-6">
          {t.text}
        </p>
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-xs font-bold shadow-lg`}
          >
            {t.initials}
          </div>
          <div>
            <p className="text-sm font-semibold">{t.name}</p>
            <p className="text-xs text-muted-foreground">
              {t.role}, {t.company}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            SECTION ANIMATION                              */
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

const glowCardItem = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
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
  const [ctaEmail, setCtaEmail] = useState('');
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % CAROUSEL_TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!carouselRef.current) return;
    const cardWidth = carouselRef.current.scrollWidth / CAROUSEL_TESTIMONIALS.length;
    carouselRef.current.scrollTo({ left: carouselIndex * cardWidth, behavior: 'smooth' });
  }, [carouselIndex]);

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

  const handleCtaSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!ctaEmail.trim()) return;
      toast.success('Welcome aboard! Check your email to get started.');
      setCtaEmail('');
    },
    [ctaEmail],
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section
          className="relative min-h-[92vh] flex items-center justify-center overflow-hidden"
          id="hero"
        >
          {/* Animated gradient mesh background */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20" />
            <div
              className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, currentColor 0px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, currentColor 0px, transparent 1px, transparent 60px)',
              }}
            />
            <motion.div
              className="absolute h-[500px] w-[500px] rounded-full opacity-[0.12] dark:opacity-[0.10]"
              style={{
                background: 'radial-gradient(circle, #10b981 0%, transparent 70%)',
                top: '5%',
                left: '10%',
              }}
              animate={{
                x: [0, 60, -30, 40, 0],
                y: [0, -40, 20, -20, 0],
                scale: [1, 1.1, 0.95, 1.05, 1],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute h-[600px] w-[600px] rounded-full opacity-[0.10] dark:opacity-[0.10]"
              style={{
                background: 'radial-gradient(circle, #14b8a6 0%, transparent 70%)',
                top: '40%',
                right: '5%',
              }}
              animate={{
                x: [0, -50, 30, -40, 0],
                y: [0, 30, -50, 20, 0],
                scale: [1, 0.9, 1.1, 0.95, 1],
              }}
              transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
            <motion.div
              className="absolute h-[400px] w-[400px] rounded-full opacity-[0.10] dark:opacity-[0.08]"
              style={{
                background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)',
                bottom: '10%',
                left: '35%',
              }}
              animate={{
                x: [0, 40, -20, 30, 0],
                y: [0, -30, 40, -10, 0],
                scale: [1, 1.05, 0.9, 1.1, 1],
              }}
              transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
            />
            <motion.div
              className="absolute h-[300px] w-[300px] rounded-full bg-teal-500 opacity-[0.08] dark:opacity-[0.06] blur-2xl"
              style={{ top: '15%', right: '25%' }}
              animate={{
                y: [0, -25, 15, -20, 0],
                x: [0, 15, -20, 10, 0],
                scale: [1, 1.08, 0.94, 1.04, 1],
              }}
              transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
            />
          </div>

          {/* Floating geometric shapes */}
          <FloatingShape type="hexagon" size={48} className="absolute top-[12%] left-[8%] text-emerald-300/40 dark:text-emerald-500/20" delay={0} duration={22} />
          <FloatingShape type="circle" size={36} className="absolute top-[25%] right-[12%] text-teal-300/40 dark:text-teal-500/20" delay={2} duration={18} />
          <FloatingShape type="hexagon" size={60} className="absolute bottom-[20%] left-[5%] text-amber-300/30 dark:text-amber-500/15" delay={1} duration={26} />
          <FloatingShape type="circle" size={28} className="absolute top-[60%] right-[8%] text-emerald-400/30 dark:text-emerald-600/15" delay={3} duration={20} />
          <FloatingShape type="hexagon" size={40} className="absolute top-[15%] right-[30%] text-teal-300/25 dark:text-teal-600/12" delay={5} duration={24} />
          <FloatingShape type="circle" size={52} className="absolute bottom-[30%] right-[25%] text-amber-200/25 dark:text-amber-500/10" delay={1.5} duration={28} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left column */}
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                >
                  <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
                    <Zap className="w-3.5 h-3.5 mr-1.5" />
                    Enterprise-Grade AI Conferencing
                  </Badge>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                    <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                      Enterprise Video
                      <br />
                      Conferencing.
                    </span>
                    <br />
                    <span className="gradient-text">Powered by AI.</span>
                  </h1>
                </motion.div>

                <motion.p
                  className="mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
                >
                  The complete meeting platform{' '}
                  <span className="text-teal-600 dark:text-teal-400 font-semibold">
                    <TypewriterText words={TYPEWRITER_WORDS} />
                  </span>
                  . HD video, real-time AI transcription, translation, and intelligent
                  summaries - all in one.
                </motion.p>

                {/* Meeting controls card */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
                  className="mt-10 w-full max-w-xl"
                >
                  <Card className="border-border/50 shadow-xl shadow-black/5 dark:shadow-black/20 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 hover:-translate-y-0.5 hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          placeholder="Enter meeting room name..."
                          value={roomName}
                          onChange={(e) => setRoomName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleStartMeeting()}
                          className="flex-1 h-11 rounded-lg border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                        />
                        <div className="relative">
                          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-500/30 dark:to-teal-600/30 rounded-lg blur-md opacity-50 -z-10" />
                          <Button
                            onClick={handleStartMeeting}
                            disabled={starting}
                            className="relative h-11 px-6 overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                          >
                            <span className="absolute inset-0 overflow-hidden rounded-lg">
                              <span className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            </span>
                            {starting ? (
                              <span className="flex items-center gap-2 relative z-10">
                                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating...
                              </span>
                            ) : (
                              <span className="flex items-center gap-2 relative z-10">
                                <Video className="w-4 h-4" />
                                Start Meeting
                              </span>
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-3">
                        <Button variant="outline" className="flex-1 h-10 text-sm relative overflow-hidden group">
                          <span className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors duration-300" />
                          <ChevronRight className="w-4 h-4 mr-1.5 relative z-10" />
                          <span className="relative z-10">Join Meeting</span>
                        </Button>
                        <Button variant="ghost" className="flex-1 h-10 text-sm">
                          <Calendar className="w-4 h-4 mr-1.5" />
                          Schedule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.55, ease: 'easeOut' }}
                >
                  {TRUST_BADGES.map((badge) => (
                    <div key={badge.label} className="flex items-center gap-2 text-muted-foreground text-sm">
                      <badge.icon className="w-4 h-4 text-emerald-600/70 dark:text-emerald-400/70" />
                      <span className="font-medium">{badge.label}</span>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Right column: Mock Browser Window */}
              <div className="hidden lg:flex justify-center">
                <MockBrowserWindow />
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
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
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
            <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {HERO_STATS.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + i * 0.1, ease: 'easeOut' }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <stat.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
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

        {/* SOCIAL PROOF SECTION */}
        <section className="py-16 bg-muted/20 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <p className="text-sm text-muted-foreground/70 font-medium tracking-wider uppercase mb-8">
                Trusted by innovative teams worldwide
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
                {COMPANY_LOGOS.map((company, i) => (
                  <motion.span
                    key={company}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className="text-muted-foreground/40 dark:text-muted-foreground/30 font-semibold tracking-wider text-sm sm:text-base uppercase select-none hover:text-muted-foreground/60 dark:hover:text-muted-foreground/50 transition-colors duration-300"
                  >
                    {company}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto"
            >
              {SOCIAL_PROOF_STATS.map((stat) => (
                <SocialProofCounter
                  key={stat.label}
                  icon={stat.icon}
                  target={stat.target}
                  suffix={stat.suffix}
                  label={stat.label}
                  format={stat.format}
                  decimal={stat.decimal}
                />
              ))}
            </motion.div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        </section>

        {/* PLATFORM OVERVIEW */}
        <div className="w-16 h-1 bg-emerald-500 rounded-full mx-auto" />
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
                and unify your team&apos;s communication.
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
                <motion.div key={feature.title} variants={glowCardItem}>
                  <div className="group relative rounded-xl p-[1px] bg-transparent hover:bg-gradient-to-br hover:from-emerald-500/50 hover:to-teal-500/50 transition-all duration-500">
                    <Card className="h-full rounded-[11px] hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5 dark:hover:shadow-emerald-500/10 transition-all duration-300 border-border/50 bg-white dark:bg-slate-900 relative z-10">
                      <CardContent className="p-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                          <feature.icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* AI PLATFORM SECTION */}
        <div className="w-16 h-1 bg-emerald-500 rounded-full mx-auto" />
        <section id="ai" className="py-24 bg-foreground/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="text-center mb-16"
            >
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm font-medium">
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
                <motion.div key={feature.title} variants={glowCardItem}>
                  <div className="group relative rounded-xl p-[1px] bg-transparent hover:bg-gradient-to-br hover:from-emerald-500/40 hover:to-teal-500/40 transition-all duration-500">
                    <Card className="h-full rounded-[11px] hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5 dark:hover:shadow-emerald-500/10 transition-all duration-300 border-border/50 bg-white dark:bg-slate-900 relative z-10">
                      <CardContent className="p-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
                          <feature.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ARCHITECTURE SECTION */}
        <div className="w-16 h-1 bg-emerald-500 rounded-full mx-auto" />
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
                <motion.div key={pillar.title} variants={glowCardItem}>
                  <div className="group relative rounded-xl p-[1px] bg-transparent hover:bg-gradient-to-br hover:from-emerald-500/30 hover:to-amber-500/30 transition-all duration-500">
                    <Card className="h-full rounded-[11px] hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5 dark:hover:shadow-emerald-500/10 transition-all duration-300 border-border/50 bg-white dark:bg-slate-900 relative z-10">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center shrink-0">
                            <pillar.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold mb-1">{pillar.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* INTEGRATIONS SECTION */}
        <div className="w-16 h-1 bg-emerald-500 rounded-full mx-auto" />
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
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{integration.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* STATS SECTION */}
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

        {/* PRICING SECTION */}
        <div className="w-16 h-1 bg-emerald-500 rounded-full mx-auto" />
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
                    <div
                      className="relative rounded-xl p-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"
                      style={{
                        backgroundSize: '200% 200%',
                        animation: 'pricing-border-rotate 4s linear infinite',
                      }}
                    >
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 blur-sm opacity-50" style={{ backgroundSize: '200% 200%', animation: 'pricing-border-rotate 4s linear infinite' }} />
                      <Card className="relative h-full rounded-xl shadow-xl shadow-emerald-500/10 dark:border-border/30 dark:bg-card/50">
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                          <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 px-4 py-1">
                            Most Popular
                          </Badge>
                        </div>
                        <CardContent className="p-8">
                          <h3 className="text-xl font-bold">{tier.name}</h3>
                          <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold tracking-tight">{tier.price}</span>
                            {tier.period && (
                              <span className="text-muted-foreground text-sm">{tier.period}</span>
                            )}
                          </div>
                          <p className="mt-3 text-sm text-muted-foreground">{tier.description}</p>
                          <div className="mt-6 mb-8 space-y-3">
                            {tier.features.map((feature) => (
                              <div key={feature} className="flex items-start gap-3 text-sm">
                                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                          <Button
                            variant={tier.ctaVariant}
                            className="w-full h-11 font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
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
                          <span className="text-4xl font-extrabold tracking-tight">{tier.price}</span>
                          {tier.period && (
                            <span className="text-muted-foreground text-sm">{tier.period}</span>
                          )}
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">{tier.description}</p>
                        <div className="mt-6 mb-8 space-y-3">
                          {tier.features.map((feature) => (
                            <div key={feature} className="flex items-start gap-3 text-sm">
                              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                        <Button variant={tier.ctaVariant} className="w-full h-11 font-semibold">
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

        {/* FEATURE COMPARISON TABLE */}
        <section className="py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="text-center mb-14"
            >
              <Badge
                variant="secondary"
                className="mb-4 px-4 py-1.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              >
                <Trophy className="w-3 h-3 mr-1" /> Feature Comparison
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                How We <span className="gradient-text">Stack Up</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                A side-by-side look at the features that matter most.
              </p>
            </motion.div>
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
            >
              <Card className="overflow-hidden border-border/50">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-4 px-5 font-semibold text-muted-foreground w-[40%]">Feature</th>
                        {COMPARISON_HEADERS.map((h) => (
                          <th
                            key={h.key}
                            className={`text-center py-4 px-3 font-semibold ${
                              h.highlight
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {h.name}
                            {h.highlight && (
                              <Badge className="ml-1.5 text-[9px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-0 px-1.5 py-0">
                                You are here
                              </Badge>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {COMPARISON_FEATURES.map((row, idx) => (
                        <tr
                          key={row.feature}
                          className={`border-b border-border/30 last:border-0 ${idx % 2 === 0 ? 'bg-muted/20' : ''} hover:bg-muted/40 transition-colors`}
                        >
                          <td className="py-3 px-5 font-medium text-sm">{row.feature}</td>
                          {COMPARISON_HEADERS.map((h) => (
                            <td key={h.key} className="text-center py-3 px-3">
                              {row[h.key as keyof typeof row] ? (
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                                    h.highlight
                                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50 dark:bg-red-900/20 text-red-400/60">
                                  <span className="text-xs font-medium">-</span>
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border/50">
                        <td className="py-4 px-5 font-bold">Total Features</td>
                        {COMPARISON_HEADERS.map((h) => {
                          const total = COMPARISON_FEATURES.filter((r) =>
                            r[h.key as keyof typeof r],
                          ).length;
                          return (
                            <td
                              key={h.key}
                              className={`text-center py-4 px-3 font-bold text-lg ${
                                h.highlight
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {total}/{COMPARISON_FEATURES.length}
                            </td>
                          );
                        })}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <div className="w-16 h-1 bg-emerald-500 rounded-full mx-auto" />
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
                  <AccordionItem key={index} value={`faq-${index}`}>
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

        {/* TESTIMONIALS CAROUSEL */}
        <section className="py-24 bg-muted/30 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="text-center mb-14"
            >
              <Badge
                variant="secondary"
                className="mb-4 px-4 py-1.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
              >
                <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" /> Loved by
                Teams Worldwide
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                What Our Customers Say
              </h2>
              <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
                See why enterprises from Fortune 500 to fast-growing startups choose
                ALVISION.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none" />

              <div
                ref={carouselRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory py-4 px-4"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {CAROUSEL_TESTIMONIALS.map((t) => (
                  <div key={t.name} className="snap-center">
                    <TestimonialCard t={t} />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 mt-6">
                {CAROUSEL_TESTIMONIALS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCarouselIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      carouselIndex === idx
                        ? 'bg-emerald-500 w-6'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Go to testimonial ${idx + 1}`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* BOTTOM CTA SECTION */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="relative overflow-hidden rounded-3xl p-12 md:p-16 text-center"
              style={{
                background:
                  'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(20,184,166,0.08) 50%, rgba(16,185,129,0.05) 100%)',
              }}
            >
              <div className="absolute inset-0 -z-0">
                <div className="absolute top-[-20%] right-[-10%] h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
                <div className="absolute bottom-[-20%] left-[-10%] h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
              </div>

              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                  Ready to Transform Your
                  <br className="hidden sm:block" /> Meetings?
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  Join thousands of enterprises already using ALVISION to
                  collaborate smarter and more securely.
                </p>

                <form
                  onSubmit={handleCtaSubmit}
                  className="mt-8 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto"
                >
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="Enter your work email"
                      value={ctaEmail}
                      onChange={(e) => setCtaEmail(e.target.value)}
                      required
                      className="w-full h-12 rounded-xl border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/20"
                  >
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
                <p className="mt-3 text-xs text-muted-foreground/70">
                  No credit card required &bull; Free forever for small teams
                </p>
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
            className="fixed bottom-8 right-8 z-40 w-11 h-11 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center hover:bg-emerald-700 hover:shadow-xl transition-all"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes pricing-border-rotate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <Footer />
    </div>
  );
}
