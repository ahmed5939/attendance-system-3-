"use client"

import { useParams, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/ui/loading"
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Users, 
  Calendar, 
  MapPin, 
  Building2,
  Clock,
  User,
  FileText,
  Activity
} from "lucide-react"
import { EditClassroomDialog } from "@/components/classroom/edit-classroom-dialog"
import { DeleteClassroomDialog } from "@/components/classroom/delete-classroom-dialog"
import { useState } from "react"

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json())

interface Classroom {
  id: string
  name: string
  description: string
  capacity: number
  location: string
  schedule: string
  instructor: string
  studentCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function ClassroomDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null)
  const [deletingClassroom, setDeletingClassroom] = useState<Classroom | null>(null)

  const classroomId = params.id as string

  // Fetch classroom details using SWR
  const { data, error, isLoading, mutate } = useSWR<{ classroom: Classroom }>(
    `/api/classrooms/${classroomId}`,
    fetcher
  )

  const classroom = data?.classroom

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Loading size="lg" text="Loading classroom details..." className="h-64" />
      </div>
    )
  }

  if (error || !classroom) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">Failed to load classroom</div>
            <Button onClick={() => mutate()}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  const handleEdit = () => {
    setEditingClassroom(classroom)
  }

  const handleDelete = () => {
    setDeletingClassroom(classroom)
  }

  const handleBack = () => {
    router.push('/classrooms')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Classrooms
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{classroom.name}</h1>
            <p className="text-gray-600 mt-1">{classroom.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Classroom Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{classroom.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Instructor</p>
                    <p className="font-medium">{classroom.instructor}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Schedule</p>
                    <p className="font-medium">{classroom.schedule}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Capacity</p>
                    <p className="font-medium">{classroom.studentCount} / {classroom.capacity} students</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={classroom.isActive ? "default" : "secondary"}>
                  {classroom.isActive ? "Active" : "Inactive"}
                </Badge>
                <span className="text-sm text-gray-500">
                  Created {new Date(classroom.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm">Activity will appear here when students attend classes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Manage Students
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                View Schedule
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Take Attendance
              </Button>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Enrollment Rate</span>
                <span className="font-medium">
                  {Math.round((classroom.studentCount / classroom.capacity) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(classroom.studentCount / classroom.capacity) * 100}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{classroom.studentCount}</p>
                  <p className="text-sm text-gray-600">Enrolled</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-600">{classroom.capacity - classroom.studentCount}</p>
                  <p className="text-sm text-gray-600">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Last Updated */}
          <Card>
            <CardHeader>
              <CardTitle>Last Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {new Date(classroom.updatedAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      {editingClassroom && (
        <EditClassroomDialog
          classroom={editingClassroom}
          open={!!editingClassroom}
          onOpenChange={(open) => !open && setEditingClassroom(null)}
          onSuccess={() => {
            setEditingClassroom(null)
            mutate()
          }}
        />
      )}

      {deletingClassroom && (
        <DeleteClassroomDialog
          classroom={deletingClassroom}
          open={!!deletingClassroom}
          onOpenChange={(open) => !open && setDeletingClassroom(null)}
          onSuccess={() => {
            setDeletingClassroom(null)
            router.push('/classrooms')
          }}
        />
      )}
    </div>
  )
} 