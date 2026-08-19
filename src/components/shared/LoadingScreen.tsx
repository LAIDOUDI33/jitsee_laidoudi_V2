'use client'

import { Activity } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5">
        {/* ALVISION logo — Activity icon in emerald gradient circle */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 animate-pulse">
          <Activity className="w-10 h-10 text-white" />
        </div>

        {/* Brand name */}
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            ALVISION
          </h1>
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading...
          </p>
        </div>

        {/* Subtle animated bar */}
        <div className="w-48 h-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 animate-[loading-slide_1.5s_ease-in-out_infinite]" />
        </div>
      </div>

      <style>{`
        @keyframes loading-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  )
}
