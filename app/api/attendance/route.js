import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const { studentId, sessionId, status, timestamp } = await req.json();

    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        sessionId,
        status,
        timestamp: new Date(timestamp),
      },
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
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const date = searchParams.get('date');

    const attendance = await prisma.attendance.findMany({
      where: {
        ...(sessionId && { sessionId }),
        ...(date && {
          timestamp: {
            gte: new Date(date),
            lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
          },
        }),
      },
      include: {
        student: true,
        session: true,
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    );
  }
} 