import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File
    const classroomId = params.id

    if (!file || !classroomId) {
      return NextResponse.json({ error: 'Missing image or classroomId' }, { status: 400 })
    }

    // Convert image to base64 string
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString('base64')
    const imageData = `data:image/jpeg;base64,${base64Image}`

    // Fetch all students and their images for the class
    const students = await prisma.student.findMany({
      where: {
        classes: { some: { id: classroomId } }
      },
      include: {
        faceImages: true,
        user: { select: { email: true } }
      }
    })

    // Prepare student images for Python server
    const studentImages = students.flatMap(student =>
      student.faceImages.map(img => ({
        studentId: student.id,
        name: student.name,
        email: student.user?.email || '',
        image: img.image // base64 string (should be data:image/jpeg;base64,...)
      }))
    )

    // Send both classroom image and student images to Python server
    const pythonRes = await fetch('http://localhost:5000/recognize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_data: imageData,
        student_images: studentImages
      })
    })
    if (!pythonRes.ok) {
      const err = await pythonRes.text()
      return NextResponse.json({ error: 'Python server error', details: err }, { status: 500 })
    }
    const result = await pythonRes.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Test attendance error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error?.toString() }, { status: 500 })
  }
} 