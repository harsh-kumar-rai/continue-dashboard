"use client"

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  strokeWidth?: number
}

export function Sparkline({ data, width = 80, height = 18, color, strokeWidth = 1 }: SparklineProps) {
  if (!data.length) return <svg width={width} height={height} />
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / Math.max(1, data.length - 1)
  const last = data[data.length - 1]
  const first = data[0]
  const dir = last >= first ? "var(--color-up)" : "var(--color-down)"
  const stroke = color ?? dir
  const path = data
    .map((v, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${(height - ((v - min) / range) * height).toFixed(1)}`)
    .join(" ")
  return (
    <svg width={width} height={height} className="block">
      <path d={path} stroke={stroke} strokeWidth={strokeWidth} fill="none" />
    </svg>
  )
}
