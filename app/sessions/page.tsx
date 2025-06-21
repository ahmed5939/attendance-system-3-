"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search } from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/components/ui/use-toast"
import useSWR from "swr"

type Session = {
  id: string
  name: string
  startTime: Date
  endTime: Date
  classId: string
  class: {
    id: string
    name: string
    teacher: {
      name: string
    }
  }
  students: Array<{
    id: string
    name: string
  }>
}

type Classroom = {
  id: string
  name: string
  teacher: {
    name: string
  }
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function SessionsPage() {
  const router = useRouter()
  const { isLoaded, isAuthenticated } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [newSession, setNewSession] = useState({
    name: "",
    startTime: "",
    endTime: "",
    classId: "",
  })
  const [open, setOpen] = useState(false)

  // Fetch data using SWR
  const { data: sessionsData, error: sessionsError, mutate: mutateSessions } = useSWR<Session[]>(
    isAuthenticated ? "/api/sessions" : null,
    fetcher
  )

  const { data: classroomsData, error: classroomsError } = useSWR<{classrooms: Classroom[]}>(
    isAuthenticated ? "/api/classrooms" : null,
    fetcher
  )

  const sessions = sessionsData || []
  const classrooms = classroomsData?.classrooms || []

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push("/sign-in")
    return null
  }

  if (sessionsError || classroomsError) {
    toast({
      title: "Error",
      description: "Failed to load sessions and classrooms",
      variant: "destructive",
    })
  }

  const filteredSessions = sessions.filter((session) => 
    session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.class.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.class.teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewSession((prev) => ({ ...prev, [name]: value }))
  }

  const handleClassroomChange = (value: string) => {
    setNewSession((prev) => ({ ...prev, classId: value }))
  }

  const handleSubmit = async () => {
    try {
      // Create proper date objects with today's date and the selected times
      const today = new Date()
      const [startHour, startMinute] = newSession.startTime.split(':')
      const [endHour, endMinute] = newSession.endTime.split(':')
      
      const startDateTime = new Date(today)
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0)
      
      const endDateTime = new Date(today)
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0)

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSession.name,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          classId: newSession.classId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create session")
      }

      const createdSession = await response.json()
      mutateSessions([...sessions, createdSession])
      setNewSession({ name: "", startTime: "", endTime: "", classId: "" })
      setOpen(false)
      toast({
        title: "Success",
        description: "Session created successfully",
      })
    } catch (error) {
      console.error("Error creating session:", error)
      toast({
        title: "Error",
        description: "Failed to create session",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sessions</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Session</DialogTitle>
              <DialogDescription>Create a new attendance session with time and class details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={newSession.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="e.g., Morning Session"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startTime" className="text-right">
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={newSession.startTime}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endTime" className="text-right">
                  End Time
                </Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={newSession.endTime}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="classroom" className="text-right">
                  Classroom
                </Label>
                <Select onValueChange={handleClassroomChange}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select classroom" />
                  </SelectTrigger>
                  <SelectContent>
                    {classrooms.map((classroom) => (
                      <SelectItem key={classroom.id} value={classroom.id}>
                        {classroom.name} - {classroom.teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !newSession.name || !newSession.startTime || !newSession.endTime || !newSession.classId
                }
              >
                Add Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center mb-6">
        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search sessions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell>{session.id}</TableCell>
                <TableCell className="font-medium">{session.name}</TableCell>
                <TableCell>{format(new Date(session.startTime), "HH:mm")}</TableCell>
                <TableCell>{format(new Date(session.endTime), "HH:mm")}</TableCell>
                <TableCell>{session.class.name}</TableCell>
                <TableCell>{session.class.teacher.name}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700">
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredSessions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No sessions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
