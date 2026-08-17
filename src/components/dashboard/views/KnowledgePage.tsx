'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { authFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  BookOpen,
  Search,
  FileText,
  Video,
  ExternalLink,
  Clock,
  Tag,
  Sparkles,
  ArrowRight,
  Bookmark,
  TrendingUp,
  GraduationCap,
  Shield,
  Settings2,
  Wrench,
  Puzzle,
  History,
  Eye,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

const fallbackArticles: KnowledgeArticle[] = []

function mapKnowledgeItem(item: { id: string; title: string; content: string; keyTopics: string[]; type: string; createdAt: string; duration?: number; participantCount?: number }): KnowledgeArticle {
  const d = new Date(item.createdAt)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const readMins = item.duration ? Math.max(1, Math.round(item.duration / 60)) : 3
  return {
    id: item.id,
    title: item.title,
    description: item.content.slice(0, 200) + (item.content.length > 200 ? '...' : ''),
    category: 'AI Features',
    tags: item.keyTopics.length > 0 ? item.keyTopics.slice(0, 3) : ['meeting', 'summary'],
    type: 'article',
    author: 'AI Assistant',
    date,
    readTime: `${readMins} min`,
    views: 0,
    bookmarked: false,
  }
}

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; gradientBorder: string }> = {
  'Getting Started': { icon: <GraduationCap className='h-4 w-4' />, color: 'text-emerald-600', bg: 'bg-emerald-500/10', gradientBorder: 'from-emerald-500 to-emerald-400' },
  'AI Features': { icon: <Sparkles className='h-4 w-4' />, color: 'text-violet-600', bg: 'bg-violet-500/10', gradientBorder: 'from-violet-500 to-violet-400' },
  'Best Practices': { icon: <TrendingUp className='h-4 w-4' />, color: 'text-sky-600', bg: 'bg-sky-500/10', gradientBorder: 'from-sky-500 to-sky-400' },
  'Security': { icon: <Shield className='h-4 w-4' />, color: 'text-red-600', bg: 'bg-red-500/10', gradientBorder: 'from-red-500 to-red-400' },
  'Administration': { icon: <Settings2 className='h-4 w-4' />, color: 'text-amber-600', bg: 'bg-amber-500/10', gradientBorder: 'from-amber-500 to-amber-400' },
  'Features': { icon: <Wrench className='h-4 w-4' />, color: 'text-teal-600', bg: 'bg-teal-500/10', gradientBorder: 'from-teal-500 to-teal-400' },
  'Integrations': { icon: <Puzzle className='h-4 w-4' />, color: 'text-rose-600', bg: 'bg-rose-500/10', gradientBorder: 'from-rose-500 to-rose-400' },
}

const categories = ['All', ...Object.keys(categoryConfig)]

