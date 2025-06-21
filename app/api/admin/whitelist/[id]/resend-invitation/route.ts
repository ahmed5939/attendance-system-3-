import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // Get whitelist entry
    const whitelistEntry = await prisma.userWhitelist.findUnique({
      where: { id }
    })

    if (!whitelistEntry) {
      return NextResponse.json({ error: 'Whitelist entry not found' }, { status: 404 })
    }

    // Send Clerk invitation
    try {
      const clerkSecretKey = process.env.CLERK_SECRET_KEY
      if (!clerkSecretKey) {
        return NextResponse.json({ error: 'CLERK_SECRET_KEY not configured' }, { status: 500 })
      }

      const invitationResponse = await fetch('https://api.clerk.com/v1/invitations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${clerkSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: whitelistEntry.email,
          public_metadata: {
            role: whitelistEntry.role,
            name: whitelistEntry.name,
            department: whitelistEntry.department,
            whitelistId: whitelistEntry.id
          },
          redirect_url: `${process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || 'http://localhost:3000/sign-in'}`,
        }),
      })

      if (!invitationResponse.ok) {
        const errorData = await invitationResponse.json()
        console.error('Failed to send Clerk invitation:', errorData)
        return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 })
      }

      const invitationData = await invitationResponse.json()
      console.log('Clerk invitation resent successfully:', invitationData.id)
      
      // Update whitelist entry with new invitation details
      await prisma.userWhitelist.update({
        where: { id: whitelistEntry.id },
        data: {
          invitationSent: true,
          invitationSentAt: new Date(),
          clerkInvitationId: invitationData.id,
        }
      })

      return NextResponse.json({ 
        message: 'Invitation resent successfully',
        invitationId: invitationData.id
      })
    } catch (invitationError) {
      console.error('Error sending Clerk invitation:', invitationError)
      return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error resending invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 