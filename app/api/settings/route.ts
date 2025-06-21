import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// In a real application, you would store this in a database
// For now, we'll use a simple in-memory store (this will reset on server restart)
let settingsStore: Record<string, any> = {
  // Default settings
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

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ settings: settingsStore })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings data' }, { status: 400 })
    }

    // Update settings store
    settingsStore = { ...settingsStore, ...settings }

    // In a real application, you would save to database here
    // await db.settings.update({ userId }, { settings: settingsStore })

    return NextResponse.json({ 
      message: 'Settings updated successfully',
      settings: settingsStore 
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  // Alias for POST
  return POST(request)
} 