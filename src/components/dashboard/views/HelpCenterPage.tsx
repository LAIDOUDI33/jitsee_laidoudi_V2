'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Command, ArrowRight, BookOpen, Video, Brain, Shield, Users, Code2,
  MessageCircle, Mail, Globe, Clock, Bookmark, Loader2, Send, HelpCircle,
  RotateCcw,
} from 'lucide-react'

const anim = {
  c: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } },
  i: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } } },
}

const quickLinks = [
  { title: 'Getting Started', icon: <BookOpen className='h-5 w-5' />, gradient: 'from-emerald-500/15 to-teal-500/15 text-emerald-600', desc: 'Set up your workspace and join your first meeting in minutes.' },
  { title: 'Meeting Guide', icon: <Video className='h-5 w-5' />, gradient: 'from-cyan-500/15 to-teal-500/15 text-cyan-600', desc: 'Schedule, host, and manage meetings like a pro.' },
  { title: 'AI Features', icon: <Brain className='h-5 w-5' />, gradient: 'from-violet-500/15 to-purple-500/15 text-violet-600', desc: 'Explore AI summaries, transcription, and smart assistant.' },
  { title: 'Account & Security', icon: <Shield className='h-5 w-5' />, gradient: 'from-amber-500/15 to-orange-500/15 text-amber-600', desc: 'Manage your profile, SSO, and security preferences.' },
  { title: 'Admin Guide', icon: <Users className='h-5 w-5' />, gradient: 'from-rose-500/15 to-pink-500/15 text-rose-600', desc: 'Organization management, billing, and user administration.' },
  { title: 'API Reference', icon: <Code2 className='h-5 w-5' />, gradient: 'from-teal-500/15 to-emerald-500/15 text-teal-600', desc: 'REST API docs, SDKs, and webhook integration guides.' },
]

const faqCategories = [
  { category: 'General', questions: [
    { q: 'What is ALVISION and who is it for?', a: 'ALVISION is an enterprise-grade AI video conferencing platform for teams of all sizes, combining HD video, real-time collaboration, and AI-powered transcription and summaries.' },
    { q: 'What browsers are supported?', a: 'Latest Chrome, Firefox, Safari, and Edge. Chromium-based browsers (Chrome or Edge) are recommended for the best AI feature experience.' },
    { q: 'Is there a mobile app available?', a: 'Yes, ALVISION is fully responsive on mobile browsers. Native iOS and Android apps are available with offline meeting notes support.' },
  ]},
  { category: 'Meetings', questions: [
    { q: 'How many participants can join a meeting?', a: 'Free plans support 25 participants. Pro plans allow 100, Enterprise up to 500 with moderator controls and breakout rooms.' },
    { q: 'Can I record meetings?', a: 'Yes, on Pro and Enterprise plans. Recordings are cloud-stored with automatic AI transcription and searchable transcripts.' },
    { q: 'How do I schedule a recurring meeting?', a: 'Use the Calendar view or Meeting Scheduler. Choose daily, weekly, or monthly intervals with custom end dates and participant management.' },
  ]},
  { category: 'AI & Transcription', questions: [
    { q: 'How accurate is the AI transcription?', a: '95-98% accuracy for clear English audio. May vary with accents, jargon, or background noise. Transcripts are editable after meetings.' },
    { q: 'What languages are supported for AI features?', a: 'English, Spanish, French, German, Japanese, and Mandarin Chinese. Additional languages are on the roadmap.' },
    { q: 'Is my meeting data used to train AI models?', a: 'No. All meeting data is processed on-demand, never stored or used for model training. Data is encrypted at rest and in transit.' },
  ]},
  { category: 'Enterprise', questions: [
    { q: 'Do you offer SSO and SCIM provisioning?', a: 'Yes, Enterprise plans include SAML 2.0 SSO, SCIM provisioning, and integration with Okta, Azure AD, and Google Workspace.' },
    { q: 'What is the uptime SLA for Enterprise?', a: '99.99% uptime SLA with service credits if targets are missed. Our status page provides real-time monitoring.' },
    { q: 'Can we deploy ALVISION on-premises?', a: 'Yes. Full air-gapped installation, dedicated support, and custom integration assistance for Enterprise customers.' },
  ]},
]

