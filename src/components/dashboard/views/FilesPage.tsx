'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface FileItem {
  id: string
  name: string
  type: 'document' | 'spreadsheet' | 'presentation' | 'video' | 'audio' | 'image' | 'folder'
  size: string
  modified: string
  modifiedBy: string
  shared: boolean
  folder?: string
}

const fileIcons: Record<string, React.ReactNode> = {
  document: <FileText className='h-8 w-8 text-blue-500' />,
  spreadsheet: <File className='h-8 w-8 text-emerald-500' />,
  presentation: <FileText className='h-8 w-8 text-orange-500' />,
  video: <FileVideo className='h-8 w-8 text-red-500' />,
  audio: <FileAudio className='h-8 w-8 text-purple-500' />,
  image: <ImageIcon className='h-8 w-8 text-pink-500' />,
  folder: <FolderUp className='h-8 w-8 text-amber-500' />,
}

const mockFiles: FileItem[] = [
  { id: 'f1', name: 'Q4 Strategy Presentation.pptx', type: 'presentation', size: '4.2 MB', modified: 'Jan 12, 2025', modifiedBy: 'Sarah Chen', shared: true, folder: 'Strategy' },
  { id: 'f2', name: 'Meeting Notes - Sprint 14.docx', type: 'document', size: '128 KB', modified: 'Jan 11, 2025', modifiedBy: 'Mike Johnson', shared: false, folder: 'Engineering' },
  { id: 'f3', name: 'Product Roadmap 2025.xlsx', type: 'spreadsheet', size: '2.1 MB', modified: 'Jan 10, 2025', modifiedBy: 'Alex Turner', shared: true, folder: 'Product' },
  { id: 'f4', name: 'Team Photo Retreat.jpg', type: 'image', size: '3.8 MB', modified: 'Jan 8, 2025', modifiedBy: 'Lisa Park', shared: false },
  { id: 'f5', name: 'Client Demo Recording.mp4', type: 'video', size: '156 MB', modified: 'Jan 7, 2025', modifiedBy: 'Emily Davis', shared: true, folder: 'Sales' },
  { id: 'f6', name: 'Brand Guidelines v3.pdf', type: 'document', size: '12.4 MB', modified: 'Jan 5, 2025', modifiedBy: 'Alex Turner', shared: true },
  { id: 'f7', name: 'Sprint Retrospective Notes.docx', type: 'document', size: '96 KB', modified: 'Jan 4, 2025', modifiedBy: 'James Wilson', shared: false, folder: 'Engineering' },
  { id: 'f8', name: 'Onboarding Checklist.xlsx', type: 'spreadsheet', size: '45 KB', modified: 'Jan 3, 2025', modifiedBy: 'Sarah Chen', shared: true, folder: 'HR' },
  { id: 'f9', name: 'Webinar Intro Audio.mp3', type: 'audio', size: '8.2 MB', modified: 'Jan 2, 2025', modifiedBy: 'Nina Patel', shared: false, folder: 'Marketing' },
]

const folders = ['All Files', 'Strategy', 'Engineering', 'Product', 'Sales', 'HR', 'Marketing']

