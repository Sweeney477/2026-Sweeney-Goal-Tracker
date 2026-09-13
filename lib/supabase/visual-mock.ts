/**
 * Local-only fixture Supabase client for visual / E2E screenshot tours.
 * Enabled when NEXT_PUBLIC_VISUAL_REVIEW=1. Never enable in production.
 */

const USER_ID = '00000000-0000-4000-8000-000000000001'
const TODAY = new Date().toISOString().slice(0, 10)

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export const VISUAL_USER = {
  id: USER_ID,
  email: 'demo@goaltracker.local',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
}

const fixtures: Record<string, any[]> = {
  profiles: [
    {
      id: 'p1',
      user_id: USER_ID,
      timezone: 'America/New_York',
      units: 'imperial',
      step_goal: 10000,
      coding_goal_minutes: 240,
      calorie_goal: 2200,
      onboarding_completed_at: '2026-01-02T00:00:00.000Z',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
    },
  ],
  goals: [
    {
      id: 'g1',
      user_id: USER_ID,
      title: 'Lose 15 lb by summer',
      category: 'health',
      target: '175',
      start_date: daysAgo(40),
      end_date: daysAgo(-60),
      created_at: daysAgo(40),
      updated_at: daysAgo(1),
    },
    {
      id: 'g2',
      user_id: USER_ID,
      title: 'Ship personal OS v1',
      category: 'coding',
      target: '120 coding minutes/day',
      start_date: daysAgo(20),
      end_date: daysAgo(-40),
      created_at: daysAgo(20),
      updated_at: daysAgo(1),
    },
    {
      id: 'g3',
      user_id: USER_ID,
      title: '3 strength sessions / week',
      category: 'fitness',
      target: '3',
      start_date: daysAgo(14),
      end_date: daysAgo(-70),
      created_at: daysAgo(14),
      updated_at: daysAgo(2),
    },
  ],
  goal_plans: [
    {
      id: 'gp1',
      goal_id: 'g1',
      plan_json: {
        lagging_metric: 'weight',
        leading_metrics: ['steps/day', 'calories/day'],
        cadence: 'daily',
        checkin_types: ['number'],
        minimum_viable_day: 'Weigh in + hit protein + 8k steps',
        weekly_review_prompt: 'Did weight trend down? What blocked adherence?',
        reminder_suggestions: ['Morning weigh-in', 'Evening calorie check'],
      },
      model: 'gpt-4o-mini',
      created_at: daysAgo(39),
    },
  ],
  checkins: [
    ...[0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12].flatMap((n, i) => {
      const date = daysAgo(n)
      const weight = 188 - i * 0.4
      return [
        {
          id: `cw-${n}`,
          user_id: USER_ID,
          date,
          type: 'weight',
          value_json: { value: Number(weight.toFixed(1)) },
          notes: n === 0 ? 'Feeling light' : null,
          created_at: `${date}T08:00:00.000Z`,
        },
        {
          id: `cs-${n}`,
          user_id: USER_ID,
          date,
          type: 'steps',
          value_json: { value: 7800 + (i % 5) * 900 },
          notes: null,
          created_at: `${date}T21:00:00.000Z`,
        },
        {
          id: `cc-${n}`,
          user_id: USER_ID,
          date,
          type: 'calories',
          value_json: { value: 1950 + (i % 3) * 120 },
          notes: null,
          created_at: `${date}T21:10:00.000Z`,
        },
        {
          id: `ck-${n}`,
          user_id: USER_ID,
          date,
          type: 'coding_minutes',
          value_json: { value: 90 + (i % 4) * 35 },
          notes: null,
          created_at: `${date}T22:00:00.000Z`,
        },
      ]
    }),
    {
      id: 'cwout-0',
      user_id: USER_ID,
      date: TODAY,
      type: 'workout',
      value_json: { value: 1, workout_type: 'strength' },
      notes: 'Upper body',
      created_at: `${TODAY}T18:00:00.000Z`,
    },
  ],
  meals: [
    {
      id: 'm1',
      user_id: USER_ID,
      name: 'Greek yogurt bowl',
      calories: 420,
      protein_g: 38,
      carbs_g: 42,
      fat_g: 12,
      consumed_at: `${TODAY}T08:30:00.000Z`,
      notes: null,
      photo_path: null,
      ai_estimate: null,
      created_at: `${TODAY}T08:31:00.000Z`,
    },
    {
      id: 'm2',
      user_id: USER_ID,
      name: 'Chicken + rice',
      calories: 650,
      protein_g: 52,
      carbs_g: 70,
      fat_g: 14,
      consumed_at: `${TODAY}T12:45:00.000Z`,
      notes: null,
      photo_path: null,
      ai_estimate: null,
      created_at: `${TODAY}T12:46:00.000Z`,
    },
    {
      id: 'm3',
      user_id: USER_ID,
      name: 'Salmon salad',
      calories: 540,
      protein_g: 40,
      carbs_g: 18,
      fat_g: 32,
      consumed_at: daysAgo(1) + 'T19:00:00.000Z',
      notes: 'Restaurant',
      photo_path: null,
      ai_estimate: { calories: 560 },
      created_at: daysAgo(1) + 'T19:05:00.000Z',
    },
  ],
  workouts: [
    {
      id: 'w1',
      user_id: USER_ID,
      date: TODAY,
      workout_type: 'strength',
      duration_min: 55,
      notes: 'Push day',
      volume_json: {
        exercises: [
          {
            name: 'Bench Press',
            sets: [
              { weight: 135, reps: 8 },
              { weight: 155, reps: 6 },
              { weight: 155, reps: 5 },
            ],
          },
          {
            name: 'Overhead Press',
            sets: [
              { weight: 85, reps: 8 },
              { weight: 95, reps: 6 },
            ],
          },
        ],
      },
      created_at: `${TODAY}T18:00:00.000Z`,
    },
    {
      id: 'w2',
      user_id: USER_ID,
      date: daysAgo(2),
      workout_type: 'strength',
      duration_min: 48,
      notes: 'Pull day',
      volume_json: {
        exercises: [
          {
            name: 'Barbell Row',
            sets: [
              { weight: 135, reps: 8 },
              { weight: 145, reps: 6 },
            ],
          },
        ],
      },
      created_at: `${daysAgo(2)}T17:30:00.000Z`,
    },
  ],
  exercises_library: [
    { id: 'e1', user_id: USER_ID, name: 'Bench Press', created_at: daysAgo(30) },
    { id: 'e2', user_id: USER_ID, name: 'Squat', created_at: daysAgo(30) },
    { id: 'e3', user_id: USER_ID, name: 'Deadlift', created_at: daysAgo(30) },
  ],
  projects: [
    {
      id: 'pr1',
      user_id: USER_ID,
      week_start: daysAgo(new Date().getDay()),
      name: 'GoalTracker Phase 2 polish',
      status: 'in_progress',
      definition_of_done: 'Auth, PWA, modular OS merged',
      links_json: { github: 'https://github.com/example/goal-tracker' },
      shipped_at: null,
      created_at: daysAgo(5),
    },
    {
      id: 'pr2',
      user_id: USER_ID,
      week_start: daysAgo(7 + new Date().getDay()),
      name: 'Meal photo estimates',
      status: 'shipped',
      definition_of_done: 'AI estimate route + UI',
      links_json: {},
      shipped_at: daysAgo(8),
      created_at: daysAgo(12),
    },
  ],
  project_milestones: [
    {
      id: 'pm1',
      project_id: 'pr1',
      title: 'Domain hooks extracted',
      completed_at: daysAgo(3),
      created_at: daysAgo(5),
    },
    {
      id: 'pm2',
      project_id: 'pr1',
      title: 'PWA icons + manifest',
      completed_at: null,
      created_at: daysAgo(4),
    },
  ],
  photos: [
    {
      id: 'ph1',
      user_id: USER_ID,
      date: daysAgo(14),
      kind: 'front',
      storage_path: `${USER_ID}/front-1.jpg`,
      notes: 'Start of cut',
      created_at: daysAgo(14),
    },
    {
      id: 'ph2',
      user_id: USER_ID,
      date: daysAgo(1),
      kind: 'front',
      storage_path: `${USER_ID}/front-2.jpg`,
      notes: 'Week 2',
      created_at: daysAgo(1),
    },
  ],
  rate_limits: [],
}

