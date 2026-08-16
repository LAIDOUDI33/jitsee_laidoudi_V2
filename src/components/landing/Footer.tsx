'use client';

import { Github, Twitter, Linkedin, Mail, Heart } from 'lucide-react';

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
  { icon: Github, href: 'https://github.com/LAIDOUDI33/jitsee_laidoudi_V2', label: 'GitHub' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Mail, href: '#', label: 'Email' },
];

function FooterLink({ href, children, badge }: { href: string; children: React.ReactNode; badge?: string }) {
  return (
    <a
      href={href}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
    >
      {children}
      {badge && (
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold leading-none text-primary">
          {badge}
        </span>
      )}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
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
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith('http') ? '_blank' : undefined}
                  rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Platform</h3>
            <ul className="space-y-2.5">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2.5">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href} badge={link.badge}>
                    {link.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © 2024 ALVISION by LAIDOUDI33. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Built with open-source technology.
            <Heart className="h-3 w-3 fill-red-500 text-red-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
