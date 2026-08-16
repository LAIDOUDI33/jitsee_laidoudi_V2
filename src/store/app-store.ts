import { create } from 'zustand'

export type AppView = 
  | 'landing' 
  | 'login' 
  | 'register' 
  | 'forgot-password'
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
  | 'admin'
  | 'admin-users'
  | 'admin-orgs'
  | 'admin-security'
  | 'admin-audit'
  | 'admin-system'
  | 'settings'
  | 'profile'

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
  
  // Meeting
  currentMeetingId: string | null
  setCurrentMeetingId: (id: string | null) => void
  meetingTitle: string
  setMeetingTitle: (title: string) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  meetingSidebarTab: 'chat' | 'participants' | 'ai' | 'polls'
  setMeetingSidebarTab: (tab: 'chat' | 'participants' | 'ai' | 'polls') => void
  
  // Notifications
  notificationCount: number
  setNotificationCount: (count: number) => void
}

export const useAppStore = create<AppState>((set, get) => ({
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
}))
