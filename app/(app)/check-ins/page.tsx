'use client'

import { Suspense } from 'react'
import { CheckInsView } from '@/components/check-ins/check-ins-view'
import { LoadingState } from '@/components/loading-state'

export default function CheckInsPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading check-ins…" />}>
      <CheckInsView />
    </Suspense>
  )
}
