'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type BottomSheetProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  /** Soft pastel wash behind the handle (matches activity tones). */
  toneClassName?: string
  className?: string
}

/**
 * Lightweight mobile-first bottom sheet for calm wellness UI.
 * Safe-area aware for iPhone PWA; no external dialog dependency.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  toneClassName,
  className,
}: BottomSheetProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // Focus first focusable control inside the panel
    const t = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'input, textarea, button:not([aria-label="Close"]), select, [tabindex]:not([tabindex="-1"])'
      )
      focusable?.focus()
    }, 30)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px] transition-opacity"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-10 w-full max-w-lg',
          'rounded-t-[1.75rem] bg-card shadow-lift ring-1 ring-border/60',
          'pb-[max(1rem,env(safe-area-inset-bottom))]',
          className
        )}
        data-testid="quick-log-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn('relative overflow-hidden rounded-t-[1.75rem]', toneClassName)}>
          <div className="flex justify-center pt-3">
            <div className="h-1 w-10 rounded-full bg-foreground/15" aria-hidden />
          </div>
          <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-3">
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-xl font-semibold tracking-tight">
                {title}
              </h2>
              {description ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/70 text-foreground/70 transition-colors hover:bg-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
        <div className="px-5 pb-2 pt-1">{children}</div>
      </div>
    </div>
  )
}
