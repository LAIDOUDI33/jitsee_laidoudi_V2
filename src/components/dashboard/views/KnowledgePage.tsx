'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BookOpen,
  Search,
  Plus,
  FileText,
  Video,
  ExternalLink,
  Clock,
  Tag,
  FolderOpen,
  Sparkles,
  ArrowRight,
  Bookmark,
  TrendingUp,
} from 'lucide-react'

interface KnowledgeArticle {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
 type: 'article' | 'video' | 'guide' | 'faq'
 author: string
  date: string
  readTime: string
  views: number
  bookmarked?: boolean
}

const mockArticles: KnowledgeArticle[] = [
  { id: 'k1', title: 'Getting Started with ALVISION', description: 'Complete guide to setting up your workspace, scheduling meetings, and using core features.', category: 'Getting Started', tags: ['onboarding', 'setup', 'basics'], type: 'guide', author: 'Sarah Chen', date: 'Jan 10, 2025', readTime: '5 min', views: 245, bookmarked: true },
  { id: 'k2', title: 'AI Meeting Summaries Explained', description: 'Learn how ALVISION generates meeting summaries, extracts action items, and provides intelligent insights.', category: 'AI Features', tags: ['ai', 'summaries', 'nlp'], type: 'article', author: 'Mike Johnson', date: 'Jan 8, 2025', readTime: '8 min', views: 189, bookmarked: false },
  { id: 'k3', title: 'Best Practices for Video Meetings', description: 'Tips for running effective, engaging video meetings with your team.', category: 'Best Practices', tags: ['meetings', 'productivity', 'tips'], type: 'article', author: 'Emily Davis', date: 'Jan 5, 2025', readTime: '4 min', views: 312 },
  { id: 'k4', title: 'Security & Compliance Overview', description: 'Understanding ALVISION security features, data encryption, and compliance certifications.', category: 'Security', tags: ['security', 'compliance', 'encryption'], type: 'guide', author: 'James Wilson', date: 'Jan 3, 2025', readTime: '10 min', views: 156, bookmarked: true },
  { id: 'k5', title: 'Team Management & RBAC', description: 'How to set up teams, manage roles, and configure permissions for your organization.', category: 'Administration', tags: ['teams', 'rbac', 'permissions'], type: 'guide', author: 'Alex Turner', date: 'Dec 28, 2024', readTime: '7 min', views: 98 },
  { id: 'k6', title: 'Recording & Transcription Setup', description: 'Configure automatic recording, enable speaker-identified transcripts, and manage storage.', category: 'Features', tags: ['recording', 'transcript', 'storage'], type: 'video', author: 'Lisa Park', date: 'Dec 25, 2024', readTime: '6 min', views: 134 },
  { id: 'k7', title: 'Integrating with Calendar Apps', description: 'Connect Microsoft 365 and Google Calendar for seamless meeting scheduling.', category: 'Integrations', tags: ['calendar', 'microsoft', 'google'], type: 'guide', author: 'Sarah Chen', date: 'Dec 20, 2024', readTime: '5 min', views: 87 },
  { id: 'k8', title: 'FAQ: Common Questions', description: 'Answers to the most frequently asked questions about ALVISION.', category: 'Getting Started', tags: ['faq', 'help'], type: 'faq', author: 'Support Team', date: 'Dec 15, 2024', readTime: '12 min', views: 523, bookmarked: true },
]

const categories = ['All', 'Getting Started', 'AI Features', 'Best Practices', 'Security', 'Administration', 'Features', 'Integrations']

const typeIcons: Record<string, React.ReactNode> = {
  article: <FileText className='h-4 w-4' />,
  video: <Video className='h-4 w-4' />,
  guide: <BookOpen className='h-4 w-4' />,
  faq: <Sparkles className='h-4 w-4' />,
}

