import re

with open('/home/z/my-project/src/components/dashboard/views/NotificationsPage.tsx', 'r') as f:
    content = f.read()

old_initial = 'const initialNotifications: Notification[] = ['
idx = content.find(old_initial)
if idx == -1:
    print('Could not find initialNotifications')
    exit(1)

end_marker = ']\n\n// ── Helpers'
end_idx = content.find(end_marker)
if end_idx == -1:
    print('Could not find end marker')
    exit(1)

replacement = """const fallbackNotifications: Notification[] = []

function mapApiNotification(n: { id: string; type: string; title: string; description: string; time: string; timeGroup: string; read: boolean; sender: { name: string; initials: string; color: string } }): Notification {
  return {
    id: n.id,
    type: n.type as NotificationType,
    sender: { name: n.sender.name, initials: n.sender.initials, color: n.sender.color },
    title: n.title,
    description: n.description,
    detail: n.description,
    timestamp: n.time,
    timeGroup: n.timeGroup as TimeGroup,
    unread: !n.read,
    pinned: false,
  }
}

// ── Helpers"""

content = content[:idx] + replacement + content[end_idx + len(end_marker):]

content = content.replace(
    "import { useState, useMemo } from 'react'",
    "import { useState, useMemo, useEffect, useCallback } from 'react'\nimport { authFetch } from '@/lib/api'"
)

old_comp_init = 'const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)'
new_comp_init = '''const [notifications, setNotifications] = useState<Notification[]>(fallbackNotifications)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await authFetch('/api/v1/notifications')
      const json = await res.json()
      if (json.success) {
        setNotifications((json.data.notifications as ReturnType<typeof mapApiNotification>[]).map(mapApiNotification))
      } else {
        setError(json.error?.message ?? 'Failed to fetch notifications')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])'''

content = content.replace(old_comp_init, new_comp_init)

with open('/home/z/my-project/src/components/dashboard/views/NotificationsPage.tsx', 'w') as f:
    f.write(content)
print('Done')
