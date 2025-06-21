import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    // Get total students
    const totalStudents = await prisma.student.count()

    // Get active sessions
    const activeSessions = await prisma.session.count({
      where: {
        startTime: {
          lte: now,
        },
        endTime: {
          gte: now,
        },
      },
    })

    // Get today's attendance
    const todayAttendance = await prisma.attendance.findMany({
      where: {
        timestamp: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    })

    const presentToday = todayAttendance.filter(
      (record) => record.status === "PRESENT"
    ).length

    const absentToday = todayAttendance.filter(
      (record) => record.status === "ABSENT"
    ).length

    return NextResponse.json({
      totalStudents,
      activeSessions,
      presentToday,
      absentToday,
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
} 