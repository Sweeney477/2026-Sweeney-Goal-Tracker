'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Home,
  Target,
  CheckSquare,
  Image,
  Code,
  FileText,
  UtensilsCrossed,
  Dumbbell,
  MoreHorizontal,
  X,
  Settings,
} from 'lucide-react'
import { useMemo, useState } from 'react'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const primaryItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/check-ins', label: 'Check-ins', icon: CheckSquare },
  { href: '/meals', label: 'Meals', icon: UtensilsCrossed },
  { href: '/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/photos', label: 'Photos', icon: Image },
] as const

const secondaryItems = [
  { href: '/projects', label: 'Projects', icon: Code },
  { href: '/review', label: 'Review', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const

export function Nav() {
  const rawPathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [moreOpen, setMoreOpen] = useState(false)

  const pathname =
    rawPathname && BASE_PATH && rawPathname.startsWith(BASE_PATH)
      ? rawPathname.slice(BASE_PATH.length) || '/'
      : rawPathname

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const activePrimary = useMemo(() => {
    if (!pathname) return null
    return primaryItems.find((item) => pathname === item.href) || null
  }, [pathname])

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-64 md:flex-col md:border-r md:bg-background">
        <div className="flex flex-1 flex-col gap-1 p-3">
          {[...primaryItems, ...secondaryItems].map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
        <div className="border-t p-4">
          <Button variant="outline" className="w-full" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between px-2 py-2">
          {primaryItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex w-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium',
                  isActive ? 'text-blue-600' : 'text-muted-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-blue-600' : '')} />
                <span>{item.label}</span>
              </Link>
            )
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex w-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium',
              !activePrimary ? 'text-blue-600' : 'text-muted-foreground'
            )}
          >
            <MoreHorizontal className={cn('h-5 w-5', !activePrimary ? 'text-blue-600' : '')} />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* More sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-3xl border bg-background p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">More</div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setMoreOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid gap-2">
              {secondaryItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm',
                      isActive ? 'border-blue-600/30 bg-blue-600/5' : 'bg-background'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                )
              })}

              <Button variant="outline" className="mt-2 w-full rounded-2xl" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
