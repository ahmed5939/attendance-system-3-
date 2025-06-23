import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { toast } from '@/components/ui/use-toast'

export const useSyncUser = () => {
  const { isLoaded, isSignedIn, userId } = useAuth()

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !isSignedIn || !userId) {
        return
      }

      try {
        const response = await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()

        if (response.ok) {
          if (data.message === 'User created from whitelist') {
            console.log('User account created successfully from whitelist')
            // Optionally show a success message
            toast({
              title: "Welcome!",
              description: "Your account has been set up successfully.",
            })
          }
        } else {
          console.error('Failed to sync user:', data.error)
          if (data.message === 'User not found in whitelist or account deactivated') {
            toast({
              title: "Access Denied",
              description: "Your account is not authorized. Please contact your administrator.",
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        console.error('Error syncing user:', error)
      }
    }

    syncUser()
  }, [isLoaded, isSignedIn, userId])

  return { isLoaded, isSignedIn }
} 