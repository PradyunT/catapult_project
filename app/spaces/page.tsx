"use client"

import { useEffect, useState } from "react"
import { SidebarTrigger } from "@/components/sidebar-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"
import { getSpaces, getTasksCountForSpace, createSpace } from "@/app/actions/space-actions"
import { NewSpaceDialog } from "@/components/new-space-dialog"
import { toast } from "@/components/ui/use-toast"

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    loadSpaces()
  }, [])

  async function loadSpaces() {
    try {
      setLoading(true)
      const spacesData = await getSpaces()

      // Get task counts for each space
      const spacesWithCounts = await Promise.all(
        spacesData.map(async (space) => {
          const taskCount = await getTasksCountForSpace(space.id)
          return {
            ...space,
            taskCount,
          }
        }),
      )

      setSpaces(spacesWithCounts)
    } catch (error) {
      console.error("Error loading spaces:", error)
      toast({
        title: "Error",
        description: "Failed to load spaces. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSpace = async (spaceData: { title: string; description: string; color: string }) => {
    try {
      const newSpace = await createSpace(spaceData)
      toast({
        title: "Space created",
        description: `"${spaceData.title}" has been created successfully.`,
      })

      // Reload spaces to include the new one
      await loadSpaces()

      // Close the dialog
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error creating space:", error)
      toast({
        title: "Error",
        description: "Failed to create space. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Spaces</h1>
          <p className="text-muted-foreground">Organize your tasks into different contexts.</p>
        </div>
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Space
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading spaces...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {spaces.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex h-40 items-center justify-center">
                <p className="text-muted-foreground">No spaces found. Create your first space to get started.</p>
              </CardContent>
            </Card>
          ) : (
            spaces.map((space) => (
              <Card key={space.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`h-4 w-4 rounded-full ${space.color || "bg-gray-500"}`} />
                    <CardTitle>{space.title}</CardTitle>
                  </div>
                  <CardDescription>{space.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{space.taskCount} tasks</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/spaces/${space.id}`}>View Space</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}

      <NewSpaceDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onCreateSpace={handleCreateSpace} />
    </div>
  )
}
