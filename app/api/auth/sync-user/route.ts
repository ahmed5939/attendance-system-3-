import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
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
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's email from Clerk
    const clerkSecretKey = process.env.CLERK_SECRET_KEY
    if (!clerkSecretKey) {
      console.error('CLERK_SECRET_KEY not configured')
      return NextResponse.json({ error: 'Clerk secret key not configured' }, { status: 500 })
    }

    // Fetch user details from Clerk
    const clerkResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!clerkResponse.ok) {
      console.error('Failed to fetch user from Clerk:', await clerkResponse.text())
      return NextResponse.json({ error: 'Failed to fetch user from Clerk' }, { status: 500 })
    }

    const clerkUser = await clerkResponse.json()
    const primaryEmail = clerkUser.email_addresses.find((email: any) => email.id === clerkUser.primary_email_address_id)
    
    if (!primaryEmail) {
      console.error('No primary email found for user:', userId)
      return NextResponse.json({ error: 'No primary email found' }, { status: 400 })
    }

    console.log('Syncing user:', { clerkId: userId, email: primaryEmail.email_address })

    // Check if user already exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        student: true,
        teacher: true,
      }
    })

    if (existingUser) {
      console.log('User already exists in database:', userId)
      return NextResponse.json({ 
        success: true, 
        user: existingUser,
        message: 'User already exists'
      })
    }

    // User doesn't exist, try to create from whitelist
    try {
      const user = await createUserFromWhitelist(userId, primaryEmail.email_address)
      console.log('Successfully created user from whitelist:', userId)
      return NextResponse.json({ 
        success: true, 
        user,
        message: 'User created from whitelist'
      })
    } catch (error) {
      console.error('Error creating user from whitelist:', error)
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Failed to create user from whitelist',
        message: 'User not found in whitelist or account deactivated'
      }, { status: 403 })
    }

  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 