import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          }
        },
        faceData: true,
        classes: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ students })
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, userEmail } = await req.json()

    if (!name || !userEmail) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, userEmail' 
      }, { status: 400 })
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found. Please make sure the user has signed up first.' 
      }, { status: 404 })
    }

    if (user.role !== 'STUDENT' && user.role !== 'TEACHER') {
      return NextResponse.json({ 
        error: 'User already has a role assigned' 
      }, { status: 400 })
    }

    // Check if user already has a student record
    const existingStudent = await prisma.student.findUnique({
      where: { userId: user.id }
    })

    if (existingStudent) {
      return NextResponse.json({ 
        error: 'User is already a student' 
      }, { status: 400 })
    }

    // Create student record and update user role
    const student = await prisma.$transaction(async (tx) => {
      // Update user role to STUDENT
      await tx.user.update({
        where: { id: user.id },
        data: { role: 'STUDENT' }
      })

      // Create student record
      return await tx.student.create({
      data: {
        name,
          userId: user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            }
          },
          faceData: true,
          classes: true,
        }
      })
    })

    return NextResponse.json({ 
      message: 'Student created successfully',
      student 
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    )
  }
} 