type Filter = { col: string; op: string; val: any }

class QueryBuilder {
  private table: string
  private filters: Filter[] = []
  private orderCol: string | null = null
  private ascending = true
  private limitN: number | null = null
  private wantSingle = false
  private wantMaybeSingle = false
  private mutate: 'none' | 'insert' | 'update' | 'upsert' | 'delete' = 'none'
  private payload: any = null

  constructor(table: string) {
    this.table = table
  }

  select(_cols?: string) {
    return this
  }
  eq(col: string, val: any) {
    this.filters.push({ col, op: 'eq', val })
    return this
  }
  gte(col: string, val: any) {
    this.filters.push({ col, op: 'gte', val })
    return this
  }
  lte(col: string, val: any) {
    this.filters.push({ col, op: 'lte', val })
    return this
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col
    this.ascending = opts?.ascending !== false
    return this
  }
  limit(n: number) {
    this.limitN = n
    return this
  }
  single() {
    this.wantSingle = true
    return this.execute()
  }
  maybeSingle() {
    this.wantMaybeSingle = true
    return this.execute()
  }
  insert(payload: any) {
    this.mutate = 'insert'
    this.payload = payload
    return this
  }
  update(payload: any) {
    this.mutate = 'update'
    this.payload = payload
    return this
  }
  upsert(payload: any) {
    this.mutate = 'upsert'
    this.payload = payload
    return this
  }
  delete() {
    this.mutate = 'delete'
    return this
  }

