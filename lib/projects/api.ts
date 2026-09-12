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
