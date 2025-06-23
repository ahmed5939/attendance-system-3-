"use client"

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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loading } from "@/components/ui/loading"
import { Calendar, Plus } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Session {
  id: string
  name: string
  startTime: string
  endTime: string
}

interface ViewScheduleDialogProps {
  classroomId: string
  isOpen: boolean
  onClose: () => void
}

export function ViewScheduleDialog({
  classroomId,
  isOpen,
  onClose,
}: ViewScheduleDialogProps) {
  const { data, isLoading } = useSWR<{ sessions: Session[] }>(
    `/api/classrooms/${classroomId}/sessions`,
    fetcher
  )

  const sessions = data?.sessions || []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>View Schedule</DialogTitle>
          <DialogDescription>
            Here are all the sessions for this class.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <Loading text="Loading schedule..." />
        ) : (
          <ScrollArea className="h-72">
            <div className="space-y-4 pr-6">
              {sessions.length === 0 && (
                <div className="text-center text-gray-500 py-10">
                  <Calendar className="h-10 w-10 mx-auto mb-2" />
                  No sessions scheduled yet.
                </div>
              )}
              {sessions.map((session) => (
                <div key={session.id} className="p-3 bg-gray-50 rounded-md">
                  <p className="font-semibold">{session.name}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="flex justify-between items-center w-full">
            <Button variant="outline" onClick={() => alert("Coming soon!")}>
                <Plus className="h-4 w-4 mr-2" />
                New Session
            </Button>
            <Button variant="secondary" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 