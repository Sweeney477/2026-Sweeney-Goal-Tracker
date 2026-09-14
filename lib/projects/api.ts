import type { SupabaseClient } from '@supabase/supabase-js'
import type { Project, ProjectMilestone } from '@/lib/types'

export const DEFAULT_MILESTONES: Omit<ProjectMilestone, 'id'>[] = [
  { label: 'Idea', completed: false },
  { label: 'Prompt', completed: false },
  { label: 'Creative Designed', completed: false },
  { label: 'Coding', completed: false },
  { label: 'Moved Online', completed: false },
  { label: 'Test', completed: false },
]

/** Coerce DB / mock milestones payloads into a safe array (never throws). */
export function normalizeMilestones(raw: unknown): ProjectMilestone[] {
  if (Array.isArray(raw)) {
    return raw.filter((m): m is ProjectMilestone => !!m && typeof m === 'object') as ProjectMilestone[]
  }
  if (typeof raw === 'string') {
    try {
      return normalizeMilestones(JSON.parse(raw))
    } catch {
      return []
    }
  }
  return []
}

export function calculateProgress(milestones: ProjectMilestone[] | unknown = []): number {
  const list = normalizeMilestones(milestones)
  if (list.length === 0) return 0
  const completed = list.filter((m) => m.completed).length
  return Math.round((completed / list.length) * 100)
}

export function deriveProjectXpStats(projects: Project[]) {
  const shippedCount = projects.filter((p) => p.status === 'shipped').length
  const xp = shippedCount * 50 + projects.filter((p) => p.status === 'in_progress').length * 10
  const level = Math.max(1, Math.floor(xp / 100) + 1)
  const nextLevelXp = level * 100
  return { shippedCount, xp, level, nextLevelXp }
}

export function withMilestoneIds(
  milestones: Omit<ProjectMilestone, 'id'>[] = DEFAULT_MILESTONES
): ProjectMilestone[] {
  return milestones.map((m) => ({
    ...m,
    id: Math.random().toString(36).substring(7),
  }))
}

export async function listProjects(supabase: SupabaseClient, userId: string, limit = 52) {
  return supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(limit)
}

export async function createProject(
  supabase: SupabaseClient,
  payload: {
    user_id: string
    name: string
    week_start: string
    status?: Project['status']
    definition_of_done?: string | null
    milestones_json?: ProjectMilestone[]
  }
) {
  return supabase.from('projects').insert(payload).select('*').maybeSingle()
}

export async function updateProject(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  patch: Partial<Project>
) {
  return supabase.from('projects').update(patch).eq('id', projectId).eq('user_id', userId)
}

export async function deleteProject(supabase: SupabaseClient, projectId: string, userId: string) {
  return supabase.from('projects').delete().eq('id', projectId).eq('user_id', userId)
}
