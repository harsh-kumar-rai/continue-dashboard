"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { functionKeysFor } from "@/lib/commands"

export function KeyboardShortcuts() {
  const router = useRouter()
  const pathname = usePathname()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Skip when user is typing in an input/textarea.
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement | null)?.isContentEditable) {
        return
      }
      // F1..F12 (context-aware via functionKeysFor)
      if (e.key.startsWith("F") && e.key.length >= 2 && e.key.length <= 3) {
        const fk = functionKeysFor(pathname).find((f) => f.key === e.key)
        if (fk) {
          e.preventDefault()
          router.push(fk.path)
          return
        }
      }
      // g + <letter> "go to" combos (Bloomberg-ish double-key navigation).
      if (e.key === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const handler = (e2: KeyboardEvent) => {
          window.removeEventListener("keydown", handler, true)
          const map: Record<string, string> = {
            m: "/markets",
            d: "/derivatives",
            s: "/screener",
            p: "/portfolio",
            n: "/news",
            a: "/alerts",
            h: "/heatmap",
            w: "/watchlist",
            e: "/economic-calendar",
            f: "/fii-dii",
            q: "/quant",
            t: "/strategy",
            "/": "/help",
            "?": "/help",
          }
          const path = map[e2.key.toLowerCase()]
          if (path) {
            e2.preventDefault()
            router.push(path)
          }
        }
        window.addEventListener("keydown", handler, true)
        // give the user 1.5 seconds before discarding the prefix
        setTimeout(() => window.removeEventListener("keydown", handler, true), 1500)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [router, pathname])
  return null
}
