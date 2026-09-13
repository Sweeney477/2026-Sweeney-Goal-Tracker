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
        className="hidden md:fixed md:inset-y-3 md:left-3 md:z-30 md:flex md:w-60 md:flex-col md:rounded-[1.75rem] md:bg-card/80 md:shadow-soft md:backdrop-blur-xl md:ring-1 md:ring-border/40"
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <div className={`grid h-10 w-10 place-items-center rounded-2xl ${brand.markClassName}`}>
            <span className="font-display text-sm font-semibold">{brand.shortName}</span>
          </div>
          <div>
            <div className="font-display text-sm font-semibold">{brand.name}</div>
            <div className="text-xs text-muted-foreground">Today · Log · Goals</div>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-3">
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
                  'flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand/10 text-brand'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
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
                  'flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand/10 text-brand'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
        <div className="p-4">
          <Button variant="outline" className="w-full rounded-2xl" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </nav>

      <nav aria-label="Primary" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden">
        <div className="pointer-events-auto mx-auto mb-[max(0.85rem,env(safe-area-inset-bottom))] max-w-md px-5">
          <div className="glass-pill flex items-center justify-between gap-0.5 rounded-full px-1.5 py-1.5">
            {primaryItems.map((item) => {
              const Icon = iconMap[item.icon]
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 text-[10px] font-medium transition-colors',
                    isActive ? 'bg-brand/12 text-brand' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
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
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 text-[10px] font-medium transition-colors',
                activeSecondary || (!activePrimary && moreOpen)
                  ? 'bg-brand/12 text-brand'
                  : 'text-muted-foreground'
              )}
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              <span>More</span>
            </button>
          </div>
        </div>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="More navigation">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]"
            onClick={() => setMoreOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="soft-card rounded-[1.75rem] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="font-display text-sm font-semibold">More</div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setMoreOpen(false)}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" strokeWidth={1.75} />
                </Button>
              </div>

              <div className="grid gap-2">
                {secondaryItems.map((item) => {
                  const Icon = iconMap[item.icon]
                  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition-colors',
                        isActive ? 'bg-brand/10' : 'bg-muted/50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                        <div>
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        </div>
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
        </div>
      ) : null}
    </>
  )
}
