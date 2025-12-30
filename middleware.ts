import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/d6aa76b2-a494-4e8c-b5eb-df8531eebc37', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'pre-fix',
      hypothesisId: 'H2',
      location: 'middleware.ts:entry',
      message: 'middleware entry',
      data: {
        path: request.nextUrl.pathname,
        ua: request.headers.get('user-agent'),
        cookieCount: request.cookies.getAll().length,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}


