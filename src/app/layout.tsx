import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from 'next-themes'
import Providers from '@/components/Providers'
import ErrorBoundary from '@/components/ErrorBoundary'

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <Providers>
          <ThemeProvider attribute='class' defaultTheme='light' enableSystem disableTransitionOnChange>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
