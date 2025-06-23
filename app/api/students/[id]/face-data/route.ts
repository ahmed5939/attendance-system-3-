import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { image } = await req.json()
    const { id: studentId } = await params

    // Validate student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      )
    }

    // Convert base64 image to Buffer for face encoding
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // TODO: Process the image to generate face encoding data
    // For now, we'll store a placeholder encoding
    // In a real implementation, you would use a face recognition library
    // like face-api.js, OpenCV, or a cloud service to generate face encodings
    const faceEncoding = Buffer.from('placeholder_face_encoding_data')

    try {
      // Create or update face data and add new image
      const result = await prisma.$transaction(async (tx) => {
        // Create or update face encoding data
        const faceData = await tx.faceData.upsert({
          where: { studentId },
          update: {
            data: faceEncoding,
            updatedAt: new Date(),
          },
          create: {
            studentId,
            data: faceEncoding,
          },
        })

        // Add new face image
        const faceImage = await tx.faceImage.create({
          data: {
            studentId,
            image: image, // Store the original base64 image
          },
        })

        return { faceData, faceImage }
      })

      return NextResponse.json({ 
        success: true, 
        faceDataId: result.faceData.id,
        faceImageId: result.faceImage.id,
        message: "Face data and image saved successfully"
      })
    } catch (dbError) {
      console.error("Database error:", dbError)
      // If faceImage model doesn't exist, fall back to storing in faceData
      const faceData = await prisma.faceData.upsert({
        where: { studentId },
        update: {
          data: faceEncoding,
          updatedAt: new Date(),
        },
        create: {
          studentId,
          data: faceEncoding,
        },
      })

      return NextResponse.json({ 
        success: true, 
        faceDataId: faceData.id,
        message: "Face data saved (image storage not available)"
      })
    }
  } catch (error) {
    console.error("Error saving face data:", error)
    return NextResponse.json(
      { error: "Failed to save face data" },
      { status: 500 }
    )
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params
    const url = new URL(req.url)
    const imageOnly = url.searchParams.get('image') === 'true'
    const allImages = url.searchParams.get('all') === 'true'

    if (imageOnly) {
      try {
        // Return only the most recent image for display purposes
        const faceImage = await prisma.faceImage.findFirst({
          where: { studentId },
          orderBy: { createdAt: 'desc' },
          select: { image: true }
        })

        if (!faceImage) {
          return NextResponse.json(
            { error: "Face image not found" },
            { status: 404 }
          )
        }

        return NextResponse.json({ image: faceImage.image })
      } catch (dbError) {
        console.error("FaceImage model not available:", dbError)
        return NextResponse.json(
          { error: "Face images not available" },
          { status: 404 }
        )
      }
    }

    if (allImages) {
      try {
        // Return all face images for the student
        const faceImages = await prisma.faceImage.findMany({
          where: { studentId },
          orderBy: { createdAt: 'desc' },
          select: { id: true, image: true, createdAt: true }
        })

        return NextResponse.json({ images: faceImages })
      } catch (dbError) {
        console.error("FaceImage model not available:", dbError)
        return NextResponse.json({ images: [] })
      }
    }

    // Return full face data
    const faceData = await prisma.faceData.findUnique({
      where: { studentId },
    })

    if (!faceData) {
      return NextResponse.json(
        { error: "Face data not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(faceData)
  } catch (error) {
    console.error("Error fetching face data:", error)
    return NextResponse.json(
      { error: "Failed to fetch face data" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params
    const url = new URL(req.url)
    const imageId = url.searchParams.get('imageId')

    if (imageId) {
      try {
        // Delete specific image
        await prisma.faceImage.delete({
          where: { id: imageId, studentId },
        })
        return NextResponse.json({ success: true, message: "Image deleted successfully" })
      } catch (dbError) {
        console.error("FaceImage model not available:", dbError)
        return NextResponse.json({ success: false, message: "Image deletion not available" })
      }
    } else {
      // Delete all face data for the student
      try {
        await prisma.$transaction(async (tx) => {
          await tx.faceImage.deleteMany({ where: { studentId } })
          await tx.faceData.deleteMany({ where: { studentId } })
        })
        return NextResponse.json({ success: true, message: "All face data deleted successfully" })
      } catch (dbError) {
        console.error("Error in transaction:", dbError)
        // Fallback to just deleting face data
        await prisma.faceData.deleteMany({ where: { studentId } })
        return NextResponse.json({ success: true, message: "Face data deleted successfully" })
      }
    }
  } catch (error) {
    console.error("Error deleting face data:", error)
    return NextResponse.json(
      { error: "Failed to delete face data" },
      { status: 500 }
    )
  }
} 