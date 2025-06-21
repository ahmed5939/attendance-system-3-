"use client"

import { useSyncUser } from '@/hooks/use-sync-user'

export function UserSyncProvider({ children }: { children: React.ReactNode }) {
  // This hook will automatically sync the user when they log in
  useSyncUser()
  
  return <>{children}</>
} 