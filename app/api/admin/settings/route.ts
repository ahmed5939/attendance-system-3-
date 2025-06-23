import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

async function getSetting(key: string, defaultValue: any) {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  return setting ? setting.value : defaultValue;
}

async function updateSetting(key: string, value: any) {
  return await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

// Get all settings
export async function GET() {
  try {
    const { userId } = auth()
    console.log('Settings API - userId:', userId)
    
    if (!userId) {
      console.log('Settings API - No userId found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user exists and has admin role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    })

    console.log('Settings API - Found user:', user)

    if (!user || user.role !== 'ADMIN') {
      console.log('Settings API - User not found or not admin. User:', user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = {
      maintenanceMode: await getSetting('maintenanceMode', false),
      backupEnabled: await getSetting('backupEnabled', true),
      backupSchedule: await getSetting('backupSchedule', '02:00'),
      backupRetention: await getSetting('backupRetention', 30),
      backupLocation: await getSetting('backupLocation', '/backups'),
      twoFactorAuth: await getSetting('twoFactorAuth', true),
      sessionTimeout: await getSetting('sessionTimeout', 30),
    };

    console.log('Settings API - Returning settings:', settings)
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update settings
export async function POST(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user exists and has admin role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json();
    
    for (const key in body) {
      await updateSetting(key, body[key]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 