import OpenAI from 'openai'

let client: OpenAI | null = null

/** Lazy OpenAI client so `next build` does not require OPENAI_API_KEY at module load. */
export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  if (!client) {
    client = new OpenAI({ apiKey })
  }
  return client
}

export function defaultOpenAIModel(fallback = 'gpt-4o-mini') {
  return process.env.OPENAI_MODEL || fallback
}
