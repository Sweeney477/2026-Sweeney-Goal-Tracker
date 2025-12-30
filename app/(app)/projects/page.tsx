'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format, startOfWeek, addWeeks } from 'date-fns'
import { Plus, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function ProjectsPage() {
  const supabase = createClient()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formWeekStart, setFormWeekStart] = useState(
    format(startOfWeek(new Date()), 'yyyy-MM-dd')
  )
  const [formDoD, setFormDoD] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(52)

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase.from('projects').insert({
        user_id: user.id,
        week_start: formWeekStart,
        name: formName,
        status: 'planning',
        definition_of_done: formDoD || null,
      })

      if (error) throw error

      setFormName('')
      setFormDoD('')
      setFormWeekStart(format(startOfWeek(new Date()), 'yyyy-MM-dd'))
      setShowNewForm(false)
      loadProjects()
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus }
      if (newStatus === 'shipped') {
        updateData.shipped_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)

      if (error) throw error
      loadProjects()
    } catch (error) {
      console.error('Error updating project:', error)
      alert('Failed to update project. Please try again.')
    }
  }

  const statusColors: Record<string, string> = {
    planning: 'bg-gray-500',
    in_progress: 'bg-blue-500',
    shipped: 'bg-green-500',
    paused: 'bg-yellow-500',
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Weekly Projects</h1>
            <p className="text-muted-foreground mt-1">
              Track your vibe-coding projects week by week
            </p>
          </div>
          <Button onClick={() => setShowNewForm(!showNewForm)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {showNewForm && (
          <Card>
            <CardHeader>
              <CardTitle>New Weekly Project</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Build a todo app"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekStart">Week Start Date</Label>
                  <Input
                    id="weekStart"
                    type="date"
                    value={formWeekStart}
                    onChange={(e) => setFormWeekStart(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dod">Definition of Done (optional)</Label>
                  <Input
                    id="dod"
                    value={formDoD}
                    onChange={(e) => setFormDoD(e.target.value)}
                    placeholder="e.g., Deployed to production, tests passing"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Project'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {loading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No projects yet. Create your first weekly project!
                </p>
              </CardContent>
            </Card>
          ) : (
            projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>
                        Week of {format(new Date(project.week_start), 'MMMM d, yyyy')}
                        {project.shipped_at &&
                          ` • Shipped ${format(new Date(project.shipped_at), 'MMM d, yyyy')}`}
                      </CardDescription>
                    </div>
                    <Badge
                      className={`${statusColors[project.status]} text-white capitalize`}
                    >
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {project.definition_of_done && (
                    <div className="mb-4">
                      <div className="text-sm font-medium mb-1">
                        Definition of Done
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {project.definition_of_done}
                      </div>
                    </div>
                  )}
                  {project.links_json && Object.keys(project.links_json).length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-medium mb-2">Links</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(project.links_json).map(([key, value]) => (
                          <a
                            key={key}
                            href={value as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {key}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {project.status !== 'shipped' && (
                      <>
                        {project.status !== 'in_progress' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(project.id, 'in_progress')}
                          >
                            Start
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(project.id, 'shipped')}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark Shipped
                        </Button>
                      </>
                    )}
                    {project.status === 'paused' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(project.id, 'in_progress')}
                      >
                        Resume
                      </Button>
                    )}
                    {project.status !== 'paused' && project.status !== 'shipped' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(project.id, 'paused')}
                      >
                        Pause
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

