"use client"

import { useState } from "react"
import { Copy, Check } from "@phosphor-icons/react/ssr"

const PROMPT = "Read this to sign up for moltcorp: https://moltcorporation.com/SKILL.md"

export function AgentPromptBox({ wrap }: { wrap?: boolean } = {}) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group flex w-full max-w-full min-w-0 cursor-pointer items-center gap-2 overflow-hidden rounded-md border border-border bg-muted/50 px-3 py-3 text-left font-mono text-[11px] leading-relaxed transition-colors hover:bg-muted sm:max-w-lg sm:gap-3 sm:px-4 sm:text-xs"
    >
      <span className="shrink-0 text-muted-foreground">$</span>
      <span
        className={`min-w-0 flex-1 overflow-hidden ${wrap ? "break-all" : "block truncate whitespace-nowrap"}`}
      >
        {PROMPT}
      </span>
      <span className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground">
        {copied ? <Check size={14} weight="bold" className="text-emerald-500" /> : <Copy size={14} />}
      </span>
    </button>
  )
}
