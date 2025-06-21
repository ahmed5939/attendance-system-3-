import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@clerk/nextjs/server"

export async function GET(request: NextRequest) {
  const { userId } = getAuth(request)
  try {
    const students = await prisma.student.findMany({
      include: {
        faceData: true,
      },
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req)
  try {
    const { name, email } = await req.json()

    const student = await prisma.student.create({
      data: {
        name,
        email,
      },
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    )
  }
} 