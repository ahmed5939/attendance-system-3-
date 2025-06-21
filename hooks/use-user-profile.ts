import useSWR from 'swr'
import { useUser } from '@clerk/nextjs'

interface UserProfile {
  id: string
  clerkId: string
  email: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  student?: {
    id: string
    name: string
    classes: Array<{
      id: string
      name: string
    }>
  }
  teacher?: {
    id: string
    name: string
    department?: string
    classes: Array<{
      id: string
      name: string
    }>
  }
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useUserProfile() {
  const { user, isLoaded } = useUser()
  
  const { data, error, mutate } = useSWR<UserProfile>(
    isLoaded && user ? `/api/users/me` : null,
    fetcher
  )

  return {
    profile: data,
    isLoading: !isLoaded || (!data && !error),
    isError: error,
    mutate
  }
} 