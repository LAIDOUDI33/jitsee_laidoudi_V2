'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pen,
  Eraser,
  Type,
  MousePointer2,
  Square,
  Circle,
  Minus,
  MoveRight,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3X3,
  Users,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/app-store'

// ─── Types ───────────────────────────────────────────────────────────────────

type ToolType =
  | 'select'
  | 'pen'
  | 'eraser'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'text'

interface DrawAction {
  type: ToolType
  points: { x: number; y: number }[]
  color: string
  width: number
  text?: string
}

interface Collaborator {
  id: string
  name: string
  color: string
  x: number
  y: number
}

const COLORS = [
  '#000000',
  '#EF4444',
  '#3B82F6',
  '#22C55E',
  '#F97316',
  '#A855F7',
  '#EC4899',
  '#6B7280',
]

const STROKE_WIDTHS = [2, 4, 6, 8]

const TOOL_ITEMS: { tool: ToolType; icon: React.ReactNode; label: string }[] = [
  { tool: 'select', icon: <MousePointer2 className='h-4 w-4' />, label: 'Select' },
  { tool: 'pen', icon: <Pen className='h-4 w-4' />, label: 'Pen' },
  { tool: 'eraser', icon: <Eraser className='h-4 w-4' />, label: 'Eraser' },
  { tool: 'rectangle', icon: <Square className='h-4 w-4' />, label: 'Rectangle' },
  { tool: 'circle', icon: <Circle className='h-4 w-4' />, label: 'Circle' },
  { tool: 'line', icon: <Minus className='h-4 w-4' />, label: 'Line' },
  { tool: 'arrow', icon: <MoveRight className='h-4 w-4' />, label: 'Arrow' },
  { tool: 'text', icon: <Type className='h-4 w-4' />, label: 'Text' },
]

