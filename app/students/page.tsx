"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FaceDataCapture } from "@/components/face-data-capture"
import { Plus, Camera } from "lucide-react"

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    throw new Error('An error occurred while fetching the data.')
  }
  return response.json()
}

export default function StudentsPage() {
  const [isAddingStudent, setIsAddingStudent] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const { data: studentsData, error, mutate } = useSWR("/api/students", fetcher)

  // Extract students array from the API response
  const students = studentsData?.students || []

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string

    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, userEmail: email }),
      })

      if (response.ok) {
        setIsAddingStudent(false)
        mutate()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add student")
      }
    } catch (error) {
      console.error("Error adding student:", error)
      alert(error instanceof Error ? error.message : "Failed to add student. Please try again.")
    }
  }

  if (error) return <div>Failed to load students</div>
  if (!studentsData) return <div>Loading...</div>

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Students</h1>
        <Dialog open={isAddingStudent} onOpenChange={setIsAddingStudent}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <Button type="submit" className="w-full">
                Add Student
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>
            Manage your students and their face recognition data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Face Data</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student: any) => (
                <TableRow key={student.id}>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.user?.email || 'N/A'}</TableCell>
                  <TableCell>
                    {student.faceData ? "Registered" : "Not Registered"}
                  </TableCell>
                  <TableCell>
                    <Dialog open={selectedStudent === student.id} onOpenChange={(open) => setSelectedStudent(open ? student.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Camera className="mr-2 h-4 w-4" />
                          {student.faceData ? "Update Face Data" : "Register Face"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            {student.faceData ? "Update Face Data" : "Register Face Data"}
                          </DialogTitle>
                        </DialogHeader>
                        <FaceDataCapture
                          studentId={student.id}
                          onSuccess={() => {
                            setSelectedStudent(null)
                            mutate()
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No students found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 