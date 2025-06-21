import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          }
        },
        classes: {
          include: {
            students: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ teachers })
  } catch (error) {
    console.error('Error fetching teachers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, department, userEmail } = body

    // Validation
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

    // Check if user already has a teacher record
    const existingTeacher = await prisma.teacher.findUnique({
      where: { userId: user.id }
    })

    if (existingTeacher) {
      return NextResponse.json({ 
        error: 'User is already a teacher' 
      }, { status: 400 })
    }

    // Create teacher record and update user role
    const teacher = await prisma.$transaction(async (tx) => {
      // Update user role to TEACHER
      await tx.user.update({
        where: { id: user.id },
        data: { role: 'TEACHER' }
      })

      // Create teacher record
      return await tx.teacher.create({
        data: {
          name,
          department,
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
          classes: true
        }
      })
    })

    return NextResponse.json({ 
      message: 'Teacher created successfully',
      teacher 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating teacher:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 