  private applyFilters(rows: any[]) {
    return rows.filter((row) =>
      this.filters.every((f) => {
        const v = row[f.col]
        if (f.op === 'eq') return v === f.val
        if (f.op === 'gte') return v >= f.val
        if (f.op === 'lte') return v <= f.val
        return true
      })
    )
  }

  private async execute() {
    if (this.mutate !== 'none') {
      const rows = fixtures[this.table] || (fixtures[this.table] = [])
      if (this.mutate === 'insert' || this.mutate === 'upsert') {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload]
        for (const item of items) {
          const withId = { id: item.id || `new-${Math.random().toString(36).slice(2, 8)}`, ...item }
          rows.unshift(withId)
        }
      }
      if (this.mutate === 'update') {
        const matched = this.applyFilters(rows)
        matched.forEach((row) => Object.assign(row, this.payload))
      }
      if (this.mutate === 'delete') {
        const keep = rows.filter((row) => !this.applyFilters([row]).length)
        fixtures[this.table] = keep
      }
    }

    let rows = [...(fixtures[this.table] || [])]
    rows = this.applyFilters(rows)
    if (this.orderCol) {
      const col = this.orderCol
      rows.sort((a, b) => {
        const av = a[col]
        const bv = b[col]
        if (av === bv) return 0
        if (av == null) return 1
        if (bv == null) return -1
        return this.ascending ? (av > bv ? 1 : -1) : av > bv ? -1 : 1
      })
    }
    if (this.limitN != null) rows = rows.slice(0, this.limitN)

    if (this.wantSingle) {
      if (!rows[0]) return { data: null, error: { message: 'No rows', code: 'PGRST116' } }
      return { data: rows[0], error: null }
    }
    if (this.wantMaybeSingle) {
      return { data: rows[0] || null, error: null }
    }
    return { data: rows, error: null }
  }

  then(resolve: (v: any) => any, reject?: (e: any) => any) {
    return this.execute().then(resolve, reject)
  }
}

export function createVisualMockClient(): any {
  return {
    auth: {
      async getUser() {
        return { data: { user: VISUAL_USER }, error: null }
      },
      async getSession() {
        return {
          data: {
            session: {
              access_token: 'visual-review',
              user: VISUAL_USER,
            },
          },
          error: null,
        }
      },
      async signOut() {
        return { error: null }
      },
      async signInWithPassword() {
        return { data: { user: VISUAL_USER, session: {} }, error: null }
      },
      async signUp() {
        return { data: { user: VISUAL_USER, session: {} }, error: null }
      },
      async signInWithOAuth() {
        return { data: { url: null }, error: null }
      },
      async resetPasswordForEmail() {
        return { data: {}, error: null }
      },
      async updateUser() {
        return { data: { user: VISUAL_USER }, error: null }
      },
      async exchangeCodeForSession() {
        return { data: { session: {} }, error: null }
      },
    },
    from(table: string) {
      return new QueryBuilder(table)
    },
    storage: {
      from(_bucket: string) {
        return {
          async createSignedUrl(path: string) {
            return {
              data: {
                signedUrl: `https://placehold.co/400x600/png?text=${encodeURIComponent(path)}`,
              },
              error: null,
            }
          },
          async upload() {
            return { data: { path: 'demo.jpg' }, error: null }
          },
          async remove() {
            return { data: [], error: null }
          },
        }
      },
    },
  }
}

export function isVisualReview() {
  return process.env.NEXT_PUBLIC_VISUAL_REVIEW === '1' || process.env.VISUAL_REVIEW === '1'
}
