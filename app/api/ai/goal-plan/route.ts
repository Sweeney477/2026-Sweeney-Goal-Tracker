import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI, defaultOpenAIModel } from '@/lib/ai/openai'
import { TrackingPlan } from '@/lib/types'
import { checkRateLimit, recordRateLimit } from '@/lib/ai/rateLimit'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Missing OpenAI configuration' },
        { status: 500 }
      )
    }

    const openai = getOpenAI()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(user.id, 'goal-plan')
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
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
          },
        }
      )
    }

    const body = await request.json()
    const { goalText, context } = body

    if (!goalText) {
      return NextResponse.json(
        { error: 'goalText is required' },
        { status: 400 }
      )
    }

    const model = defaultOpenAIModel('gpt-4o-mini')

    const systemPrompt = `You are a goal tracking advisor. Given a user's goal in plain English, generate a comprehensive tracking plan with:
- lagging_metric: The main outcome metric (e.g., "weight", "body fat percentage")
- leading_metrics: Array of actionable metrics that predict the lagging metric (e.g., ["steps/day", "calories/day", "protein/grams"])
- milestones: A small set of actionable milestones (3-7) that clearly move the user toward the goal.
  - Make milestones ordered from earliest to latest
  - Each milestone must be concrete + measurable (avoid vague phrases like "be consistent" or "stay motivated")
  - Prefer verbs that imply action + proof (e.g., "complete", "log", "ship", "schedule", "run", "publish")
  - Include 2-5 short action steps per milestone (actions[])
  - Include a measurable success_criteria for each milestone
- cadence: Either "daily" or "weekly" - how often to check in
- checkin_types: Array of check-in types needed: "number", "checklist", "photo", "timer"
- minimum_viable_day: A brief description of the minimum daily actions to stay on track
- weekly_review_prompt: A prompt template for weekly reviews
- reminder_suggestions: Array of suggested reminder times/messages

Return ONLY valid JSON matching this structure:
{
  "lagging_metric": string,
  "leading_metrics": string[],
  "milestones": Array<{
    "title": string,
    "timeframe"?: string,
    "actions"?: string[],
    "success_criteria"?: string
  }>,
  "cadence": "daily" | "weekly",
  "checkin_types": ("number" | "checklist" | "photo" | "timer")[],
  "minimum_viable_day": string,
  "weekly_review_prompt": string,
  "reminder_suggestions": string[]
}`

    const userPrompt = `Goal: ${goalText}

${context ? `Context: ${JSON.stringify(context)}` : ''}

Generate a tracking plan for this goal.`


    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      )
    }

    const plan: TrackingPlan = JSON.parse(content)

    // Normalize + guard against malformed AI output
    const rawMilestones = (plan as any)?.milestones
    plan.milestones = Array.isArray(rawMilestones)
      ? rawMilestones
          .slice(0, 7)
          .map((m: any) => ({
            title: typeof m?.title === 'string' ? m.title : '',
            timeframe: typeof m?.timeframe === 'string' ? m.timeframe : undefined,
            actions: Array.isArray(m?.actions) ? m.actions.filter((a: any) => typeof a === 'string') : undefined,
            success_criteria: typeof m?.success_criteria === 'string' ? m.success_criteria : undefined,
          }))
          .filter((m: any) => m.title.trim().length > 0)
      : []

    // Validate required fields
    if (!plan.cadence || !plan.leading_metrics) {
      return NextResponse.json(
        { error: 'Invalid plan structure from AI' },
        { status: 500 }
      )
    }

    // Record successful request
    await recordRateLimit(user.id, 'goal-plan')

    return NextResponse.json(
      { plan },
      {
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': String(rateLimit.remaining - 1),
          'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
        },
      }
    )
  } catch (error: any) {
    console.error('Error generating goal plan:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate goal plan' },
      { status: 500 }
    )
  }
}

