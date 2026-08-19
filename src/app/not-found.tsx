'use client'

import { motion } from 'framer-motion'
import { Activity, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md flex flex-col items-center text-center gap-6"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25"
        >
          <Activity className="w-8 h-8 text-white" />
        </motion.div>

        {/* 404 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <h1 className="text-7xl font-bold text-emerald-500">404</h1>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="space-y-2"
        >
          <h2 className="text-xl font-semibold text-foreground">Page Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 w-full"
        >
          <Button
            onClick={() => (window.location.href = '/')}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
