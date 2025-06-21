"use client"

import { createContext, useContext, ReactNode } from 'react'
import useSWR from 'swr'

// Default settings
const defaultSettings = {
  systemName: "Attendance System",
  timezone: "UTC",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  lateThreshold: 15,
  absentThreshold: 30,
  autoMarkAbsent: true,
  requirePhoto: true,
  allowManualEntry: true,
  emailNotifications: true,
  pushNotifications: false,
  dailyReports: true,
  weeklyReports: false,
  sessionTimeout: 30,
  requireReauth: false,
  logActivity: true,
  confidenceThreshold: 0.8,
  maxRetries: 3,
  enableLiveness: true,
}

type Settings = typeof defaultSettings

interface SettingsContextType {
  settings: Settings
  isLoading: boolean
  error: any
  mutate: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json())

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data, error, isLoading, mutate } = useSWR('/api/settings', fetcher, {
    fallbackData: { settings: defaultSettings }
  })

  const settings = data?.settings || defaultSettings

  return (
    <SettingsContext.Provider value={{ settings, isLoading, error, mutate }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
} 