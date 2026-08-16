'use client'

import { useSyncExternalStore, useCallback } from 'react'

const ONBOARDING_KEY = 'alvision-onboarding-seen'

// Subscribe to sessionStorage changes
function subscribeToOnboarding(callback: () => void) {
  const handler = () => callback()
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}

function getOnboardingSnapshot(): string {
  return sessionStorage.getItem(ONBOARDING_KEY) ?? ''
}

function getOnboardingServerSnapshot(): string {
  return ''
}

export function useOnboarding() {
  const sessionStorageValue = useSyncExternalStore(
    subscribeToOnboarding,
    getOnboardingSnapshot,
    getOnboardingServerSnapshot
  )

  const isCompleted = sessionStorageValue !== ''
  const showOnboarding = !isCompleted

  const completeOnboarding = useCallback(() => {
    sessionStorage.setItem(ONBOARDING_KEY, 'true')
    // Trigger re-render by dispatching a storage event
    window.dispatchEvent(new StorageEvent('storage', { key: ONBOARDING_KEY }))
  }, [])

  const setShowOnboarding = useCallback((show: boolean) => {
    if (!show) {
      completeOnboarding()
    }
  }, [completeOnboarding])

  const resetOnboarding = useCallback(() => {
    sessionStorage.removeItem(ONBOARDING_KEY)
    window.dispatchEvent(new StorageEvent('storage', { key: ONBOARDING_KEY }))
  }, [])

  return {
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    resetOnboarding,
  }
}
