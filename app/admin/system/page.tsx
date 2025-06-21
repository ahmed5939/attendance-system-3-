"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Database, 
  Server, 
  Shield, 
  Users, 
  Settings, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Cpu,
  Memory,
  Network
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useUserProfile } from "@/hooks/use-user-profile"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function SystemAdminPage() {
  const { isLoaded, isAuthenticated } = useAuth()
  const { data: userProfile } = useUserProfile()
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [backupEnabled, setBackupEnabled] = useState(true)
  const [autoCleanup, setAutoCleanup] = useState(true)

  // Fetch system stats
  const { data: stats } = useSWR("/api/stats", fetcher, {
    refreshInterval: 30000 // Refresh every 30 seconds
  })

  // Check if user is admin
  const isAdmin = userProfile?.role === 'ADMIN'

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
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p>You need to be logged in to access this page.</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p>You need administrator privileges to access system administration.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Administration</h1>
          <p className="text-gray-600 mt-1">Monitor and manage system resources and settings</p>
        </div>
        <Badge variant={maintenanceMode ? "destructive" : "default"}>
          {maintenanceMode ? "Maintenance Mode" : "System Online"}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="backup">Backup & Recovery</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* System Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database Status</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Online</div>
                <p className="text-xs text-muted-foreground">
                  Last sync: 2 minutes ago
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats?.totalTeachers || 0} teachers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeSessions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Currently running
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">98%</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Database className="h-6 w-6" />
                <span>Database Backup</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Users className="h-6 w-6" />
                <span>User Management</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Settings className="h-6 w-6" />
                <span>System Settings</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CPU Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  CPU Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Usage</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Peak:</span> 78%
                  </div>
                  <div>
                    <span className="text-muted-foreground">Average:</span> 32%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Memory className="h-5 w-5" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Usage</span>
                    <span>2.1 GB / 8 GB</span>
                  </div>
                  <Progress value={26} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Available:</span> 5.9 GB
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cached:</span> 1.2 GB
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disk Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Disk Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Used Space</span>
                    <span>156 GB / 500 GB</span>
                  </div>
                  <Progress value={31} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Free:</span> 344 GB
                  </div>
                  <div>
                    <span className="text-muted-foreground">Database:</span> 45 GB
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Network Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Incoming</span>
                    <span>2.3 MB/s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Outgoing</span>
                    <span>1.8 MB/s</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Active Connections:</span> 127
                  </div>
                  <div>
                    <span className="text-muted-foreground">Uptime:</span> 15d 7h
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable system access
                    </p>
                  </div>
                  <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all users
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">
                      Auto-logout after inactivity
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input type="number" defaultValue={30} min={5} max={480} />
                </div>
              </CardContent>
            </Card>

            {/* Security Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Security Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <span className="text-sm">Failed login attempts detected</span>
                    <Badge variant="secondary">2 hours ago</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="text-sm">Security scan completed</span>
                    <Badge variant="default">1 day ago</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <span className="text-sm">Database backup successful</span>
                    <Badge variant="secondary">2 days ago</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Backup Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Backup Configuration</CardTitle>
                <CardDescription>Configure automated backup settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automated Backups</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable daily database backups
                    </p>
                  </div>
                  <Switch checked={backupEnabled} onCheckedChange={setBackupEnabled} />
                </div>

                <div className="space-y-2">
                  <Label>Backup Schedule</Label>
                  <Input defaultValue="02:00" type="time" disabled={!backupEnabled} />
                </div>

                <div className="space-y-2">
                  <Label>Retention Period (days)</Label>
                  <Input defaultValue="30" type="number" min={1} max={365} disabled={!backupEnabled} />
                </div>

                <div className="space-y-2">
                  <Label>Backup Location</Label>
                  <Input defaultValue="/backups" disabled={!backupEnabled} />
                </div>

                <Button disabled={!backupEnabled}>
                  Create Manual Backup
                </Button>
              </CardContent>
            </Card>

            {/* Recent Backups */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Backups</CardTitle>
                <CardDescription>Latest backup operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div>
                      <span className="font-medium">Full Backup</span>
                      <p className="text-sm text-muted-foreground">Today, 02:00 AM</p>
                    </div>
                    <Badge variant="default">Success</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div>
                      <span className="font-medium">Full Backup</span>
                      <p className="text-sm text-muted-foreground">Yesterday, 02:00 AM</p>
                    </div>
                    <Badge variant="default">Success</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div>
                      <span className="font-medium">Full Backup</span>
                      <p className="text-sm text-muted-foreground">2 days ago, 02:00 AM</p>
                    </div>
                    <Badge variant="default">Success</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>Recent system events and activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">User login</span>
                    <p className="text-sm text-muted-foreground">admin@school.edu logged in successfully</p>
                  </div>
                  <span className="text-sm text-muted-foreground">2 minutes ago</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">Database backup</span>
                    <p className="text-sm text-muted-foreground">Scheduled backup completed successfully</p>
                  </div>
                  <span className="text-sm text-muted-foreground">1 hour ago</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">Face recognition</span>
                    <p className="text-sm text-muted-foreground">Processing completed for session A101</p>
                  </div>
                  <span className="text-sm text-muted-foreground">3 hours ago</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">System maintenance</span>
                    <p className="text-sm text-muted-foreground">Scheduled maintenance window completed</p>
                  </div>
                  <span className="text-sm text-muted-foreground">1 day ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 