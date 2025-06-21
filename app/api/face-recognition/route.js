import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import cv from '@techstark/opencv-js';

export async function POST(req) {
  try {
    const { image, sessionId } = await req.json();
    
    // Convert base64 image to OpenCV format
    const imageData = Buffer.from(image.split(',')[1], 'base64');
    const mat = cv.imdecode(imageData);
    
    // Load face detection model
    const faceCascade = new cv.CascadeClassifier();
    faceCascade.load('haarcascade_frontalface_default.xml');
    
    // Detect faces
    const faces = faceCascade.detectMultiScale(mat);
    
    // For each detected face, try to match with student faces
    const recognizedStudents = [];
    
    for (const face of faces) {
      const faceImage = mat.roi(face);
      
      // Get all students for this session
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          students: {
            include: {
              faceData: true,
            },
          },
        },
      });
      
      // Compare face with each student's face data
      for (const student of session.students) {
        if (student.faceData) {
          const similarity = compareFaces(faceImage, student.faceData);
          if (similarity > 0.8) { // Threshold for face matching
            recognizedStudents.push({
              studentId: student.id,
              confidence: similarity,
            });
          }
        }
      }
    }
    
    // Create attendance records for recognized students
    const attendanceRecords = await Promise.all(
      recognizedStudents.map(async ({ studentId }) => {
        return prisma.attendance.create({
          data: {
            studentId,
            sessionId,
            status: 'PRESENT',
            timestamp: new Date(),
          },
        });
      })
    );
    
    return NextResponse.json({
      recognizedStudents,
      attendanceRecords,
    });
  } catch (error) {
    console.error('Error processing face recognition:', error);
    return NextResponse.json(
      { error: 'Failed to process face recognition' },
      { status: 500 }
    );
  }
}

// Helper function to compare faces using OpenCV
function compareFaces(face1, face2) {
  // Implement face comparison logic using OpenCV
  // This is a simplified version - in production, you'd want to use a more sophisticated approach
  const similarity = cv.matchTemplate(face1, face2, cv.TM_CCOEFF_NORMED);
  return similarity.data[0];
} 