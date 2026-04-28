"use client"

import { useEffect, useRef } from "react"

const TENORS = ["3M", "6M", "1Y", "2Y", "5Y", "10Y", "30Y"]
const CURRENT = [6.42, 6.51, 6.58, 6.64, 6.78, 6.92, 7.18]
const MONTH_AGO = [6.55, 6.62, 6.68, 6.72, 6.81, 6.95, 7.21]
const YEAR_AGO = [6.92, 7.01, 7.08, 7.12, 7.18, 7.22, 7.34]

export function YieldCurve() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
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

    const pad = { l: 40, r: 12, t: 18, b: 22 }
    const cw = w - pad.l - pad.r
    const ch = h - pad.t - pad.b
    const all = [...CURRENT, ...MONTH_AGO, ...YEAR_AGO]
    const min = Math.min(...all) - 0.05
    const max = Math.max(...all) + 0.05

    const xFor = (i: number) => pad.l + (i / (TENORS.length - 1)) * cw
    const yFor = (v: number) => pad.t + ch - ((v - min) / (max - min)) * ch

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
    ctx.font = "10px ui-monospace, monospace"
    ctx.textAlign = "right"
    for (let i = 0; i <= 5; i++) {
      const y = pad.t + (ch / 5) * i
      const v = max - ((max - min) / 5) * i
      ctx.fillText(`${v.toFixed(2)}%`, pad.l - 4, y + 3)
    }

    // X labels
    ctx.textAlign = "center"
    TENORS.forEach((t, i) => {
      ctx.fillText(t, xFor(i), h - 6)
    })

    const drawLine = (data: number[], color: string, dashed?: boolean) => {
      ctx.strokeStyle = color
      ctx.lineWidth = dashed ? 1 : 1.5
      if (dashed) ctx.setLineDash([3, 3])
      ctx.beginPath()
      data.forEach((v, i) => {
        const x = xFor(i)
        const y = yFor(v)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = color
      data.forEach((v, i) => {
        ctx.beginPath()
        ctx.arc(xFor(i), yFor(v), 2, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    drawLine(YEAR_AGO, "#666", true)
    drawLine(MONTH_AGO, "#cccccc", true)
    drawLine(CURRENT, "#ff8c00")

    // Legend
    ctx.font = "10px ui-monospace, monospace"
    ctx.textAlign = "left"
    ctx.fillStyle = "#ff8c00"; ctx.fillText("● TODAY", pad.l, 12)
    ctx.fillStyle = "#cccccc"; ctx.fillText("● 1M AGO", pad.l + 70, 12)
    ctx.fillStyle = "#666"; ctx.fillText("● 1Y AGO", pad.l + 140, 12)
  }, [])

  return (
    <div ref={wrapRef} className="w-full h-full">
      <canvas ref={canvasRef} />
    </div>
  )
}
