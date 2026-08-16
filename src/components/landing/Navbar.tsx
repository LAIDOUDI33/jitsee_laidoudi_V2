'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Github, Menu, X, Bell, Video } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';

const navLinks = [
  { label: 'Platform', href: '#platform' },
  { label: 'AI', href: '#ai' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

function useIsHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollOpacity, setScrollOpacity] = useState(0);
  const [activeSection, setActiveSection] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const isHydrated = useIsHydrated();
  const { setCurrentView } = useAppStore();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
      setScrollOpacity(isScrolled ? 1 : 0);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAnchorClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'backdrop-blur-md'
            : 'bg-transparent'
        }`}
        style={{
          backgroundColor: `rgba(var(--background-rgb, 255,255,255), ${scrollOpacity * 0.8})`,
        }}
      >
        {/* Subtle bottom border glow on scroll */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px transition-opacity duration-500"
          style={{
            opacity: scrollOpacity,
            background: `linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.3) 20%, hsl(var(--primary) / 0.5) 50%, hsl(var(--primary) / 0.3) 80%, transparent 100%)`,
            boxShadow: `0 1px 12px hsl(var(--primary) / ${scrollOpacity * 0.15})`,
          }}
        />

        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5" onClick={(e) => e.preventDefault()}>
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="36" y2="36">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>
              <rect width="36" height="36" rx="8" fill="url(#logo-grad)" />
              <path
                d="M12 12.5C12 11.1193 13.1193 10 14.5 10H21.5C22.8807 10 24 11.1193 24 12.5V19.5C24 20.8807 22.8807 22 21.5 22H20L16 26V22H14.5C13.1193 22 12 20.8807 12 19.5V12.5Z"
                fill="white"
                fillOpacity="0.95"
              />
              <circle cx="17" cy="16" r="1.2" fill="#4F46E5" />
              <circle cx="20" cy="16" r="1.2" fill="#4F46E5" />
            </svg>
            <span className="font-bold text-xl bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              ALVISION
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className={`relative px-3 py-2 text-sm font-medium transition-colors rounded-md hover:text-foreground ${
                  activeSection === link.href.slice(1)
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {link.label}
                {activeSection === link.href.slice(1) && (
                  <motion.span
                    layoutId="navbar-active"
                    className="absolute inset-0 rounded-md bg-primary/10"
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
                  />
                )}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            {isHydrated && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
                className="hover:scale-[1.1] active:scale-[0.95] transition-transform"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}

            {/* Notification bell with red dot badge */}
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:scale-[1.1] active:scale-[0.95] transition-transform"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-background">
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping" />
              </span>
            </Button>

            {/* Start Meeting CTA */}
            <Button
              size="sm"
              onClick={() => setCurrentView('meeting-room')}
              className="gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md shadow-emerald-500/20"
            >
              <Video className="h-4 w-4" />
              Start Meeting
            </Button>

            <Button variant="ghost" size="icon" asChild>
              <a
                href="https://github.com/LAIDOUDI33/jitsee_laidoudi_V2"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="hover:scale-[1.1] active:scale-[0.95] transition-transform"
              >
                <Github className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentView('login')} className="hover:scale-[1.02] active:scale-[0.98] transition-transform">
              Sign In
            </Button>
            <Button size="sm" onClick={() => setCurrentView('register')} className="relative hover:scale-[1.02] active:scale-[0.98] transition-transform">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
              Get Started
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            {isHydrated && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
              <AnimatePresence mode="wait">
                {mobileOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="h-5 w-5" /></motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="h-5 w-5" /></motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </nav>
      </header>

      {/* Mobile menu - slide-in from right with backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={closeMobile}
            />
            {/* Slide-in panel from right */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[280px] bg-background border-l shadow-2xl md:hidden overflow-y-auto"
            >
              <div className="flex flex-col h-full">
                {/* Mobile menu header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <span className="font-bold text-lg bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                    ALVISION
                  </span>
                  <Button variant="ghost" size="icon" onClick={closeMobile} className="hover:scale-[1.1] active:scale-[0.95] transition-transform">
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Nav links */}
                <div className="flex flex-col gap-1 p-4">
                  {navLinks.map((link, i) => (
                    <motion.a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => handleAnchorClick(e, link.href)}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.05, duration: 0.2 }}
                      className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        activeSection === link.href.slice(1)
                          ? 'bg-primary/10 text-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {link.label}
                    </motion.a>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="mt-auto flex flex-col gap-2 p-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border-emerald-200/50 hover:from-emerald-500/20 hover:to-emerald-500/10"
                    onClick={() => { setCurrentView('meeting-room'); closeMobile(); }}
                  >
                    <Video className="h-4 w-4 text-emerald-600" />
                    <span className='text-emerald-600'>Start Meeting</span>
                  </Button>
                  <Button variant="outline" className="w-full hover:scale-[1.02] active:scale-[0.98] transition-transform" onClick={() => { setCurrentView('login'); closeMobile(); }}>
                    Sign In
                  </Button>
                  <Button className="w-full hover:scale-[1.02] active:scale-[0.98] transition-transform" onClick={() => { setCurrentView('register'); closeMobile(); }}>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                    Get Started
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
