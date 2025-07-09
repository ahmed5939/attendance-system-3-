import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, sessionId, status, timestamp } = await req.json();

    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        sessionId,
        status,
        timestamp: new Date(timestamp),
      },
      include: {
        student: {
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
        session: {
          include: {
            class: true
          }
        }
      }
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error creating attendance record:', error);
    return NextResponse.json(
      { error: 'Failed to create attendance record' },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const whereClause = {};

    if (sessionId) {
      whereClause.sessionId = sessionId;
    }

    if (studentId) {
      whereClause.studentId = studentId;
    }

    // Date filtering
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);
      
      whereClause.timestamp = {
        gte: startOfDay,
        lt: endOfDay,
      };
    } else if (startDate && endDate) {
      whereClause.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
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
        session: {
          include: {
            class: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Filter by class if specified (client-side filtering for now)
    let filteredAttendance = attendance;
    if (classId) {
      filteredAttendance = attendance.filter(record => 
        record.session?.class?.id === classId
      );
    }
    
    return NextResponse.json(filteredAttendance);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    );
  }
} 