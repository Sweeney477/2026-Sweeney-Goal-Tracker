import webpush from 'web-push'

export function isPushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
  )
}

export function configureWebPush() {
  if (!isPushConfigured()) {
    throw new Error('Web Push is not configured (VAPID keys missing)')
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  return webpush
}

export type PushPayload = {
  title: string
  body: string
  url?: string
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload
) {
  const push = configureWebPush()
  return push.sendNotification(subscription, JSON.stringify(payload))
}
