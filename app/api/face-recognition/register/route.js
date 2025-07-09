import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Python server configuration
const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL || 'http://localhost:5000'

export async function POST(request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { studentId, image } = body

    if (!studentId || !image) {
      return NextResponse.json({ 
        error: 'Missing required fields: studentId, image' 
      }, { status: 400 })
    }

    // Get student information
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ 
        error: 'Student not found' 
      }, { status: 404 })
    }

    // Send image to Python server for face registration
    try {
      const pythonResponse = await fetch(`${PYTHON_SERVER_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          student_name: student.name,
          image_data: image
        }),
      })

      if (!pythonResponse.ok) {
        throw new Error(`Python server error: ${pythonResponse.status}`)
      }

      const registrationResult = await pythonResponse.json()

      if (!registrationResult.success) {
        return NextResponse.json({ 
          error: registrationResult.error || 'Face registration failed' 
        }, { status: 400 })
      }

      // Update student record to indicate face data is available
      await prisma.student.update({
        where: { id: studentId },
        data: {
          // You might want to store additional face data metadata here
        }
      })

      console.log(`Face registered successfully for ${student.name} (${studentId})`)

      return NextResponse.json({
        success: true,
        message: registrationResult.message,
        student: {
          id: student.id,
          name: student.name,
          email: student.user.email
        }
      })

    } catch (error) {
      console.error('Error communicating with Python server:', error)
      return NextResponse.json({ 
        error: 'Face recognition service unavailable' 
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Error in face registration API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 