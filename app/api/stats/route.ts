import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get basic stats
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      activeSessions,
      presentToday,
      absentToday
    ] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count({ where: { isActive: true } }),
      prisma.session.count({
        where: {
          startTime: { lte: new Date() },
          endTime: { gte: new Date() }
        }
      }),
      prisma.attendance.count({
        where: {
          status: 'PRESENT',
          timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      prisma.attendance.count({
        where: {
          status: 'ABSENT',
          timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      })
    ])

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      totalClasses,
      activeSessions,
      presentToday,
      absentToday
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 