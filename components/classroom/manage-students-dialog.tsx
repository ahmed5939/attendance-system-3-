"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loading } from "@/components/ui/loading"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Student {
  id: string
  name: string
  user: {
    email: string
  }
}

interface ManageStudentsDialogProps {
  classroomId: string
  isOpen: boolean
  onClose: () => void
  onStudentsManaged: () => void
}

export function ManageStudentsDialog({
  classroomId,
  isOpen,
  onClose,
  onStudentsManaged,
}: ManageStudentsDialogProps) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

  // Fetch all students
  const { data: allStudentsData, isLoading: isLoadingAllStudents } = useSWR<{ students: Student[] }>(
    "/api/students",
    fetcher
  )

  // Fetch students in this class
  const { data: classStudentsData, isLoading: isLoadingClassStudents } = useSWR<{ students: Student[] }>(
    `/api/classrooms/${classroomId}/students`,
    fetcher
  )

  useEffect(() => {
    if (classStudentsData?.students) {
      setSelectedStudentIds(new Set(classStudentsData.students.map((s) => s.id)))
    }
  }, [classStudentsData])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/classrooms/${classroomId}/students`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: Array.from(selectedStudentIds) }),
      })

      if (!response.ok) {
        throw new Error("Failed to save students")
      }

      onStudentsManaged()
      onClose()
    } catch (error) {
      console.error(error)
      // Handle error display to the user
    } finally {
      setIsSaving(false)
    }
  }

  const handleStudentSelect = (studentId: string, isSelected: boolean) => {
    const newSelectedIds = new Set(selectedStudentIds)
    if (isSelected) {
      newSelectedIds.add(studentId)
    } else {
      newSelectedIds.delete(studentId)
    }
    setSelectedStudentIds(newSelectedIds)
  }

  const isLoading = isLoadingAllStudents || isLoadingClassStudents
  const allStudents = allStudentsData?.students || []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Students</DialogTitle>
          <DialogDescription>
            Select students to enroll in this class.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <Loading text="Loading students..." />
        ) : (
          <ScrollArea className="h-72">
            <div className="space-y-4 pr-6">
              {allStudents.map((student) => (
                <div key={student.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={student.id}
                    checked={selectedStudentIds.has(student.id)}
                    onCheckedChange={(checked) => handleStudentSelect(student.id, !!checked)}
                  />
                  <Label htmlFor={student.id} className="flex flex-col">
                    <span>{student.name}</span>
                    <span className="text-xs text-gray-500">{student.user?.email}</span>
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 