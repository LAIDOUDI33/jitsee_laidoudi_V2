'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  Upload,
  FolderUp,
  File,
  FileText,
  FileVideo,
  FileAudio,
  Image as ImageIcon,
  Download,
  Trash2,
  MoreVertical,
  Search,
  Grid3X3,
  List,
  FolderPlus,
  Share2,
  Clock,
  HardDrive,
  CloudUpload,
  TrendingUp,
  FileSpreadsheet,
  FileImage,
  FileType,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'

interface FileItem {
  id: string
  name: string
  type: 'document' | 'spreadsheet' | 'presentation' | 'video' | 'audio' | 'image' | 'folder'
  size: string
  sizeBytes: number
  modified: string
  modifiedBy: string
  shared: boolean
  folder?: string
}

const fileIconConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; gradientBg: string }> = {
  document: { icon: <FileText className='h-5 w-5' />, color: 'text-sky-500', bg: 'bg-sky-500/10', gradientBg: 'bg-gradient-to-br from-sky-500/15 to-sky-500/5' },
  spreadsheet: { icon: <FileSpreadsheet className='h-5 w-5' />, color: 'text-emerald-500', bg: 'bg-emerald-500/10', gradientBg: 'bg-gradient-to-br from-emerald-500/15 to-emerald-500/5' },
  presentation: { icon: <FileText className='h-5 w-5' />, color: 'text-orange-500', bg: 'bg-orange-500/10', gradientBg: 'bg-gradient-to-br from-orange-500/15 to-orange-500/5' },
  video: { icon: <FileVideo className='h-5 w-5' />, color: 'text-purple-500', bg: 'bg-purple-500/10', gradientBg: 'bg-gradient-to-br from-purple-500/15 to-purple-500/5' },
  audio: { icon: <FileAudio className='h-5 w-5' />, color: 'text-purple-500', bg: 'bg-purple-500/10', gradientBg: 'bg-gradient-to-br from-purple-500/15 to-purple-500/5' },
  image: { icon: <FileImage className='h-5 w-5' />, color: 'text-orange-500', bg: 'bg-orange-500/10', gradientBg: 'bg-gradient-to-br from-orange-500/15 to-orange-500/5' },
  folder: { icon: <FolderUp className='h-5 w-5' />, color: 'text-amber-500', bg: 'bg-amber-500/10', gradientBg: 'bg-gradient-to-br from-amber-500/15 to-amber-500/5' },
}

const gridIconConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; gradientBg: string }> = {
  document: { icon: <FileText className='h-10 w-10' />, color: 'text-sky-500', bg: 'bg-sky-500/10', gradientBg: 'bg-gradient-to-br from-sky-500/20 to-sky-500/5' },
  spreadsheet: { icon: <FileSpreadsheet className='h-10 w-10' />, color: 'text-emerald-500', bg: 'bg-emerald-500/10', gradientBg: 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5' },
  presentation: { icon: <FileText className='h-10 w-10' />, color: 'text-orange-500', bg: 'bg-orange-500/10', gradientBg: 'bg-gradient-to-br from-orange-500/20 to-orange-500/5' },
  video: { icon: <FileVideo className='h-10 w-10' />, color: 'text-purple-500', bg: 'bg-purple-500/10', gradientBg: 'bg-gradient-to-br from-purple-500/20 to-purple-500/5' },
  audio: { icon: <FileAudio className='h-10 w-10' />, color: 'text-purple-500', bg: 'bg-purple-500/10', gradientBg: 'bg-gradient-to-br from-purple-500/20 to-purple-500/5' },
  image: { icon: <FileImage className='h-10 w-10' />, color: 'text-orange-500', bg: 'bg-orange-500/10', gradientBg: 'bg-gradient-to-br from-orange-500/20 to-orange-500/5' },
  folder: { icon: <FolderUp className='h-10 w-10' />, color: 'text-amber-500', bg: 'bg-amber-500/10', gradientBg: 'bg-gradient-to-br from-amber-500/20 to-amber-500/5' },
}

function parseSizeToBytes(size: string): number {
  const match = size.match(/([\d.]+)\s*(KB|MB|GB)/)
  if (!match) return 0
  const val = parseFloat(match[1])
  if (match[2] === 'GB') return val * 1024 * 1024 * 1024
  if (match[2] === 'MB') return val * 1024 * 1024
  return val * 1024
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const val = bytes / Math.pow(1024, i)
  return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${units[i]}`
}

const mockFiles: FileItem[] = [
  { id: 'f1', name: 'Q4 Strategy Presentation.pptx', type: 'presentation', size: '4.2 MB', sizeBytes: 4.2 * 1024 * 1024, modified: 'Jan 12, 2025', modifiedBy: 'Sarah Chen', shared: true, folder: 'Strategy' },
  { id: 'f2', name: 'Meeting Notes - Sprint 14.docx', type: 'document', size: '128 KB', sizeBytes: 128 * 1024, modified: 'Jan 11, 2025', modifiedBy: 'Mike Johnson', shared: false, folder: 'Engineering' },
  { id: 'f3', name: 'Product Roadmap 2025.xlsx', type: 'spreadsheet', size: '2.1 MB', sizeBytes: 2.1 * 1024 * 1024, modified: 'Jan 10, 2025', modifiedBy: 'Alex Turner', shared: true, folder: 'Product' },
  { id: 'f4', name: 'Team Photo Retreat.jpg', type: 'image', size: '3.8 MB', sizeBytes: 3.8 * 1024 * 1024, modified: 'Jan 8, 2025', modifiedBy: 'Lisa Park', shared: false },
  { id: 'f5', name: 'Client Demo Recording.mp4', type: 'video', size: '156 MB', sizeBytes: 156 * 1024 * 1024, modified: 'Jan 7, 2025', modifiedBy: 'Emily Davis', shared: true, folder: 'Sales' },
  { id: 'f6', name: 'Brand Guidelines v3.pdf', type: 'document', size: '12.4 MB', sizeBytes: 12.4 * 1024 * 1024, modified: 'Jan 5, 2025', modifiedBy: 'Alex Turner', shared: true },
  { id: 'f7', name: 'Sprint Retrospective Notes.docx', type: 'document', size: '96 KB', sizeBytes: 96 * 1024, modified: 'Jan 4, 2025', modifiedBy: 'James Wilson', shared: false, folder: 'Engineering' },
  { id: 'f8', name: 'Onboarding Checklist.xlsx', type: 'spreadsheet', size: '45 KB', sizeBytes: 45 * 1024, modified: 'Jan 3, 2025', modifiedBy: 'Sarah Chen', shared: true, folder: 'HR' },
  { id: 'f9', name: 'Webinar Intro Audio.mp3', type: 'audio', size: '8.2 MB', sizeBytes: 8.2 * 1024 * 1024, modified: 'Jan 2, 2025', modifiedBy: 'Nina Patel', shared: false, folder: 'Marketing' },
]

const folders = ['All Files', 'Strategy', 'Engineering', 'Product', 'Sales', 'HR', 'Marketing']

const TOTAL_STORAGE_GB = 5

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export default function FilesPage() {
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [search, setSearch] = useState('')
  const [activeFolder, setActiveFolder] = useState('All Files')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [uploadOpen, setUploadOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  // Simulated upload progress animation when dialog is open
  const uploadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const uploadStartRef = useRef(false)

  const startUploadSimulation = useCallback(() => {
    if (uploadStartRef.current) return
    uploadStartRef.current = true
    setUploadProgress(0)
    uploadIntervalRef.current = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current)
          uploadStartRef.current = false
          return 100
        }
        // Eased progress: fast start, slow end
        const increment = prev < 30 ? 8 : prev < 70 ? 4 : prev < 90 ? 2 : 0.5
        return Math.min(prev + increment, 100)
      })
    }, 150)
  }, [])

  const stopUploadSimulation = useCallback(() => {
    if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current)
    uploadIntervalRef.current = null
    uploadStartRef.current = false
    setUploadProgress(0)
  }, [])

  const handleUploadOpenChange = useCallback((open: boolean) => {
    setUploadOpen(open)
    if (open) {
      startUploadSimulation()
    } else {
      stopUploadSimulation()
    }
  }, [startUploadSimulation, stopUploadSimulation])

  useEffect(() => {
    return () => {
      if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current)
    }
  }, [])

  const filtered = mockFiles.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase())
    const matchesFolder = activeFolder === 'All Files' || f.folder === activeFolder
    return matchesSearch && matchesFolder
  })

  const totalSizeBytes = useMemo(() => mockFiles.reduce((acc, f) => acc + f.sizeBytes, 0), [])
  const totalSizeMB = totalSizeBytes / (1024 * 1024)
  const storagePct = Math.min((totalSizeBytes / (TOTAL_STORAGE_GB * 1024 * 1024 * 1024)) * 100, 100)

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const handleDownload = (name: string) => toast.success(`Downloading "${name}"...`)
  const handleShare = (name: string) => toast.success(`Share link copied for "${name}"`)
  const handleDelete = (name: string) => toast.success(`"${name}" moved to trash`)

  const sparkline = (bars: number[], color: string) => (
    <div className='flex items-end gap-[2px] h-5'>
      {bars.map((v, i) => (
        <div key={i} className={`w-1 rounded-full ${color} transition-all`} style={{ height: `${v}%` }} />
      ))}
    </div>
  )

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='relative'>
        <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
          <div>
            <h2 className='text-3xl font-bold tracking-tight'>Files</h2>
            <p className='text-muted-foreground text-sm mt-1'>Manage and share files across your organization</p>
            <div className='h-1 w-12 rounded-full bg-gradient-to-r from-primary to-primary/50 mt-2' />
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' className='gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => setUploadOpen(true)}>
              <Upload className='h-3.5 w-3.5' /> Upload
            </Button>
            <Button variant='outline' size='sm' className='gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform'>
              <FolderPlus className='h-3.5 w-3.5' /> New Folder
            </Button>
          </div>
        </div>
      </div>

      {/* Storage stats with progress bar */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300'>
          <CardContent className='p-4 space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='p-2.5 rounded-xl bg-gradient-to-br from-sky-500/10 to-sky-500/5'><HardDrive className='h-5 w-5 text-sky-600' /></div>
                <div>
                  <p className='text-2xl font-bold'>{totalSizeMB < 1024 ? `${totalSizeMB.toFixed(1)} MB` : `${(totalSizeMB / 1024).toFixed(2)} GB`}</p>
                  <p className='text-xs text-muted-foreground'>of {TOTAL_STORAGE_GB} GB used</p>
                </div>
              </div>
              <span className='text-[10px] font-medium text-amber-600 flex items-center gap-0.5'><TrendingUp className='h-2.5 w-2.5' />↑ 8%</span>
            </div>
            <div className='space-y-1'>
              <div className='relative h-2 rounded-full bg-primary/10 overflow-hidden'>
              <div className='h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500' style={{ width: `${storagePct}%` }} />
            </div>
              <p className='text-[10px] text-muted-foreground text-right'>{storagePct.toFixed(1)}% used</p>
            </div>
          </CardContent>
        </Card>
        <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300'>
          <CardContent className='p-4 flex items-center gap-3'>
            <div className='p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5'><File className='h-5 w-5 text-emerald-600' /></div>
            <div className='flex-1'>
              <div className='flex items-center justify-between'>
                <p className='text-2xl font-bold'>{mockFiles.length}</p>
                <span className='text-[10px] font-medium text-emerald-600 flex items-center gap-0.5'><TrendingUp className='h-2.5 w-2.5' />+3</span>
              </div>
              <p className='text-xs text-muted-foreground'>Total Files</p>
              {sparkline([20, 30, 25, 40, 45, 50, 55], 'bg-emerald-500/40')}
            </div>
          </CardContent>
        </Card>
        <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300'>
          <CardContent className='p-4 flex items-center gap-3'>
            <div className='p-2.5 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-500/5'><Share2 className='h-5 w-5 text-violet-600' /></div>
            <div className='flex-1'>
              <p className='text-2xl font-bold'>{mockFiles.filter(f => f.shared).length}</p>
              <p className='text-xs text-muted-foreground'>Shared Files</p>
              {sparkline([15, 25, 35, 30, 40, 38, 42], 'bg-violet-500/40')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-2 flex-1'>
          <div className='relative flex-1 max-w-xs'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input placeholder='Search files...' className='pl-9 h-9' value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <div className='flex border rounded-lg overflow-hidden border-border/50 transition-all duration-300'>
            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size='icon' className={`h-9 w-9 rounded-none transition-all duration-300 ${view === 'list' ? 'bg-primary/10 text-primary' : ''}`} onClick={() => setView('list')}><List className='h-4 w-4' /></Button>
            <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size='icon' className={`h-9 w-9 rounded-none transition-all duration-300 ${view === 'grid' ? 'bg-primary/10 text-primary' : ''}`} onClick={() => setView('grid')}><Grid3X3 className='h-4 w-4' /></Button>
          </div>
        </div>
      </div>

      {/* Folders */}
      <div className='flex gap-2 flex-wrap'>
        {folders.map(f => (
          <Button
            key={f}
            variant={activeFolder === f ? 'default' : 'outline'}
            size='sm'
            onClick={() => setActiveFolder(f)}
            className={`hover:scale-[1.02] active:scale-[0.98] transition-transform ${activeFolder === f ? 'bg-gradient-to-r from-primary to-primary/90' : ''}`}
          >
            {activeFolder === f && <FolderUp className='h-3.5 w-3.5' />}
            {f}
          </Button>
        ))}
      </div>

      {selected.size > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className='flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20'>
          <span className='text-sm font-medium'>{selected.size} selected</span>
          <div className='flex-1' />
          <Button variant='outline' size='sm' className='gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => toast.success('Downloading selected files...')}><Download className='h-3.5 w-3.5' /> Download</Button>
          <Button variant='outline' size='sm' className='gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => toast.success('Share links copied!')}><Share2 className='h-3.5 w-3.5' /> Share</Button>
          <Button variant='outline' size='sm' className='gap-1.5 text-red-600 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => toast.success('Files moved to trash')}><Trash2 className='h-3.5 w-3.5' /> Delete</Button>
        </motion.div>
      )}

      {/* List view */}
      {view === 'list' ? (
        <Card className='border border-border/50 bg-gradient-to-br from-card to-card/80 overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='w-10'><Checkbox /></TableHead>
                <TableHead>Name</TableHead>
                <TableHead className='hidden sm:table-cell'>Folder</TableHead>
                <TableHead className='hidden md:table-cell'>Modified</TableHead>
                <TableHead className='hidden lg:table-cell'>Modified By</TableHead>
                <TableHead className='w-20'>Size</TableHead>
                <TableHead className='w-10' />\n              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((file, idx) => {
                const iconCfg = fileIconConfig[file.type]
                return (
                  <TableRow key={file.id} className={`group hover:bg-muted/50 transition-colors cursor-pointer ${idx % 2 === 1 ? 'even:bg-muted/30' : ''}`}>
                    <TableCell><Checkbox checked={selected.has(file.id)} onCheckedChange={() => toggleSelect(file.id)} /></TableCell>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <div className={`shrink-0 p-2 rounded-lg ${iconCfg.gradientBg} group-hover:shadow-sm transition-all duration-300`}><span className={iconCfg.color}>{iconCfg.icon}</span></div>
                        <div className='min-w-0'>
                          <p className='font-medium text-sm truncate max-w-[200px]'>{file.name}</p>
                          <div className='flex items-center gap-1.5 mt-0.5'>
                            {file.shared && <Badge variant='outline' className='text-[9px] gap-0.5 border-primary/20 text-primary bg-primary/5'><Share2 className='h-2.5 w-2.5' />Shared</Badge>}
                            <span className='text-[10px] text-muted-foreground uppercase'>{file.type}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='hidden sm:table-cell text-muted-foreground text-sm'>{file.folder || '—'}</TableCell>
                    <TableCell className='hidden md:table-cell text-muted-foreground text-xs'>{file.modified}</TableCell>
                    <TableCell className='hidden lg:table-cell text-muted-foreground text-sm'>{file.modifiedBy}</TableCell>
                    <TableCell className='text-muted-foreground text-sm font-mono text-xs'>{file.size}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' className='h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity'><MoreVertical className='h-4 w-4' /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem className='gap-2' onClick={() => handleDownload(file.name)}><Download className='h-4 w-4' /> Download</DropdownMenuItem>
                          <DropdownMenuItem className='gap-2' onClick={() => handleShare(file.name)}><Share2 className='h-4 w-4' /> Share</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className='gap-2 text-red-600' onClick={() => handleDelete(file.name)}><Trash2 className='h-4 w-4' /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className='flex flex-col items-center justify-center py-16'>
              <div className='relative'>
                <FolderUp className='h-16 w-16 text-muted-foreground/20' />
                <div className='absolute inset-0 flex items-center justify-center'>
                  <FolderUp className='h-8 w-8 text-muted-foreground/40' />
                </div>
              </div>
              <p className='font-medium mt-4'>No files found</p>
              <p className='text-sm text-muted-foreground mt-1'>Upload files or try a different search</p>
              <Button variant='outline' className='mt-4 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform' onClick={() => setUploadOpen(true)}>
                <Upload className='h-4 w-4' /> Upload Files
              </Button>
            </div>
          )}
        </Card>
      ) : (
        /* Grid view */
        <motion.div variants={container} initial='hidden' animate='show' className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
          {filtered.map(file => {
            const iconCfg = gridIconConfig[file.type]
            return (
              <motion.div key={file.id} variants={item}>
                <Card className='group cursor-pointer border border-border/50 hover:border-primary/30 bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden'>
                  {/* Subtle hover glow effect */}
                  <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none' style={{ boxShadow: 'inset 0 0 30px hsl(var(--primary) / 0.05), 0 0 20px hsl(var(--primary) / 0.08)' }} />
                  <CardContent className='p-4 flex flex-col items-center text-center relative'>
                    <div className={`p-4 rounded-2xl ${iconCfg.gradientBg} mb-3 group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}><span className={iconCfg.color}>{iconCfg.icon}</span></div>
                    <p className='text-sm font-medium truncate w-full'>{file.name}</p>
                    <p className='text-xs text-muted-foreground mt-1 font-mono'>{formatFileSize(file.sizeBytes)}</p>
                    <div className='flex items-center gap-2 mt-2'>
                      {file.shared && <Badge variant='outline' className='text-[9px] gap-0.5 border-primary/20 text-primary bg-primary/5'><Share2 className='h-2.5 w-2.5' />Shared</Badge>}
                      <span className='text-[10px] text-muted-foreground uppercase'>{file.type}</span>
                    </div>
                    <div className='flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity'>
                      <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => handleDownload(file.name)}><Download className='h-3.5 w-3.5' /></Button>
                      <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => handleShare(file.name)}><Share2 className='h-3.5 w-3.5' /></Button>
                      <Button variant='ghost' size='icon' className='h-7 w-7 text-red-500' onClick={() => handleDelete(file.name)}><Trash2 className='h-3.5 w-3.5' /></Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={handleUploadOpenChange}>
        <DialogContent>
          <DialogHeader>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center'>
                <CloudUpload className='h-5 w-5 text-primary-foreground' />
              </div>
              <div>
                <DialogTitle>Upload Files</DialogTitle>
                <p className='text-sm text-muted-foreground mt-0.5'>Drag and drop or browse to upload</p>
              </div>
            </div>
          </DialogHeader>
          {/* Simulated upload progress bar */}
          <AnimatePresence>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='space-y-1.5 mb-4'
              >
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-muted-foreground'>Simulated upload in progress...</span>
                  <motion.span
                    key={Math.round(uploadProgress)}
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: 1 }}
                    className='font-mono text-primary font-medium'
                  >
                    {Math.round(uploadProgress)}%
                  </motion.span>
                </div>
                <div className='relative h-2 rounded-full bg-primary/10 overflow-hidden'>
                  <motion.div
                    className='h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60'
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' as const }}
                  />
                  <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]' style={{ backgroundSize: '200% 100%', backgroundPosition: `${uploadProgress}% 0` }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${dragOver ? 'border-primary/60 bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.15)]' : 'border-primary/20 hover:border-primary/40 bg-primary/5'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); toast.success('Files received!') }}
          >
            <CloudUpload className={`h-12 w-12 mx-auto mb-4 transition-colors duration-300 ${dragOver ? 'text-primary' : 'text-primary/40'}`} />
            <p className='font-medium'>{dragOver ? 'Drop files here' : 'Drag and drop files here'}</p>
            <p className='text-sm text-muted-foreground mt-1'>or click to browse (up to 500MB per file)</p>
            <Button variant='outline' className='mt-4 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform'><FolderUp className='h-4 w-4' /> Browse Files</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
