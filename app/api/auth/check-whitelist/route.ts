import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 })
    }

    // Check if email exists in whitelist
    const whitelistEntry = await prisma.userWhitelist.findUnique({
      where: { email }
    })

    if (!whitelistEntry) {
      return NextResponse.json({ 
        error: 'Email not found in whitelist. Please contact your administrator.' 
      }, { status: 404 })
    }

    if (!whitelistEntry.isActive) {
      return NextResponse.json({ 
        error: 'Your account has been deactivated. Please contact your administrator.' 
      }, { status: 403 })
    }

    return NextResponse.json({ 
      allowed: true,
      role: whitelistEntry.role,
      name: whitelistEntry.name,
      department: whitelistEntry.department
    })
  } catch (error) {
    console.error('Error checking whitelist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 