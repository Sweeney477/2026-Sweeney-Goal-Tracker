'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  CheckSquare,
  Code,
  Dumbbell,
  FileText,
  Home,
  Image,
  MoreHorizontal,
  Settings,
  Target,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { brand } from '@/lib/config/brand'
import { navModules, type AppModule } from '@/lib/config/modules'
import { cn } from '@/lib/utils'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const iconMap: Record<AppModule['icon'], LucideIcon> = {
  Home,
  CheckSquare,
  Dumbbell,
  UtensilsCrossed,
  Target,
  Image,
  Code,
  FileText,
  Settings,
}

export function Nav() {
  const rawPathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [moreOpen, setMoreOpen] = useState(false)

  const pathname =
    rawPathname && BASE_PATH && rawPathname.startsWith(BASE_PATH)
      ? rawPathname.slice(BASE_PATH.length) || '/'
      : rawPathname

  const primaryItems = useMemo(() => navModules('primary'), [])
  const secondaryItems = useMemo(() => navModules('secondary'), [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const activePrimary = useMemo(() => {
    if (!pathname) return null
    return primaryItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) || null
  }, [pathname, primaryItems])

  const activeSecondary = useMemo(() => {
    if (!pathname) return null
    return secondaryItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) || null
  }, [pathname, secondaryItems])

  useEffect(() => {
    if (!moreOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [moreOpen])

  return (
    <>
      <nav
        aria-label="Main"
        className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-64 md:flex-col md:border-r md:bg-background/95 md:backdrop-blur"
      >
        <div className="flex items-center gap-3 border-b px-4 py-4">
          <div className={`grid h-10 w-10 place-items-center rounded-xl ${brand.markClassName}`}>
            <span className="font-display text-sm font-semibold">{brand.shortName}</span>
          </div>
          <div>
            <div className="font-display text-sm font-semibold">{brand.name}</div>
            <div className="text-xs text-muted-foreground">Personal OS</div>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          <div className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Core
          </div>
          {primaryItems.map((item) => {
            const Icon = iconMap[item.icon]
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand/10 text-brand'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{item.label}</span>
              </Link>
            )
          })}

          <div className="mt-4 px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            More
          </div>
          {secondaryItems.map((item) => {
            const Icon = iconMap[item.icon]
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand/10 text-brand'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
        <div className="border-t p-4">
          <Button variant="outline" className="w-full rounded-xl" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </nav>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden pb-safe"
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-0.5 px-1 py-1.5">
          {primaryItems.map((item) => {
            const Icon = iconMap[item.icon]
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium',
                  isActive ? 'text-brand' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium',
              activeSecondary || (!activePrimary && moreOpen) ? 'text-brand' : 'text-muted-foreground'
            )}
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
            <span>More</span>
          </button>
        </div>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="More navigation">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-lg rounded-t-2xl border bg-background p-4 pb-safe shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-display text-sm font-semibold">More</div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setMoreOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid gap-2 pb-4">
              {secondaryItems.map((item) => {
                const Icon = iconMap[item.icon]
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center justify-between rounded-xl border px-4 py-3 text-sm',
                      isActive ? 'border-brand/30 bg-brand/5' : 'bg-background'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      </div>
                    </div>
                  </Link>
                )
              })}

              <Button variant="outline" className="mt-2 w-full rounded-xl" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
