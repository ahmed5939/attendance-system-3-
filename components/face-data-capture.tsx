"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Upload, CheckCircle, XCircle } from "lucide-react"

interface FaceDataCaptureProps {
  studentId: string
  onSuccess?: () => void
}

export function FaceDataCapture({ studentId, onSuccess }: FaceDataCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCapturing(true)
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Could not access camera. Please check permissions.")
    }
  }

  const stopCapture = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCapturing(false)
    setPreview(null)
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)
        setPreview(canvas.toDataURL('image/jpeg'))
      }
    }
  }

  const handleUpload = async () => {
    if (!preview) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/students/${studentId}/face-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: preview,
        }),
      })

      if (response.ok) {
        onSuccess?.()
        stopCapture()
      } else {
        throw new Error('Failed to upload face data')
      }
    } catch (error) {
      console.error('Error uploading face data:', error)
      alert('Failed to upload face data. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Face Data Capture</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
          {isCapturing ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : preview ? (
            <img
              src={preview}
              alt="Captured face"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Camera className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex justify-center gap-4">
          {!isCapturing && !preview && (
            <Button onClick={startCapture}>
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
          )}

          {isCapturing && (
            <>
              <Button onClick={captureImage}>
                <Upload className="mr-2 h-4 w-4" />
                Capture
              </Button>
              <Button variant="outline" onClick={stopCapture}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          )}

          {preview && (
            <>
              <Button onClick={handleUpload} disabled={isProcessing}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {isProcessing ? "Processing..." : "Save Face Data"}
              </Button>
              <Button variant="outline" onClick={stopCapture}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 