'use client'

import { Video, MessageSquare, Users, FileText, Shield, CheckCheck } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore, NotificationItem } from '@/store/app-store'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const iconMap: Record<NotificationItem['icon'], React.ReactNode> = {
  video: <Video className='h-4 w-4 text-blue-500 dark:text-blue-400' />,
  message: <MessageSquare className='h-4 w-4 text-emerald-500 dark:text-emerald-400' />,
  users: <Users className='h-4 w-4 text-violet-500 dark:text-violet-400' />,
  file: <FileText className='h-4 w-4 text-amber-500 dark:text-amber-400' />,
  shield: <Shield className='h-4 w-4 text-rose-500 dark:text-rose-400' />,
}

const iconBgMap: Record<NotificationItem['icon'], string> = {
  video: 'bg-blue-100 dark:bg-blue-950/50',
  message: 'bg-emerald-100 dark:bg-emerald-950/50',
  users: 'bg-violet-100 dark:bg-violet-950/50',
  file: 'bg-amber-100 dark:bg-amber-950/50',
  shield: 'bg-rose-100 dark:bg-rose-950/50',
}

export default function NotificationDropdown() {
  const { notifications, notificationCount, markNotificationRead, markAllNotificationsRead } = useAppStore()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon' className='relative h-9 w-9 rounded-lg transition-all duration-200 hover:bg-muted'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='18'
            height='18'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='text-muted-foreground'
          >
            <path d='M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' />
            <path d='M10.3 21a1.94 1.94 0 0 0 3.4 0' />
          </svg>
          {notificationCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className='absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white'
            >
              {notificationCount > 9 ? '9+' : notificationCount}
              <motion.span
                className='absolute inset-0 rounded-full bg-red-500'
                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' as const }}
              />
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-[380px] p-0 rounded-xl shadow-lg border border-border/50 bg-card'>
        {/* Header */}
        <div className='flex items-center justify-between px-4 py-3 border-b border-border/50'>
          <h3 className='text-sm font-semibold text-foreground'>Notifications</h3>
          {notificationCount > 0 && (
            <Button
              variant='ghost'
              size='sm'
              onClick={markAllNotificationsRead}
              className='h-7 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors'
            >
              <CheckCheck className='h-3.5 w-3.5 mr-1.5' />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notification list */}
        <ScrollArea className='max-h-[360px]'>
          <div className='p-2'>
            {notifications.map((notification, index) => (
              <motion.button
                key={notification.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.2 }}
                onClick={() => markNotificationRead(notification.id)}
                className={cn(
                  'w-full flex items-start gap-3 rounded-lg p-3 text-left transition-all duration-200 group',
                  'hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent hover:shadow-sm',
                  notification.unread && 'bg-primary/5 dark:bg-primary/10'
                )}
              >
                {/* Icon */}
                <div className={cn('shrink-0 h-8 w-8 rounded-lg flex items-center justify-center mt-0.5', iconBgMap[notification.icon])}>
                  {iconMap[notification.icon]}
                </div>

                {/* Content */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2'>
                    <p className={cn('text-sm truncate', notification.unread ? 'font-semibold text-foreground' : 'font-medium text-foreground')}>{notification.title}</p>
                    {notification.unread && (
                      <span className='shrink-0 h-2 w-2 rounded-full bg-blue-500' />
                    )}
                  </div>
                  <p className='text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed'>{notification.description}</p>
                  <p className='text-[11px] text-muted-foreground/60 mt-1'>{notification.time}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className='border-t border-border/50 px-4 py-2.5'>
          <Button
            variant='ghost'
            className='w-full h-8 text-xs text-muted-foreground hover:text-foreground transition-colors'
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
