import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

async function createUserFromWhitelist(clerkId: string, email: string) {
  // Check if user is in whitelist
  const whitelistEntry = await prisma.userWhitelist.findUnique({
    where: { email }
  })

  if (!whitelistEntry) {
    console.log('User not in whitelist:', email)
    throw new Error('User not in whitelist')
  }

  if (!whitelistEntry.isActive) {
    console.log('User account deactivated:', email)
    throw new Error('Account deactivated')
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { clerkId }
  })

  if (existingUser) {
    console.log('User already exists:', clerkId)
    return existingUser
  }

  // Create user record with role from whitelist
  const user = await prisma.user.create({
    data: {
      clerkId,
      email,
      role: whitelistEntry.role,
    }
  })

  // Create the appropriate profile based on role
  if (whitelistEntry.role === 'STUDENT') {
    await prisma.student.create({
      data: {
        name: whitelistEntry.name,
        userId: user.id,
      }
    })
  } else if (whitelistEntry.role === 'TEACHER') {
    await prisma.teacher.create({
      data: {
        name: whitelistEntry.name,
        department: whitelistEntry.department,
        userId: user.id,
      }
    })
  }
  // ADMIN role doesn't need additional profile

  // Mark whitelist entry as completed
  await prisma.userWhitelist.update({
    where: { id: whitelistEntry.id },
    data: {
      accountCreated: true,
      accountCreatedAt: new Date(),
    }
  })

  console.log('Created user with profile:', user)
  return user
}

export async function POST(request: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env')
  }

  // Get the headers
  const headerPayload = headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await request.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: any

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400
    })
  }

  // Get the ID and type
  const { id } = evt.data
  const eventType = evt.type

  console.log(`Webhook with and ID of ${id} and type of ${eventType}`)
  console.log('Webhook body:', body)

  if (eventType === 'user.created') {
    const { id: clerkId, email_addresses, public_metadata } = evt.data

    // Get the primary email
    const primaryEmail = email_addresses.find((email: any) => email.id === evt.data.primary_email_address_id)
    
    if (!primaryEmail) {
      return NextResponse.json({ error: 'No primary email found' }, { status: 400 })
    }

    try {
      const user = await createUserFromWhitelist(clerkId, primaryEmail.email_address)
      return NextResponse.json({ success: true, user })
    } catch (error) {
      console.error('Error creating user:', error)
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create user' }, { status: 500 })
    }
  }

  if (eventType === 'invitation.accepted') {
    const { id: clerkId, email_addresses, public_metadata } = evt.data

    // Get the primary email
    const primaryEmail = email_addresses.find((email: any) => email.id === evt.data.primary_email_address_id)
    
    if (!primaryEmail) {
      return NextResponse.json({ error: 'No primary email found' }, { status: 400 })
    }

    try {
      const user = await createUserFromWhitelist(clerkId, primaryEmail.email_address)
      return NextResponse.json({ success: true, user })
    } catch (error) {
      console.error('Error creating user from invitation:', error)
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create user' }, { status: 500 })
    }
  }

  if (eventType === 'user.updated') {
    const { id: clerkId, email_addresses } = evt.data

    // Get the primary email
    const primaryEmail = email_addresses.find((email: any) => email.id === evt.data.primary_email_address_id)
    
    if (!primaryEmail) {
      return NextResponse.json({ error: 'No primary email found' }, { status: 400 })
    }

    try {
      // Update user record
      const user = await prisma.user.update({
        where: { clerkId },
        data: {
          email: primaryEmail.email_address,
        }
      })

      console.log('Updated user:', user)
      return NextResponse.json({ success: true, user })
    } catch (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
  }

  if (eventType === 'user.deleted') {
    const { id: clerkId } = evt.data

    try {
      // Delete user record (this will cascade to student/teacher records)
      const user = await prisma.user.delete({
        where: { clerkId }
      })

      console.log('Deleted user:', user)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error deleting user:', error)
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
} 