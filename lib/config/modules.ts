/**
 * Feature module registry.
 *
 * Toggle `enabled` to hide a surface from navigation without deleting routes.
 * Change `nav` between `primary` | `secondary` | `none` to reshape the shell.
 * Forks adapt the personal OS by editing this file (+ trackers.ts).
 */
export type NavPlacement = 'primary' | 'secondary' | 'none'

export type ModuleId =
  | 'dashboard'
  | 'check-ins'
  | 'workouts'
  | 'meals'
  | 'goals'
  | 'photos'
  | 'projects'
  | 'review'
  | 'settings'

export type AppModule = {
  id: ModuleId
  enabled: boolean
  href: `/${string}`
  label: string
  /** Lucide icon name resolved in the nav shell */
  icon:
    | 'Home'
    | 'CheckSquare'
    | 'Dumbbell'
    | 'UtensilsCrossed'
    | 'Target'
    | 'Image'
    | 'Code'
    | 'FileText'
    | 'Settings'
  nav: NavPlacement
  description: string
}

export const modules: AppModule[] = [
  {
    id: 'dashboard',
    enabled: true,
    href: '/dashboard',
    label: 'Today',
    icon: 'Home',
    nav: 'primary',
    description: 'Daily overview',
  },
  {
    id: 'check-ins',
    enabled: true,
    href: '/check-ins',
    label: 'Log',
    icon: 'CheckSquare',
    nav: 'primary',
    description: 'Quick daily check-ins',
  },
  {
    id: 'goals',
    enabled: true,
    href: '/goals',
    label: 'Goals',
    icon: 'Target',
    nav: 'primary',
    description: 'Goals and tracking plans',
  },
  {
    id: 'projects',
    enabled: true,
    href: '/projects',
    label: 'Projects',
    icon: 'Code',
    nav: 'primary',
    description: 'Weekly coding projects',
  },
  {
    id: 'workouts',
    enabled: true,
    href: '/workouts',
    label: 'Workouts',
    icon: 'Dumbbell',
    nav: 'secondary',
    description: 'Session builder and history',
  },
  {
    id: 'meals',
    enabled: true,
    href: '/meals',
    label: 'Meals',
    icon: 'UtensilsCrossed',
    nav: 'secondary',
    description: 'Macros and photo estimates',
  },
  {
    id: 'photos',
    enabled: true,
    href: '/photos',
    label: 'Photos',
    icon: 'Image',
    nav: 'secondary',
    description: 'Progress photos',
  },
  {
    id: 'review',
    enabled: true,
    href: '/review',
    label: 'Review',
    icon: 'FileText',
    nav: 'secondary',
    description: 'Weekly review',
  },
  {
    id: 'settings',
    enabled: true,
    href: '/settings',
    label: 'Settings',
    icon: 'Settings',
    nav: 'secondary',
    description: 'Profile, export, account',
  },
]

export function enabledModules() {
  return modules.filter((m) => m.enabled)
}

export function navModules(placement: NavPlacement) {
  return enabledModules().filter((m) => m.nav === placement)
}

export function isModuleEnabled(id: ModuleId) {
  return modules.some((m) => m.id === id && m.enabled)
}
