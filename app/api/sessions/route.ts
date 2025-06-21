import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.session.findMany({
      include: {
        class: {
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
          },
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
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, startTime, endTime, classId } = await request.json();

    const session = await prisma.session.create({
      data: {
        name,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        classId,
      },
      include: {
        class: {
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
          },
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
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
