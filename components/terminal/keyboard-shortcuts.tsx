"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { FUNCTION_KEYS } from "@/lib/commands"

export function KeyboardShortcuts() {
  const router = useRouter()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // F1..F12
      if (e.key.startsWith("F") && e.key.length >= 2 && e.key.length <= 3) {
        const fk = FUNCTION_KEYS.find((f) => f.key === e.key)
        if (fk) {
          e.preventDefault()
          router.push(fk.path)
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [router])
  return null
}