const typeIcons: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  article: { icon: <FileText className='h-4 w-4' />, color: 'text-sky-600', bg: 'bg-gradient-to-br from-sky-500/20 to-sky-500/5' },
  video: { icon: <Video className='h-4 w-4' />, color: 'text-red-600', bg: 'bg-gradient-to-br from-red-500/20 to-red-500/5' },
  guide: { icon: <BookOpen className='h-4 w-4' />, color: 'text-emerald-600', bg: 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5' },
  faq: { icon: <Sparkles className='h-4 w-4' />, color: 'text-amber-600', bg: 'bg-gradient-to-br from-amber-500/20 to-amber-500/5' },
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export default function KnowledgePage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [articles, setArticles] = useState<KnowledgeArticle[]>(fallbackArticles)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchKnowledge = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await authFetch('/api/v1/knowledge')
      const json = await res.json()
      if (json.success) {
        setArticles((json.data.items as ReturnType<typeof mapKnowledgeItem>[]).map(mapKnowledgeItem))
      } else {
        setError(json.error?.message ?? 'Failed to fetch knowledge items')
      }
    } catch {
      setError('Network error fetching knowledge items')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchKnowledge() }, [fetchKnowledge])

  const filtered = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = activeCategory === 'All' || a.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const toggleBookmark = (id: string) => {
    setArticles(prev => prev.map(a => {
      if (a.id === id) {
        const updated = { ...a, bookmarked: !a.bookmarked }
        toast.success(updated.bookmarked ? 'Bookmarked!' : 'Bookmark removed')
        return updated
      }
      return a
    }))
  }

  const trending = [...articles].sort((a, b) => b.views - a.views).slice(0, 3)
  const recentlyViewed = articles.slice(0, 3)

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {}
    articles.forEach(a => {
      stats[a.category] = (stats[a.category] || 0) + 1
    })
    return stats
  }, [articles])

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) => regex.test(part) ? <mark key={i} className='bg-primary/20 text-primary rounded px-0.5'>{part}</mark> : part)
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='relative'>
        <h2 className='text-3xl font-bold tracking-tight'>Knowledge Base</h2>
        <p className='text-muted-foreground text-sm mt-1'>Guides, tutorials, and best practices for ALVISION</p>
        <div className='h-1 w-12 rounded-full bg-gradient-to-r from-primary to-primary/50 mt-2' />
      </div>

      {/* Hero search */}
      <Card className='bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border-primary/10 overflow-hidden relative'>
        <CardContent className='p-8 text-center relative'>
          <div className='w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 shadow-lg'>
            <BookOpen className='h-7 w-7 text-primary-foreground' />
          </div>
          <h3 className='text-xl font-bold mb-2'>Find answers fast</h3>
          <p className='text-muted-foreground mb-6 max-w-lg mx-auto text-sm'>Search across {articles.length} articles, guides, and FAQs</p>
          <div className='absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer pointer-events-none' />
          <div className='relative max-w-lg mx-auto'>
            <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground' />
            <Input placeholder='Search articles, guides, FAQs...' className='pl-12 h-12 text-base border-primary/20 focus-visible:border-primary/40 transition-colors' value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className='space-y-3'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className='animate-pulse'>
              <CardContent className='p-5 flex items-start gap-4'>
                <div className='w-10 h-10 rounded-xl bg-muted shrink-0' />
                <div className='flex-1 space-y-2'>
                  <div className='h-4 bg-muted rounded w-2/3' />
                  <div className='h-3 bg-muted rounded w-full' />
                  <div className='h-3 bg-muted rounded w-1/3' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <Card className='border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20'>
          <CardContent className='p-4 flex items-center justify-between'>
            <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>
            <Button variant='outline' size='sm' onClick={fetchKnowledge}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {/* Category cards with gradient top borders */}
      {!loading && (
      <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3'>
        {Object.entries(categoryConfig).map(([name, config]) => (
          <motion.button
            key={name}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveCategory(activeCategory === name ? 'All' : name)}
            className={`p-3 rounded-xl border text-center transition-all border-border/50 hover:border-primary/30 bg-gradient-to-br from-card to-card/80 relative overflow-hidden ${activeCategory === name ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'hover:shadow-md'}`}
          >
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${config.gradientBorder} ${activeCategory === name ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
            <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center mx-auto mb-2 ${config.color}`}>
              {config.icon}
            </div>
            <p className='text-[11px] font-medium leading-tight'>{name}</p>
            <p className='text-[10px] text-muted-foreground mt-0.5'>{categoryStats[name] || 0} articles</p>
          </motion.button>
        ))}
      </div>
      )}

      <div className='flex flex-col lg:flex-row gap-6'>
        {/* Main content */}
        <div className='flex-1 space-y-4'>
          {/* Category filter pills */}
          <div className='flex gap-2 flex-wrap'>
            {categories.map(c => (
              <Button
                key={c}
                variant={activeCategory === c ? 'default' : 'outline'}
                size='sm'
                onClick={() => setActiveCategory(c)}
                className={`hover:scale-[1.02] active:scale-[0.98] transition-transform ${activeCategory === c ? 'bg-gradient-to-r from-primary to-primary/90' : ''}`}
              >
                {c === 'All' && <BookOpen className='h-3.5 w-3.5 mr-1' />}
                {c}
                {c !== 'All' && <span className='ml-1 opacity-60'>{categoryStats[c] || 0}</span>}
              </Button>
            ))}
          </div>

          {/* Articles */}
          <motion.div variants={container} initial='hidden' animate='show' className='space-y-3'>
            {filtered.map(article => {
              const typeCfg = typeIcons[article.type]
              const catCfg = categoryConfig[article.category]
              return (
                <motion.div key={article.id} variants={item}>
                  <Card className='group relative border border-border/50 hover:border-primary/30 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer overflow-hidden before:content-[\"\"] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-primary/50 before:to-primary/0'>
                    <CardContent className='p-5'>
                      <div className='flex items-start gap-4'>
                        <div className={`p-2.5 rounded-xl ${typeCfg.bg} ${typeCfg.color} shrink-0 mt-0.5 group-hover:scale-110 transition-transform`}>
                          {typeCfg.icon}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between gap-2'>
                            <div>
                              <h3 className='font-semibold group-hover:text-primary transition-colors'>{highlightText(article.title, search)}</h3>
                              <p className='text-sm text-muted-foreground mt-1 line-clamp-2'>{highlightText(article.description, search)}</p>
                            </div>
                            <motion.button
                              whileTap={{ scale: 0.8 }}
                              onClick={(e) => { e.stopPropagation(); toggleBookmark(article.id) }}
                              className='shrink-0 p-1 rounded-md hover:bg-muted transition-colors'
                            >
                              <motion.div
                                animate={article.bookmarked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                                transition={{ duration: 0.3 }}
                              >
                                <Bookmark className={`h-4 w-4 transition-colors duration-200 ${article.bookmarked ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-primary'}`} />
                              </motion.div>
                            </motion.button>
                          </div>
                          <div className='flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-muted-foreground'>
                            <span className='flex items-center gap-1'><Clock className='h-3 w-3' />{article.readTime}</span>
                            <span>{article.date}</span>
                            <span>by {article.author}</span>
                            <span className='flex items-center gap-1'><Eye className='h-3 w-3' />{article.views} views</span>
                          </div>
                          <div className='flex flex-wrap gap-1.5 mt-2.5'>
                            <Badge variant='outline' className={`text-[10px] gap-1 ${catCfg?.bg || ''} ${catCfg?.color || ''} border-current/20`}>
                              {catCfg?.icon} {article.category}
                            </Badge>
                            {article.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant='secondary' className='text-[10px]'>
                                <Tag className='h-2.5 w-2.5 mr-0.5' />{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <ArrowRight className='h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 shrink-0 mt-1' />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
            {filtered.length === 0 && (
              <div className='flex flex-col items-center justify-center py-16'>
                <div className='relative'>
                  <BookOpen className='h-16 w-16 text-muted-foreground/20' />
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <BookOpen className='h-8 w-8 text-muted-foreground/40' />
                  </div>
                </div>
                <p className='font-medium mt-4'>No articles found</p>
                <p className='text-sm text-muted-foreground mt-1'>Try a different search or category</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className='w-full lg:w-72 space-y-4 hidden lg:block'>
          {/* Recently Viewed */}
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300'>
            <CardHeader className='pb-3'><CardTitle className='text-sm flex items-center gap-2'><History className='h-4 w-4' /> Recently Viewed</CardTitle></CardHeader>
            <CardContent className='space-y-3 divide-y divide-border/50'>
              {recentlyViewed.map((a, ri) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: ri * 0.06 }}
                  className='pt-3 first:pt-0'
                >
                  <button className='w-full text-left group'>
                    <p className='text-sm font-medium group-hover:text-primary transition-colors line-clamp-2'>{a.title}</p>
                    <p className='text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5'><Clock className='h-3 w-3' />{a.readTime} · {a.date}</p>
                  </button>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Trending */}
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300'>
            <CardHeader className='pb-3'><CardTitle className='text-sm flex items-center gap-2'><TrendingUp className='h-4 w-4 text-primary' /> Trending</CardTitle></CardHeader>
            <CardContent className='space-y-3 divide-y divide-border/50'>
              {trending.map((a, i) => (
                <div key={a.id} className='flex gap-3 group pt-3 first:pt-0'>
                  <span className='text-lg font-bold text-muted-foreground/30'>{i + 1}</span>
                  <div className='flex-1 min-w-0'>
                    <button className='w-full text-left'>
                      <p className='text-sm font-medium group-hover:text-primary transition-colors line-clamp-2'>{a.title}</p>
                      <p className='text-xs text-muted-foreground mt-0.5'>{a.views} views</p>
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300'>
            <CardHeader className='pb-3'><CardTitle className='text-sm'>Quick Links</CardTitle></CardHeader>
            <CardContent className='space-y-1 divide-y divide-border/50'>
              {['API Documentation', 'Release Notes', 'Community Forum', 'Feature Requests'].map(link => (
                <button key={link} className='w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 text-sm transition-colors'>
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