export default function KnowledgePage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [articles, setArticles] = useState(mockArticles)

  const filtered = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = activeCategory === 'All' || a.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const toggleBookmark = (id: string) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, bookmarked: !a.bookmarked } : a))
  }

  const trending = [...articles].sort((a, b) => b.views - a.views).slice(0, 3)

  return (
    <div className='space-y-6'>
      {/* Hero search */}
      <Card className='bg-gradient-to-br from-blue-500/5 to-violet-500/5 border-blue-200/50 dark:border-blue-800/30'>
        <CardContent className='p-8 text-center'>
          <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mx-auto mb-4'>
            <BookOpen className='h-6 w-6 text-white' />
          </div>
          <h2 className='text-2xl font-bold mb-2'>Knowledge Base</h2>
          <p className='text-muted-foreground mb-6 max-w-lg mx-auto'>Find guides, tutorials, and best practices to get the most out of ALVISION.</p>
          <div className='relative max-w-lg mx-auto'>
            <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground' />
            <Input placeholder='Search articles, guides, FAQs...' className='pl-12 h-12 text-base' value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className='flex flex-col lg:flex-row gap-6'>
        {/* Main content */}
        <div className='flex-1 space-y-4'>
          {/* Categories */}
          <div className='flex gap-2 flex-wrap'>
            {categories.map(c => (
              <Button
                key={c}
                variant={activeCategory === c ? 'default' : 'outline'}
                size='sm'
                onClick={() => setActiveCategory(c)}
              >{c}</Button>
            ))}
          </div>

          {/* Articles */}
          <div className='space-y-3'>
            {filtered.map(article => (
              <Card key={article.id} className='group hover:shadow-md transition-shadow cursor-pointer'>
                <CardContent className='p-5'>
                  <div className='flex items-start gap-4'>
                    <div className='p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5'>
                      {typeIcons[article.type]}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-2'>
                        <div>
                          <h3 className='font-semibold group-hover:text-primary transition-colors'>{article.title}</h3>
                          <p className='text-sm text-muted-foreground mt-1 line-clamp-2'>{article.description}</p>
                        </div>
                        <button onClick={() => toggleBookmark(article.id)} className='shrink-0'>
                          <Bookmark className={`h-4 w-4 transition-colors ${article.bookmarked ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-primary'}`} />
                        </button>
                      </div>
                      <div className='flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-muted-foreground'>
                        <span className='flex items-center gap-1'><Clock className='h-3 w-3' />{article.readTime}</span>
                        <span>{article.date}</span>
                        <span>by {article.author}</span>
                        <span className='flex items-center gap-1'><TrendingUp className='h-3 w-3' />{article.views} views</span>
                      </div>
                      <div className='flex flex-wrap gap-1.5 mt-2.5'>
                        <Badge variant='outline' className='text-[10px]'>{article.category}</Badge>
                        {article.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant='secondary' className='text-[10px]'>
                            <Tag className='h-2.5 w-2.5 mr-0.5' />{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <ArrowRight className='h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1' />
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <div className='text-center py-12 text-muted-foreground'>
                <BookOpen className='h-10 w-10 mx-auto mb-3 opacity-40' />
                <p className='font-medium'>No articles found</p>
                <p className='text-sm'>Try a different search or category</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className='w-full lg:w-72 space-y-4 hidden lg:block'>
          <Card>
            <CardHeader className='pb-3'><CardTitle className='text-sm flex items-center gap-2'><TrendingUp className='h-4 w-4' /> Trending</CardTitle></CardHeader>
            <CardContent className='space-y-3'>
              {trending.map((a, i) => (
                <button key={a.id} className='w-full text-left flex gap-3 group'>
                  <span className='text-lg font-bold text-muted-foreground/40'>{i + 1}</span>
                  <div>
                    <p className='text-sm font-medium group-hover:text-primary transition-colors line-clamp-2'>{a.title}</p>
                    <p className='text-xs text-muted-foreground mt-0.5'>{a.views} views</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-3'><CardTitle className='text-sm'>Quick Links</CardTitle></CardHeader>
            <CardContent className='space-y-2'>
              {['API Documentation', 'Release Notes', 'Community Forum', 'Feature Requests'].map(link => (
                <button key={link} className='w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted text-sm transition-colors'>
                  <span>{link}</span>
                  <ExternalLink className='h-3.5 w-3.5 text-muted-foreground' />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
