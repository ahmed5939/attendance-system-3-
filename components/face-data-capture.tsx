"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Upload, CheckCircle, XCircle, FileImage } from "lucide-react"

interface FaceDataCaptureProps {
  studentId: string
  onSuccess?: () => void
}

export function FaceDataCapture({ studentId, onSuccess }: FaceDataCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture()
    }
  }, [])

  const startCapture = async () => {
    try {
      setCameraError(null)
      console.log("Requesting camera access...")
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported in this browser")
      }

      // Request camera access with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user" // Use front camera
        },
        audio: false
      })
      
      console.log("Camera access granted:", stream)
      
      // Small delay to ensure video element is ready
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCapturing(true)
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded")
          videoRef.current?.play().catch(err => {
            console.error("Error playing video:", err)
          })
        }
        
        videoRef.current.onerror = (error) => {
          console.error("Video error:", error)
          setCameraError("Error loading video stream")
        }
      } else {
        console.error("Video element not found in DOM")
        throw new Error("Video element not found")
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setCameraError("Camera access denied. Please allow camera permissions and try again.")
        } else if (error.name === 'NotFoundError') {
          setCameraError("No camera found. Please connect a camera and try again.")
        } else if (error.name === 'NotSupportedError') {
          setCameraError("Camera access is not supported in this browser.")
        } else {
          setCameraError(`Camera error: ${error.message}`)
        }
      } else {
        setCameraError("Could not access camera. Please check permissions and try again.")
      }
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreview(result)
    }
    reader.readAsDataURL(file)
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
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
        const result = await response.json()
        console.log('Face data saved successfully:', result)
        onSuccess?.()
        stopCapture()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload face data')
      }
    } catch (error) {
      console.error('Error uploading face data:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload face data. Please try again.')
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
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover ${!isCapturing ? 'hidden' : ''}`}
          />
          {preview && !isCapturing && (
            <img
              src={preview}
              alt="Captured face"
              className="h-full w-full object-cover"
            />
          )}
          {!isCapturing && !preview && (
            <div className="flex h-full items-center justify-center">
              <Camera className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {cameraError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{cameraError}</p>
          </div>
        )}

        <div className="flex justify-center gap-4">
          {!isCapturing && !preview && (
            <>
              <Button onClick={startCapture} disabled={!!cameraError}>
                <Camera className="mr-2 h-4 w-4" />
                Use Camera
              </Button>
              <Button variant="outline" onClick={triggerFileUpload}>
                <FileImage className="mr-2 h-4 w-4" />
                Upload Image
              </Button>
            </>
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