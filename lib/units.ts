export type UnitSystem = 'metric' | 'imperial'

export function normalizeUnits(units?: string | null): UnitSystem {
  return units === 'metric' ? 'metric' : 'imperial'
}

export function weightUnitLabel(units?: string | null): string {
  return normalizeUnits(units) === 'metric' ? 'kg' : 'lbs'
}

export function percentOfGoal(value: number, max: number) {
  if (!max) return 0
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)))
}
