import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const classData = await prisma.class.findUnique({
      where: { id: params.id },
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
      }
    })
    
    if (!classData) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 })
    }

    // Transform to match expected format
    const classroom = {
      id: classData.id,
      name: classData.name,
      description: classData.description,
      capacity: classData.capacity,
      location: classData.location,
      instructor: classData.teacher.name,
      teacherId: classData.teacherId,
      studentCount: classData.students.length,
      isActive: classData.isActive,
      createdAt: classData.createdAt.toISOString(),
      updatedAt: classData.updatedAt.toISOString()
    }

    return NextResponse.json({ classroom })
  } catch (error) {
    console.error('Error fetching classroom:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, capacity, location, teacherId, isActive } = body

    // Check if classroom exists
    const existingClass = await prisma.class.findUnique({
      where: { id: params.id },
      include: { 
        students: true,
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
        }
      }
    })
    
    if (!existingClass) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 })
    }

    // Validation
    if (capacity && (capacity < 1 || capacity > 100)) {
      return NextResponse.json({ 
        error: 'Capacity must be between 1 and 100' 
      }, { status: 400 })
    }

    // Verify teacher exists if teacherId is provided
    if (teacherId) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId }
      })

      if (!teacher) {
        return NextResponse.json({ 
          error: 'Teacher not found' 
        }, { status: 404 })
      }
    }

    // Update classroom in database
    const updatedClass = await prisma.class.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(capacity && { capacity: parseInt(capacity) }),
        ...(location && { location }),
        ...(teacherId && { teacherId }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
      include: {
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
        }
      }
    })

    // Transform to match expected format
    const classroom = {
      id: updatedClass.id,
      name: updatedClass.name,
      description: updatedClass.description,
      capacity: updatedClass.capacity,
      location: updatedClass.location,
      instructor: updatedClass.teacher.name,
      teacherId: updatedClass.teacherId,
      studentCount: updatedClass.students.length,
      isActive: updatedClass.isActive,
      createdAt: updatedClass.createdAt.toISOString(),
      updatedAt: updatedClass.updatedAt.toISOString()
    }

    return NextResponse.json({ 
      message: 'Classroom updated successfully',
      classroom 
    })
  } catch (error) {
    console.error('Error updating classroom:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if classroom exists and has students
    const existingClass = await prisma.class.findUnique({
      where: { id: params.id },
      include: { 
        students: true,
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
        }
      }
    })
    
    if (!existingClass) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 })
    }

    // Check if classroom has students
    if (existingClass.students.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete classroom with enrolled students' 
      }, { status: 400 })
    }

    // Delete classroom from database
    const deletedClass = await prisma.class.delete({
      where: { id: params.id },
      include: {
        students: true,
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
        }
      }
    })

    // Transform to match expected format
    const classroom = {
      id: deletedClass.id,
      name: deletedClass.name,
      description: deletedClass.description,
      capacity: deletedClass.capacity,
      location: deletedClass.location,
      instructor: deletedClass.teacher.name,
      teacherId: deletedClass.teacherId,
      studentCount: deletedClass.students.length,
      isActive: deletedClass.isActive,
      createdAt: deletedClass.createdAt.toISOString(),
      updatedAt: deletedClass.updatedAt.toISOString()
    }

    return NextResponse.json({ 
      message: 'Classroom deleted successfully',
      classroom 
    })
  } catch (error) {
    console.error('Error deleting classroom:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 