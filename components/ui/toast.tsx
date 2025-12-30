'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

let toastListeners: ((toasts: Toast[]) => void)[] = []
let toasts: Toast[] = []

function notify() {
  toastListeners.forEach((listener) => listener([...toasts]))
}

export function toast(message: string, type: Toast['type'] = 'info', duration = 5000) {
  const id = Math.random().toString(36).substring(7)
  const newToast: Toast = { id, message, type, duration }
  toasts = [...toasts, newToast]
  notify()

  if (duration > 0) {
    setTimeout(() => {
      dismiss(id)
    }, duration)
  }

  return id
}

export function dismiss(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  notify()
}

export function useToast() {
  const [toastList, setToastList] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setToastList(newToasts)
    }
    toastListeners.push(listener)
    listener(toasts)

    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener)
    }
  }, [])

  return { toasts: toastList, toast, dismiss }
}

export function Toaster() {
  const { toasts: toastList } = useToast()

  if (toastList.length === 0) return null

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 mx-auto max-w-md px-4 md:bottom-4 md:left-auto md:right-4">
      <div className="space-y-2">
        {toastList.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lg',
              t.type === 'error' && 'border-red-200 bg-red-50 text-red-700',
              t.type === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
              t.type === 'info' && 'border-blue-200 bg-blue-50 text-blue-700'
            )}
          >
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="rounded-full p-1 hover:bg-black/5"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

