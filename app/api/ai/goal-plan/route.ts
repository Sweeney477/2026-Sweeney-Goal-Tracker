import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { TrackingPlan } from '@/lib/types'


export async function POST(request: NextRequest) {
  try {

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Missing OpenAI configuration' },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { goalText, context } = body

    if (!goalText) {
      return NextResponse.json(
        { error: 'goalText is required' },
        { status: 400 }
      )
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'

    const systemPrompt = `You are a goal tracking advisor. Given a user's goal in plain English, generate a comprehensive tracking plan with:
- lagging_metric: The main outcome metric (e.g., "weight", "body fat percentage")
- leading_metrics: Array of actionable metrics that predict the lagging metric (e.g., ["steps/day", "calories/day", "protein/grams"])
- cadence: Either "daily" or "weekly" - how often to check in
- checkin_types: Array of check-in types needed: "number", "checklist", "photo", "timer"
- minimum_viable_day: A brief description of the minimum daily actions to stay on track
- weekly_review_prompt: A prompt template for weekly reviews
- reminder_suggestions: Array of suggested reminder times/messages

Return ONLY valid JSON matching this structure:
{
  "lagging_metric": string,
  "leading_metrics": string[],
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
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      )
    }

    const plan: TrackingPlan = JSON.parse(content)

    // Validate required fields
    if (!plan.cadence || !plan.leading_metrics) {
      return NextResponse.json(
        { error: 'Invalid plan structure from AI' },
        { status: 500 }
      )
    }


    return NextResponse.json({ plan })
  } catch (error: any) {
    console.error('Error generating goal plan:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate goal plan' },
      { status: 500 }
    )
  }
}

