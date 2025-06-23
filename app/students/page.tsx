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
import { Plus, Camera, User, Trash2, Eye } from "lucide-react"

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

// Component to display face image
function FaceImage({ studentId }: { studentId: string }) {
  const { data: faceData } = useSWR(
    `/api/students/${studentId}/face-data?image=true`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const { data: allImagesData } = useSWR(
    `/api/students/${studentId}/face-data?all=true`,
    fetcher,
    { revalidateOnFocus: false }
  )

  if (!faceData?.image) {
    return (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">No images</span>
      </div>
    )
  }

  const imageCount = allImagesData?.images?.length || 1

  return (
    <div className="flex items-center gap-2">
      <img
        src={faceData.image}
        alt="Student face"
        className="h-8 w-8 rounded-full object-cover border"
      />
      <div className="flex flex-col">
        <span className="text-sm text-green-600">Registered</span>
        <span className="text-xs text-gray-500">{imageCount} image{imageCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}

// Component to view all face images
function FaceImageGallery({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const { data: allImagesData, mutate } = useSWR(
    `/api/students/${studentId}/face-data?all=true`,
    fetcher
  )

  const handleDeleteImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/students/${studentId}/face-data?imageId=${imageId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        mutate()
      } else {
        alert('Failed to delete image')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Failed to delete image')
    }
  }

  const images = allImagesData?.images || []

  return (
    <div className="space-y-4">
      {images.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No face images found</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img: any) => (
            <div key={img.id} className="relative group">
              <img
                src={img.image}
                alt="Face image"
                className="w-full h-32 object-cover rounded-lg border"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={() => handleDeleteImage(img.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(img.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function StudentsPage() {
  const [isAddingStudent, setIsAddingStudent] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [viewingImages, setViewingImages] = useState<string | null>(null)
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
                    <FaceImage studentId={student.id} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog open={selectedStudent === student.id} onOpenChange={(open) => setSelectedStudent(open ? student.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Camera className="mr-2 h-4 w-4" />
                            Add Image
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Add Face Image</DialogTitle>
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
                      
                      <Dialog open={viewingImages === student.id} onOpenChange={(open) => setViewingImages(open ? student.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            View Images
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Face Images for {student.name}</DialogTitle>
                          </DialogHeader>
                          <FaceImageGallery
                            studentId={student.id}
                            onClose={() => setViewingImages(null)}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
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