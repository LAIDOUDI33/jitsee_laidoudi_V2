'use client'

import { useCallback, useSyncExternalStore } from 'react'

const ONBOARDING_KEY = 'alvision-onboarding-complete'

// Subscribe to localStorage changes
function subscribeToOnboarding(callback: () => void) {
  const handler = () => callback()
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}

function getOnboardingSnapshot(): string {
  return localStorage.getItem(ONBOARDING_KEY) ?? 'false'
}

function getOnboardingServerSnapshot(): string {
  return 'false'
}

export function useOnboarding() {
  const localStorageValue = useSyncExternalStore(
    subscribeToOnboarding,
    getOnboardingSnapshot,
    getOnboardingServerSnapshot
  )

  const isCompleted = localStorageValue === 'true'
  const showOnboarding = !isCompleted

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    window.dispatchEvent(new StorageEvent('storage', { key: ONBOARDING_KEY }))
  }, [])

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY)
    window.dispatchEvent(new StorageEvent('storage', { key: ONBOARDING_KEY }))
  }, [])

  const setShowOnboarding = useCallback((show: boolean) => {
    if (!show) {
      completeOnboarding()
    } else {
      resetOnboarding()
    }
  }, [completeOnboarding, resetOnboarding])

  return {
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    resetOnboarding,
  }
}
