'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Pen,
  Eraser,
  Type,
  MousePointer2,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3X3,
  Download,
  Save,
  Palette,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { WhiteboardCanvas, type ToolType, type WhiteboardElement } from './WhiteboardCanvas'
import { authFetch } from '@/lib/api'
import { useAppStore } from '@/store/app-store'

// ─── Constants ───────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  { name: 'White', hex: '#ffffff' },
  { name: 'Black', hex: '#1e293b' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Slate', hex: '#64748b' },
]

const STROKE_OPTIONS = [
  { label: 'Thin', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Thick', value: 8 },
]

const TOOL_ITEMS: { tool: ToolType; icon: React.ReactElement; label: string; shortcut: string }[] = [
  { tool: 'select', icon: <MousePointer2 className='h-4 w-4' />, label: 'Select', shortcut: 'V' },
  { tool: 'pen', icon: <Pen className='h-4 w-4' />, label: 'Pen', shortcut: 'P' },
  { tool: 'line', icon: <Minus className='h-4 w-4' />, label: 'Line', shortcut: 'L' },
  { tool: 'arrow', icon: <ArrowRight className='h-4 w-4' />, label: 'Arrow', shortcut: 'A' },
  { tool: 'rectangle', icon: <Square className='h-4 w-4' />, label: 'Rectangle', shortcut: 'R' },
  { tool: 'circle', icon: <Circle className='h-4 w-4' />, label: 'Circle', shortcut: 'C' },
  { tool: 'text', icon: <Type className='h-4 w-4' />, label: 'Text', shortcut: 'T' },
  { tool: 'eraser', icon: <Eraser className='h-4 w-4' />, label: 'Eraser', shortcut: 'E' },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function WhiteboardPage() {
  const { user } = useAppStore()

  // Tool state
  const [activeTool, setActiveTool] = useState<ToolType>('pen')
  const [activeColor, setActiveColor] = useState('#ffffff')
  const [activeWidth, setActiveWidth] = useState(4)
  const [showGrid, setShowGrid] = useState(true)
  const [zoom, setZoom] = useState(1)

  // Elements state (controlled)
  const [elements, setElements] = useState<WhiteboardElement[]>([])
  const hasLoadedRef = useRef(false)

  // Dialog state
  const [showClearDialog, setShowClearDialog] = useState(false)

  // Save state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const elementsRef = useRef<WhiteboardElement[]>([])
  const canvasRef = useRef<HTMLDivElement>(null)

  // ── Undo / Redo ────────────────────────────────────────────────────────
  // History managed with state so undo/redo buttons reactively disable.
  const [undoStack, setUndoStack] = useState<WhiteboardElement[][]>([])
  const [redoStack, setRedoStack] = useState<WhiteboardElement[][]>([])

  const canUndo = undoStack.length > 0
  const canRedo = redoStack.length > 0

  // ── Fetch initial data ──────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await authFetch('/api/v1/whiteboard?sessionId=default')
        if (res.ok) {
          const json = await res.json()
          const data: WhiteboardElement[] = json.data?.data ?? []
          hasLoadedRef.current = true
          setElements(data)
          elementsRef.current = data
        }
      } catch {
        // Silently fail on load — start blank
      }
    }
    load()
  }, [])

  // ── Debounced save ─────────────────────────────────────────────────────
  const debouncedSave = useCallback(
    (newElements: WhiteboardElement[]) => {
      elementsRef.current = newElements
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      setSaveStatus('idle')
      saveTimerRef.current = setTimeout(async () => {
        try {
          setSaveStatus('saving')
          const res = await authFetch('/api/v1/whiteboard', {
            method: 'PUT',
            body: JSON.stringify({ sessionId: 'default', data: elementsRef.current }),
          })
          if (res.ok) {
            setSaveStatus('saved')
          } else {
            setSaveStatus('error')
          }
        } catch {
          setSaveStatus('error')
        }
      }, 1500)
    },
    []
  )

  const handleElementAdd = useCallback(
    (newElement: WhiteboardElement, allElements: WhiteboardElement[]) => {
      // Skip undo tracking on initial load
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true
      } else {
        // Push current elements to undo stack
        setUndoStack((stack) => {
          const next = [...stack, elements]
          return next.length > 100 ? next.slice(-100) : next
        })
        setRedoStack([])
      }
      setElements(allElements)
      debouncedSave(allElements)
    },
    [elements, debouncedSave]
  )

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    setRedoStack((r) => [...r, elements])
    setUndoStack((u) => u.slice(0, -1))
    setElements(prev)
    elementsRef.current = prev
    debouncedSave(prev)
  }, [undoStack, elements, debouncedSave])

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    setUndoStack((u) => [...u, elements])
    setRedoStack((r) => r.slice(0, -1))
    setElements(next)
    elementsRef.current = next
    debouncedSave(next)
  }, [redoStack, elements, debouncedSave])

  const handleClear = useCallback(() => {
    setShowClearDialog(false)
    setUndoStack((u) => [...u, elements])
    setRedoStack([])
    setElements([])
    elementsRef.current = []
    debouncedSave([])
  }, [elements, debouncedSave])

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      // Ctrl/Cmd+Z for undo, Ctrl/Cmd+Shift+Z for redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) handleRedo()
        else handleUndo()
        return
      }

      // Tool shortcuts
      const toolShortcut: Record<string, ToolType> = {
        v: 'select', p: 'pen', l: 'line', a: 'arrow',
        r: 'rectangle', c: 'circle', t: 'text', e: 'eraser',
      }
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const lower = e.key.toLowerCase()
        if (toolShortcut[lower]) {
          setActiveTool(toolShortcut[lower])
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleUndo, handleRedo])

  // ── Zoom controls ───────────────────────────────────────────────────────
  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.15, 4)), [])
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.15, 0.25)), [])
  const handleZoomFit = useCallback(() => setZoom(1), [])

  // ── Export ──────────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const canvas = canvasRef.current?.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'alvision-whiteboard.png'
    link.href = canvas.toDataURL()
    link.click()
  }, [])

  // ── Save status icon ────────────────────────────────────────────────────
  const saveStatusIcon =
    saveStatus === 'saving' ? (
      <div className='h-3 w-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin' />
    ) : saveStatus === 'saved' ? (
      <div className='h-3 w-3 rounded-full bg-emerald-500' />
    ) : saveStatus === 'error' ? (
      <div className='h-3 w-3 rounded-full bg-rose-500' />
    ) : null

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={200}>
      {/* Full-screen overlay */}
      <div className='fixed inset-0 z-[100] bg-slate-900 flex flex-col'>
        {/* ─── Top Toolbar ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className='z-50 flex items-center gap-1 px-3 py-2 bg-slate-800/90 backdrop-blur-xl border-b border-slate-700/50 shadow-lg'
        >
          {/* Drawing tools — group 1: select, pen, line, arrow */}
          <div className='flex items-center gap-0.5'>
            {TOOL_ITEMS.slice(0, 4).map((item) => (
              <Tooltip key={item.tool}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTool === item.tool ? 'default' : 'ghost'}
                    size='icon'
                    className={`h-8 w-8 ${
                      activeTool === item.tool
                        ? 'bg-emerald-600 hover:bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                    }`}
                    onClick={() => setActiveTool(item.tool)}
                  >
                    {item.icon}
                    <span className='sr-only'>{item.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='bottom' className='text-xs bg-slate-800 text-slate-200 border-slate-700'>
                  {item.label} <kbd className='ml-1 text-[10px] text-slate-400 bg-slate-700 px-1 rounded'>{item.shortcut}</kbd>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Drawing tools — group 2: rectangle, circle, text, eraser */}
          <div className='flex items-center gap-0.5'>
            {TOOL_ITEMS.slice(4).map((item) => (
              <Tooltip key={item.tool}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTool === item.tool ? 'default' : 'ghost'}
                    size='icon'
                    className={`h-8 w-8 ${
                      activeTool === item.tool
                        ? 'bg-emerald-600 hover:bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                    }`}
                    onClick={() => setActiveTool(item.tool)}
                  >
                    {item.icon}
                    <span className='sr-only'>{item.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='bottom' className='text-xs bg-slate-800 text-slate-200 border-slate-700'>
                  {item.label} <kbd className='ml-1 text-[10px] text-slate-400 bg-slate-700 px-1 rounded'>{item.shortcut}</kbd>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <Separator orientation='vertical' className='mx-2 h-6 bg-slate-600/50' />

          {/* Color picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-slate-300 hover:bg-slate-700 relative'
              >
                <div
                  className='h-4 w-4 rounded-full border-2 border-slate-400'
                  style={{ backgroundColor: activeColor }}
                />
                <span className='sr-only'>Color</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-2 bg-slate-800 border-slate-700' align='start'>
              <div className='flex flex-col gap-2'>
                <p className='text-xs text-slate-400 font-medium px-1'>Colors</p>
                <div className='flex flex-wrap gap-1.5'>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      className={`h-7 w-7 rounded-full border-2 transition-all duration-150 hover:scale-110 ${
                        activeColor === c.hex
                          ? 'border-emerald-400 ring-2 ring-emerald-400/30 scale-110'
                          : 'border-slate-600 hover:border-slate-400'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      onClick={() => setActiveColor(c.hex)}
                      title={c.name}
                    />
                  ))}
                </div>
                <Separator className='bg-slate-600/50' />
                <div className='flex items-center gap-2 px-1'>
                  <Palette className='h-3.5 w-3.5 text-slate-400' />
                  <input
                    type='color'
                    value={activeColor}
                    onChange={(e) => setActiveColor(e.target.value)}
                    className='h-6 w-6 cursor-pointer rounded border-0 bg-transparent'
                    title='Custom color'
                  />
                  <span className='text-xs text-slate-400'>Custom</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Quick color swatches */}
          <div className='hidden sm:flex items-center gap-0.5'>
            {PRESET_COLORS.slice(0, 5).map((c) => (
              <button
                key={c.hex}
                className={`h-5 w-5 rounded-full border transition-all duration-100 hover:scale-125 ${
                  activeColor === c.hex
                    ? 'border-emerald-400 scale-125'
                    : 'border-slate-600'
                }`}
                style={{ backgroundColor: c.hex }}
                onClick={() => setActiveColor(c.hex)}
                title={c.name}
              />
            ))}
          </div>

          <Separator orientation='vertical' className='mx-2 h-6 bg-slate-600/50' />

          {/* Stroke width */}
          <div className='flex items-center gap-0.5'>
            {STROKE_OPTIONS.map((sw) => (
              <Tooltip key={sw.value}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeWidth === sw.value ? 'default' : 'ghost'}
                    size='icon'
                    className={`h-8 w-8 ${
                      activeWidth === sw.value
                        ? 'bg-emerald-600 hover:bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                    }`}
                    onClick={() => setActiveWidth(sw.value)}
                  >
                    <span
                      className='rounded-full bg-current'
                      style={{
                        width: `${Math.min(sw.value * 2, 14)}px`,
                        height: `${Math.min(sw.value * 2, 14)}px`,
                      }}
                    />
                    <span className='sr-only'>{sw.label} ({sw.value}px)</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='bottom' className='text-xs bg-slate-800 text-slate-200 border-slate-700'>
                  {sw.label} ({sw.value}px)
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <Separator orientation='vertical' className='mx-2 h-6 bg-slate-600/50' />

          {/* Undo / Redo / Clear */}
          <div className='flex items-center gap-0.5'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                  onClick={handleUndo}
                  disabled={!canUndo}
                >
                  <Undo2 className='h-4 w-4' />
                  <span className='sr-only'>Undo</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='text-xs bg-slate-800 text-slate-200 border-slate-700'>
                Undo <kbd className='ml-1 text-[10px] text-slate-400 bg-slate-700 px-1 rounded'>⌘Z</kbd>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                  onClick={handleRedo}
                  disabled={!canRedo}
                >
                  <Redo2 className='h-4 w-4' />
                  <span className='sr-only'>Redo</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='text-xs bg-slate-800 text-slate-200 border-slate-700'>
                Redo <kbd className='ml-1 text-[10px] text-slate-400 bg-slate-700 px-1 rounded'>⌘⇧Z</kbd>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-slate-300 hover:bg-rose-500/20 hover:text-rose-400'
                  onClick={() => setShowClearDialog(true)}
                >
                  <Trash2 className='h-4 w-4' />
                  <span className='sr-only'>Clear all</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='text-xs bg-slate-800 text-slate-200 border-slate-700'>
                Clear all
              </TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation='vertical' className='mx-2 h-6 bg-slate-600/50' />

          {/* Zoom controls */}
          <div className='flex items-center gap-0.5'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                  onClick={handleZoomOut}
                >
                  <ZoomOut className='h-4 w-4' />
                  <span className='sr-only'>Zoom out</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='text-xs bg-slate-800 text-slate-200 border-slate-700'>
                Zoom out
              </TooltipContent>
            </Tooltip>
            <span className='text-xs text-slate-400 w-11 text-center font-mono select-none'>
              {Math.round(zoom * 100)}%
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                  onClick={handleZoomIn}
                >
                  <ZoomIn className='h-4 w-4' />
                  <span className='sr-only'>Zoom in</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='text-xs bg-slate-800 text-slate-200 border-slate-700'>
                Zoom in
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                  onClick={handleZoomFit}
                >
                  <Maximize2 className='h-4 w-4' />
                  <span className='sr-only'>Fit to screen</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='text-xs bg-slate-800 text-slate-200 border-slate-700'>
                Fit to screen
              </TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation='vertical' className='mx-2 h-6 bg-slate-600/50' />

          {/* Grid toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showGrid ? 'default' : 'ghost'}
                size='icon'
                className={`h-8 w-8 ${
                  showGrid
                    ? 'bg-emerald-600 hover:bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                }`}
                onClick={() => setShowGrid(!showGrid)}
              >
                <Grid3X3 className='h-4 w-4' />
                <span className='sr-only'>Toggle grid</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side='bottom' className='text-xs bg-slate-800 text-slate-200 border-slate-700'>
              Toggle grid
            </TooltipContent>
          </Tooltip>

          {/* Export */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                onClick={handleExport}
              >
                <Download className='h-4 w-4' />
                <span className='sr-only'>Export PNG</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side='bottom' className='text-xs bg-slate-800 text-slate-200 border-slate-700'>
              Export as PNG
            </TooltipContent>
          </Tooltip>

          {/* Spacer */}
          <div className='flex-1' />

          {/* Save status + info */}
          <div className='flex items-center gap-2'>
            {saveStatusIcon && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className='flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-700/50'>
                    {saveStatusIcon}
                    <span className='text-[10px] text-slate-400'>
                      {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save failed'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side='bottom' className='text-xs bg-slate-800 text-slate-200 border-slate-700'>
                  Auto-saved to cloud
                </TooltipContent>
              </Tooltip>
            )}

            <div className='hidden sm:flex items-center gap-1.5 text-slate-500'>
              <Save className='h-3.5 w-3.5' />
              <span className='text-[10px]'>Auto-save</span>
            </div>

            {/* Element count */}
            <span className='text-[10px] text-slate-500 font-mono'>{elements.length} objects</span>
          </div>
        </motion.div>

        {/* ─── Canvas Area ──────────────────────────────────────────────── */}
        <div ref={canvasRef} className='flex-1 relative overflow-hidden'>
          <WhiteboardCanvas
            elements={elements}
            onElementAdd={handleElementAdd}
            activeTool={activeTool}
            activeColor={activeColor}
            activeWidth={activeWidth}
            showGrid={showGrid}
            zoom={zoom}
          />

          {/* ─── Bottom-left tool indicator ──────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
            className='absolute bottom-4 left-4 z-40 flex items-center gap-2 bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-lg px-3 py-2 shadow-lg'
          >
            {React.cloneElement(
              TOOL_ITEMS.find((t) => t.tool === activeTool)!.icon as React.ReactElement<{ className?: string }>,
              { className: 'h-3.5 w-3.5 text-emerald-400' }
            )}
            <span className='text-xs text-slate-300 font-medium'>
              {TOOL_ITEMS.find((t) => t.tool === activeTool)?.label}
            </span>
            <Separator orientation='vertical' className='h-4 mx-1 bg-slate-600/50' />
            <div
              className='h-3.5 w-3.5 rounded-full border border-slate-500'
              style={{ backgroundColor: activeColor }}
            />
            <span className='text-xs text-slate-400'>{activeWidth}px</span>
          </motion.div>
        </div>

        {/* ─── Clear Confirmation Dialog ────────────────────────────────── */}
        <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <AlertDialogContent className='bg-slate-800 border-slate-700'>
            <AlertDialogHeader>
              <AlertDialogTitle className='text-slate-100'>Clear entire whiteboard?</AlertDialogTitle>
              <AlertDialogDescription className='text-slate-400'>
                This will remove all drawings, shapes, and text from the whiteboard. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className='bg-slate-700 text-slate-200 hover:bg-slate-600 border-slate-600'>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClear}
                className='bg-rose-600 text-white hover:bg-rose-700'
              >
                Clear all
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
