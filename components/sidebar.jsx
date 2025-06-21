"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Users, Calendar, BarChart3, Settings, LogOut, User, Camera, Clock } from "lucide-react"

export default function Sidebar() {
  const [user, setUser] = useState(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // In a real app, this would be a proper auth check
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  // Don't show sidebar on login page
  if (pathname === "/") return null

  // Define menu items based on user role
  const getMenuItems = () => {
    const items = [
      {
        title: "Dashboard",
        icon: BarChart3,
        href: "/dashboard",
        roles: ["admin", "teacher", "student"],
      },
      {
        title: "Attendance",
        icon: Calendar,
        href: "/attendance",
        roles: ["admin", "teacher", "student"],
      },
    ]

    // Admin-only items
    if (user?.role === "admin") {
      items.push(
        {
          title: "Students",
          icon: Users,
          href: "/students",
          roles: ["admin"],
        },
        {
          title: "Face Recognition",
          icon: Camera,
          href: "/face-recognition",
          roles: ["admin"],
        },
        {
          title: "Sessions",
          icon: Clock,
          href: "/sessions",
          roles: ["admin"],
        },
        {
          title: "Settings",
          icon: Settings,
          href: "/settings",
          roles: ["admin"],
        },
      )
    }

    // Teacher-only items
    if (user?.role === "teacher") {
      items.push({
        title: "Corrections",
        icon: Users,
        href: "/corrections",
        roles: ["teacher"],
      })
    }

    return items
  }

  return (
    <SidebarComponent>
      <SidebarHeader className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <Camera className="h-6 w-6" />
          <span className="font-bold">AI Attendance</span>
        </div>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {getMenuItems().map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                <a href={item.href} className="flex items-center">
                  <item.icon className="mr-2 h-5 w-5" />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{user?.username || "User"}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </SidebarFooter>
    </SidebarComponent>
  )
}
