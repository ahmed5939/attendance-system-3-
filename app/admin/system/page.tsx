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
  BarChart3,
  Network
} from "lucide-react"
import { useUserProfile } from "@/hooks/use-user-profile"
import useSWR from "swr"
import { useAuth } from "@clerk/nextjs";
import { formatDistanceToNow } from 'date-fns'

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return response.json()
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function SystemAdminPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const { profile: userProfile } = useUserProfile()

  // Fetch system stats
  const { data: stats } = useSWR("/api/stats", fetcher, {
    refreshInterval: 5000 // Refresh every 5 seconds
  })

  // Fetch system logs
  const { data: logs, error: logsError } = useSWR("/api/admin/logs", fetcher, {
    refreshInterval: 5000, // Refresh every 5 seconds
    onError: (error) => {
      console.error('Logs SWR error:', error)
    },
    onSuccess: (data) => {
      console.log('Logs SWR success:', data)
    }
  })

  // Fetch system settings
  const { data: settings, mutate: mutateSettings } = useSWR("/api/admin/settings", fetcher)

  // Check if user is admin
  const isAdmin = userProfile?.role === 'ADMIN'

  const handleSettingChange = async (key: string, value: any) => {
    try {
      // Optimistically update the local state
      mutateSettings((currentSettings: any) => ({ ...currentSettings, [key]: value }), false)
      
      // Make the API call
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })

      // Re-fetch to confirm
      mutateSettings()
    } catch (error) {
      console.error("Failed to update setting", error)
      // Optionally, show an error to the user and roll back
    }
  }

  if (!isLoaded || !stats || !settings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Loading System Data...</h1>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
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
        <Badge variant={settings.maintenanceMode ? "destructive" : "default"}>
          {settings.maintenanceMode ? "Maintenance Mode" : "System Online"}
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
                <div className="text-2xl font-bold text-green-600">{stats.databaseStatus}</div>
                <p className="text-xs text-muted-foreground">
                  Last sync: {formatDistanceToNow(new Date(stats.lastSync))} ago
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.totalTeachers || 0} teachers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeSessions || 0}</div>
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
                <div className="text-2xl font-bold text-green-600">{stats.health}%</div>
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
                    <span>{stats.cpuUsage.toFixed(2)}%</span>
                  </div>
                  <Progress value={stats.cpuUsage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Usage</span>
                    <span>{formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)}</span>
                  </div>
                  <Progress value={stats.memory.usagePercentage} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Available:</span> {formatBytes(stats.memory.free)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disk Usage (Placeholder) */}
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
              </CardContent>
            </Card>

            {/* Network (Placeholder) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Network Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Uptime:</span> {formatDistanceToNow(new Date(Date.now() - stats.uptime * 1000))}
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
                  <Switch checked={settings.maintenanceMode} onCheckedChange={(val) => handleSettingChange('maintenanceMode', val)} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all users
                    </p>
                  </div>
                  <Switch checked={settings.twoFactorAuth} onCheckedChange={(val) => handleSettingChange('twoFactorAuth', val)} />
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
                  <Input 
                    type="number" 
                    value={settings.sessionTimeout} 
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                    min={5} 
                    max={480} 
                  />
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
                  <Switch checked={settings.backupEnabled} onCheckedChange={(val) => handleSettingChange('backupEnabled', val)} />
                </div>

                <div className="space-y-2">
                  <Label>Backup Schedule</Label>
                  <Input 
                    value={settings.backupSchedule}
                    onChange={(e) => handleSettingChange('backupSchedule', e.target.value)} 
                    type="time" 
                    disabled={!settings.backupEnabled} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Retention Period (days)</Label>
                  <Input 
                    value={settings.backupRetention} 
                    onChange={(e) => handleSettingChange('backupRetention', parseInt(e.target.value))}
                    type="number" 
                    min={1} 
                    max={365} 
                    disabled={!settings.backupEnabled} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Backup Location</Label>
                  <Input 
                    value={settings.backupLocation} 
                    onChange={(e) => handleSettingChange('backupLocation', e.target.value)} 
                    disabled={!settings.backupEnabled} 
                  />
                </div>

                <Button disabled={!settings.backupEnabled}>
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
                {logsError ? (
                  <p className="text-center text-red-500 py-4">Error loading logs: {logsError.message}</p>
                ) : !logs ? (
                  <p>Loading logs...</p>
                ) : Array.isArray(logs) ? (
                  logs.length > 0 ? (
                    logs.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium capitalize">{log.level.toLowerCase()}</span>
                          <p className="text-sm text-muted-foreground">{log.message}</p>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(log.createdAt))} ago
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No logs found</p>
                  )
                ) : (
                  <p className="text-center text-red-500 py-4">Error loading logs</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 