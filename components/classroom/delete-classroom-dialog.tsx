"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { Building2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

interface DeleteClassroomDialogProps {
  classroom: Classroom
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeleteClassroomDialog({ classroom, open, onOpenChange, onSuccess }: DeleteClassroomDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/classrooms/${classroom.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete classroom")
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

  const canDelete = classroom.studentCount === 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Classroom
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this classroom? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!canDelete && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Cannot delete classroom with enrolled students. Please remove all students first.
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-600" />
              <span className="font-medium">{classroom.name}</span>
            </div>
            <p className="text-sm text-gray-600">{classroom.description}</p>
            <div className="text-sm text-gray-500 space-y-1">
              <p><strong>Location:</strong> {classroom.location}</p>
              <p><strong>Instructor:</strong> {classroom.instructor}</p>
              <p><strong>Students:</strong> {classroom.studentCount} / {classroom.capacity}</p>
            </div>
          </div>

          {canDelete && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> This will permanently delete the classroom and all associated data.
              </p>
            </div>
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
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading || !canDelete}
          >
            {isLoading ? (
              <Loading size="sm" />
            ) : (
              "Delete Classroom"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 