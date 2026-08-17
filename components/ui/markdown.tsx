"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

/**
 * Renders AI-generated markdown (agreement terms, tenant briefs, etc.) as
 * formatted, dark-mode-friendly typography.
 *
 * Why this exists: agreement/brief content arrives as markdown (headings,
 * **bold**, lists) but was previously displayed in a <pre>, showing raw
 * `**` markers. This component renders it properly.
 *
 * Styling lives in globals.css under `.markdown-body` (light + dark variants)
 * so it stays consistent with the dashboard theme system.
 *
 * `remark-gfm` adds tables / strikethrough / task-list support for the richer
 * AI-generated lease documents.
 */
export function Markdown({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div className={cn("markdown-body", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}
