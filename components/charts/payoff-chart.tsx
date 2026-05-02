"use client"

import { useEffect, useRef } from "react"
import type { PayoffPoint } from "@/lib/payoff"

interface Props {
  points: PayoffPoint[]
  spot: number
  breakevens: number[]
  // Optional T+0 (current day) payoff points for the dotted secondary line.
  todayPoints?: PayoffPoint[]
}

// Bloomberg-grade payoff diagram: stark line, no green/red area shading.
// Theoretical (expiry) payoff = solid amber; T+0 (current day) = dotted cyan.
export function PayoffChart({ points, spot, breakevens, todayPoints }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap || points.length === 0) return
    const dpr = window.devicePixelRatio || 1
    const w = wrap.clientWidth
    const h = wrap.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, w, h)

    const pad = { l: 56, r: 12, t: 10, b: 22 }
    const cw = w - pad.l - pad.r
    const ch = h - pad.t - pad.b

    const minSpot = points[0].spot
    const maxSpot = points[points.length - 1].spot
    let minPnl = Math.min(...points.map((p) => p.pnl))
    let maxPnl = Math.max(...points.map((p) => p.pnl))
    if (todayPoints) {
      minPnl = Math.min(minPnl, ...todayPoints.map((p) => p.pnl))
      maxPnl = Math.max(maxPnl, ...todayPoints.map((p) => p.pnl))
    }
    const range = Math.max(Math.abs(minPnl), Math.abs(maxPnl)) || 1
    minPnl = -range
    maxPnl = range

    const xFor = (s: number) => pad.l + ((s - minSpot) / (maxSpot - minSpot)) * cw
    const yFor = (v: number) => pad.t + ch - ((v - minPnl) / (maxPnl - minPnl)) * ch

    // Faint dotted gridlines — Bloomberg-grade
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 1
    ctx.setLineDash([1, 3])
    for (let i = 0; i <= 5; i++) {
      const y = pad.t + (ch / 5) * i
      ctx.beginPath()
      ctx.moveTo(pad.l, y)
      ctx.lineTo(pad.l + cw, y)
      ctx.stroke()
    }
    ctx.setLineDash([])

    // Y labels
    ctx.fillStyle = "#808080"
    ctx.font = "10px ui-monospace, Consolas, monospace"
    ctx.textAlign = "right"
    for (let i = 0; i <= 5; i++) {
      const y = pad.t + (ch / 5) * i
      const v = maxPnl - ((maxPnl - minPnl) / 5) * i
      ctx.fillText(
        v >= 0 ? `+${Math.round(v).toLocaleString()}` : Math.round(v).toLocaleString(),
        pad.l - 4,
        y + 3,
      )
    }

    // X labels
    ctx.textAlign = "center"
    for (let i = 0; i <= 6; i++) {
      const x = pad.l + (cw / 6) * i
      const s = minSpot + ((maxSpot - minSpot) / 6) * i
      ctx.fillText(s.toFixed(0), x, h - 6)
    }

    // Hard zero rule — solid amber, single pixel.
    ctx.strokeStyle = "#8a5a14"
    ctx.lineWidth = 1
    ctx.beginPath()
    const zeroY = yFor(0)
    ctx.moveTo(pad.l, zeroY)
    ctx.lineTo(pad.l + cw, zeroY)
    ctx.stroke()

    // Spot vertical (solid white, 1px)
    ctx.strokeStyle = "#ffffff"
    ctx.beginPath()
    ctx.moveTo(xFor(spot), pad.t)
    ctx.lineTo(xFor(spot), pad.t + ch)
    ctx.stroke()
    ctx.fillStyle = "#ffffff"
    ctx.textAlign = "left"
    ctx.fillText(`SPOT ${spot.toFixed(0)}`, xFor(spot) + 3, pad.t + 10)

    // Breakevens — dotted yellow
    ctx.strokeStyle = "#ffd400"
    ctx.setLineDash([2, 4])
    breakevens.forEach((be) => {
      ctx.beginPath()
      ctx.moveTo(xFor(be), pad.t)
      ctx.lineTo(xFor(be), pad.t + ch)
      ctx.stroke()
      ctx.fillStyle = "#ffd400"
      ctx.textAlign = "left"
      ctx.fillText(`BE ${be.toFixed(0)}`, xFor(be) + 3, pad.t + ch - 4)
    })
    ctx.setLineDash([])

    // T+0 current-day payoff (dotted cyan), drawn first so theoretical sits on top.
    if (todayPoints && todayPoints.length > 0) {
      ctx.strokeStyle = "#00d3e6"
      ctx.lineWidth = 1
      ctx.setLineDash([2, 3])
      ctx.beginPath()
      todayPoints.forEach((p, i) => {
        const x = xFor(p.spot)
        const y = yFor(p.pnl)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Theoretical (expiry) payoff — solid amber, no fill.
    ctx.strokeStyle = "#ffa028"
    ctx.lineWidth = 1.5
    ctx.beginPath()
    points.forEach((p, i) => {
      const x = xFor(p.spot)
      const y = yFor(p.pnl)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Inline legend (text only)
    ctx.font = "9px ui-monospace, Consolas, monospace"
    ctx.textAlign = "left"
    ctx.fillStyle = "#ffa028"
    ctx.fillText("─ EXPIRY", pad.l, pad.t - 1)
    if (todayPoints && todayPoints.length > 0) {
      ctx.fillStyle = "#00d3e6"
      ctx.fillText("· · T+0", pad.l + 60, pad.t - 1)
    }
  }, [points, spot, breakevens, todayPoints])

  return (
    <div ref={wrapRef} className="w-full h-full">
      <canvas ref={canvasRef} />
    </div>
  )
}
