import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type AppView = 
  | 'landing' 
  | 'login' 
  | 'register' 
  | 'forgot-password'
  | 'search'
  | 'dashboard' 
  | 'meeting-room'
  | 'meetings' 
  | 'teams' 
  | 'chat' 
  | 'files' 
  | 'recordings'
  | 'ai-assistant'
  | 'knowledge'
  | 'calendar'
  | 'events'
  | 'whiteboard'
  | 'analytics'
  | 'status'
  | 'people'
  | 'integrations'
  | 'admin'
  | 'admin-users'
  | 'admin-orgs'
  | 'admin-security'
  | 'admin-audit'
  | 'admin-system'
  | 'settings'
  | 'profile'
  | 'help-center'
  | 'webhooks'
  | 'templates'
  | 'notifications'
  | 'breakout-rooms'
  | 'participants'
  | 'meeting-notes'
  | 'session-history'

export interface NotificationItem {
  id: string
  icon: 'video' | 'message' | 'users' | 'file' | 'shield'
  title: string
  description: string
  time: string
  unread: boolean
}

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  organizationId?: string
  organizationName?: string
}

interface AppState {
  // Navigation
  currentView: AppView
  setCurrentView: (view: AppView) => void
  previousView: AppView | null
  navigateBack: () => void
  
  // Auth
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
  setTokens: (accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  
  // Meeting
  currentMeetingId: string | null
  setCurrentMeetingId: (id: string | null) => void
  meetingTitle: string
  setMeetingTitle: (title: string) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  meetingSidebarTab: 'chat' | 'participants' | 'ai' | 'polls' | 'breakout'
  setMeetingSidebarTab: (tab: 'chat' | 'participants' | 'ai' | 'polls' | 'breakout') => void
  
  // Notifications
  notificationCount: number
  setNotificationCount: (count: number) => void
  notifications: NotificationItem[]
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  addNotification: (notification: NotificationItem) => void

  // Search
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
}

const defaultNotifications: NotificationItem[] = [
  {
    id: 'n1',
    icon: 'video',
    title: 'Meeting starting soon',
    description: 'Sprint Planning with Engineering team starts in 5 minutes',
    time: '2m ago',
    unread: true,
  },
  {
    id: 'n2',
    icon: 'message',
    title: 'New message in #design',
    description: 'Sarah Chen: Updated the mockups for the new dashboard',
    time: '15m ago',
    unread: true,
  },
  {
    id: 'n3',
    icon: 'users',
    title: 'Team member joined',
    description: 'Alex Rivera has joined the Product team',
    time: '1h ago',
    unread: true,
  },
  {
    id: 'n4',
    icon: 'file',
    title: 'Recording ready',
    description: 'AI summary for Q4 Review meeting is now available',
    time: '3h ago',
    unread: false,
  },
  {
    id: 'n5',
    icon: 'shield',
    title: 'Security alert resolved',
    description: 'Unusual login attempt from new device has been verified',
    time: '1d ago',
    unread: false,
  },
]

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentView: 'landing',
      setCurrentView: (view) => set({ previousView: get().currentView, currentView: view }),
      previousView: null,
      navigateBack: () => {
        const prev = get().previousView
        if (prev) set({ currentView: prev, previousView: null })
      },
      
      user: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      isAuthenticated: false,
      // Tokens are stored ONLY in localStorage (single source of truth).
      // api.ts reads/writes them directly; this helper is kept for the login flow.
      setTokens: (accessToken, refreshToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('alvision_access_token', accessToken)
          localStorage.setItem('alvision_refresh_token', refreshToken)
        }
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('alvision_access_token')
          localStorage.removeItem('alvision_refresh_token')
        }
        set({ user: null, isAuthenticated: false })
      },
      
      currentMeetingId: null,
      setCurrentMeetingId: (id) => set({ currentMeetingId: id }),
      meetingTitle: '',
      setMeetingTitle: (title) => set({ meetingTitle: title }),
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      meetingSidebarTab: 'chat',
      setMeetingSidebarTab: (tab) => set({ meetingSidebarTab: tab }),
      
      notificationCount: 3,
      setNotificationCount: (count) => set({ notificationCount: count }),
      notifications: defaultNotifications,
      markNotificationRead: (id) => {
        const notifications = get().notifications.map(n =>
          n.id === id ? { ...n, unread: false } : n
        )
        const unreadCount = notifications.filter(n => n.unread).length
        set({ notifications, notificationCount: unreadCount })
      },
      markAllNotificationsRead: () => {
        const notifications = get().notifications.map(n => ({ ...n, unread: false }))
        set({ notifications, notificationCount: 0 })
      },
      addNotification: (notification) => {
        const notifications = [notification, ...get().notifications]
        const unreadCount = notifications.filter(n => n.unread).length
        set({ notifications, notificationCount: unreadCount })
      },

      searchOpen: false,
      setSearchOpen: (open) => set({ searchOpen: open }),
    }),
    {
      name: 'alvision-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
