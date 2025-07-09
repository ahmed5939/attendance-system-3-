"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Download, Filter, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const fetcher = (url) => fetch(url).then(res => res.json())

export default function AttendancePage() {
  const { user, isLoaded } = useUser()
  const [date, setDate] = useState(new Date())

  // Fetch attendance data using SWR - no filtering, just get all data
  const attendanceUrl = `/api/attendance?date=${format(date, "yyyy-MM-dd")}`
  const { data: attendance, error: attendanceError, mutate: mutateAttendance } = useSWR(attendanceUrl, fetcher)

  // Get user role from Clerk metadata or default to student
  const userRole = user?.publicMetadata?.role || "student"

  const handleStatusChange = async (attendanceId, newStatus) => {
    // Only allow teachers and admins to change status
    if (userRole === "student") return

    try {
      // Find the attendance record to update
      const record = attendance.find(a => a.id === attendanceId)
      if (!record) return

      const response = await fetch(`/api/attendance/${attendanceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        // Refresh the attendance data
        mutateAttendance()
      }
    } catch (error) {
      console.error("Error updating attendance:", error)
    }
  }

  const handleExport = () => {
    if (!attendance || attendance.length === 0) {
      alert("No data to export")
      return
    }

    // Create CSV content
    const headers = ["Name", "Email", "Class", "Session", "Date", "Status"]
    const csvContent = [
      headers.join(","),
      ...attendance.map(record => [
        `"${record.student?.name || "Unknown"}"`,
        `"${record.student?.user?.email || "No email"}"`,
        `"${record.session?.class?.name || "Unknown"}"`,
        `"${record.session?.name || "Unknown"}"`,
        `"${format(new Date(record.timestamp), "MMM dd, yyyy HH:mm")}"`,
        `"${record.status}"`
      ].join(","))
    ].join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `attendance-${format(date, "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Attendance Records (Raw API Data)</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <Button variant="outline" className="ml-auto" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {attendanceError && (
        <div className="text-red-500 mb-4">
          Error loading attendance data: {attendanceError.message}
        </div>
      )}

      {/* Raw data display */}


      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              {(userRole === "admin" || userRole === "teacher") && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!attendance && !attendanceError && (
              <TableRow>
                <TableCell colSpan={userRole === "student" ? 7 : 8} className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            )}
            
            {attendance?.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-mono text-xs">{record.id}</TableCell>
                <TableCell className="font-medium">
                  {record.student?.name || "Unknown"}
                </TableCell>
                <TableCell>
                  {record.student?.user?.email || "No email"}
                </TableCell>
                <TableCell>
                  {record.session?.class?.name || "Unknown"}
                </TableCell>
                <TableCell>
                  {record.session?.name || "Unknown"}
                </TableCell>
                <TableCell>
                  {format(new Date(record.timestamp), "MMM dd, yyyy HH:mm")}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      record.status === "PRESENT" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
                    )}
                  >
                    {record.status}
                  </span>
                </TableCell>
                {(userRole === "admin" || userRole === "teacher") && (
                  <TableCell>
                    <Select
                      defaultValue={record.status}
                      onValueChange={(value) => handleStatusChange(record.id, value)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRESENT">Present</SelectItem>
                        <SelectItem value="ABSENT">Absent</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                )}
              </TableRow>
            ))}
            
            {attendance?.length === 0 && (
              <TableRow>
                <TableCell colSpan={userRole === "student" ? 7 : 8} className="text-center py-4">
                  No attendance records found for the selected date
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
