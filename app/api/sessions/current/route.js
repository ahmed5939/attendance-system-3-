import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    
    // Get the current session based on time
    const currentSession = await prisma.session.findFirst({
      where: {
        startTime: {
          lte: now,
        },
        endTime: {
          gte: now,
        },
      },
      include: {
        classroom: true,
        students: {
          include: {
            faceData: true,
          },
        },
      },
    });

    if (!currentSession) {
      return NextResponse.json([]);
    }

    return NextResponse.json([currentSession]);
  } catch (error) {
    console.error('Error fetching current session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current session' },
      { status: 500 }
    );
  }
} 