import { PrismaClient } from '@/app/generated/prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create sample classes
  const classes = [
    {
      name: "Computer Science 101",
      description: "Introduction to Computer Science and Programming",
      capacity: 30,
      location: "Room 201, Building A",
      schedule: "Monday, Wednesday, Friday 9:00 AM - 10:30 AM",
      instructor: "Dr. Sarah Johnson",
      isActive: true,
    },
    {
      name: "Mathematics 201",
      description: "Advanced Calculus and Linear Algebra",
      capacity: 25,
      location: "Room 305, Building B",
      schedule: "Tuesday, Thursday 2:00 PM - 3:30 PM",
      instructor: "Prof. Michael Chen",
      isActive: true,
    },
    {
      name: "Physics Lab",
      description: "Hands-on Physics Laboratory Sessions",
      capacity: 20,
      location: "Lab 102, Science Building",
      schedule: "Wednesday 1:00 PM - 4:00 PM",
      instructor: "Dr. Emily Rodriguez",
      isActive: true,
    },
    {
      name: "English Literature",
      description: "Study of Classic and Modern Literature",
      capacity: 35,
      location: "Room 150, Humanities Building",
      schedule: "Monday, Wednesday 11:00 AM - 12:30 PM",
      instructor: "Prof. James Wilson",
      isActive: true,
    },
    {
      name: "Chemistry 101",
      description: "Introduction to General Chemistry",
      capacity: 28,
      location: "Lab 205, Science Building",
      schedule: "Tuesday, Thursday 10:00 AM - 11:30 AM",
      instructor: "Dr. Lisa Thompson",
      isActive: true,
    }
  ]

  for (const classData of classes) {
    await prisma.class.upsert({
      where: { name: classData.name },
      update: {},
      create: classData,
    })
  }

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 