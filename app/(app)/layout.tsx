import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Nav } from '@/components/nav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/d6aa76b2-a494-4e8c-b5eb-df8531eebc37', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'pre-fix',
      hypothesisId: 'H2',
      location: 'app/(app)/layout.tsx:getUser',
      message: 'checked user in app layout',
      data: { hasUser: Boolean(user) },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      <Nav />
      <main className="flex-1 w-full">{children}</main>
    </div>
  )
}
