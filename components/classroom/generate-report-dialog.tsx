"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface GenerateReportDialogProps {
  classroomId: string
  isOpen: boolean
  onClose: () => void
}

export function GenerateReportDialog({
  classroomId,
  isOpen,
  onClose,
}: GenerateReportDialogProps) {
  const [reportType, setReportType] = useState("csv")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      // In a real app, you'd fetch from an API endpoint:
      // const response = await fetch(`/api/classrooms/${classroomId}/report?type=${reportType}`)
      // const blob = await response.blob()
      
      // For now, create a dummy CSV
      const headers = "student_id,student_name,date,status\n"
      const row1 = "1,John Doe,2023-10-27,PRESENT\n"
      const row2 = "2,Jane Smith,2023-10-27,ABSENT\n"
      const dummyCsv = headers + row1 + row2
      const blob = new Blob([dummyCsv], { type: "text/csv" })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `report-${classroomId}.${reportType}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      
      onClose()
    } catch (error) {
      console.error("Failed to generate report", error)
      // Display error to user
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogDescription>
            Generate an attendance report for this class.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Label>Report Format</Label>
          <RadioGroup value={reportType} onValueChange={setReportType}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="csv" id="csv" />
              <Label htmlFor="csv">CSV</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pdf" id="pdf" disabled />
              <Label htmlFor="pdf">PDF (coming soon)</Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 