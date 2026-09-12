import { modules, type ModuleId } from '@/lib/config/modules'

/** Map an app pathname (no basePath) to a module id when it belongs to a feature surface. */
export function moduleIdFromPath(pathname: string): ModuleId | null {
  const path = pathname.split('?')[0] || '/'
  const match = modules.find((m) => path === m.href || path.startsWith(`${m.href}/`))
  return match?.id ?? null
}
