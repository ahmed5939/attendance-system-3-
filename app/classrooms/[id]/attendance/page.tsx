"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, ArrowLeft } from "lucide-react"

export default function TakeAttendancePage() {
  const params = useParams()
  const router = useRouter()
  const classroomId = params.id as string

  const [isCameraActive, setIsCameraActive] = useState(false)

  const handleStartCamera = () => {
    setIsCameraActive(true)
    // Here you would add logic to access the camera
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Classroom
        </Button>
        <h1 className="text-2xl font-bold">Take Attendance</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Camera View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-200 rounded-md flex items-center justify-center">
                {isCameraActive ? (
                  <p>Camera would be active here.</p>
                ) : (
                  <div className="text-center text-gray-500">
                    <Camera className="h-16 w-16 mx-auto mb-4" />
                    <Button onClick={handleStartCamera}>Start Camera</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Attendance Log</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Students will be marked here as they are recognized.</p>
              {/* List of recognized students would go here */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 