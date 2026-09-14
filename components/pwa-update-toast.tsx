'use client'

import { useEffect, useState } from 'react'

/**
 * After deploys, iOS/Safari can keep a stale shell until the page reloads.
 * skipWaiting + clientsClaim activate the new SW; this banner nudges a reload
 * so the home-screen PWA picks up the fresh build.
 */
export function PwaUpdateToast() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    let cancelled = false

    const show = () => {
      if (!cancelled) setVisible(true)
    }

    const onControllerChange = () => show()
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    const watchRegistration = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration()
        if (!reg || cancelled) return

        if (reg.waiting) show()

        reg.addEventListener('updatefound', () => {
          const installing = reg.installing
          if (!installing) return
          installing.addEventListener('statechange', () => {
            // New SW installed while an older controller is active → update ready.
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              show()
            }
          })
        })
      } catch {
        // Ignore SW lookup failures (private mode / unsupported).
      }
    }

    void watchRegistration()

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      void navigator.serviceWorker.getRegistration().then((reg) => reg?.update())
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
      role="status"
    >
      <div className="flex max-w-md items-center gap-3 rounded-2xl border border-brand/20 bg-background/95 px-4 py-3 text-sm shadow-lg backdrop-blur">
        <span className="flex-1 text-foreground">App update available.</span>
        <button
          type="button"
          className="rounded-xl bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground"
          onClick={() => {
            void (async () => {
              try {
                if ('caches' in window) {
                  const keys = await caches.keys()
                  await Promise.all(keys.map((key) => caches.delete(key)))
                }
              } catch {
                // Best-effort; still reload.
              }
              const base = process.env.NEXT_PUBLIC_BASE_PATH || '/goal'
              window.location.replace(`${base}/`)
            })()
          }}
        >
          Reload
        </button>
        <button
          type="button"
          className="rounded-xl px-2 py-1.5 text-sm text-muted-foreground"
          onClick={() => setVisible(false)}
          aria-label="Dismiss update notice"
        >
          Later
        </button>
      </div>
    </div>
  )
}
