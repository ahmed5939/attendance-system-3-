"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RefreshCw, Play, Pause } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useUserProfile } from "@/hooks/use-user-profile"
import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function FaceRecognitionPage() {
  const { isLoaded, isAuthenticated } = useAuth()
  const { data: userProfile } = useUserProfile()
  const [isProcessing, setIsProcessing] = useState(false)
  const [cronEnabled, setCronEnabled] = useState(true)
  const [cronSchedule, setCronSchedule] = useState("0 */1 * * *")
  const [selectedFile, setSelectedFile] = useState(null)
  const [processingProgress, setProcessingProgress] = useState(0)
  const videoRef = useRef(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentSession, setCurrentSession] = useState(null)
  const [recognizedStudents, setRecognizedStudents] = useState([])

  // Fetch current session
  const { data: sessions } = useSWR('/api/sessions/current', fetcher, {
    refreshInterval: 60000 // Refresh every minute
  })

  useEffect(() => {
    if (sessions && sessions.length > 0) {
      setCurrentSession(sessions[0])
    }
  }, [sessions])

  // Check if user is admin
  const isAdmin = userProfile?.role === 'ADMIN'

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p>You need to be logged in to access this page.</p>
        </div>
      </div>
    )
  }

  // Admin-only access
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p>You need administrator privileges to access the face recognition system.</p>
        </div>
      </div>
    )
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile({
        file,
        preview: URL.createObjectURL(file),
      })
    }
  }

  const startProcessing = () => {
    setIsProcessing(true)
    setProcessingProgress(0)

    // Simulate processing progress
    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          return 100
        }
        return prev + 10
      })
    }, 500)
  }

  const processFrame = async () => {
    if (!videoRef.current || !currentSession) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoRef.current, 0, 0)
    
    const imageData = canvas.toDataURL('image/jpeg')

    try {
      const response = await fetch('/api/face-recognition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          sessionId: currentSession.id,
        }),
      })

      const data = await response.json()
      setRecognizedStudents(data.recognizedStudents)
    } catch (error) {
      console.error('Error processing frame:', error)
    }
  }

  const toggleStream = async () => {
    if (isStreaming) {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks()
        tracks.forEach((track) => track.stop())
        videoRef.current.srcObject = null
      }
      setIsStreaming(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setIsStreaming(true)
        
        // Start processing frames
        const interval = setInterval(() => {
          if (isStreaming) {
            processFrame()
          } else {
            clearInterval(interval)
          }
        }, 5000) // Process every 5 seconds
      } catch (err) {
        console.error("Error accessing camera:", err)
        alert("Could not access camera. Please check permissions.")
      }
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Face Recognition System</h1>

      <Tabs defaultValue="live" className="w-full">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="live">Live Processing</TabsTrigger>
          <TabsTrigger value="logs">Processing Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Processing Settings</CardTitle>
              <CardDescription>Configure how the system automatically processes CCTV footage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Automated Processing</Label>
                  <p className="text-sm text-muted-foreground">
                    System will automatically process CCTV footage on schedule
                  </p>
                </div>
                <Switch checked={cronEnabled} onCheckedChange={setCronEnabled} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cron">Schedule (Cron Expression)</Label>
                <Input
                  id="cron"
                  value={cronSchedule}
                  onChange={(e) => setCronSchedule(e.target.value)}
                  disabled={!cronEnabled}
                />
                <p className="text-xs text-muted-foreground">Current schedule: Every hour (0 */1 * * *)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">CCTV Source</Label>
                <Input id="source" placeholder="rtsp://camera-ip:port/stream" disabled={!cronEnabled} />
                <p className="text-xs text-muted-foreground">Enter the RTSP URL of your CCTV camera</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">Recognition Threshold</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="threshold"
                    type="range"
                    min="0.5"
                    max="0.95"
                    step="0.05"
                    defaultValue="0.7"
                    disabled={!cronEnabled}
                  />
                  <span className="text-sm">0.7</span>
                </div>
                <p className="text-xs text-muted-foreground">Minimum confidence level for face recognition</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button disabled={!cronEnabled}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Camera Feed</CardTitle>
                <CardDescription>Real-time face recognition processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 bg-gray-900 rounded-lg"
                  />
                  <div className="absolute top-2 right-2">
                    <Button
                      onClick={toggleStream}
                      variant={isStreaming ? "destructive" : "default"}
                      size="sm"
                    >
                      {isStreaming ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isStreaming ? "Stop" : "Start"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recognized Students</CardTitle>
                <CardDescription>Students detected in current session</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recognizedStudents.length > 0 ? (
                    recognizedStudents.map((student, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="font-medium">{student.name}</span>
                        <span className="text-sm text-green-600">Present</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No students recognized yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Manual Processing</CardTitle>
              <CardDescription>Process images manually for testing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Upload Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              {selectedFile && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <img
                    src={selectedFile.preview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded"
                  />
                </div>
              )}

              <Button onClick={startProcessing} disabled={!selectedFile || isProcessing}>
                {isProcessing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Process Image"
                )}
              </Button>

              {isProcessing && (
                <div className="space-y-2">
                  <Label>Progress</Label>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">{processingProgress}%</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Logs</CardTitle>
              <CardDescription>Recent face recognition processing activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>Session started - Class A</span>
                  <span className="text-sm text-muted-foreground">2 minutes ago</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>John Doe recognized (95% confidence)</span>
                  <span className="text-sm text-muted-foreground">1 minute ago</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>Jane Smith recognized (87% confidence)</span>
                  <span className="text-sm text-muted-foreground">30 seconds ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
