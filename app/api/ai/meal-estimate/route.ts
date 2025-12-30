import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { checkRateLimit, recordRateLimit } from '@/lib/ai/rateLimit'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Maximum base64 image size: ~5MB (base64 is ~33% larger than binary)
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_BASE64_SIZE = Math.floor(MAX_IMAGE_SIZE_BYTES * 1.33)

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
    const rateLimit = await checkRateLimit(user.id, 'meal-estimate')
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
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
          },
        }
      )
    }

    const body = await request.json()
    const { imageBase64 } = body

    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 })
    }

    // Validate image size
    const base64Size = imageBase64.length
    if (base64Size > MAX_BASE64_SIZE) {
      return NextResponse.json(
        {
          error: `Image too large. Maximum size is ${Math.round(MAX_IMAGE_SIZE_BYTES / 1024 / 1024)}MB.`,
        },
        { status: 400 }
      )
    }

    const dataUrl = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    const systemPrompt = `You are a nutrition coach. Given a meal photo, return a conservative calorie and macro estimate as JSON:
{
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "notes": string // short rationale
}
Use integers. When unsure, round down slightly.`

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Estimate calories and macros for this meal photo.' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'No response from OpenAI' }, { status: 500 })
    }

    const estimate = JSON.parse(content)

    // Record successful request
    await recordRateLimit(user.id, 'meal-estimate')

    return NextResponse.json(
      { estimate },
      {
        headers: {
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': String(rateLimit.remaining - 1),
          'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
        },
      }
    )
  } catch (error: any) {
    console.error('Error estimating meal macros:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to estimate meal macros' },
      { status: 500 }
    )
  }
}


