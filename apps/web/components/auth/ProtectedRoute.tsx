'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { useHasHydrated } from '@/lib/store/useHasHydrated'

interface Props {
  children: React.ReactNode
  requireRole?: 'vendor' | 'admin'
}

export default function ProtectedRoute({ children, requireRole }: Props) {
  const router = useRouter()
  const hasHydrated = useHasHydrated()
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)

  useEffect(() => {
    if (!hasHydrated) return
    if (!accessToken || !user) {
      router.push('/auth')
      return
    }
    if (requireRole === 'vendor' && user.role !== 'vendor' && user.role !== 'admin') {
      router.push('/search')
      return
    }
    if (requireRole === 'admin' && user.role !== 'admin') {
      router.push('/')
    }
  }, [hasHydrated, accessToken, user, router, requireRole])

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    )
  }

  if (!accessToken || !user) return null
  if (requireRole === 'vendor' && user.role !== 'vendor' && user.role !== 'admin') return null
  if (requireRole === 'admin' && user.role !== 'admin') return null

  return <>{children}</>
}
