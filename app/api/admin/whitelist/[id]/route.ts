import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
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

    // Check if whitelist entry exists
    const whitelistEntry = await prisma.userWhitelist.findUnique({
      where: { id: params.id }
    })

    if (!whitelistEntry) {
      return NextResponse.json({ error: 'Whitelist entry not found' }, { status: 404 })
    }

    // Delete the whitelist entry
    await prisma.userWhitelist.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      message: 'User removed from whitelist successfully'
    })
  } catch (error) {
    console.error('Error removing from whitelist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 