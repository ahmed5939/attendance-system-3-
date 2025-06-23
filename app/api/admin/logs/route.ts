import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = auth()
    console.log('Logs API - userId:', userId)
    
    if (!userId) {
      console.log('Logs API - No userId found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user exists and has admin role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    })

    console.log('Logs API - Found user:', user)

    if (!user || user.role !== 'ADMIN') {
      console.log('Logs API - User not found or not admin. User:', user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const logs = await prisma.systemLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to the latest 100 logs for performance
    })

    console.log('Logs API - Returning logs count:', logs.length)
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching system logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 