import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/sidebar'
import { UserSyncProvider } from '@/components/user-sync-provider'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from '@clerk/nextjs'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Attendance System',
  description: 'Automated attendance system using face recognition',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
            <SignedOut>
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="max-w-md w-full space-y-8 p-8">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-gray-900">Attendance System</h1>
                  <p className="mt-2 text-gray-600">Sign in to access your dashboard</p>
                </div>
                <div className="flex flex-col space-y-4">
                  <SignInButton mode="modal">
                    <button className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </div>
            </div>
            </SignedOut>
            <SignedIn>
              <UserSyncProvider>
                <div className="flex h-screen">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto bg-gray-50">
                    {children}
                  </main>
                </div>
              </UserSyncProvider>
            </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  )
}
