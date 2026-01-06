'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const INSTALL_PROMPT_DISMISSED_KEY = 'gymbo-install-prompt-dismissed'
const INSTALL_PROMPT_DISMISSED_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    // Register service worker
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }

    // Check if user previously dismissed the prompt
    const checkDismissedStatus = () => {
      const dismissedAt = localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY)
      if (dismissedAt) {
        const dismissedTime = parseInt(dismissedAt, 10)
        const now = Date.now()
        // If dismissed less than 7 days ago, don't show prompt
        if (now - dismissedTime < INSTALL_PROMPT_DISMISSED_DURATION) {
          return true
        } else {
          // More than 7 days have passed, clear the flag
          localStorage.removeItem(INSTALL_PROMPT_DISMISSED_KEY)
        }
      }
      return false
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()

      // Check if user dismissed it recently
      if (checkDismissedStatus()) {
        return
      }

      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Show install prompt after a delay (don't annoy users immediately)
      setTimeout(() => {
        setShowInstallPrompt(true)
      }, 5000) // 5 seconds delay
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User ${outcome} the install prompt`)

    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowInstallPrompt(false)

    // If user dismissed the native prompt, remember it
    if (outcome === 'dismissed') {
      localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, Date.now().toString())
    }
  }

  const handleDismiss = () => {
    // Remember that user dismissed the prompt
    localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, Date.now().toString())
    setShowInstallPrompt(false)
  }

  if (!showInstallPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <Alert className="bg-background border-border shadow-lg">
        <AlertDescription className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              📱
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1">Install Gymbo</p>
              <p className="text-sm text-muted-foreground">
                Install this app on your home screen for quick and easy access.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleInstallClick} size="sm" className="flex-1">
              Install
            </Button>
            <Button onClick={handleDismiss} size="sm" variant="outline">
              Not Now
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
