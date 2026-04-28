"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import Link from "next/link"
import { fmtPct } from "@/lib/format"

export interface TreemapItem {
  id: string
  label: string
  sublabel?: string
  weight: number // size
  value: number // color metric e.g. ret1d
  href?: string
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
  item: TreemapItem
}

// Squarified treemap algorithm (Bruls et al.)
function squarify(items: TreemapItem[], x: number, y: number, w: number, h: number): Rect[] {
  const total = items.reduce((s, i) => s + i.weight, 0)
  if (total === 0 || items.length === 0) return []
  const scaled = items.map((i) => ({ ...i, _v: (i.weight / total) * w * h }))

  const out: Rect[] = []

  function worst(row: typeof scaled, length: number): number {
    if (row.length === 0) return Infinity
    const sum = row.reduce((s, r) => s + r._v, 0)
    const sumSq = sum * sum
    const lenSq = length * length
    let max = -Infinity
    let min = Infinity
    for (const r of row) {
      max = Math.max(max, r._v)
      min = Math.min(min, r._v)
    }
    return Math.max((lenSq * max) / sumSq, sumSq / (lenSq * min))
  }

  function layoutRow(row: typeof scaled, length: number, rect: { x: number; y: number; w: number; h: number }) {
    const sum = row.reduce((s, r) => s + r._v, 0)
    const horizontal = rect.w >= rect.h
    const thickness = sum / length
    let cx = rect.x
    let cy = rect.y
    for (const r of row) {
      const sz = r._v / thickness
      if (horizontal) {
        out.push({ x: rect.x, y: cy, w: thickness, h: sz, item: r })
        cy += sz
      } else {
        out.push({ x: cx, y: rect.y, w: sz, h: thickness, item: r })
        cx += sz
      }
    }
    if (horizontal) {
      return { x: rect.x + thickness, y: rect.y, w: rect.w - thickness, h: rect.h }
    }
    return { x: rect.x, y: rect.y + thickness, w: rect.w, h: rect.h - thickness }
  }

  function recurse(remaining: typeof scaled, rect: { x: number; y: number; w: number; h: number }) {
    if (!remaining.length) return
    const row: typeof scaled = []
    let i = 0
    const length = Math.min(rect.w, rect.h)
    while (i < remaining.length) {
      const next = remaining[i]
      const trial = [...row, next]
      if (row.length === 0 || worst(trial, length) <= worst(row, length)) {
        row.push(next)
        i++
      } else {
        const newRect = layoutRow(row, length, rect)
        recurse(remaining.slice(i), newRect)
        return
      }
    }
    layoutRow(row, length, rect)
  }

  recurse(scaled, { x, y, w, h })
  return out
}

// Map ret1d to red/green intensity background hex
function colorFor(v: number): string {
  // -5% .. +5% range
  const t = Math.max(-0.05, Math.min(0.05, v)) / 0.05 // -1..1
  if (t > 0) {
    // green
    const a = Math.abs(t)
    const g = Math.floor(60 + a * 195)
    return `rgb(0,${g},${Math.floor(40 * (1 - a))})`
  }
  if (t < 0) {
    const a = Math.abs(t)
    const r = Math.floor(60 + a * 195)
    return `rgb(${r},${Math.floor(15 * (1 - a))},${Math.floor(30 * (1 - a))})`
  }
  return "#1a1a1a"
}

export function Treemap({ items, title }: { items: TreemapItem[]; title?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 500 })
  const [hover, setHover] = useState<TreemapItem | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setSize({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const rects = useMemo(
    () => squarify([...items].sort((a, b) => b.weight - a.weight), 0, 0, size.w, size.h),
    [items, size],
  )

  return (
    <div ref={ref} className="relative w-full h-full bg-black select-none">
      {rects.map((r) => {
        const tiny = r.w < 36 || r.h < 18
        const small = r.w < 70 || r.h < 30
        const fontSize = small ? 9 : Math.max(10, Math.min(14, r.w / 8))
        const content = (
          <div
            key={r.item.id}
            className="absolute overflow-hidden border border-black/60"
            style={{
              left: r.x,
              top: r.y,
              width: r.w,
              height: r.h,
              background: colorFor(r.item.value),
            }}
            onMouseEnter={() => setHover(r.item)}
            onMouseLeave={() => setHover(null)}
          >
            {!tiny && (
              <div className="px-1 py-[1px] text-white" style={{ fontSize, lineHeight: 1.1 }}>
                <div className="font-bold tracking-tight truncate">{r.item.label}</div>
                {!small && (
                  <div className="text-[10px] opacity-90 truncate">{fmtPct(r.item.value)}</div>
                )}
              </div>
            )}
          </div>
        )
        return r.item.href ? (
          <Link key={r.item.id} href={r.item.href} className="contents">
            {content}
          </Link>
        ) : (
          content
        )
      })}
      {hover && (
        <div className="absolute bottom-1 right-1 px-2 py-1 text-[10px] bg-black border border-[var(--color-amber)] text-[var(--color-amber)] z-10 pointer-events-none">
          <div className="font-bold">{hover.label}</div>
          {hover.sublabel && <div className="text-[var(--color-mute)]">{hover.sublabel}</div>}
          <div>RET 1D: {fmtPct(hover.value)}</div>
        </div>
      )}
    </div>
  )
}
