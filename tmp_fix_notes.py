with open('/home/z/my-project/src/components/dashboard/views/MeetingNotesPage.tsx', 'r') as f:
    content = f.read()

# Replace mock data with empty fallback + API wiring
old_mock = 'const initialNotes: MeetingNote[] = ['
idx = content.find(old_mock)
if idx == -1:
    print('Could not find initialNotes')
    exit(1)

# Find the end of the array - it ends before the filter tags array
end_marker = ']\n\nconst availableTags: Tag[]'
end_idx = content.find(end_marker)
if end_idx == -1:
    print('Could not find end marker')
    exit(1)

replacement = '''const fallbackNotes: MeetingNote[] = []

function mapApiNote(n: { id: string; title: string; startTime: string | null; content: string; keyTopics: string[]; duration: number; participantCount: number; createdAt: string }): MeetingNote {
  const d = new Date(n.createdAt)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const tags: Tag[] = n.keyTopics.length > 0 ? (['Sprint Planning', 'Design Review', '1-on-1', 'Client Call', 'Retrospective', 'Board Meeting'] as Tag[]).filter(t => n.keyTopics.some(k => k.toLowerCase().includes(t.toLowerCase()))) : ['Client Call']
  return {
    id: n.id,
    title: n.title,
    date,
    participants: [],
    tags,
    content: n.content,
    actionItems: [],
  }
}

const availableTags: Tag[]'''

content = content[:idx] + replacement + content[end_idx + len(end_marker):]

# Add imports
content = content.replace(
    "import { useState, useMemo, useEffect, useCallback } from 'react'",
    "import { useState, useMemo, useEffect, useCallback } from 'react'\nimport { authFetch } from '@/lib/api'"
)

# Replace component initialization
old_init = 'const [notes, setNotes] = useState<MeetingNote[]>(initialNotes)'
new_init = '''const [notes, setNotes] = useState<MeetingNote[]>(fallbackNotes)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await authFetch('/api/v1/notes')
      const json = await res.json()
      if (json.success) {
        setNotes((json.data.notes as ReturnType<typeof mapApiNote>[]).map(mapApiNote))
      } else {
        setError(json.error?.message ?? 'Failed to fetch notes')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotes() }, [fetchNotes])'''

content = content.replace(old_init, new_init)

with open('/home/z/my-project/src/components/dashboard/views/MeetingNotesPage.tsx', 'w') as f:
    f.write(content)
print('Done')
