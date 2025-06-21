"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Download, Filter } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// Mock attendance data
const mockAttendance = [
  {
    id: 1,
    name: "John Doe",
    rollNumber: "S001",
    class: "Class A",
    date: "2023-05-01",
    session: "Morning",
    status: "Present",
  },
  {
    id: 2,
    name: "Jane Smith",
    rollNumber: "S002",
    class: "Class B",
    date: "2023-05-01",
    session: "Morning",
    status: "Absent",
  },
  {
    id: 3,
    name: "Michael Johnson",
    rollNumber: "S003",
    class: "Class A",
    date: "2023-05-01",
    session: "Morning",
    status: "Present",
  },
  {
    id: 4,
    name: "Emily Brown",
    rollNumber: "S004",
    class: "Class C",
    date: "2023-05-01",
    session: "Morning",
    status: "Present",
  },
  {
    id: 5,
    name: "David Wilson",
    rollNumber: "S005",
    class: "Class B",
    date: "2023-05-01",
    session: "Morning",
    status: "Present",
  },
  {
    id: 6,
    name: "Sarah Taylor",
    rollNumber: "S006",
    class: "Class A",
    date: "2023-05-01",
    session: "Afternoon",
    status: "Absent",
  },
  {
    id: 7,
    name: "James Anderson",
    rollNumber: "S007",
    class: "Class C",
    date: "2023-05-01",
    session: "Afternoon",
    status: "Present",
  },
  {
    id: 8,
    name: "Olivia Thomas",
    rollNumber: "S008",
    class: "Class B",
    date: "2023-05-01",
    session: "Afternoon",
    status: "Present",
  },
  {
    id: 9,
    name: "Robert Jackson",
    rollNumber: "S009",
    class: "Class A",
    date: "2023-05-01",
    session: "Afternoon",
    status: "Present",
  },
  {
    id: 10,
    name: "Sophia White",
    rollNumber: "S010",
    class: "Class C",
    date: "2023-05-01",
    session: "Afternoon",
    status: "Absent",
  },
]

export default function AttendancePage() {
  const [attendance, setAttendance] = useState(mockAttendance)
  const [date, setDate] = useState(new Date())
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSession, setSelectedSession] = useState("")
  const [user, setUser] = useState(null)

  useEffect(() => {
    // In a real app, this would be a proper auth check
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleStatusChange = (id, newStatus) => {
    // Only allow teachers and admins to change status
    if (user?.role === "student") return

    setAttendance((prev) => prev.map((record) => (record.id === id ? { ...record, status: newStatus } : record)))
  }

  const filteredAttendance = attendance.filter((record) => {
    // Filter by class if selected
    if (selectedClass && record.class !== selectedClass) return false

    // Filter by session if selected
    if (selectedSession && record.session !== selectedSession) return false

    // Filter by date (always applied)
    return record.date === format(date, "yyyy-MM-dd")
  })

  // For students, only show their own attendance
  const studentAttendance =
    user?.role === "student"
      ? filteredAttendance.filter((record) => record.name === "John Doe") // Mock student name
      : filteredAttendance

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Attendance Records</h1>

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

        {user?.role !== "student" && (
          <>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="Class A">Class A</SelectItem>
                <SelectItem value="Class B">Class B</SelectItem>
                <SelectItem value="Class C">Class C</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="Morning">Morning</SelectItem>
                <SelectItem value="Afternoon">Afternoon</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}

        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>

        <Button variant="outline" className="ml-auto">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Roll Number</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Status</TableHead>
              {(user?.role === "admin" || user?.role === "teacher") && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentAttendance.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.name}</TableCell>
                <TableCell>{record.rollNumber}</TableCell>
                <TableCell>{record.class}</TableCell>
                <TableCell>{record.session}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      record.status === "Present" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
                    )}
                  >
                    {record.status}
                  </span>
                </TableCell>
                {(user?.role === "admin" || user?.role === "teacher") && (
                  <TableCell>
                    <Select
                      defaultValue={record.status}
                      onValueChange={(value) => handleStatusChange(record.id, value)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Present">Present</SelectItem>
                        <SelectItem value="Absent">Absent</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {studentAttendance.length === 0 && (
              <TableRow>
                <TableCell colSpan={user?.role === "student" ? 5 : 6} className="text-center py-4">
                  No attendance records found for the selected filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