const articles = [
  { title: 'How to Set Up Your First Meeting', category: 'Getting Started', cc: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', t: '3 min' },
  { title: 'Using AI Summaries to Save Time', category: 'AI Features', cc: 'bg-violet-500/10 text-violet-600 border-violet-500/20', t: '5 min' },
  { title: 'Configuring SSO with Azure AD', category: 'Enterprise', cc: 'bg-rose-500/10 text-rose-600 border-rose-500/20', t: '7 min' },
  { title: 'Recording and Transcription Best Practices', category: 'Meetings', cc: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20', t: '6 min' },
]

const channels = [
  { title: 'Live Chat', icon: <MessageCircle className='h-5 w-5' />, color: 'bg-emerald-500/10 text-emerald-600', border: 'border-emerald-500/20', btn: 'bg-emerald-600 hover:bg-emerald-700 text-white', desc: 'Connect with support in real-time for immediate assistance.', cta: 'Start Chat' },
  { title: 'Email Support', icon: <Mail className='h-5 w-5' />, color: 'bg-teal-500/10 text-teal-600', border: 'border-teal-500/20', btn: 'border-teal-500/30 text-teal-600 hover:bg-teal-500/10', desc: "Send a detailed message, we'll respond within 4 business hours.", cta: 'Send Email' },
  { title: 'Community Forum', icon: <Globe className='h-5 w-5' />, color: 'bg-purple-500/10 text-purple-600', border: 'border-purple-500/20', btn: 'border-purple-500/30 text-purple-600 hover:bg-purple-500/10', desc: 'Join discussions, share tips, and find solutions from other users.', cta: 'Visit Forum' },
]

const priorities: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20' },
  medium: { label: 'Medium', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  high: { label: 'High', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  urgent: { label: 'Urgent', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
}

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set())
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const toggleBookmark = (idx: number) => {
    setBookmarked(prev => {
      const next = new Set(prev)
      if (next.has(idx)) { next.delete(idx); toast.info('Bookmark removed') }
      else { next.add(idx); toast.success('Article bookmarked') }
      return next
    })
  }

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !category || !priority || !description.trim()) {
      toast.error('Please fill in all required fields'); return
    }
    setSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSubmitting(false)
    toast.success('Support ticket submitted successfully! We\'ll get back to you soon.')
    setSubject(''); setCategory(''); setPriority(''); setDescription('')
  }

  return (
    <motion.div className='space-y-6' variants={anim.c} initial='hidden' animate='show'>
      <div className='h-1 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500' />

      {/* Header */}
      <motion.div variants={anim.i} className='flex items-center gap-3'>
        <HelpCircle className='h-6 w-6 text-primary' />
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Help Center</h1>
          <p className='text-sm text-muted-foreground'>Find answers, explore guides, and get support</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={anim.i} className='relative max-w-2xl'>
        <Command className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60' />
        <Input placeholder='Search articles, FAQs, and guides...' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className='pl-10 pr-4 h-11 bg-card/80 backdrop-blur border-border/50 text-sm rounded-xl' />
      </motion.div>

      {/* Quick Links */}
      <motion.div variants={anim.i} className='flex items-center justify-between'>
        <h2 className='text-base font-semibold mb-0'>Quick Links</h2>
        <Button
          variant='outline'
          size='sm'
          data-tour='restart-tour'
          onClick={() => window.dispatchEvent(new Event('start-alvision-tour'))}
          className='text-xs gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700'
        >
          <RotateCcw className='h-3.5 w-3.5' />
          Restart Tour
        </Button>
      </motion.div>
      <motion.div variants={anim.i}>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {quickLinks.map((link) => (
            <motion.div key={link.title} variants={anim.i}>
              <Card className='bg-card/80 backdrop-blur border border-border/50 rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer group'>
                <CardContent className='p-5'>
                  <div className='flex items-start gap-4'>
                    <div className={`p-2.5 rounded-lg bg-gradient-to-br ${link.gradient} shrink-0`}>{link.icon}</div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between gap-2'>
                        <h3 className='text-sm font-semibold group-hover:text-primary transition-colors'>{link.title}</h3>
                        <ArrowRight className='h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300 shrink-0' />
                      </div>
                      <p className='text-xs text-muted-foreground mt-1 leading-relaxed'>{link.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div variants={anim.i}>
        <h2 className='text-base font-semibold mb-3'>Frequently Asked Questions</h2>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {faqCategories.map((cat) => (
            <Card key={cat.category} className='bg-card/80 backdrop-blur border border-border/50 rounded-xl hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden relative'>
              <div className='absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/60 to-teal-400/60' />
              <CardHeader className='pb-3 pt-4 px-5'><CardTitle className='text-sm font-semibold'>{cat.category}</CardTitle></CardHeader>
              <CardContent className='px-5 pb-5 pt-0'>
                <Accordion type='single' collapsible className='w-full'>
                  {cat.questions.map((faq, i) => (
                    <AccordionItem key={i} value={`${cat.category}-${i}`} className='border-b-0 border-t first:border-t-0 border-border/40'>
                      <AccordionTrigger className='text-xs font-medium py-3 hover:no-underline text-left'>{faq.q}</AccordionTrigger>
                      <AccordionContent className='pb-3'><p className='text-xs text-muted-foreground leading-relaxed'>{faq.a}</p></AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Popular Articles */}
      <motion.div variants={anim.i}>
        <div className='flex items-center justify-between mb-3'>
          <h2 className='text-base font-semibold'>Popular Articles</h2>
          <Button variant='ghost' size='sm' className='text-xs text-muted-foreground hover:text-foreground'>View all <ArrowRight className='ml-1.5 h-3 w-3' /></Button>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {articles.map((a, idx) => (
            <motion.div key={a.title} variants={anim.i}>
              <Card className='bg-card/80 backdrop-blur border border-border/50 rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer group h-full overflow-hidden relative'>
                <div className='absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/50 to-teal-400/50' />
                <CardContent className='p-4 flex flex-col h-full'>
                  <Badge variant='outline' className={`self-start text-[10px] mb-3 ${a.cc}`}>{a.category}</Badge>
                  <h3 className='text-sm font-medium group-hover:text-primary transition-colors leading-snug flex-1'>{a.title}</h3>
                  <div className='flex items-center justify-between mt-3 pt-3 border-t border-border/40'>
                    <span className='flex items-center gap-1 text-[11px] text-muted-foreground'><Clock className='h-3 w-3' />{a.t}</span>
                    <span className='text-[11px] text-muted-foreground/60'>Recently updated</span>
                    <button onClick={(e) => { e.stopPropagation(); toggleBookmark(idx) }} className='p-1 rounded-md hover:bg-muted transition-colors'>
                      <Bookmark className={`h-3.5 w-3.5 transition-colors ${bookmarked.has(idx) ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/50'}`} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Contact Support */}
      <motion.div variants={anim.i}>
        <h2 className='text-base font-semibold mb-3'>Contact Support</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {channels.map((ch) => (
            <motion.div key={ch.title} variants={anim.i}>
              <Card className={`bg-card/80 backdrop-blur border ${ch.border} rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full overflow-hidden relative`}>
                <CardContent className='p-5 flex flex-col items-center text-center h-full'>
                  <div className={`p-3 rounded-xl ${ch.color} mb-3`}>{ch.icon}</div>
                  <h3 className='text-sm font-semibold'>{ch.title}</h3>
                  <p className='text-xs text-muted-foreground mt-1.5 leading-relaxed flex-1'>{ch.desc}</p>
                  <Button variant='outline' size='sm' className={`mt-4 text-xs ${ch.btn}`}>{ch.cta} <ArrowRight className='ml-1.5 h-3 w-3' /></Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Ticket Form */}
      <motion.div variants={anim.i}>
        <Card className='bg-card/80 backdrop-blur border border-border/50 rounded-xl hover:shadow-lg hover:shadow-primary/5 transition-all duration-300'>
          <CardHeader className='pb-3 pt-5 px-6'>
            <div className='flex items-center gap-2'><Send className='h-5 w-5 text-primary' /><CardTitle className='text-base font-semibold'>Submit a Support Ticket</CardTitle></div>
            <p className='text-xs text-muted-foreground mt-1'>Can&apos;t find what you need? Our team will respond within 24 hours.</p>
          </CardHeader>
          <CardContent className='px-6 pb-6 pt-0 space-y-4'>
            <div className='space-y-1.5'><Label className='text-xs font-medium'>Subject</Label><Input placeholder='Brief description of your issue' value={subject} onChange={(e) => setSubject(e.target.value)} className='h-9 text-sm' /></div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-1.5'><Label className='text-xs font-medium'>Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger className='h-9 text-sm'><SelectValue placeholder='Select category' /></SelectTrigger><SelectContent><SelectItem value='technical'>Technical Issue</SelectItem><SelectItem value='billing'>Billing</SelectItem><SelectItem value='feature'>Feature Request</SelectItem><SelectItem value='account'>Account</SelectItem><SelectItem value='other'>Other</SelectItem></SelectContent></Select></div>
              <div className='space-y-1.5'><Label className='text-xs font-medium'>Priority</Label><Select value={priority} onValueChange={setPriority}><SelectTrigger className='h-9 text-sm'><SelectValue placeholder='Select priority' /></SelectTrigger><SelectContent>{Object.entries(priorities).map(([key, cfg]) => (<SelectItem key={key} value={key}><span className='flex items-center gap-2'><span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${cfg.color}`}>{cfg.label}</span></span></SelectItem>))}</SelectContent></Select></div>
            </div>
            <div className='space-y-1.5'><Label className='text-xs font-medium'>Description</Label><Textarea placeholder='Describe your issue in detail...' value={description} onChange={(e) => setDescription(e.target.value)} className='min-h-[100px] text-sm' /></div>
            <div className='flex justify-end'><Button onClick={handleSubmitTicket} disabled={submitting} className='text-sm gap-2'>{submitting ? <><Loader2 className='h-4 w-4 animate-spin' /> Submitting...</> : <><Send className='h-4 w-4' /> Submit Ticket</>}</Button></div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
