"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import useSWR from "swr"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loading } from "@/components/ui/loading"
import { Building2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const editClassroomSchema = z.object({
  name: z.string().min(1, "Classroom name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  capacity: z.number().min(1, "Capacity must be at least 1").max(100, "Capacity cannot exceed 100"),
  location: z.string().min(1, "Location is required").max(200, "Location must be less than 200 characters"),
  teacherId: z.string().min(1, "Teacher selection is required"),
  isActive: z.boolean(),
})

type EditClassroomForm = z.infer<typeof editClassroomSchema>

interface Teacher {
  id: string
  name: string
  department?: string
  user: {
    email: string
  }
}

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

interface EditClassroomDialogProps {
  classroom: Classroom
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json())

export function EditClassroomDialog({ classroom, open, onOpenChange, onSuccess }: EditClassroomDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch teachers using SWR
  const { data: teachersData, error: teachersError, isLoading: teachersLoading } = useSWR<{ teachers: Teacher[] }>(
    open ? '/api/teachers' : null,
    fetcher
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<EditClassroomForm>({
    resolver: zodResolver(editClassroomSchema),
    defaultValues: {
      name: classroom.name,
      description: classroom.description,
      capacity: classroom.capacity,
      location: classroom.location,
      teacherId: classroom.teacherId,
      isActive: classroom.isActive,
    },
  })

  const isActive = watch("isActive")
  const selectedTeacherId = watch("teacherId")

  useEffect(() => {
    if (open && classroom) {
      setValue("name", classroom.name)
      setValue("description", classroom.description)
      setValue("capacity", classroom.capacity)
      setValue("location", classroom.location)
      setValue("teacherId", classroom.teacherId)
      setValue("isActive", classroom.isActive)
    }
  }, [open, classroom, setValue])

  const onSubmit = async (data: EditClassroomForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/classrooms/${classroom.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update classroom")
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Edit Classroom
          </DialogTitle>
          <DialogDescription>
            Update the classroom information below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Classroom Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Computer Science 101"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Brief description of the classroom or course"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                {...register("capacity", { valueAsNumber: true })}
                min="1"
                max="100"
              />
              {errors.capacity && (
                <p className="text-sm text-red-600">{errors.capacity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacherId">Teacher *</Label>
              {teachersLoading ? (
                <div className="flex items-center justify-center h-10 border rounded-md">
                  <Loading size="sm" />
                </div>
              ) : teachersError ? (
                <div className="text-sm text-red-600">Failed to load teachers</div>
              ) : (
                <Select
                  value={selectedTeacherId}
                  onValueChange={(value) => setValue("teacherId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachersData?.teachers?.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{teacher.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {teacher.user.email}
                            {teacher.department && ` • ${teacher.department}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.teacherId && (
                <p className="text-sm text-red-600">{errors.teacherId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              {...register("location")}
              placeholder="e.g., Room 201, Building A"
            />
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || teachersLoading}>
              {isLoading ? (
                <>
                  <Loading size="sm" className="mr-2" />
                  Updating...
                </>
              ) : (
                "Update Classroom"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 