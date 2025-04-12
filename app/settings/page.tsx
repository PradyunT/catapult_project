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
import { Moon, Sun } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useState, useEffect } from "react"

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true)
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
              <CardTitle>Brightspace Integration</CardTitle>
              <CardDescription>Connect your Brightspace account to import assignments and deadlines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSaveIntegration}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="brightspace-url">Brightspace URL</Label>
                    <Input id="brightspace-url" placeholder="https://your-institution.brightspace.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="brightspace-api-key">API Key</Label>
                    <Input id="brightspace-api-key" type="password" />
                  </div>
                  <Button type="submit">Save Brightspace Settings</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outlook Integration</CardTitle>
              <CardDescription>Connect your Outlook account to sync calendar events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSaveIntegration}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="outlook-email">Outlook Email</Label>
                    <Input id="outlook-email" type="email" placeholder="your.email@outlook.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="outlook-password">Password</Label>
                    <Input id="outlook-password" type="password" />
                  </div>
                  <Button type="submit">Save Outlook Settings</Button>
                </div>
              </form>
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
                  {/* Email field removed as requested */}
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
