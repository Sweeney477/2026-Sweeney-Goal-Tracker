import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Nav } from '@/components/nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { Toaster } from '@/components/ui/toast'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Next.js automatically applies `basePath` to internal navigations.
    redirect('/auth/login')
  }

  // Onboarding redirect is handled in middleware

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
        {/* Top bar (mobile-first) */}
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600 text-white shadow-sm">
                <span className="text-sm font-semibold">GT</span>
              </div>
              <div className="leading-tight">
                <div className="text-[15px] font-semibold">GoalTracker</div>
                <div className="text-xs text-muted-foreground">Level up your daily habits.</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-sm font-semibold text-foreground">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-md flex-col">
          <main className="flex-1 px-4 pb-24 pt-4">{children}</main>
        </div>

        <Nav />
        <Toaster />
      </div>
    </div>
  )
}
