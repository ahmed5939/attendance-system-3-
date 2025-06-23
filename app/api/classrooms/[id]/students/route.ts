import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Get students in a class
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const students = await prisma.student.findMany({
      where: {
        classes: {
          some: {
            id: params.id,
          },
        },
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    })
    return NextResponse.json({ students })
  } catch (error) {
    console.error("Error fetching class students:", error)
    return NextResponse.json(
      { error: "Failed to fetch class students" },
      { status: 500 }
    )
  }
}

// Update students in a class
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { studentIds } = await req.json()
    const classroomId = params.id

    await prisma.class.update({
      where: { id: classroomId },
      data: {
        students: {
          set: studentIds.map((id: string) => ({ id })),
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating class students:", error)
    return NextResponse.json(
      { error: "Failed to update class students" },
      { status: 500 }
    )
  }
} 