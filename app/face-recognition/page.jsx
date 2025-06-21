"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RefreshCw, Play, Pause } from "lucide-react"
import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function FaceRecognitionPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [cronEnabled, setCronEnabled] = useState(true)
  const [cronSchedule, setCronSchedule] = useState("0 */1 * * *")
  const [selectedFile, setSelectedFile] = useState(null)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [user, setUser] = useState(null)
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

  useEffect(() => {
    // In a real app, this would be a proper auth check
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  // Redirect if not admin (in a real app, this would be server-side)
  if (user && user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p>You don't have permission to view this page.</p>
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
                  <span className="w-12 text-center">0.7</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Higher values require more precise matches (fewer false positives, more false negatives)
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Processing</CardTitle>
              <CardDescription>
                {currentSession 
                  ? `Current Session: ${currentSession.name} (${new Date(currentSession.startTime).toLocaleTimeString()} - ${new Date(currentSession.endTime).toLocaleTimeString()})`
                  : 'No active session found'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative w-full max-w-2xl mx-auto border rounded-md overflow-hidden bg-black aspect-video">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                  {!isStreaming && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                      <p>Camera is off</p>
                    </div>
                  )}
                </div>

                {isStreaming && (
                  <div className="p-4 border rounded-md bg-muted/50">
                    <h3 className="font-medium mb-2">Recognition Results:</h3>
                    {recognizedStudents.length > 0 ? (
                      <div className="space-y-2">
                        {recognizedStudents.map((student) => (
                          <div key={student.studentId} className="flex items-center justify-between">
                            <span>{student.name}</span>
                            <span className="text-sm text-muted-foreground">
                              Confidence: {(student.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm">No students recognized yet</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={toggleStream} disabled={!currentSession}>
                {isStreaming ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Stop Processing
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Processing
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Logs</CardTitle>
              <CardDescription>View recent face recognition processing logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Automated Processing</h3>
                        <p className="text-sm text-muted-foreground">Today, 08:30 AM</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Success</span>
                    </div>
                    <p className="mt-2 text-sm">Processed 125 frames, recognized 48 students</p>
                  </div>

                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Manual Processing</h3>
                        <p className="text-sm text-muted-foreground">Yesterday, 02:15 PM</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Success</span>
                    </div>
                    <p className="mt-2 text-sm">Processed 1 image, recognized 12 students</p>
                  </div>

                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Automated Processing</h3>
                        <p className="text-sm text-muted-foreground">Yesterday, 07:30 AM</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Partial</span>
                    </div>
                    <p className="mt-2 text-sm">Processed 120 frames, recognized 45 students, 2 unrecognized</p>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Automated Processing</h3>
                        <p className="text-sm text-muted-foreground">2 days ago, 07:30 AM</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Failed</span>
                    </div>
                    <p className="mt-2 text-sm">Connection to CCTV failed. Check camera connection.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
