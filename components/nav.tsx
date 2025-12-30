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
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/check-ins', label: 'Check-ins', icon: CheckSquare },
  { href: '/meals', label: 'Meals', icon: UtensilsCrossed },
  { href: '/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/photos', label: 'Photos', icon: Image },
  { href: '/projects', label: 'Projects', icon: Code },
  { href: '/review', label: 'Review', icon: FileText },
]

export function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <nav className="border-t bg-background md:border-r md:border-t-0 w-full md:w-64 md:min-h-screen sticky top-0 z-20">
      <div className="flex flex-wrap md:flex-col h-full gap-1 md:gap-0">
        <div className="flex flex-wrap md:flex-col w-full gap-1 md:gap-0">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-w-[140px] flex-1 items-center gap-3 px-4 py-3 text-sm font-medium transition-colors md:min-w-0',
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
        <div className="mt-auto p-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  )
}
