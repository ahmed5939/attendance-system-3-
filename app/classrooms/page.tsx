"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/ui/loading"
import { 
  Plus, 
  Search, 
  Users, 
  Calendar, 
  MapPin, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Building2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateClassroomDialog } from "@/components/classroom/create-classroom-dialog"
import { EditClassroomDialog } from "@/components/classroom/edit-classroom-dialog"
import { DeleteClassroomDialog } from "@/components/classroom/delete-classroom-dialog"

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json())

interface Classroom {
  id: string
  name: string
  description: string
  capacity: number
  location: string
  instructor: string
  teacherId: string
  studentCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function ClassroomsPage() {
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null)
  const [deletingClassroom, setDeletingClassroom] = useState<Classroom | null>(null)

  // Fetch classrooms using SWR
  const { data, error, isLoading, mutate } = useSWR<{ classrooms: Classroom[] }>('/api/classrooms', fetcher)

  const filteredClassrooms = data?.classrooms?.filter(classroom =>
    classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classroom.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classroom.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classroom.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleEdit = (classroom: Classroom) => {
    setEditingClassroom(classroom)
  }

  const handleDelete = (classroom: Classroom) => {
    setDeletingClassroom(classroom)
  }

  const handleView = (classroom: Classroom) => {
    // Navigate to classroom detail page
    window.location.href = `/classrooms/${classroom.id}`
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Loading size="lg" text="Loading classrooms..." className="h-64" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">Failed to load classrooms</div>
            <Button onClick={() => mutate()}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classrooms</h1>
          <p className="text-gray-600 mt-1">Manage your classrooms and course schedules</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Classroom
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search classrooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary">
              {filteredClassrooms.length} classroom{filteredClassrooms.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Classrooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClassrooms.map((classroom) => (
          <Card key={classroom.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{classroom.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleView(classroom)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(classroom)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(classroom)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription className="line-clamp-2">
                {classroom.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{classroom.location}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{classroom.studentCount} / {classroom.capacity} students</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Badge variant={classroom.isActive ? "default" : "secondary"}>
                  {classroom.isActive ? "Active" : "Inactive"}
                </Badge>
                <span className="text-xs text-gray-500">
                  Instructor: {classroom.instructor}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredClassrooms.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No classrooms found' : 'No classrooms yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Create your first classroom to get started'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                Create Classroom
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CreateClassroomDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          mutate()
        }}
      />

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
            mutate()
          }}
        />
      )}
    </div>
  )
} 