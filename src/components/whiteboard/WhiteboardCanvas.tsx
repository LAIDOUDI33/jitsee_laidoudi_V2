'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToolType =
  | 'select'
  | 'pen'
  | 'line'
  | 'arrow'
  | 'rectangle'
  | 'circle'
  | 'text'
  | 'eraser'

export interface WhiteboardElement {
  id: string
  type: ToolType
  points: { x: number; y: number }[]
  color: string
  width: number
  text?: string
}

export interface WhiteboardCanvasProps {
  /** Controlled elements array */
  elements: WhiteboardElement[]
  /** Callback when a new element is added (for persistence + undo) */
  onElementAdd?: (element: WhiteboardElement, allElements: WhiteboardElement[]) => void
  /** Active tool controlled externally */
  activeTool?: ToolType
  /** Active color controlled externally */
  activeColor?: string
  /** Active stroke width controlled externally */
  activeWidth?: number
  /** Show dot grid background */
  showGrid?: boolean
  /** Zoom level */
  zoom?: number
  /** Embed mode: no chrome, transparent bg */
  embedded?: boolean
  /** Extra CSS class for the container */
  className?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ─── Canvas Drawing Functions ────────────────────────────────────────────────

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, zoomVal: number) {
  ctx.save()
  const spacing = 24 * zoomVal
  ctx.fillStyle = 'rgba(148, 163, 184, 0.25)'
  for (let x = spacing / 2; x < w; x += spacing) {
    for (let y = spacing / 2; y < h; y += spacing) {
      ctx.beginPath()
      ctx.arc(x, y, 1 * zoomVal, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

function drawElement(ctx: CanvasRenderingContext2D, el: WhiteboardElement, zoomVal: number) {
  if (!el || el.points.length === 0) return

  ctx.save()
  ctx.strokeStyle = el.color
  ctx.lineWidth = el.width * zoomVal
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (el.type === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
  }

  switch (el.type) {
    case 'pen':
    case 'eraser': {
      ctx.beginPath()
      ctx.moveTo(el.points[0].x * zoomVal, el.points[0].y * zoomVal)
      for (let i = 1; i < el.points.length; i++) {
        const prev = el.points[i - 1]
        const curr = el.points[i]
        const mx = ((prev.x + curr.x) / 2) * zoomVal
        const my = ((prev.y + curr.y) / 2) * zoomVal
        ctx.quadraticCurveTo(prev.x * zoomVal, prev.y * zoomVal, mx, my)
      }
      if (el.points.length > 1) {
        const last = el.points[el.points.length - 1]
        ctx.lineTo(last.x * zoomVal, last.y * zoomVal)
      }
      ctx.stroke()
      break
    }
    case 'line': {
      const start = el.points[0]
      const end = el.points[el.points.length - 1]
      ctx.beginPath()
      ctx.moveTo(start.x * zoomVal, start.y * zoomVal)
      ctx.lineTo(end.x * zoomVal, end.y * zoomVal)
      ctx.stroke()
      break
    }
    case 'arrow': {
      const start = el.points[0]
      const end = el.points[el.points.length - 1]
      const sx = start.x * zoomVal
      const sy = start.y * zoomVal
      const ex = end.x * zoomVal
      const ey = end.y * zoomVal
      const angle = Math.atan2(ey - sy, ex - sx)
      const headLen = 14 * zoomVal
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(ex, ey)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(ex, ey)
      ctx.lineTo(
        ex - headLen * Math.cos(angle - Math.PI / 6),
        ey - headLen * Math.sin(angle - Math.PI / 6)
      )
      ctx.moveTo(ex, ey)
      ctx.lineTo(
        ex - headLen * Math.cos(angle + Math.PI / 6),
        ey - headLen * Math.sin(angle + Math.PI / 6)
      )
      ctx.stroke()
      break
    }
    case 'rectangle': {
      const start = el.points[0]
      const end = el.points[el.points.length - 1]
      ctx.strokeRect(
        start.x * zoomVal,
        start.y * zoomVal,
        (end.x - start.x) * zoomVal,
        (end.y - start.y) * zoomVal
      )
      break
    }
    case 'circle': {
      const start = el.points[0]
      const end = el.points[el.points.length - 1]
      const rx = Math.abs((end.x - start.x) / 2) * zoomVal
      const ry = Math.abs((end.y - start.y) / 2) * zoomVal
      const cx = ((start.x + end.x) / 2) * zoomVal
      const cy = ((start.y + end.y) / 2) * zoomVal
      ctx.beginPath()
      ctx.ellipse(cx, cy, Math.max(rx, 0.1), Math.max(ry, 0.1), 0, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    case 'text': {
      if (el.text) {
        ctx.fillStyle = el.color
        ctx.font = `${Math.round(el.width * 5 * zoomVal)}px Inter, system-ui, sans-serif`
        ctx.fillText(el.text, el.points[0].x * zoomVal, el.points[0].y * zoomVal)
      }
      break
    }
    default:
      break
  }

  ctx.restore()
}

function redrawAll(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  elements: WhiteboardElement[],
  currentEl: WhiteboardElement | null,
  showGridFlag: boolean,
  zoomVal: number
) {
  ctx.clearRect(0, 0, w, h)
  if (showGridFlag) drawGrid(ctx, w, h, zoomVal)
  for (const el of elements) drawElement(ctx, el, zoomVal)
  if (currentEl) drawElement(ctx, currentEl, zoomVal)
}

// ─── Component ───────────────────────────────────────────────────────────────

export function WhiteboardCanvas({
  elements,
  onElementAdd,
  activeTool: externalTool = 'pen',
  activeColor: externalColor = '#ffffff',
  activeWidth: externalWidth = 4,
  showGrid: externalShowGrid = true,
  zoom: externalZoom = 1,
  embedded = false,
  className = '',
}: WhiteboardCanvasProps) {
  // ── Refs ────────────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDrawingRef = useRef(false)
  const lastPinchDistRef = useRef<number | null>(null)

  // ── Local drawing state (not persisted until complete) ───────────────────
  const [currentEl, setCurrentEl] = useState<WhiteboardElement | null>(null)
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null)
  const [textValue, setTextValue] = useState('')
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  const tool = externalTool
  const color = externalColor
  const width = externalWidth
  const showGridFlag = externalShowGrid
  const zoomVal = externalZoom

  // ── ResizeObserver ────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setCanvasSize({ width: Math.round(width), height: Math.round(height) })
        }
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // ── Redraw effect ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || canvasSize.width === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasSize.width * dpr
    canvas.height = canvasSize.height * dpr
    canvas.style.width = `${canvasSize.width}px`
    canvas.style.height = `${canvasSize.height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    redrawAll(ctx, canvasSize.width, canvasSize.height, elements, currentEl, showGridFlag, zoomVal)
  }, [canvasSize, elements, currentEl, showGridFlag, zoomVal])

  // ── Get position from pointer/touch event ────────────────────────────────
  const getPos = useCallback(
    (e: React.PointerEvent | React.TouchEvent): { x: number; y: number } => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      let cx: number, cy: number
      if ('touches' in e) {
        const touch = e.touches[0] || (e as React.TouchEvent).changedTouches?.[0]
        if (!touch) return { x: 0, y: 0 }
        cx = touch.clientX
        cy = touch.clientY
      } else {
        cx = e.clientX
        cy = e.clientY
      }
      return {
        x: (cx - rect.left) / zoomVal,
        y: (cy - rect.top) / zoomVal,
      }
    },
    [zoomVal]
  )

  // ── Finalize an element ──────────────────────────────────────────────────
  const finalizeElement = useCallback(
    (el: WhiteboardElement) => {
      // Ensure shape tools have at least 2 points
      const finalEl =
        el.points.length === 1 && el.type !== 'text'
          ? { ...el, points: [el.points[0], el.points[0]] }
          : el
      const newElements = [...elements, finalEl]
      onElementAdd?.(finalEl, newElements)
    },
    [elements, onElementAdd]
  )

  // ── Pointer down ─────────────────────────────────────────────────────────
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.button && e.button !== 0) return
      const pos = getPos(e)

      if (tool === 'text') {
        setTextInput({ x: pos.x, y: pos.y })
        setTextValue('')
        return
      }

      if (tool === 'select') return

      isDrawingRef.current = true
      ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)

      setCurrentEl({
        id: generateId(),
        type: tool,
        points: [pos],
        color,
        width,
      })
    },
    [tool, color, width, getPos]
  )

  // ── Pointer move ─────────────────────────────────────────────────────────
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !currentEl) return
      const pos = getPos(e)
      // For shape tools, only keep start + current (2 points)
      if (['rectangle', 'circle', 'line', 'arrow'].includes(currentEl.type)) {
        setCurrentEl({ ...currentEl, points: [currentEl.points[0], pos] })
      } else {
        setCurrentEl({ ...currentEl, points: [...currentEl.points, pos] })
      }
    },
    [currentEl, getPos]
  )

  // ── Pointer up ───────────────────────────────────────────────────────────
  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    if (currentEl && currentEl.points.length > 0) {
      finalizeElement(currentEl)
    }
    setCurrentEl(null)
  }, [currentEl, finalizeElement])

  // ── Touch handlers ────────────────────────────────────────────────────────
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 2) {
        isDrawingRef.current = false
        setCurrentEl(null)
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        lastPinchDistRef.current = Math.sqrt(dx * dx + dy * dy)
        return
      }
      if (e.touches.length === 1) {
        const pos = getPos(e)
        if (tool === 'text') {
          setTextInput({ x: pos.x, y: pos.y })
          setTextValue('')
          return
        }
        if (tool !== 'select') {
          isDrawingRef.current = true
          setCurrentEl({
            id: generateId(),
            type: tool,
            points: [pos],
            color,
            width,
          })
        }
      }
    },
    [tool, color, width, getPos]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 2 && lastPinchDistRef.current !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const dist = Math.sqrt(dx * dx + dy * dy)
        // Pinch-to-zoom is handled by parent via onZoomChange if needed
        lastPinchDistRef.current = dist
        return
      }
      if (!isDrawingRef.current || !currentEl) return
      e.preventDefault()
      const pos = getPos(e)
      if (['rectangle', 'circle', 'line', 'arrow'].includes(currentEl.type)) {
        setCurrentEl({ ...currentEl, points: [currentEl.points[0], pos] })
      } else {
        setCurrentEl({ ...currentEl, points: [...currentEl.points, pos] })
      }
    },
    [currentEl, getPos]
  )

  const handleTouchEnd = useCallback(() => {
    lastPinchDistRef.current = null
    if (isDrawingRef.current) {
      isDrawingRef.current = false
      if (currentEl && currentEl.points.length > 0) {
        finalizeElement(currentEl)
      }
      setCurrentEl(null)
    }
  }, [currentEl, finalizeElement])

  // ── Text submit ───────────────────────────────────────────────────────────
  const handleTextSubmit = useCallback(() => {
    if (!textInput || !textValue.trim()) {
      setTextInput(null)
      return
    }
    const el: WhiteboardElement = {
      id: generateId(),
      type: 'text',
      points: [{ x: textInput.x, y: textInput.y }],
      color,
      width,
      text: textValue,
    }
    finalizeElement(el)
    setTextInput(null)
    setTextValue('')
  }, [textInput, textValue, color, width, finalizeElement])

  // ── Cursor class ─────────────────────────────────────────────────────────
  const cursorClass =
    tool === 'select'
      ? 'cursor-default'
      : tool === 'text'
        ? 'cursor-text'
        : tool === 'eraser'
          ? 'cursor-cell'
          : 'cursor-crosshair'

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${embedded ? '' : 'flex-1'} ${className}`}
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 ${cursorClass}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Text input overlay */}
      {textInput && (
        <div
          className='absolute z-40'
          style={{
            left: textInput.x * zoomVal,
            top: textInput.y * zoomVal - 20,
          }}
        >
          <input
            type='text'
            autoFocus
            className='bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-emerald-500/40 rounded-md px-2 py-1 text-sm shadow-lg outline-none ring-2 ring-emerald-500/20 min-w-[140px] text-slate-900 dark:text-slate-100'
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
        </div>
      )}
    </div>
  )
}

export default WhiteboardCanvas
