"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { Loading } from "@/components/ui/loading"
import { Building2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const createClassroomSchema = z.object({
  name: z.string().min(1, "Classroom name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  capacity: z.number().min(1, "Capacity must be at least 1").max(100, "Capacity cannot exceed 100"),
  location: z.string().min(1, "Location is required").max(200, "Location must be less than 200 characters"),
  schedule: z.string().min(1, "Schedule is required").max(200, "Schedule must be less than 200 characters"),
  instructor: z.string().min(1, "Instructor is required").max(100, "Instructor name must be less than 100 characters"),
})

type CreateClassroomForm = z.infer<typeof createClassroomSchema>

interface CreateClassroomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateClassroomDialog({ open, onOpenChange, onSuccess }: CreateClassroomDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateClassroomForm>({
    resolver: zodResolver(createClassroomSchema),
    defaultValues: {
      name: "",
      description: "",
      capacity: 30,
      location: "",
      schedule: "",
      instructor: "",
    },
  })

  const onSubmit = async (data: CreateClassroomForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/classrooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create classroom")
      }

      reset()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
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
            Create New Classroom
          </DialogTitle>
          <DialogDescription>
            Add a new classroom to your attendance system. Fill in the details below.
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
              <Label htmlFor="instructor">Instructor *</Label>
              <Input
                id="instructor"
                {...register("instructor")}
                placeholder="e.g., Dr. Sarah Johnson"
              />
              {errors.instructor && (
                <p className="text-sm text-red-600">{errors.instructor.message}</p>
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

          <div className="space-y-2">
            <Label htmlFor="schedule">Schedule *</Label>
            <Input
              id="schedule"
              {...register("schedule")}
              placeholder="e.g., Monday, Wednesday, Friday 9:00 AM - 10:30 AM"
            />
            {errors.schedule && (
              <p className="text-sm text-red-600">{errors.schedule.message}</p>
            )}
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loading size="sm" />
              ) : (
                "Create Classroom"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 