# Task 7: Dashboard Layout & Shared Components Upgrade

## Files Modified
1. **src/store/app-store.ts** — Added `NotificationItem` interface, notifications array state, `markNotificationRead`, `markAllNotificationsRead`, `addNotification` actions, `searchOpen` boolean state, `setSearchOpen` action, and `'search'` to `AppView` union type.

2. **src/components/dashboard/DashboardLayout.tsx** — Major upgrade:
   - Search bar with Cmd+K shortcut hint in topbar (triggers SearchCommand dialog)
   - NotificationDropdown replacing static bell icon
   - QuickStartMeeting button in topbar
   - User avatar DropdownMenu (Profile, Settings, Help, Sign Out)
   - Sidebar nav items: gradient hover backgrounds, spring-animated active indicator (layoutId), translateX on active label
   - Online status green dot next to user avatar (sidebar + topbar)
   - Reduced topbar height from h-16 to h-14, added backdrop-blur

3. **src/components/shared/NotificationDropdown.tsx** — New component:
   - Popover-based dropdown with 5 mock notifications
   - Each notification: colored icon (video/message/users/file/shield), title, description, time, unread blue dot
   - "Mark all as read" button with CheckCheck icon
   - Pulse animation on notification count badge
   - Hover gradient effect per notification item
   - "View all notifications" footer link
   - Full dark mode support

4. **src/components/shared/SearchCommand.tsx** — New component:
   - CommandDialog (cmdk) triggered by Cmd+K global shortcut
   - Three groups: Quick Actions (4 items), Pages (12 items), Recent (3 mock items)
   - Keyboard shortcut hints on quick actions
   - Real-time filtering via cmdk built-in search
   - Selecting an item navigates via setCurrentView and closes dialog

5. **src/components/shared/QuickStartMeeting.tsx** — New component:
   - Button that POSTs to /api/v1/meetings to create instant meeting
   - Loading spinner state, success toast, error toast
   - Navigates to meeting-room view on success
   - Scale micro-interaction on hover/active

## Key Design Decisions
- Reused existing shadcn/ui components (Popover, Command, DropdownMenu, Dialog) — no custom primitives
- Notification data lives in Zustand store for consistency across components
- SearchCommand uses CommandDialog pattern which handles focus management automatically
- Active sidebar indicator uses framer-motion layoutId for smooth transitions between nav items
- Topbar uses backdrop-blur for a modern glass effect
- All interactions use 200ms transitions for snappy feel
- Color-coded notification icons for quick visual scanning
