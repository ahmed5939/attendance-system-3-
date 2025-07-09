"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function TestAttendancePage() {
  const params = useParams()
  const classroomId = params.id as string
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [createSession, setCreateSession] = useState(true)
  const [sessionName, setSessionName] = useState("Test Session")

  // Fetch classroom data using SWR
  const { data: classroom, error: classroomError } = useSWR(
    classroomId ? `/api/classrooms/${classroomId}` : null,
    fetcher
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const createTestSession = async () => {
    if (!createSession) return null
    
    const now = new Date()
    const endTime = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
    
    const sessionData = {
      name: sessionName,
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
      classId: classroomId
    }

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionData)
    })

    if (!res.ok) {
      throw new Error("Failed to create test session")
    }

    return await res.json()
  }

  const recordAttendance = async (sessionId: string, students: any[], status: 'PRESENT' | 'ABSENT') => {
    const attendancePromises = students.map(student =>
      fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          sessionId: sessionId,
          status: status,
          timestamp: new Date().toISOString()
        })
      })
    )

    await Promise.all(attendancePromises)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      // Create test session if enabled
      let session = null
      if (createSession) {
        session = await createTestSession()
      }

      // Process image for face recognition
      const formData = new FormData()
      formData.append("image", file)
      formData.append("classroomId", classroomId)
      
      const res = await fetch("/api/classrooms/" + classroomId + "/test-attendance", {
        method: "POST",
        body: formData,
      })
      
      if (!res.ok) throw new Error("Failed to process image")
      const data = await res.json()
      setResult(data)

      // Record attendance if session was created
      if (session && data) {
        if (data.present && data.present.length > 0) {
          await recordAttendance(session.id, data.present, 'PRESENT')
        }
        if (data.absent && data.absent.length > 0) {
          await recordAttendance(session.id, data.absent, 'ABSENT')
        }
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (classroomError) {
    return <div className="text-red-500">Error loading classroom data</div>
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>
            Test Attendance (Face Recognition)
            {classroom?.classroom && (
              <span className="text-sm font-normal text-gray-500 block mt-1">
                {classroom.classroom.name}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!classroom && !classroomError && (
            <div className="text-center py-4">Loading classroom data...</div>
          )}
          
          {classroom && (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Upload Image</Label>
                  <Input 
                    id="file"
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    required 
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="create-session"
                    checked={createSession}
                    onCheckedChange={setCreateSession}
                  />
                  <Label htmlFor="create-session">Create test session and record attendance</Label>
                </div>

                {createSession && (
                  <div className="space-y-2">
                    <Label htmlFor="session-name">Session Name</Label>
                    <Input
                      id="session-name"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="Enter session name"
                    />
                  </div>
                )}

                <Button type="submit" disabled={loading || !file}>
                  {loading ? "Processing..." : "Upload & Detect"}
                </Button>
              </form>

              {error && <div className="text-red-500 mt-4">{error}</div>}
              
              {result && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Results</h3>
                  {createSession && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-green-800 text-sm">
                        ✓ Test session created and attendance recorded
                      </p>
                    </div>
                  )}
                  <div className="mb-2">
                    <span className="font-medium">Present:</span>
                    <ul className="list-disc ml-6">
                      {result.present?.map((student: any) => (
                        <li key={student.id}>{student.name} ({student.email})</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-medium">Absent:</span>
                    <ul className="list-disc ml-6">
                      {result.absent?.map((student: any) => (
                        <li key={student.id}>{student.name} ({student.email})</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 
