"use client"

import { createContext, useContext, useState } from "react"

type User = {
  id: string
  name: string
  email: string
  role: "admin" | "teacher" | "student"
}

type AppContextType = {
  user: User | null
  setUser: (user: User | null) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  return (
    <AppContext.Provider value={{ user, setUser }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within a Provider")
  }
  return context
} 