export default function FilesPage() {
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [search, setSearch] = useState('')
  const [activeFolder, setActiveFolder] = useState('All Files')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [uploadOpen, setUploadOpen] = useState(false)

  const filtered = mockFiles.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase())
    const matchesFolder = activeFolder === 'All Files' || f.folder === activeFolder
    return matchesSearch && matchesFolder
  })

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelected(next)
  }

  const totalSize = mockFiles.reduce((acc, f) => {
    const match = f.size.match(/([\d.]+)\s*(KB|MB|GB)/)
    if (!match) return acc
    const val = parseFloat(match[1])
    const mult = match[2] === 'GB' ? 1024 : match[2] === 'MB' ? 1 : 0.001
    return acc + val * mult
  }, 0)

  return (
    <div className='space-y-6'>
      {/* Storage stats */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-blue-500/10'><HardDrive className='h-5 w-5 text-blue-600' /></div><div><p className='text-2xl font-bold'>{totalSize.toFixed(1)} MB</p><p className='text-xs text-muted-foreground'>Total Storage Used</p></div></CardContent></Card>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-emerald-500/10'><File className='h-5 w-5 text-emerald-600' /></div><div><p className='text-2xl font-bold'>{mockFiles.length}</p><p className='text-xs text-muted-foreground'>Total Files</p></div></CardContent></Card>
        <Card><CardContent className='p-4 flex items-center gap-3'><div className='p-2 rounded-lg bg-violet-500/10'><Share2 className='h-5 w-5 text-violet-600' /></div><div><p className='text-2xl font-bold'>{mockFiles.filter(f => f.shared).length}</p><p className='text-xs text-muted-foreground'>Shared Files</p></div></CardContent></Card>
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
          <Button variant='outline' size='sm' className='gap-1.5' onClick={() => setUploadOpen(true)}><Upload className='h-3.5 w-3.5' /> Upload</Button>
          <Button variant='outline' size='sm' className='gap-1.5'><FolderPlus className='h-3.5 w-3.5' /> New Folder</Button>
          <div className='flex border rounded-lg overflow-hidden'>
            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size='icon' className='h-9 w-9 rounded-none' onClick={() => setView('list')}><List className='h-4 w-4' /></Button>
            <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size='icon' className='h-9 w-9 rounded-none' onClick={() => setView('grid')}><Grid3X3 className='h-4 w-4' /></Button>
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
          >
            {f}
          </Button>
        ))}
      </div>

      {selected.size > 0 && (
        <div className='flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20'>
          <span className='text-sm font-medium'>{selected.size} selected</span>
          <Button variant='outline' size='sm' className='gap-1.5'><Download className='h-3.5 w-3.5' /> Download</Button>
          <Button variant='outline' size='sm' className='gap-1.5'><Share2 className='h-3.5 w-3.5' /> Share</Button>
          <Button variant='outline' size='sm' className='gap-1.5 text-red-600'><Trash2 className='h-3.5 w-3.5' /> Delete</Button>
        </div>
      )}

      {/* List view */}
      {view === 'list' ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-10'><Checkbox /></TableHead>
                <TableHead>Name</TableHead>
                <TableHead className='hidden sm:table-cell'>Folder</TableHead>
                <TableHead className='hidden md:table-cell'>Modified</TableHead>
                <TableHead className='hidden lg:table-cell'>Modified By</TableHead>
                <TableHead className='w-20'>Size</TableHead>
                <TableHead className='w-10' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(file => (
                <TableRow key={file.id} className='group'>
                  <TableCell><Checkbox checked={selected.has(file.id)} onCheckedChange={() => toggleSelect(file.id)} /></TableCell>
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <div className='shrink-0'>{fileIcons[file.type]}</div>
                      <div className='min-w-0'>
                        <p className='font-medium text-sm truncate max-w-[200px]'>{file.name}</p>
                        {file.shared && <Badge variant='secondary' className='text-[10px] mt-0.5'>Shared</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='hidden sm:table-cell text-muted-foreground text-sm'>{file.folder || '—'}</TableCell>
                  <TableCell className='hidden md:table-cell text-muted-foreground text-sm'>{file.modified}</TableCell>
                  <TableCell className='hidden lg:table-cell text-muted-foreground text-sm'>{file.modifiedBy}</TableCell>
                  <TableCell className='text-muted-foreground text-sm'>{file.size}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon' className='h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity'><MoreVertical className='h-4 w-4' /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem className='gap-2'><Download className='h-4 w-4' /> Download</DropdownMenuItem>
                        <DropdownMenuItem className='gap-2'><Share2 className='h-4 w-4' /> Share</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className='gap-2 text-red-600'><Trash2 className='h-4 w-4' /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className='text-center py-12 text-muted-foreground'>
              <File className='h-10 w-10 mx-auto mb-3 opacity-40' />
              <p className='font-medium'>No files found</p>
            </div>
          )}
        </Card>
      ) : (
        /* Grid view */
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
          {filtered.map(file => (
            <Card key={file.id} className='group cursor-pointer hover:shadow-md transition-shadow'>
              <CardContent className='p-4 flex flex-col items-center text-center'>
                <div className='mb-3'>{fileIcons[file.type]}</div>
                <p className='text-sm font-medium truncate w-full'>{file.name}</p>
                <p className='text-xs text-muted-foreground mt-1'>{file.size}</p>
                {file.shared && <Badge variant='secondary' className='text-[10px] mt-2'>Shared</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Files</DialogTitle></DialogHeader>
          <div className='border-2 border-dashed rounded-xl p-12 text-center'>
            <CloudUpload className='h-12 w-12 mx-auto mb-4 text-muted-foreground/50' />
            <p className='font-medium'>Drag and drop files here</p>
            <p className='text-sm text-muted-foreground mt-1'>or click to browse (up to 500MB)</p>
            <Button variant='outline' className='mt-4'>Browse Files</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
