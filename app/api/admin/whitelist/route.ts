import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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

    const whitelist = await prisma.userWhitelist.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ whitelist })
  } catch (error) {
    console.error('Error fetching whitelist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    const { email, role, name, department } = body

    // Validation
    if (!email || !role || !name) {
      return NextResponse.json({ 
        error: 'Missing required fields: email, role, name' 
      }, { status: 400 })
    }

    if (!['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be STUDENT, TEACHER, or ADMIN' 
      }, { status: 400 })
    }

    if (role === 'TEACHER' && !department) {
      return NextResponse.json({ 
        error: 'Department is required for teachers' 
      }, { status: 400 })
    }

    // Check if email already exists in whitelist
    const existingWhitelist = await prisma.userWhitelist.findUnique({
      where: { email }
    })

    if (existingWhitelist) {
      return NextResponse.json({ 
        error: 'Email already exists in whitelist' 
      }, { status: 400 })
    }

    // Add to whitelist
    const whitelistEntry = await prisma.userWhitelist.create({
      data: {
        email,
        role,
        name,
        department,
        isActive: true,
      }
    })

    // Send Clerk invitation
    try {
      const clerkSecretKey = process.env.CLERK_SECRET_KEY
      if (!clerkSecretKey) {
        console.warn('CLERK_SECRET_KEY not found, skipping invitation email')
      } else {
        const invitationResponse = await fetch('https://api.clerk.com/v1/invitations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${clerkSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email_address: email,
            public_metadata: {
              role: role,
              name: name,
              department: department,
              whitelistId: whitelistEntry.id
            },
            redirect_url: `${process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || 'http://localhost:3000/sign-in'}`,
          }),
        })

        if (!invitationResponse.ok) {
          const errorData = await invitationResponse.json()
          console.error('Failed to send Clerk invitation:', errorData)
          // Don't fail the request, just log the error
        } else {
          const invitationData = await invitationResponse.json()
          console.log('Clerk invitation sent successfully:', invitationData.id)
          
          // Update whitelist entry with invitation details
          await prisma.userWhitelist.update({
            where: { id: whitelistEntry.id },
            data: {
              invitationSent: true,
              invitationSentAt: new Date(),
              clerkInvitationId: invitationData.id,
            }
          })
        }
      }
    } catch (invitationError) {
      console.error('Error sending Clerk invitation:', invitationError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ 
      message: 'User added to whitelist and invitation sent successfully',
      whitelistEntry 
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding to whitelist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 