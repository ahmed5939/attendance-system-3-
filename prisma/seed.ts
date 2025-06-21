import { PrismaClient } from './app/generated/prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.attendance.deleteMany()
  await prisma.session.deleteMany()
  await prisma.student.deleteMany()
  await prisma.teacher.deleteMany()
  await prisma.user.deleteMany()
  await prisma.userWhitelist.deleteMany()
  await prisma.class.deleteMany()

  // Add admin users to whitelist
  const adminUsers = [
    {
      email: 'admin@school.edu',
      role: 'ADMIN' as const,
      name: 'System Administrator',
      department: null,
    },
    {
      email: 'principal@school.edu',
      role: 'ADMIN' as const,
      name: 'School Principal',
      department: null,
    },
  ]

  // Add teachers to whitelist
  const teachers = [
    {
      email: 'john.doe@school.edu',
      role: 'TEACHER' as const,
      name: 'John Doe',
      department: 'Computer Science',
    },
    {
      email: 'jane.smith@school.edu',
      role: 'TEACHER' as const,
      name: 'Jane Smith',
      department: 'Mathematics',
    },
    {
      email: 'mike.johnson@school.edu',
      role: 'TEACHER' as const,
      name: 'Mike Johnson',
      department: 'Physics',
    },
  ]

  // Add students to whitelist
  const students = [
    {
      email: 'alice.student@school.edu',
      role: 'STUDENT' as const,
      name: 'Alice Student',
      department: null,
    },
    {
      email: 'bob.student@school.edu',
      role: 'STUDENT' as const,
      name: 'Bob Student',
      department: null,
    },
    {
      email: 'charlie.student@school.edu',
      role: 'STUDENT' as const,
      name: 'Charlie Student',
      department: null,
    },
  ]

  // Create whitelist entries
  const allUsers = [...adminUsers, ...teachers, ...students]
  
  for (const user of allUsers) {
    await prisma.userWhitelist.create({
      data: user
    })
  }

  console.log(`✅ Added ${allUsers.length} users to whitelist`)

  // Create some sample classes (these will be linked to teachers when they sign up)
  const sampleClasses = [
    {
      name: 'Introduction to Computer Science',
      description: 'Basic programming concepts and problem solving',
      capacity: 30,
      location: 'Room 101',
      isActive: true,
    },
    {
      name: 'Advanced Mathematics',
      description: 'Calculus and linear algebra',
      capacity: 25,
      location: 'Room 202',
      isActive: true,
    },
    {
      name: 'Physics Lab',
      description: 'Hands-on physics experiments',
      capacity: 20,
      location: 'Lab 301',
      isActive: true,
    },
  ]

  console.log('✅ Database seeded successfully!')
  console.log('\n📋 Next steps:')
  console.log('1. Run: npx prisma db push')
  console.log('2. Set up Clerk webhook to: /api/webhooks/clerk')
  console.log('3. Add CLERK_WEBHOOK_SECRET to your .env file')
  console.log('4. Sign up with one of the admin emails to get started')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 