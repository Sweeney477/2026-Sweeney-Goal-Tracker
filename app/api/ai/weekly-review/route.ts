import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, defaultOpenAIModel } from '@/lib/ai/openai'
import { WeeklyReview } from '@/lib/types'
import { checkRateLimit, recordRateLimit } from '@/lib/ai/rateLimit'


export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(user.id, 'weekly-review')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter || 60),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
          },
        }
      )
    }

    const body = await request.json()
    const { days = 7 } = body

    // Fetch check-ins from the last N days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .order('date', { ascending: true })

    if (checkinsError) {
      return NextResponse.json(
        { error: 'Failed to fetch check-ins' },
        { status: 500 }
      )
    }

    // Fetch recent goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (goalsError) {
      return NextResponse.json(
        { error: 'Failed to fetch goals' },
        { status: 500 }
      )
    }

    // Fetch recent projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(4)

    if (projectsError) {
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }

    const model = defaultOpenAIModel('gpt-4o-mini')

    const systemPrompt = `You are a personal coaching assistant. Analyze the user's recent tracking data and generate a weekly review with:
- wins: Array of positive observations and achievements (3-5 items)
- risks: Array of potential issues or areas of concern (2-4 items)
- changes: Array of 1-2 actionable changes to make next week (be specific)
- next_week_plan: Array of concrete actions for the upcoming week (3-5 items)
- priority_goal: The single most important goal to focus on next week

Be honest, specific, and actionable. Base your analysis on the actual data provided.

Return ONLY valid JSON matching this structure:
{
  "wins": string[],
  "risks": string[],
  "changes": string[],
  "next_week_plan": string[],
  "priority_goal": string
}`

    const userPrompt = `Analyze the last ${days} days of tracking data:

Check-ins (${checkins?.length || 0} entries):
${JSON.stringify(checkins?.slice(0, 50) || [], null, 2)}

Active Goals (${goals?.length || 0}):
${JSON.stringify(goals || [], null, 2)}

Recent Projects (${projects?.length || 0}):
${JSON.stringify(projects || [], null, 2)}

Generate a weekly review based on this data.`

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      )
    }

    const review: WeeklyReview = JSON.parse(content)

    // Validate required fields
    if (!review.wins || !review.next_week_plan) {
      return NextResponse.json(
        { error: 'Invalid review structure from AI' },
        { status: 500 }
      )
    }

    // Record successful request
    await recordRateLimit(user.id, 'weekly-review')

    return NextResponse.json(
      { review },
      {
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': String(rateLimit.remaining - 1),
          'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
        },
      }
    )
  } catch (error: any) {
    console.error('Error generating weekly review:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate weekly review' },
      { status: 500 }
    )
  }
}

