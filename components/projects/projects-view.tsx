'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { Plus, CheckCircle2, Zap, CalendarDays, MoreVertical, Check, X, Trash2, Edit2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useProjects } from '@/lib/projects/use-projects'

const ProgressRing = ({ value }: { value: number }) => (
  <svg width="52" height="52" viewBox="0 0 56 56" className="shrink-0">
    <circle cx="28" cy="28" r="22" stroke="hsl(var(--border))" strokeWidth="6" fill="none" />
    <circle
      cx="28"
      cy="28"
      r="22"
      stroke="hsl(217 91% 60%)"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
      strokeDasharray={`${2 * Math.PI * 22}`}
      strokeDashoffset={`${2 * Math.PI * 22 * (1 - Math.max(0, Math.min(100, value)) / 100)}`}
      transform="rotate(-90 28 28)"
    />
    <text x="28" y="32" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))" fontWeight="700">
      {value}%
    </text>
  </svg>
)

export function ProjectsView() {
  const {
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
  } = useProjects()

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Weekly Projects</h1>
          <div className="mt-2 inline-flex items-center gap-2 rounded-2xl border bg-background px-3 py-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {dateRangeLabel}
          </div>
        </div>
        <div className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          <span className="inline-flex items-center gap-2">
            <Zap className="h-4 w-4" /> Level {level}
          </span>
          <div className="text-[11px] font-medium opacity-90">
            {xp.toLocaleString()} XP to lvl {level + 1}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowNewForm(!showNewForm)}
        className="flex w-full items-center justify-center gap-3 rounded-3xl bg-slate-950 px-5 py-4 text-white shadow-sm"
      >
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/15">
          <Plus className="h-5 w-5" />
        </span>
        <div className="text-left">
          <div className="text-lg font-semibold">New Project</div>
          <div className="text-sm opacity-80">+50 XP Reward</div>
        </div>
      </button>

      {showNewForm && (
        <div className="rounded-3xl border bg-background p-4 shadow-sm">
          <div className="text-lg font-semibold">New Weekly Project</div>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground">
                PROJECT NAME
              </Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Build a personal tracker"
                required
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="weekStart" className="text-xs font-semibold text-muted-foreground">
                  WEEK START
                </Label>
                <Input
                  id="weekStart"
                  type="date"
                  value={formWeekStart}
                  onChange={(e) => setFormWeekStart(e.target.value)}
                  required
                  className="h-12 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dod" className="text-xs font-semibold text-muted-foreground">
                  DEFINITION OF DONE
                </Label>
                <Input
                  id="dod"
                  value={formDoD}
                  onChange={(e) => setFormDoD(e.target.value)}
                  placeholder="Ship to prod…"
                  className="h-12 rounded-2xl"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} className="rounded-2xl">
                {submitting ? 'Creating…' : 'Create Project'}
              </Button>
              <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setShowNewForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : projects.length === 0 ? (
          <div className="rounded-3xl border bg-background p-6 text-center text-sm text-muted-foreground shadow-sm">
            No projects yet. Create your first weekly project!
          </div>
        ) : (
          projects.map((project) => {
            const milestones = project.milestones_json || []
            const progress = calculateProgress(milestones)
            const isExpanded = expandedProject === project.id

            return (
              <div key={project.id} className="rounded-3xl border bg-background p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xl font-semibold">{project.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Week of {format(new Date(project.week_start), 'MMM d, yyyy')}
                      {project.shipped_at ? ` • Shipped ${format(new Date(project.shipped_at), 'MMM d')}` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ProgressRing value={progress} />
                    <button
                      type="button"
                      onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                      className="grid h-11 w-11 place-items-center rounded-2xl border bg-background hover:bg-muted/50"
                    >
                      <MoreVertical className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">Progress</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Milestones */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-muted-foreground">Milestones</div>
                    {!showAddMilestone[project.id] && project.status !== 'shipped' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-xl text-xs"
                        onClick={() => setShowAddMilestone({ ...showAddMilestone, [project.id]: true })}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {milestones.map((milestone) => (
                      <label
                        key={milestone.id}
                        className={cn(
                          'group relative flex cursor-pointer items-center gap-2 rounded-2xl border p-3 transition-colors',
                          milestone.completed
                            ? 'border-emerald-200 bg-emerald-50'
                            : 'border-border bg-background hover:bg-muted/50'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={milestone.completed}
                          onChange={() => handleMilestoneToggle(project.id, milestone.id)}
                          disabled={project.status === 'shipped'}
                          className="h-5 w-5 rounded border-2 border-input accent-blue-600 disabled:cursor-not-allowed"
                        />
                        <span
                          className={cn(
                            'flex-1 text-sm font-medium',
                            milestone.completed && 'text-emerald-700 line-through'
                          )}
                        >
                          {milestone.label}
                        </span>
                        {milestone.completed && (
                          <Check className="h-4 w-4 text-emerald-600" />
                        )}
                        {project.status !== 'shipped' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteMilestone(project.id, milestone.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 rounded-full p-1 hover:bg-red-100 text-red-600 transition-opacity"
                            aria-label="Delete milestone"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </label>
                    ))}
                  </div>

                  {/* Add Milestone Input */}
                  {showAddMilestone[project.id] && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="New milestone name"
                        value={newMilestoneLabel}
                        onChange={(e) => setNewMilestoneLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddCustomMilestone(project.id)
                          } else if (e.key === 'Escape') {
                            setShowAddMilestone({ ...showAddMilestone, [project.id]: false })
                            setNewMilestoneLabel('')
                          }
                        }}
                        className="h-10 rounded-2xl"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddCustomMilestone(project.id)}
                        className="rounded-2xl"
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowAddMilestone({ ...showAddMilestone, [project.id]: false })
                          setNewMilestoneLabel('')
                        }}
                        className="rounded-2xl"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>

                {project.definition_of_done && (
                  <div className="mt-4 rounded-2xl border bg-muted/20 p-3 text-sm text-muted-foreground">
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Definition of Done</div>
                    {project.definition_of_done}
                  </div>
                )}

                {/* Expanded Menu */}
                {isExpanded && (
                  <div className="mt-4 space-y-2 rounded-2xl border bg-muted/20 p-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start rounded-xl"
                      onClick={() => {
                        setEditingProject(project.id)
                        setExpandedProject(null)
                      }}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit Project
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        handleDeleteProject(project.id)
                        setExpandedProject(null)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Project
                    </Button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex items-center gap-2">
                  {project.status !== 'shipped' && (
                    <>
                      <Button
                        className="h-12 flex-1 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-600/90 disabled:opacity-50"
                        onClick={() => handleStatusChange(project.id, 'shipped')}
                        disabled={progress < 100}
                        title={progress < 100 ? 'Complete all milestones first' : 'Mark project as shipped'}
                      >
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Mark Shipped
                      </Button>
                      <Button
                        variant="outline"
                        className="h-12 rounded-2xl"
                        onClick={() =>
                          handleStatusChange(
                            project.id,
                            project.status === 'in_progress' ? 'paused' : 'in_progress'
                          )
                        }
                      >
                        {project.status === 'in_progress' ? 'Pause' : 'Start'}
                      </Button>
                    </>
                  )}
                  {project.status === 'shipped' && (
                    <Badge className={cn(statusColors[project.status], 'h-12 px-4 text-white capitalize')}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Shipped
                    </Badge>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
