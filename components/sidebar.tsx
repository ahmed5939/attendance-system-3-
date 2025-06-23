"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton, useUser } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileCheck,
  Camera,
  Settings,
  Building2,
  Shield,
  UserCheck,
} from "lucide-react"
import { useUserProfile } from "@/hooks/use-user-profile"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["STUDENT", "TEACHER", "ADMIN"]
  },
  {
    name: "Classrooms",
    href: "/classrooms",
    icon: Building2,
    roles: ["TEACHER", "ADMIN"]
  },
  {
    name: "Students",
    href: "/students",
    icon: Users,
    roles: ["TEACHER", "ADMIN"]
  },
  {
    name: "Sessions",
    href: "/sessions",
    icon: Calendar,
    roles: ["TEACHER", "ADMIN"]
  },
  {
    name: "Attendance",
    href: "/attendance",
    icon: FileCheck,
    roles: ["STUDENT", "TEACHER", "ADMIN"]
  },
]

const adminNavigation = [
  {
    name: "User Whitelist",
    href: "/admin/whitelist",
    icon: UserCheck,
  },
  {
    name: "System Admin",
    href: "/admin/system",
    icon: Shield,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const { profile } = useUserProfile()

  const userRole = profile?.role || "STUDENT"
  const isAdmin = userRole === "ADMIN"

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(userRole)
  )

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white shadow-sm">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-3 font-semibold text-gray-900">
          <Camera className="h-7 w-7 text-blue-600" />
          <span className="text-lg">Attendance System</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-3 text-sm font-medium">
          {filteredNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-900",
                pathname === item.href && "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
              )}
            >
              <item.icon className={cn("h-4 w-4", pathname === item.href && "text-blue-600")} />
              {item.name}
            </Link>
          ))}
          
          {isAdmin && (
            <>
              <div className="mt-6 mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin
              </div>
              {adminNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-900",
                    pathname === item.href && "bg-red-50 text-red-700 border-r-2 border-red-600"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", pathname === item.href && "text-red-600")} />
                  {item.name}
                </Link>
              ))}
            </>
          )}
        </nav>
      </div>
      <div className="border-t bg-gray-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-10 w-10"
                }
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile?.student?.name || profile?.teacher?.name || user?.fullName || user?.firstName || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
            <p className="text-xs text-gray-400 truncate capitalize">
              {userRole.toLowerCase()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 