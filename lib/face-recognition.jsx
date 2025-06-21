"use client"

import * as faceapi from "face-api.js"

// Class to handle face recognition
export class FaceRecognition {
  constructor() {
    this.isModelLoaded = false
    this.labeledFaceDescriptors = null
    this.faceMatcher = null
  }

  async loadModels() {
    if (this.isModelLoaded) return

    try {
      // Load models from public directory
      await faceapi.nets.ssdMobilenetv1.loadFromUri("/models")
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models")
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models")

      this.isModelLoaded = true
      console.log("Face recognition models loaded")
    } catch (error) {
      console.error("Error loading face recognition models:", error)
      throw error
    }
  }

  async loadLabeledImages(students) {
    try {
      // In a real app, this would load images from a database or file system
      // For this example, we'll simulate loading labeled images
      const labeledDescriptors = await Promise.all(
        students.map(async (student) => {
          // Simulate loading multiple images for each student
          // In a real app, these would be actual image URLs
          const descriptions = []

          // Simulate processing 3 images per student
          for (let i = 0; i < 3; i++) {
            // In a real app, you would load actual images here
            // For this example, we'll create random face descriptors
            const descriptor = new Float32Array(128).fill(0).map(() => Math.random())
            descriptions.push(descriptor)
          }

          return new faceapi.LabeledFaceDescriptors(student.name, descriptions)
        }),
      )

      this.labeledFaceDescriptors = labeledDescriptors
      this.faceMatcher = new faceapi.FaceMatcher(labeledDescriptors)

      console.log("Labeled face descriptors loaded")
      return true
    } catch (error) {
      console.error("Error loading labeled images:", error)
      throw error
    }
  }

  async recognizeFaces(imageElement) {
    if (!this.isModelLoaded) {
      await this.loadModels()
    }

    if (!this.faceMatcher) {
      throw new Error("Face matcher not initialized. Call loadLabeledImages first.")
    }

    try {
      // Detect all faces in the image with their descriptors
      const detections = await faceapi.detectAllFaces(imageElement).withFaceLandmarks().withFaceDescriptors()

      // Match each face against our labeled face descriptors
      const results = detections.map((detection) => {
        const bestMatch = this.faceMatcher.findBestMatch(detection.descriptor)
        return {
          detection: detection,
          label: bestMatch.label,
          distance: bestMatch.distance,
        }
      })

      return results
    } catch (error) {
      console.error("Error recognizing faces:", error)
      throw error
    }
  }

  async processCCTVImage(imageElement, threshold = 0.6) {
    const recognitionResults = await this.recognizeFaces(imageElement)

    // Filter results by confidence threshold
    const validResults = recognitionResults.filter(
      (result) => result.distance < threshold && result.label !== "unknown",
    )

    // Extract student IDs/names from results
    const recognizedStudents = validResults.map((result) => result.label)

    return {
      totalFaces: recognitionResults.length,
      recognizedStudents: recognizedStudents,
      results: validResults,
    }
  }

  // Method to mark attendance based on recognition results
  async markAttendance(imageElement, sessionId, date) {
    const processingResults = await this.processCCTVImage(imageElement)

    // In a real app, this would update a database
    const attendanceRecords = processingResults.recognizedStudents.map((studentName) => ({
      studentName,
      sessionId,
      date,
      status: "Present",
      method: "AI Recognition",
    }))

    return {
      success: true,
      attendanceRecords,
      stats: {
        totalFaces: processingResults.totalFaces,
        recognizedFaces: processingResults.recognizedStudents.length,
        unrecognizedFaces: processingResults.totalFaces - processingResults.recognizedStudents.length,
      },
    }
  }
}

export default FaceRecognition
