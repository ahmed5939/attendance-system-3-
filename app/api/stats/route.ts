import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import os from 'os'
import { createLog } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Log this action
    createLog('INFO', `System stats fetched by user ${userId}`)

    // Get basic stats from the database
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

    // Simulate system-level stats
    const cpuUsage = Math.random() * 100
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    const usedMemory = totalMemory - freeMemory
    const memoryUsage = (usedMemory / totalMemory) * 100
    const uptime = os.uptime()

    const systemHealth = 98 // Placeholder

    return NextResponse.json({
      // Database stats
      totalStudents,
      totalTeachers,
      totalClasses,
      activeSessions,
      presentToday,
      absentToday,

      // System stats (simulated)
      cpuUsage,
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usagePercentage: memoryUsage
      },
      uptime,
      health: systemHealth,
      databaseStatus: "Online",
      lastSync: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 