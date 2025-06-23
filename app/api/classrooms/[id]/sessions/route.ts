import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Get sessions for a class
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        classId: params.id,
      },
      orderBy: {
        startTime: "desc",
      },
    })
    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Error fetching class sessions:", error)
    return NextResponse.json(
      { error: "Failed to fetch class sessions" },
      { status: 500 }
    )
  }
} 