const MOCK_COLLABORATORS: Collaborator[] = [
  { id: 'c1', name: 'Sarah Chen', color: '#3B82F6', x: 320, y: 200 },
  { id: 'c2', name: 'Alex Rivera', color: '#EF4444', x: 600, y: 350 },
  { id: 'c3', name: 'Priya Sharma', color: '#22C55E', x: 450, y: 150 },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function WhiteboardPage() {
  const { user } = useAppStore()

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const minimapRef = useRef<HTMLCanvasElement>(null)

  // Tool state
  const [activeTool, setActiveTool] = useState<ToolType>('pen')
  const [activeColor, setActiveColor] = useState(COLORS[0])
  const [activeWidth, setActiveWidth] = useState(STROKE_WIDTHS[1])
  const [showGrid, setShowGrid] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [isDrawing, setIsDrawing] = useState(false)

  // History state
  const [history, setHistory] = useState<DrawAction[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [currentAction, setCurrentAction] = useState<DrawAction | null>(null)

  // Canvas dimensions
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Text input state
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null)
  const [textValue, setTextValue] = useState('')

  // Collaborator cursor animation
  const [collaborators, setCollaborators] = useState<Collaborator[]>(MOCK_COLLABORATORS)

  // ─── Resize handler ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ─── Draw single action ──────────────────────────────────────────────────
  const drawAction = useCallback(
    (ctx: CanvasRenderingContext2D, action: DrawAction) => {
      if (!action || action.points.length === 0) return

      ctx.save()
      ctx.strokeStyle = action.color
      ctx.lineWidth = action.width * zoom
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (action.type === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.strokeStyle = 'rgba(0,0,0,1)'
      }

      if (action.type === 'pen' || action.type === 'eraser' || action.type === 'select') {
        ctx.beginPath()
        ctx.moveTo(action.points[0].x * zoom, action.points[0].y * zoom)
        for (let i = 1; i < action.points.length; i++) {
          const prev = action.points[i - 1]
          const curr = action.points[i]
          const mx = ((prev.x + curr.x) / 2) * zoom
          const my = ((prev.y + curr.y) / 2) * zoom
          ctx.quadraticCurveTo(prev.x * zoom, prev.y * zoom, mx, my)
        }
        ctx.stroke()
      } else if (action.type === 'rectangle') {
        const start = action.points[0]
        const end = action.points[action.points.length - 1]
        ctx.strokeRect(
          start.x * zoom,
          start.y * zoom,
          (end.x - start.x) * zoom,
          (end.y - start.y) * zoom
        )
      } else if (action.type === 'circle') {
        const start = action.points[0]
        const end = action.points[action.points.length - 1]
        const rx = Math.abs((end.x - start.x) / 2) * zoom
        const ry = Math.abs((end.y - start.y) / 2) * zoom
        const cx = ((start.x + end.x) / 2) * zoom
        const cy = ((start.y + end.y) / 2) * zoom
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        ctx.stroke()
      } else if (action.type === 'line') {
        const start = action.points[0]
        const end = action.points[action.points.length - 1]
        ctx.beginPath()
        ctx.moveTo(start.x * zoom, start.y * zoom)
        ctx.lineTo(end.x * zoom, end.y * zoom)
        ctx.stroke()
      } else if (action.type === 'arrow') {
        const start = action.points[0]
        const end = action.points[action.points.length - 1]
        const sx = start.x * zoom
        const sy = start.y * zoom
        const ex = end.x * zoom
        const ey = end.y * zoom
        const angle = Math.atan2(ey - sy, ex - sx)
        const headLen = 14 * zoom
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(ex, ey)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(ex, ey)
        ctx.lineTo(ex - headLen * Math.cos(angle - Math.PI / 6), ey - headLen * Math.sin(angle - Math.PI / 6))
        ctx.moveTo(ex, ey)
        ctx.lineTo(ex - headLen * Math.cos(angle + Math.PI / 6), ey - headLen * Math.sin(angle + Math.PI / 6))
        ctx.stroke()
      } else if (action.type === 'text' && action.text) {
        ctx.fillStyle = action.color
        ctx.font = `${action.width * 4 * zoom}px Inter, system-ui, sans-serif`
        ctx.fillText(action.text, action.points[0].x * zoom, action.points[0].y * zoom)
      }
      ctx.restore()
    },
    [zoom]
  )

  // ─── Redraw canvas ──────────────────────────────────────────────────────
  const redrawCanvas = useCallback(
    (ctx: CanvasRenderingContext2D, actions: DrawAction[][]) => {
      const w = canvasSize.width
      const h = canvasSize.height
      ctx.clearRect(0, 0, w, h)

      // Draw grid
      if (showGrid) {
        ctx.save()
        ctx.fillStyle = '#94a3b8'
        const spacing = 24 * zoom
        for (let x = 0; x < w; x += spacing) {
          for (let y = 0; y < h; y += spacing) {
            ctx.beginPath()
            ctx.arc(x, y, 1 * zoom, 0, Math.PI * 2)
            ctx.fill()
          }
        }
        ctx.restore()
      }

      // Draw all actions
      for (const action of actions.flat()) {
        drawAction(ctx, action)
      }
    },
    [canvasSize, showGrid, zoom, drawAction]
  )

  // ─── Canvas effect ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvasSize.width
    canvas.height = canvasSize.height

    const snapshot = [...history.slice(0, historyIndex + 1)]
    redrawCanvas(ctx, snapshot)

    // Draw current action being drawn
    if (currentAction) {
      drawAction(ctx, currentAction)
    }
  }, [canvasSize, history, historyIndex, currentAction, redrawCanvas])

  // ─── Minimap effect ──────────────────────────────────────────────────────
  useEffect(() => {
    const minimap = minimapRef.current
    const canvas = canvasRef.current
    if (!minimap || !canvas) return
    const mctx = minimap.getContext('2d')
    if (!mctx) return

    const mw = 180
    const mh = Math.round((mw / canvasSize.width) * canvasSize.height)
    minimap.width = mw
    minimap.height = mh
    minimap.style.height = `${mh}px`

    mctx.fillStyle = '#ffffff'
    mctx.fillRect(0, 0, mw, mh)
    mctx.drawImage(canvas, 0, 0, mw, mh)
    mctx.strokeStyle = '#94a3b8'
    mctx.lineWidth = 1
    mctx.strokeRect(0, 0, mw, mh)
  }, [canvasSize, history, historyIndex, currentAction])

  // ─── Get position from mouse/touch event ─────────────────────────────────
  function getPosition(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom,
    }
  }

  // ─── Mouse / Touch handlers ─────────────────────────────────────────────
  function handlePointerDown(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const pos = getPosition(e)

    if (activeTool === 'text') {
      setTextInput({ x: pos.x, y: pos.y })
      setTextValue('')
      return
    }

    setIsDrawing(true)
    const action: DrawAction = {
      type: activeTool,
      points: [pos],
      color: activeColor,
      width: activeWidth,
    }
    setCurrentAction(action)
  }

  function handlePointerMove(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing || !currentAction) return
    const pos = getPosition(e)
    setCurrentAction({ ...currentAction, points: [...currentAction.points, pos] })
  }

  function handlePointerUp() {
    if (!isDrawing || !currentAction) {
      setIsDrawing(false)
      return
    }
    setIsDrawing(false)

    if (currentAction.points.length > 0) {
      const newHistory = [...history.slice(0, historyIndex + 1), [...history[historyIndex], currentAction]]
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    }
    setCurrentAction(null)
  }

  // ─── Text submit handler ──────────────────────────────────────────────────
  function handleTextSubmit() {
    if (!textInput || !textValue.trim()) {
      setTextInput(null)
      return
    }
    const action: DrawAction = {
      type: 'text',
      points: [{ x: textInput.x, y: textInput.y }],
      color: activeColor,
      width: activeWidth,
      text: textValue,
    }
    const newHistory = [...history.slice(0, historyIndex + 1), [...history[historyIndex], action]]
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setTextInput(null)
    setTextValue('')
  }

  // ─── Undo / Redo ─────────────────────────────────────────────────────────
  function handleUndo() {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
    }
  }

  function handleRedo() {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
    }
  }

  // ─── Clear canvas ─────────────────────────────────────────────────────────
  function handleClear() {
    setHistory([[]])
    setHistoryIndex(0)
    setCurrentAction(null)
  }

  // ─── Zoom controls ───────────────────────────────────────────────────────
  function handleZoomIn() {
    setZoom((z) => Math.min(z + 0.1, 3))
  }

  function handleZoomOut() {
    setZoom((z) => Math.max(z - 0.1, 0.3))
  }

  function handleZoomFit() {
    setZoom(1)
  }

  // ─── Collaborator cursor animation ────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setCollaborators((prev) =>
        prev.map((c) => ({
          ...c,
          x: c.x + (Math.random() - 0.5) * 30,
          y: c.y + (Math.random() - 0.5) * 30,
        }))
      )
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // ─── Export canvas ───────────────────────────────────────────────────────
  function handleExport() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'alvision-whiteboard.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <TooltipProvider delayDuration={200}>
      <div className='relative h-screen w-screen overflow-hidden bg-background flex flex-col'>
        {/* ─── Top Toolbar ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className='z-50 flex items-center gap-1 px-3 py-2 bg-white/80 dark:bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-sm'
        >
          {/* Drawing tools */}
          <div className='flex items-center gap-0.5'>
            {TOOL_ITEMS.map((item) => (
              <Tooltip key={item.tool}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTool === item.tool ? 'default' : 'ghost'}
                    size='icon'
                    className={`h-8 w-8 ${
                      activeTool === item.tool
                        ? 'shadow-md shadow-primary/20'
                        : 'hover:bg-muted/80'
                    }`}
                    onClick={() => setActiveTool(item.tool)}
                  >
                    {item.icon}
                    <span className='sr-only'>{item.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='bottom' className='text-xs'>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <Separator orientation='vertical' className='mx-2 h-6' />

          {/* Color picker */}
          <div className='flex items-center gap-1'>
            {COLORS.map((color) => (
              <button
                key={color}
                className={`h-6 w-6 rounded-full border-2 transition-all duration-150 hover:scale-110 ${
                  activeColor === color
                    ? 'border-foreground ring-2 ring-primary/30 scale-110'
                    : 'border-transparent hover:border-muted-foreground/50'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setActiveColor(color)}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>

          <Separator orientation='vertical' className='mx-2 h-6' />

          {/* Stroke width */}
          <div className='flex items-center gap-1'>
            {STROKE_WIDTHS.map((w) => (
              <Tooltip key={w}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeWidth === w ? 'default' : 'ghost'}
                    size='icon'
                    className={`h-8 w-8 ${
                      activeWidth === w
                        ? 'shadow-md shadow-primary/20'
                        : 'hover:bg-muted/80'
                    }`}
                    onClick={() => setActiveWidth(w)}
                  >
                    <span
                      className='rounded-full bg-current'
                      style={{
                        width: `${Math.min(w * 2, 14)}px`,
                        height: `${Math.min(w * 2, 14)}px`,
                      }}
                    />
                    <span className='sr-only'>{w}px stroke</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='bottom' className='text-xs'>
                  {w}px
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <Separator orientation='vertical' className='mx-2 h-6' />

          {/* Undo / Redo / Clear */}
          <div className='flex items-center gap-0.5'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 hover:bg-muted/80'
                  onClick={handleUndo}
                  disabled={historyIndex === 0}
                >
                  <Undo2 className='h-4 w-4' />
                  <span className='sr-only'>Undo</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='text-xs'>Undo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 hover:bg-muted/80'
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                >
                  <Redo2 className='h-4 w-4' />
                  <span className='sr-only'>Redo</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='text-xs'>Redo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 hover:bg-destructive/10 hover:text-destructive'
                  onClick={handleClear}
                >
                  <Trash2 className='h-4 w-4' />
                  <span className='sr-only'>Clear</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='text-xs'>Clear canvas</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation='vertical' className='mx-2 h-6' />

          {/* Zoom controls */}
          <div className='flex items-center gap-0.5'>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 hover:bg-muted/80'
                  onClick={handleZoomOut}
                >
                  <ZoomOut className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='text-xs'>Zoom out</TooltipContent>
            </Tooltip>
            <span className='text-xs text-muted-foreground w-12 text-center font-mono'>
              {Math.round(zoom * 100)}%
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 hover:bg-muted/80'
                  onClick={handleZoomIn}
                >
                  <ZoomIn className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='text-xs'>Zoom in</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 hover:bg-muted/80'
                  onClick={handleZoomFit}
                >
                  <Maximize2 className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom' className='text-xs'>Fit to screen</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation='vertical' className='mx-2 h-6' />

          {/* Grid toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showGrid ? 'default' : 'ghost'}
                size='icon'
                className={`h-8 w-8 ${showGrid ? 'shadow-md shadow-primary/20' : 'hover:bg-muted/80'}`}
                onClick={() => setShowGrid(!showGrid)}
              >
                <Grid3X3 className='h-4 w-4' />
                <span className='sr-only'>Toggle grid</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side='bottom' className='text-xs'>
              Toggle grid
            </TooltipContent>
          </Tooltip>

          {/* Export */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 hover:bg-muted/80'
                onClick={handleExport}
              >
                <Download className='h-4 w-4' />
                <span className='sr-only'>Export</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side='bottom' className='text-xs'>Export as PNG</TooltipContent>
          </Tooltip>

          {/* Spacer */}
          <div className='flex-1' />

          {/* Collaboration indicators */}
          <div className='flex items-center gap-3'>
            {/* Live indicator */}
            <Badge
              variant='outline'
              className='gap-1.5 bg-emerald-500/10 border-emerald-500/30 text-emerald-600 text-xs py-0.5 px-2'
            >
              <span className='relative flex h-2 w-2'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75' />
                <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500' />
              </span>
              Live
            </Badge>

            {/* Participants */}
            <div className='flex items-center gap-1'>
              <Users className='h-4 w-4 text-muted-foreground' />
              <span className='text-xs text-muted-foreground font-medium'>
                {collaborators.length + 1}
              </span>
              <div className='flex -space-x-2 ml-1'>
                {collaborators.map((c) => (
                  <div
                    key={c.id}
                    className='h-6 w-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white'
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  >
                    {c.name.charAt(0)}
                  </div>
                ))}
                <div className='h-6 w-6 rounded-full border-2 border-background bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground'>
                  {user?.name?.charAt(0) || 'Y'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Canvas Area ──────────────────────────────────────────────── */}
        <div ref={containerRef} className='flex-1 relative overflow-hidden'>
          <canvas
            ref={canvasRef}
            className='absolute inset-0 cursor-crosshair'
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
              touchAction: 'none',
            }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />

          {/* Custom cursor styles for tools */}
          <style jsx>{`
            canvas.tool-eraser { cursor: cell !important; }
            canvas.tool-select { cursor: default !important; }
            canvas.tool-text { cursor: text !important; }
          `}</style>

          {/* ─── Text Input Overlay ──────────────────────────────────────── */}
          <AnimatePresence>
            {textInput && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className='absolute z-40'
                style={{
                  left: textInput.x * zoom,
                  top: textInput.y * zoom,
                }}
              >
                <input
                  type='text'
                  autoFocus
                  className='bg-white/90 dark:bg-card/90 backdrop-blur-sm border border-primary/40 rounded-md px-2 py-1 text-sm shadow-lg outline-none ring-2 ring-primary/20 min-w-[120px]'
                  placeholder='Type here...'
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTextSubmit()
                    if (e.key === 'Escape') {
                      setTextInput(null)
                      setTextValue('')
                    }
                  }}
                  onBlur={handleTextSubmit}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Mock Collaborator Cursors ────────────────────────────────── */}
          {collaborators.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: c.x * zoom,
                y: c.y * zoom,
              }}
              transition={{ type: 'spring', stiffness: 120, damping: 14, duration: 0.8 }}
              className='absolute z-30 pointer-events-none'
            >
              {/* Cursor SVG */}
              <svg
                width='16'
                height='20'
                viewBox='0 0 16 20'
                fill='none'
                className='drop-shadow-sm'
              >
                <path
                  d='M1 1L6 18L8.5 11L15 9.5L1 1Z'
                  fill={c.color}
                  stroke='white'
                  strokeWidth='1.5'
                  strokeLinejoin='round'
                />
              </svg>
              {/* Name label */}
              <span
                className='absolute left-4 top-4 text-[10px] font-medium px-1.5 py-0.5 rounded-md text-white whitespace-nowrap shadow-sm'
                style={{ backgroundColor: c.color }}
              >
                {c.name.split(' ')[0]}
              </span>
            </motion.div>
          ))}

          {/* ─── Mini-map ─────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
            className='absolute bottom-4 right-4 z-40 rounded-lg border border-border/50 bg-white/90 dark:bg-card/90 backdrop-blur-sm shadow-lg overflow-hidden'
          >
            <canvas ref={minimapRef} className='block' />
          </motion.div>

          {/* ─── Tool label indicator (bottom-left) ──────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
            className='absolute bottom-4 left-4 z-40 flex items-center gap-2 bg-white/90 dark:bg-card/90 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 shadow-lg'
          >
            {React.cloneElement(
              TOOL_ITEMS.find((t) => t.tool === activeTool)!.icon,
              { className: 'h-3.5 w-3.5 text-muted-foreground' }
            )}
            <span className='text-xs text-muted-foreground font-medium'>
              {TOOL_ITEMS.find((t) => t.tool === activeTool)?.label}
            </span>
            <Separator orientation='vertical' className='h-4 mx-1' />
            <div
              className='h-3.5 w-3.5 rounded-full border'
              style={{ borderColor: activeColor, backgroundColor: activeColor }}
            />
            <span className='text-xs text-muted-foreground'>{activeWidth}px</span>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  )
}
