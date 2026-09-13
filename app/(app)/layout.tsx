import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Nav } from '@/components/nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { Toaster } from '@/components/ui/toast'
import { brand } from '@/lib/config/brand'

function initialsFrom(email?: string | null, fullName?: string | null) {
  const fromName = (fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')
  if (fromName) return fromName

  const local = (email || 'U').split('@')[0]
  const parts = local.split(/[.\-_]/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase() || 'U'
  }
  return (local.slice(0, 2) || 'U').toUpperCase()
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const fullName = (user.user_metadata?.full_name || user.user_metadata?.name || '') as string
  const initials = initialsFrom(user.email, fullName)

  return (
    <div className="min-h-screen bg-background">
      <div className="app-wash min-h-screen">
        <header className="sticky top-0 z-30 bg-background/55 backdrop-blur-xl supports-[backdrop-filter]:bg-background/45 md:pl-[17rem]">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 lg:max-w-5xl">
            <div className="flex items-center gap-3 md:invisible md:pointer-events-none">
              <div className={`grid h-9 w-9 place-items-center rounded-2xl shadow-soft ${brand.markClassName}`}>
                <span className="font-display text-sm font-semibold">{brand.shortName}</span>
              </div>
              <div className="leading-tight">
                <div className="font-display text-[15px] font-semibold tracking-tight">{brand.name}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div
                className="grid h-9 w-9 place-items-center rounded-full bg-brand/10 text-sm font-semibold text-brand ring-1 ring-brand/15"
                aria-label="Account"
              >
                {initials}
              </div>
            </div>
          </div>
        </header>

        <div className="md:pl-[17rem]">
          <div className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-3xl flex-col lg:max-w-5xl">
            <main className="flex-1 px-4 pb-nav pt-5 md:px-6 md:pb-12">{children}</main>
          </div>
        </div>

        <Nav />
        <Toaster />
      </div>
    </div>
  )
}
