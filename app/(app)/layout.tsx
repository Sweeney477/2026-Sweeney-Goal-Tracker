import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Nav } from '@/components/nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { Toaster } from '@/components/ui/toast'
import { brand } from '@/lib/config/brand'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const initials =
    (user.email || 'U')
      .split('@')[0]
      .split(/[.\-_]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || 'U'

  return (
    <div className="min-h-screen bg-background">
      <div className="app-soft app-dots min-h-screen">
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:pl-64">
          <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 md:max-w-3xl">
            <div className="flex items-center gap-3">
              <div className={`grid h-10 w-10 place-items-center rounded-2xl shadow-sm ${brand.markClassName}`}>
                <span className="font-display text-sm font-semibold">{brand.shortName}</span>
              </div>
              <div className="leading-tight">
                <div className="font-display text-[15px] font-semibold tracking-tight">{brand.name}</div>
                <div className="text-xs text-muted-foreground">{brand.tagline}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div
                className="grid h-9 w-9 place-items-center rounded-full bg-muted text-sm font-semibold text-foreground"
                aria-label="Account"
              >
                {initials}
              </div>
            </div>
          </div>
        </header>

        <div className="md:pl-64">
          <div className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-2xl flex-col md:max-w-3xl">
            <main className="animate-fade-up flex-1 px-4 pb-24 pt-4 md:pb-8">{children}</main>
          </div>
        </div>

        <Nav />
        <Toaster />
      </div>
    </div>
  )
}
