import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JitSee - Secure Video Conferencing by LAIDOUDI33",
  description:
    "JitSee is a secure, open-source video conferencing platform built on Jitsi Meet. Host crystal-clear video meetings, screen sharing, and real-time collaboration — completely free.",
  keywords: [
    "JitSee",
    "video conferencing",
    "video calls",
    "online meetings",
    "screen sharing",
    "Jitsi Meet",
    "WebRTC",
    "secure calls",
    "LAIDOUDI33",
    "open source",
  ],
  authors: [{ name: "LAIDOUDI33" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "JitSee - Secure Video Conferencing",
    description:
      "Crystal-clear video meetings, screen sharing, and real-time collaboration. Free and open source.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JitSee - Secure Video Conferencing",
    description:
      "Crystal-clear video meetings, screen sharing, and real-time collaboration. Free and open source.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
