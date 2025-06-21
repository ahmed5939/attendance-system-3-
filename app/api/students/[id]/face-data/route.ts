import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { image } = await req.json()
    const studentId = params.id

    // Validate student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      )
    }

    // Create or update face data
    const faceData = await prisma.faceData.upsert({
      where: {
        studentId,
      },
      update: {
        imageData: image,
        updatedAt: new Date(),
      },
      create: {
        studentId,
        imageData: image,
      },
    })

    return NextResponse.json(faceData)
  } catch (error) {
    console.error("Error saving face data:", error)
    return NextResponse.json(
      { error: "Failed to save face data" },
      { status: 500 }
    )
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id

    const faceData = await prisma.faceData.findUnique({
      where: { studentId },
    })

    if (!faceData) {
      return NextResponse.json(
        { error: "Face data not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(faceData)
  } catch (error) {
    console.error("Error fetching face data:", error)
    return NextResponse.json(
      { error: "Failed to fetch face data" },
      { status: 500 }
    )
  }
} 