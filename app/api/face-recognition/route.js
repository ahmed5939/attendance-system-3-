import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// Python server configuration
const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { image, sessionId } = body;

    if (!image) {
      return NextResponse.json({ 
        error: 'Missing required field: image' 
      }, { status: 400 });
    }

    // Send image to Python server for face recognition
    try {
      const pythonResponse = await fetch(`${PYTHON_SERVER_URL}/recognize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_data: image
        }),
      });

      if (!pythonResponse.ok) {
        throw new Error(`Python server error: ${pythonResponse.status}`);
      }

      const recognitionResult = await pythonResponse.json();

      if (!recognitionResult.success) {
        return NextResponse.json({ 
          error: recognitionResult.error || 'Face recognition failed' 
        }, { status: 400 });
      }

      // Process recognized faces and mark attendance
      const recognizedStudents = [];
      
      for (const face of recognitionResult.recognized_faces) {
        try {
          // Find student in database
          const student = await prisma.student.findUnique({
            where: { id: face.student_id },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                }
              }
            }
          });

          if (student && sessionId) {
            // Check if attendance already exists for this session
            const existingAttendance = await prisma.attendance.findFirst({
              where: {
                studentId: student.id,
                sessionId: sessionId,
              }
            });

            if (!existingAttendance) {
              // Create attendance record
              await prisma.attendance.create({
                data: {
                  studentId: student.id,
                  sessionId: sessionId,
                  status: 'PRESENT',
                  timestamp: new Date(),
                }
              });

              console.log(`Attendance marked for ${student.name} in session ${sessionId}`);
            }

            recognizedStudents.push({
              studentId: student.id,
              name: student.name,
              email: student.user.email,
              confidence: face.confidence,
              distance: face.distance
            });
          }
        } catch (error) {
          console.error(`Error processing student ${face.student_id}:`, error);
        }
      }

      return NextResponse.json({
        success: true,
        recognizedStudents,
        totalFacesDetected: recognitionResult.total_faces_detected,
        facesRecognized: recognitionResult.faces_recognized
      });

    } catch (error) {
      console.error('Error communicating with Python server:', error);
      return NextResponse.json({ 
        error: 'Face recognition service unavailable' 
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Error in face recognition API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get registered faces from Python server
    try {
      const pythonResponse = await fetch(`${PYTHON_SERVER_URL}/faces`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!pythonResponse.ok) {
        throw new Error(`Python server error: ${pythonResponse.status}`);
      }

      const facesResult = await pythonResponse.json();

      if (!facesResult.success) {
        return NextResponse.json({ 
          error: facesResult.error || 'Failed to get registered faces' 
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        faces: facesResult.faces
      });

    } catch (error) {
      console.error('Error communicating with Python server:', error);
      return NextResponse.json({ 
        error: 'Face recognition service unavailable' 
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Error in face recognition API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 