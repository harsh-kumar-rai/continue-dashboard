"use client"

import { useEffect, useRef } from "react"
import type { PayoffPoint } from "@/lib/payoff"

interface Props {
  points: PayoffPoint[]
  spot: number
  breakevens: number[]
}

export function PayoffChart({ points, spot, breakevens }: Props) {
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
    ctx.clearRect(0, 0, w, h)

    const pad = { l: 56, r: 12, t: 10, b: 22 }
    const cw = w - pad.l - pad.r
    const ch = h - pad.t - pad.b

    const minSpot = points[0].spot
    const maxSpot = points[points.length - 1].spot
    let minPnl = Math.min(...points.map((p) => p.pnl))
    let maxPnl = Math.max(...points.map((p) => p.pnl))
    const range = Math.max(Math.abs(minPnl), Math.abs(maxPnl)) || 1
    minPnl = -range
    maxPnl = range

    const xFor = (s: number) => pad.l + ((s - minSpot) / (maxSpot - minSpot)) * cw
    const yFor = (v: number) => pad.t + ch - ((v - minPnl) / (maxPnl - minPnl)) * ch

    // Grid
    ctx.strokeStyle = "#252525"
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
      const y = pad.t + (ch / 5) * i
      ctx.beginPath()
      ctx.moveTo(pad.l, y)
      ctx.lineTo(pad.l + cw, y)
      ctx.stroke()
    }

    // Y labels
    ctx.fillStyle = "#888"
    ctx.font = "10px ui-monospace, Consolas, monospace"
    ctx.textAlign = "right"
    for (let i = 0; i <= 5; i++) {
      const y = pad.t + (ch / 5) * i
      const v = maxPnl - ((maxPnl - minPnl) / 5) * i
      ctx.fillText(v >= 0 ? `+${Math.round(v).toLocaleString()}` : Math.round(v).toLocaleString(), pad.l - 4, y + 3)
    }

    // X labels
    ctx.textAlign = "center"
    for (let i = 0; i <= 6; i++) {
      const x = pad.l + (cw / 6) * i
      const s = minSpot + ((maxSpot - minSpot) / 6) * i
      ctx.fillText(s.toFixed(0), x, h - 6)
    }

    // Zero line
    ctx.strokeStyle = "#555"
    ctx.beginPath()
    const zeroY = yFor(0)
    ctx.moveTo(pad.l, zeroY)
    ctx.lineTo(pad.l + cw, zeroY)
    ctx.stroke()

    // Spot vertical line
    ctx.strokeStyle = "#ff8c00"
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(xFor(spot), pad.t)
    ctx.lineTo(xFor(spot), pad.t + ch)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = "#ff8c00"
    ctx.textAlign = "left"
    ctx.fillText(`SPOT ${spot.toFixed(0)}`, xFor(spot) + 3, pad.t + 10)

    // Breakevens
    ctx.strokeStyle = "#ffea00"
    ctx.setLineDash([2, 4])
    breakevens.forEach((be) => {
      ctx.beginPath()
      ctx.moveTo(xFor(be), pad.t)
      ctx.lineTo(xFor(be), pad.t + ch)
      ctx.stroke()
      ctx.fillStyle = "#ffea00"
      ctx.textAlign = "left"
      ctx.fillText(`BE ${be.toFixed(0)}`, xFor(be) + 3, pad.t + ch - 4)
    })
    ctx.setLineDash([])

    // Fill profit area (green) and loss area (red)
    // Profit (above zero)
    ctx.fillStyle = "rgba(0, 200, 80, 0.25)"
    ctx.beginPath()
    ctx.moveTo(xFor(points[0].spot), zeroY)
    points.forEach((p) => {
      const yClipped = Math.min(yFor(p.pnl), zeroY)
      ctx.lineTo(xFor(p.spot), yClipped)
    })
    ctx.lineTo(xFor(points[points.length - 1].spot), zeroY)
    ctx.closePath()
    ctx.fill()

    // Loss (below zero)
    ctx.fillStyle = "rgba(255, 76, 76, 0.25)"
    ctx.beginPath()
    ctx.moveTo(xFor(points[0].spot), zeroY)
    points.forEach((p) => {
      const yClipped = Math.max(yFor(p.pnl), zeroY)
      ctx.lineTo(xFor(p.spot), yClipped)
    })
    ctx.lineTo(xFor(points[points.length - 1].spot), zeroY)
    ctx.closePath()
    ctx.fill()

    // Payoff line
    ctx.strokeStyle = "#ff8c00"
    ctx.lineWidth = 1.5
    ctx.beginPath()
    points.forEach((p, i) => {
      const x = xFor(p.spot)
      const y = yFor(p.pnl)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  }, [points, spot, breakevens])

  return (
    <div ref={wrapRef} className="w-full h-full">
      <canvas ref={canvasRef} />
    </div>
  )
}
