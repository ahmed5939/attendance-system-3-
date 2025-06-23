"use client"

import { useState } from "react"
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
import { Plus, Search, Trash2 } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "@/components/ui/use-toast"
import useSWR from "swr"

type WhitelistEntry = {
  id: string
  email: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  name: string
  department?: string
  isActive: boolean
  invitationSent: boolean
  invitationSentAt?: string
  clerkInvitationId?: string
  accountCreated: boolean
  accountCreatedAt?: string
  createdAt: string
  updatedAt: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function WhitelistPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [newEntry, setNewEntry] = useState({
    email: "",
    role: "",
    name: "",
    department: "",
  })
  const [open, setOpen] = useState(false)

  // Fetch whitelist data using SWR
  const { data: whitelistData, error, mutate } = useSWR<{whitelist: WhitelistEntry[]}>(
    isSignedIn ? "/api/admin/whitelist" : null,
    fetcher
  )

  const whitelist = whitelistData?.whitelist || []

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p>You need to be an admin to access this page.</p>
        </div>
      </div>
    )
  }

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load whitelist",
      variant: "destructive",
    })
  }

  const filteredWhitelist = whitelist.filter((entry) => 
    entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewEntry((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => {
    setNewEntry((prev) => ({ ...prev, role: value }))
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/admin/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEntry.email,
          role: newEntry.role,
          name: newEntry.name,
          department: newEntry.role === 'TEACHER' ? newEntry.department : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add to whitelist")
      }

      const result = await response.json()
      mutate()
      setNewEntry({ email: "", role: "", name: "", department: "" })
      setOpen(false)
      toast({
        title: "Success",
        description: "User added to whitelist and invitation sent successfully",
      })
    } catch (error) {
      console.error("Error adding to whitelist:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add to whitelist",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this user from the whitelist?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/whitelist/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove from whitelist")
      }

      mutate()
      toast({
        title: "Success",
        description: "User removed from whitelist",
      })
    } catch (error) {
      console.error("Error removing from whitelist:", error)
      toast({
        title: "Error",
        description: "Failed to remove from whitelist",
        variant: "destructive",
      })
    }
  }

  const handleResendInvitation = async (entry: WhitelistEntry) => {
    try {
      const response = await fetch(`/api/admin/whitelist/${entry.id}/resend-invitation`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to resend invitation")
      }

      mutate()
      toast({
        title: "Success",
        description: "Invitation resent successfully",
      })
    } catch (error) {
      console.error("Error resending invitation:", error)
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Whitelist</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add User to Whitelist</DialogTitle>
              <DialogDescription>Add a new user to the whitelist and send them an email invitation to create their account.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newEntry.email}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="user@school.edu"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={newEntry.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Full Name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select onValueChange={handleRoleChange}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="TEACHER">Teacher</SelectItem>
                    <SelectItem value="ADMIN">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newEntry.role === 'TEACHER' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="department" className="text-right">
                    Department
                  </Label>
                  <Input
                    id="department"
                    name="department"
                    value={newEntry.department}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder="e.g., Computer Science"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !newEntry.email || !newEntry.role || !newEntry.name ||
                  (newEntry.role === 'TEACHER' && !newEntry.department)
                }
              >
                Add User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center mb-6">
        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search whitelist..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invitation</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWhitelist.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.email}</TableCell>
                <TableCell>{entry.name}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    entry.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                    entry.role === 'TEACHER' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {entry.role}
                  </span>
                </TableCell>
                <TableCell>{entry.department || '-'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    entry.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {entry.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  {entry.invitationSent ? (
                    <div className="space-y-1">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Invitation Sent {entry.invitationSentAt ? new Date(entry.invitationSentAt).toLocaleDateString() : ''}
                      </span>
                      {entry.accountCreated && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Account Created {entry.accountCreatedAt ? new Date(entry.accountCreatedAt).toLocaleDateString() : ''}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Pending
                    </span>
                  )}
                </TableCell>
                <TableCell>{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {entry.invitationSent && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => handleResendInvitation(entry)}
                      >
                        Resend
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredWhitelist.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No whitelist entries found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 