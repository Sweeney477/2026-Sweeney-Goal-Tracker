/**
 * Brand + product identity. Forks can change this file without touching UI markup.
 */
export const brand = {
  name: 'GoalTracker',
  shortName: 'GT',
  tagline: 'Goals, fitness, and projects — tracked calmly.',
  description: 'A calm personal OS for goals, fitness, and projects.',
  /** CSS classes for the brand mark */
  markClassName: 'bg-brand text-brand-foreground',
} as const

export type Brand = typeof brand
