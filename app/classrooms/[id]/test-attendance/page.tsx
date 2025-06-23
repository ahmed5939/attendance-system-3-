"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function TestAttendancePage() {
  const params = useParams()
  const classroomId = params.id as string
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
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
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Attendance (Face Recognition)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="file" accept="image/*" onChange={handleFileChange} required />
            <Button type="submit" disabled={loading || !file}>
              {loading ? "Processing..." : "Upload & Detect"}
            </Button>
          </form>
          {error && <div className="text-red-500 mt-4">{error}</div>}
          {result && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Results</h3>
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
        </CardContent>
      </Card>
    </div>
  )
} 