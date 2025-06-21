import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const classes = await prisma.class.findMany({
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              }
            }
          }
        },
        students: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              }
            }
          }
        },
        sessions: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the expected format
    const classrooms = classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      description: cls.description,
      capacity: cls.capacity,
      location: cls.location,
      instructor: cls.teacher.name,
      teacherId: cls.teacherId,
      studentCount: cls.students.length,
      isActive: cls.isActive,
      createdAt: cls.createdAt.toISOString(),
      updatedAt: cls.updatedAt.toISOString()
    }))

    return NextResponse.json({ classrooms })
  } catch (error) {
    console.error('Error fetching classrooms:', error)
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
    const { name, description, capacity, location, teacherId } = body

    // Validation
    if (!name || !description || !capacity || !location || !teacherId) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, description, capacity, location, teacherId' 
      }, { status: 400 })
    }

    if (capacity < 1 || capacity > 100) {
      return NextResponse.json({ 
        error: 'Capacity must be between 1 and 100' 
      }, { status: 400 })
    }

    // Verify teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId }
    })

    if (!teacher) {
      return NextResponse.json({ 
        error: 'Teacher not found' 
      }, { status: 404 })
    }

    // Create new classroom in database
    const newClass = await prisma.class.create({
      data: {
        name,
        description,
        capacity: parseInt(capacity),
        location,
        teacherId,
        isActive: true,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              }
            }
          }
        },
        students: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              }
            }
          }
        },
      }
    })

    // Transform to match expected format
    const classroom = {
      id: newClass.id,
      name: newClass.name,
      description: newClass.description,
      capacity: newClass.capacity,
      location: newClass.location,
      instructor: newClass.teacher.name,
      teacherId: newClass.teacherId,
      studentCount: newClass.students.length,
      isActive: newClass.isActive,
      createdAt: newClass.createdAt.toISOString(),
      updatedAt: newClass.updatedAt.toISOString()
    }

    return NextResponse.json({ 
      message: 'Classroom created successfully',
      classroom 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating classroom:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 