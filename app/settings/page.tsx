"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/ui/loading"
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Camera,
  Clock,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react"

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => res.json())

// Default settings
const defaultSettings = {
  systemName: "Attendance System",
  timezone: "UTC",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  lateThreshold: 15,
  absentThreshold: 30,
  autoMarkAbsent: true,
  requirePhoto: true,
  allowManualEntry: true,
  emailNotifications: true,
  pushNotifications: false,
  dailyReports: true,
  weeklyReports: false,
  sessionTimeout: 30,
  requireReauth: false,
  logActivity: true,
  confidenceThreshold: 0.8,
  maxRetries: 3,
  enableLiveness: true,
}

export default function SettingsPage() {
  const { user } = useUser()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [localSettings, setLocalSettings] = useState(defaultSettings)

  // Fetch settings using SWR
  const { data, error, isLoading, mutate } = useSWR('/api/settings', fetcher, {
    onSuccess: (data) => {
      if (data.settings) {
        setLocalSettings(data.settings)
      }
    }
  })

  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    setSaveStatus('saving')
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: localSettings }),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      const result = await response.json()
      setSaveStatus('success')
      
      // Update the SWR cache
      mutate({ settings: localSettings })
      
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const renderSaveButton = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <Button disabled className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </Button>
        )
      case 'success':
        return (
          <Button variant="outline" className="flex items-center gap-2 text-green-600 border-green-600">
            <CheckCircle className="h-4 w-4" />
            Saved Successfully
          </Button>
        )
      case 'error':
        return (
          <Button variant="outline" className="flex items-center gap-2 text-red-600 border-red-600">
            <AlertCircle className="h-4 w-4" />
            Save Failed
          </Button>
        )
      default:
        return (
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Loading size="lg" text="Loading settings..." className="h-64" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load settings</h3>
            <p className="text-gray-600 mb-4">There was an error loading your settings.</p>
            <Button onClick={() => mutate()}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your system preferences and configuration</p>
        </div>
        {renderSaveButton()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Basic system configuration and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="systemName">System Name</Label>
              <Input
                id="systemName"
                value={localSettings.systemName}
                onChange={(e) => handleSettingChange('systemName', e.target.value)}
                placeholder="Enter system name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={localSettings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="EST">Eastern Time</SelectItem>
                  <SelectItem value="PST">Pacific Time</SelectItem>
                  <SelectItem value="GMT">GMT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select value={localSettings.dateFormat} onValueChange={(value) => handleSettingChange('dateFormat', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timeFormat">Time Format</Label>
                <Select value={localSettings.timeFormat} onValueChange={(value) => handleSettingChange('timeFormat', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour</SelectItem>
                    <SelectItem value="24h">24-hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Attendance Settings
            </CardTitle>
            <CardDescription>
              Configure attendance rules and thresholds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lateThreshold">Late Threshold (minutes)</Label>
                <Input
                  id="lateThreshold"
                  type="number"
                  value={localSettings.lateThreshold}
                  onChange={(e) => handleSettingChange('lateThreshold', parseInt(e.target.value))}
                  min="1"
                  max="60"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="absentThreshold">Absent Threshold (minutes)</Label>
                <Input
                  id="absentThreshold"
                  type="number"
                  value={localSettings.absentThreshold}
                  onChange={(e) => handleSettingChange('absentThreshold', parseInt(e.target.value))}
                  min="1"
                  max="120"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-mark as absent</Label>
                  <p className="text-sm text-gray-500">Automatically mark students as absent after threshold</p>
                </div>
                <Switch
                  checked={localSettings.autoMarkAbsent}
                  onCheckedChange={(checked) => handleSettingChange('autoMarkAbsent', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require photo verification</Label>
                  <p className="text-sm text-gray-500">Students must take a photo when marking attendance</p>
                </div>
                <Switch
                  checked={localSettings.requirePhoto}
                  onCheckedChange={(checked) => handleSettingChange('requirePhoto', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow manual entry</Label>
                  <p className="text-sm text-gray-500">Enable manual attendance entry for administrators</p>
                </div>
                <Switch
                  checked={localSettings.allowManualEntry}
                  onCheckedChange={(checked) => handleSettingChange('allowManualEntry', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure email and push notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email notifications</Label>
                  <p className="text-sm text-gray-500">Receive attendance reports via email</p>
                </div>
                <Switch
                  checked={localSettings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push notifications</Label>
                  <p className="text-sm text-gray-500">Receive real-time push notifications</p>
                </div>
                <Switch
                  checked={localSettings.pushNotifications}
                  onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Daily reports</Label>
                  <p className="text-sm text-gray-500">Send daily attendance summaries</p>
                </div>
                <Switch
                  checked={localSettings.dailyReports}
                  onCheckedChange={(checked) => handleSettingChange('dailyReports', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly reports</Label>
                  <p className="text-sm text-gray-500">Send weekly attendance summaries</p>
                </div>
                <Switch
                  checked={localSettings.weeklyReports}
                  onCheckedChange={(checked) => handleSettingChange('weeklyReports', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage security and privacy preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={localSettings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                min="5"
                max="480"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require re-authentication</Label>
                  <p className="text-sm text-gray-500">Force re-login for sensitive operations</p>
                </div>
                <Switch
                  checked={localSettings.requireReauth}
                  onCheckedChange={(checked) => handleSettingChange('requireReauth', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Log user activity</Label>
                  <p className="text-sm text-gray-500">Track and log all user actions</p>
                </div>
                <Switch
                  checked={localSettings.logActivity}
                  onCheckedChange={(checked) => handleSettingChange('logActivity', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Face Recognition Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Face Recognition Settings
            </CardTitle>
            <CardDescription>
              Configure face recognition parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="confidenceThreshold">Confidence Threshold</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="confidenceThreshold"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="1.0"
                  value={localSettings.confidenceThreshold}
                  onChange={(e) => handleSettingChange('confidenceThreshold', parseFloat(e.target.value))}
                />
                <Badge variant="secondary">{Math.round(localSettings.confidenceThreshold * 100)}%</Badge>
              </div>
              <p className="text-sm text-gray-500">Minimum confidence level for face recognition</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRetries">Maximum Retries</Label>
              <Input
                id="maxRetries"
                type="number"
                value={localSettings.maxRetries}
                onChange={(e) => handleSettingChange('maxRetries', parseInt(e.target.value))}
                min="1"
                max="10"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable liveness detection</Label>
                <p className="text-sm text-gray-500">Detect if the person is real and present</p>
              </div>
              <Switch
                checked={localSettings.enableLiveness}
                onCheckedChange={(checked) => handleSettingChange('enableLiveness', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </CardTitle>
            <CardDescription>
              Your account information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={user?.fullName || ''} disabled />
            </div>
            
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.primaryEmailAddress?.emailAddress || ''} disabled />
            </div>

            <div className="space-y-2">
              <Label>User ID</Label>
              <Input value={user?.id || ''} disabled />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Account Status</Label>
                <p className="text-sm text-gray-500">Your account verification status</p>
              </div>
              <Badge variant={user?.emailAddresses?.[0]?.verification?.status === 'verified' ? 'default' : 'secondary'}>
                {user?.emailAddresses?.[0]?.verification?.status === 'verified' ? 'Verified' : 'Unverified'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 