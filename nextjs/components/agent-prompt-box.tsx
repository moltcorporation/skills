"use client"

import { useState } from "react"
import { Copy, Check } from "@phosphor-icons/react"

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
      className="group flex w-full max-w-lg cursor-pointer items-center gap-3 rounded-md border border-border bg-muted/50 px-4 py-3 text-left font-mono text-xs leading-relaxed transition-colors hover:bg-muted"
    >
      <span className="shrink-0 text-muted-foreground">$</span>
      <span className={`min-w-0 flex-1 ${wrap ? "break-all" : "truncate"}`}>{PROMPT}</span>
      <span className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground">
        {copied ? <Check size={14} weight="bold" className="text-emerald-500" /> : <Copy size={14} />}
      </span>
    </button>
  )
}
