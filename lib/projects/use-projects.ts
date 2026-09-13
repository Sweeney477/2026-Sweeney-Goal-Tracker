'use client'

/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react'
import { format, startOfWeek, addWeeks } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/toast'
import { Project, ProjectMilestone } from '@/lib/types'
import {
  calculateProgress,
  createProject,
  DEFAULT_MILESTONES,
  deleteProject,
  deriveProjectXpStats,
  listProjects,
  updateProject,
  withMilestoneIds,
} from '@/lib/projects/api'

export function useProjects() {
  const supabase = createClient()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formWeekStart, setFormWeekStart] = useState(
    format(startOfWeek(new Date()), 'yyyy-MM-dd')
  )
  const [formDoD, setFormDoD] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [newMilestoneLabel, setNewMilestoneLabel] = useState('')
  const [showAddMilestone, setShowAddMilestone] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await listProjects(supabase, user.id)

      if (error) throw error

      const projectsWithMilestones = (data || []).map((p: Project) => ({
        ...p,
        milestones_json: p.milestones_json || [],
      }))

      setProjects(projectsWithMilestones as Project[])
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const requireUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const user = await requireUser()
      if (!user) return

      const initialMilestones = withMilestoneIds(DEFAULT_MILESTONES)

      const { error } = await createProject(supabase, {
        user_id: user.id,
        week_start: formWeekStart,
        name: formName,
        status: 'planning',
        definition_of_done: formDoD || null,
        milestones_json: initialMilestones,
      })

      if (error) throw error

      setFormName('')
      setFormDoD('')
      setFormWeekStart(format(startOfWeek(new Date()), 'yyyy-MM-dd'))
      setShowNewForm(false)
      loadProjects()
      toast('Project created!', 'success')
    } catch (error: any) {
      console.error('Error creating project:', error)
      toast(error.message || 'Failed to create project. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMilestoneToggle = async (projectId: string, milestoneId: string) => {
    try {
      const user = await requireUser()
      if (!user) return

      const project = projects.find((p) => p.id === projectId)
      if (!project) return

      const milestones = (project.milestones_json || []).map((m) => {
        if (m.id === milestoneId) {
          return {
            ...m,
            completed: !m.completed,
            completed_at: !m.completed ? new Date().toISOString() : undefined,
          }
        }
        return m
      })

      const progress = calculateProgress(milestones)
      const updateData: Partial<Project> = {
        milestones_json: milestones,
      }

      if (progress === 100) {
        updateData.status = 'shipped'
        updateData.shipped_at = new Date().toISOString()
        toast('Project completed! 🎉', 'success')
      } else if (progress > 0 && project.status === 'planning') {
        updateData.status = 'in_progress'
      }

      const { error } = await updateProject(supabase, projectId, user.id, updateData)

      if (error) throw error
      loadProjects()
    } catch (error: any) {
      console.error('Error updating milestone:', error)
      toast(error.message || 'Failed to update milestone.', 'error')
    }
  }

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    try {
      const user = await requireUser()
      if (!user) return

      const project = projects.find((p) => p.id === projectId)
      if (!project) return

      const updateData: Partial<Project> = { status: newStatus as Project['status'] }

      if (newStatus === 'shipped') {
        updateData.shipped_at = new Date().toISOString()

        const milestones = (project.milestones_json || []).map((m) => ({
          ...m,
          completed: true,
          completed_at: m.completed_at || new Date().toISOString(),
        }))
        updateData.milestones_json = milestones
      }

      const { error } = await updateProject(supabase, projectId, user.id, updateData)

      if (error) throw error
      loadProjects()
      toast(newStatus === 'shipped' ? 'Project shipped! 🚀' : 'Status updated', 'success')
    } catch (error: any) {
      console.error('Error updating project:', error)
      toast(error.message || 'Failed to update project. Please try again.', 'error')
    }
  }

  const handleAddCustomMilestone = async (projectId: string) => {
    if (!newMilestoneLabel.trim()) {
      toast('Please enter a milestone name', 'error')
      return
    }

    try {
      const user = await requireUser()
      if (!user) return

      const project = projects.find((p) => p.id === projectId)
      if (!project) return

      const milestones = project.milestones_json || []
      const newMilestone: ProjectMilestone = {
        id: Math.random().toString(36).substring(7),
        label: newMilestoneLabel.trim(),
        completed: false,
      }

      const { error } = await updateProject(supabase, projectId, user.id, {
        milestones_json: [...milestones, newMilestone],
      })

      if (error) throw error
      setNewMilestoneLabel('')
      setShowAddMilestone({ ...showAddMilestone, [projectId]: false })
      loadProjects()
      toast('Milestone added!', 'success')
    } catch (error: any) {
      console.error('Error adding milestone:', error)
      toast(error.message || 'Failed to add milestone.', 'error')
    }
  }

  const handleDeleteMilestone = async (projectId: string, milestoneId: string) => {
    try {
      const user = await requireUser()
      if (!user) return

      const project = projects.find((p) => p.id === projectId)
      if (!project) return

      const milestones = (project.milestones_json || []).filter((m) => m.id !== milestoneId)

      const { error } = await updateProject(supabase, projectId, user.id, {
        milestones_json: milestones,
      })

      if (error) throw error
      loadProjects()
      toast('Milestone removed', 'success')
    } catch (error: any) {
      console.error('Error deleting milestone:', error)
      toast(error.message || 'Failed to delete milestone.', 'error')
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      const user = await requireUser()
      if (!user) return

      const { error } = await deleteProject(supabase, projectId, user.id)

      if (error) throw error
      loadProjects()
      toast('Project deleted', 'success')
    } catch (error: any) {
      console.error('Error deleting project:', error)
      toast(error.message || 'Failed to delete project.', 'error')
    }
  }

  const statusColors: Record<string, string> = {
    planning: 'bg-gray-500',
    in_progress: 'bg-blue-500',
    shipped: 'bg-green-500',
    paused: 'bg-yellow-500',
  }

  const currentWeekStart = startOfWeek(new Date())
  const currentWeekEnd = addWeeks(currentWeekStart, 1)
  const dateRangeLabel = `${format(currentWeekStart, 'MMM d')} – ${format(
    new Date(currentWeekEnd.getTime() - 24 * 60 * 60 * 1000),
    'MMM d'
  )}`

  const { xp, level } = deriveProjectXpStats(projects)

  return {
    projects,
    loading,
    showNewForm,
    setShowNewForm,
    formName,
    setFormName,
    formWeekStart,
    setFormWeekStart,
    formDoD,
    setFormDoD,
    submitting,
    expandedProject,
    setExpandedProject,
    editingProject,
    setEditingProject,
    newMilestoneLabel,
    setNewMilestoneLabel,
    showAddMilestone,
    setShowAddMilestone,
    statusColors,
    dateRangeLabel,
    xp,
    level,
    calculateProgress,
    handleSubmit,
    handleMilestoneToggle,
    handleStatusChange,
    handleAddCustomMilestone,
    handleDeleteMilestone,
    handleDeleteProject,
  }
}
