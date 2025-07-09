import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function PUT(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await req.json();
    const { id } = params;

    if (!status || !['PRESENT', 'ABSENT'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: { status },
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
    console.error('Error updating attendance record:', error);
    return NextResponse.json(
      { error: 'Failed to update attendance record' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await prisma.attendance.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    return NextResponse.json(
      { error: 'Failed to delete attendance record' },
      { status: 500 }
    );
  }
} 