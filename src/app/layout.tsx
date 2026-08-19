import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from 'next-themes'
import Providers from '@/components/Providers'
import ErrorBoundary from '@/components/ErrorBoundary'
import PerformanceMonitor from '@/components/shared/PerformanceMonitor'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ALVISION — Enterprise AI Video Conferencing & Collaboration',
  description: 'ALVISION is a production-grade enterprise AI video conferencing and collaboration platform. HD video, AI transcription, translation, meeting summaries, real-time chat, and more.',
  keywords: ['ALVISION', 'video conferencing', 'enterprise', 'AI', 'WebRTC', 'collaboration', 'meeting', 'transcription', 'Jitsi Meet'],
  authors: [{ name: 'LAIDOUDI33' }],
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <link rel='manifest' href='/manifest.json' />
        <link rel='icon' href='/favicon.svg' type='image/svg+xml' />
        <link rel='apple-touch-icon' href='/icons/icon-192.svg' />
        <meta name='theme-color' content='#10b981' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='black-translucent' />
        <meta name='apple-mobile-web-app-title' content='ALVISION' />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <Providers>
          <ThemeProvider attribute='class' defaultTheme='light' enableSystem disableTransitionOnChange>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <PerformanceMonitor />
            <Toaster />
          </ThemeProvider>
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
