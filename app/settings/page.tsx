"use client"

import type * as React from "react"
import { SidebarTrigger } from "@/components/sidebar-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"
import { Moon, Sun, Calendar, CheckCircle2, BookOpen } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useState, useEffect, useRef } from "react"
import BrightspaceIntegrationButton from "@/components/BrightspaceIntegrationButton"

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const maxRetries = 30 // 1 minute of polling (30 * 2 seconds)
  const popupWindowRef = useRef<Window | null>(null)

  // Check initial connection status
  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        const response = await fetch('/api/calendar/status');
        const data = await response.json();
        setIsGoogleCalendarConnected(data.connected);
      } catch (error) {
        console.error('Error checking initial calendar status:', error);
      }
    };
    checkInitialStatus();
  }, []);

  // Handle messages from the popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'google-calendar-connected') {
        setIsGoogleCalendarConnected(true);
        toast({
          title: "Google Calendar Connected",
          description: "Your Google Calendar has been successfully connected.",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true)
    return () => {
      // Cleanup interval when component unmounts
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  const handleSaveIntegration = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Integration saved",
      description: "Your integration settings have been saved successfully.",
    })
  }

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Account updated",
      description: "Your account settings have been updated successfully.",
    })
  }

  // Handle Google Calendar disconnect
  const handleGoogleCalendarDisconnect = async () => {
    try {
      const response = await fetch('/api/calendar/disconnect', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect Google Calendar');
      }

      setIsGoogleCalendarConnected(false);
      toast({
        title: "Google Calendar Disconnected",
        description: "Your Google Calendar has been successfully disconnected.",
      });
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect Google Calendar. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle Google Calendar integration
  const handleGoogleCalendarConnect = async () => {
    try {
      // Clear any existing interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }

      // Call the API endpoint that will handle the Google Calendar integration
      const response = await fetch('/api/calendar/connect', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to connect to Google Calendar');
      }

      const data = await response.json();
      
      if (data.authUrl) {
        // Open the authorization URL in a new window
        popupWindowRef.current = window.open(data.authUrl, 'Google Calendar Auth', 'width=600,height=600');
        
        let retryCount = 0;
        
        // Start polling for the token
        pollIntervalRef.current = setInterval(async () => {
          if (retryCount >= maxRetries) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
            }
            if (popupWindowRef.current) {
              popupWindowRef.current.close();
            }
            toast({
              title: "Connection Timeout",
              description: "Failed to connect to Google Calendar. Please try again.",
              variant: "destructive",
            });
            return;
          }

          try {
            const statusResponse = await fetch('/api/calendar/status');
            const statusData = await statusResponse.json();
            
            if (statusData.connected) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
              }
              if (popupWindowRef.current) {
                popupWindowRef.current.close();
              }
              setIsGoogleCalendarConnected(true);
              toast({
                title: "Google Calendar Connected",
                description: "Your Google Calendar has been successfully connected.",
              });
            }
          } catch (error) {
            console.error('Error checking connection status:', error);
          }

          retryCount++;
        }, 2000);
      }
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Google Calendar. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle theme toggle
  const handleThemeToggle = (checked: boolean) => {
    const newTheme = checked ? "dark" : "light"
    setTheme(newTheme)
    toast({
      title: "Theme updated",
      description: `Theme set to ${newTheme} mode.`,
      duration: 2000,
    })
  }

  // Determine if dark mode is active
  const isDarkMode = mounted && (theme === "dark" || (theme === "system" && resolvedTheme === "dark"))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and integrations.</p>
        </div>
        <SidebarTrigger className="md:hidden" />
      </div>

      <Tabs defaultValue="appearance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how Sensei AI looks on your device.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme-toggle">Theme</Label>
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4" />
                  {mounted && <Switch id="theme-toggle" checked={isDarkMode} onCheckedChange={handleThemeToggle} />}
                  <Moon className="h-4 w-4" />
                </div>
                {mounted && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Current theme: {isDarkMode ? "Dark" : "Light"} mode
                    {theme === "system" && " (system preference)"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Google Calendar Integration</CardTitle>
              <CardDescription>Connect your Google Calendar to sync events and tasks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Google Calendar</span>
                  {isGoogleCalendarConnected && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
                {isGoogleCalendarConnected ? (
                  <Button 
                    variant="destructive"
                    onClick={handleGoogleCalendarDisconnect}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button 
                    onClick={handleGoogleCalendarConnect}
                  >
                    Connect
                  </Button>
                )}
              </div>
              {isGoogleCalendarConnected && (
                <div className="mt-4 text-sm text-muted-foreground">
                  Your Google Calendar is connected and syncing with your tasks.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brightspace Integration</CardTitle>
              <CardDescription>Connect your Brightspace account to import assignments and deadlines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Brightspace Assignments</span>
                </div>
                <BrightspaceIntegrationButton />
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Click the button to manually scrape and import assignments. You will need to log in via the popup window.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSaveAccount}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input id="name" placeholder="Your Name" />
                  </div>
                </div>
                <Button type="submit" className="mt-4">
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
