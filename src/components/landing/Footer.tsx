'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Twitter, Linkedin, Mail, Heart, ArrowUp, Send, CheckCircle2, Youtube, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const platformLinks = [
  { label: 'Video Conferencing', href: '#platform' },
  { label: 'AI Assistant', href: '#ai' },
  { label: 'Team Collaboration', href: '#platform' },
  { label: 'Events & Webinars', href: '#platform' },
  { label: 'Security', href: '#platform' },
  { label: 'API', href: '#architecture' },
];

const resourceLinks = [
  { label: 'Documentation', href: '#' },
  { label: 'API Reference', href: '#' },
  { label: 'Architecture Guide', href: '#architecture' },
  { label: 'Deployment Guide', href: '#' },
  { label: 'Changelog', href: '#' },
  { label: 'Status', href: '#' },
];

const companyLinks = [
  { label: 'About', href: '#' },
  { label: 'Careers', href: '#', badge: 'Hiring!' },
  { label: 'Contact', href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
];

const socialLinks = [
  { icon: Github, href: 'https://github.com/LAIDOUDI33/jitsee_laidoudi_V2', label: 'GitHub', hoverColor: 'hover:bg-zinc-800 hover:text-white dark:hover:bg-zinc-200 dark:hover:text-zinc-900' },
  { icon: Twitter, href: '#', label: 'Twitter', hoverColor: 'hover:bg-sky-500 hover:text-white' },
  { icon: Linkedin, href: '#', label: 'LinkedIn', hoverColor: 'hover:bg-blue-700 hover:text-white' },
  { icon: Youtube, href: '#', label: 'YouTube', hoverColor: 'hover:bg-red-600 hover:text-white' },
  { icon: Mail, href: '#', label: 'Email', hoverColor: 'hover:bg-amber-500 hover:text-white' },
  { icon: Globe, href: '#', label: 'Website', hoverColor: 'hover:bg-violet-500 hover:text-white' },
];

const footerColumns = [
  { title: 'Platform', links: platformLinks },
  { title: 'Resources', links: resourceLinks },
  { title: 'Company', links: companyLinks },
];

function FooterLink({ href, children, badge }: { href: string; children: React.ReactNode; badge?: string }) {
  return (
    <a
      href={href}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-2 group"
    >
      <span className="group-hover:translate-x-0.5 transition-transform duration-200">{children}</span>
      {badge && (
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold leading-none text-primary animate-pulse">
          {badge}
        </span>
      )}
    </a>
  );
}

export default function Footer() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [emailError, setEmailError] = useState('');

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubscribe = () => {
    if (!email) {
      setEmailError('Please enter your email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email');
      return;
    }
    setEmailError('');
    setSubscribed(true);
    toast.success('Subscribed to newsletter!');
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Newsletter & Platform Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8 border-b">
          {/* Newsletter signup */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4 }}
          >
            <h3 className="text-sm font-semibold text-foreground mb-1.5">Stay Updated</h3>
            <p className="text-xs text-muted-foreground mb-3">Get the latest news, updates, and tips delivered to your inbox.</p>
            <div className="flex gap-2 max-w-sm">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="you@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                  className={`pl-9 h-9 focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${emailError ? 'border-red-300 focus-visible:ring-red-500/20' : ''}`}
                />
              </div>
              <motion.div whileTap={{ scale: 0.96 }}>
                <Button
                  onClick={handleSubscribe}
                  className="gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform shrink-0"
                  disabled={subscribed}
                >
                  {subscribed ? (
                    <><CheckCircle2 className="h-4 w-4" /> Done</>
                  ) : (
                    <><Send className="h-4 w-4" /> Subscribe</>
                  )}
                </Button>
              </motion.div>
            </div>
            <AnimatePresence>
              {emailError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-xs text-destructive mt-1.5"
                >
                  {emailError}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Platform Status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col items-start md:items-end justify-center"
          >
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">Platform Status</h3>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-sm text-emerald-600 font-medium">All Systems Operational</span>
              </div>
              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-500/10">
                99.98% Uptime
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Last incident: 14 days ago ·{' '}
              <a href="#" className="underline hover:text-foreground transition-colors">View status page →</a>
            </p>
          </motion.div>
        </div>

        {/* Main footer grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-10">
          {/* Brand column */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="sm:col-span-2 lg:col-span-1"
          >
            <a href="#" className="flex items-center gap-2.5 mb-4" onClick={(e) => e.preventDefault()}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
              >
                <defs>
                  <linearGradient id="footer-logo-grad" x1="0" y1="0" x2="36" y2="36">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
                <rect width="36" height="36" rx="8" fill="url(#footer-logo-grad)" />
                <path
                  d="M12 12.5C12 11.1193 13.1193 10 14.5 10H21.5C22.8807 10 24 11.1193 24 12.5V19.5C24 20.8807 22.8807 22 21.5 22H20L16 26V22H14.5C13.1193 22 12 20.8807 12 19.5V12.5Z"
                  fill="white"
                  fillOpacity="0.95"
                />
                <circle cx="17" cy="16" r="1.2" fill="#4F46E5" />
                <circle cx="20" cy="16" r="1.2" fill="#4F46E5" />
              </svg>
              <span className="font-bold text-lg bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                ALVISION
              </span>
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Enterprise AI Video Conferencing & Collaboration Platform. Built by LAIDOUDI33 on open-source WebRTC technology.
            </p>
            {/* Social icons row with staggered entrance and hover effects */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social, i) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith('http') ? '_blank' : undefined}
                  rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-all duration-200 hover:scale-110 hover:shadow-md ${social.hoverColor}`}
                  aria-label={social.label}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Link columns with staggered entrance */}
          {footerColumns.map((col, colIdx) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: 0.1 + colIdx * 0.08 }}
            >
              <h3 className="text-sm font-semibold text-foreground mb-4">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link, linkIdx) => (
                  <motion.li
                    key={link.label}
                    initial={{ opacity: 0, x: -5 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + colIdx * 0.08 + linkIdx * 0.04, duration: 0.25 }}
                  >
                    <FooterLink href={link.href} badge={link.badge}>
                      {link.label}
                    </FooterLink>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="border-t py-6 flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © 2024 ALVISION by LAIDOUDI33. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Built with open-source technology.
              <Heart className="h-3 w-3 fill-red-500 text-red-500" />
            </p>
          </div>
        </motion.div>
      </div>

      {/* Back to top button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
            aria-label="Back to top"
          >
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
}
