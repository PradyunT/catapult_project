"use client"

import { useEffect, useState } from "react"
import { SidebarTrigger } from "@/components/sidebar-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit, MessageSquare, Plus } from "lucide-react"
import Link from "next/link"
import { notFound, useRouter } from "next/navigation"
import { getSpaceById } from "@/app/actions/space-actions"
import { getTasks } from "@/app/actions/task-actions"
import { TaskList } from "@/components/task-list"
import { useChatDrawer } from "@/components/chat-drawer-provider"

interface SpacePageProps {
  params: {
    id: string
  }
}

export default function SpacePage({ params }: SpacePageProps) {
  const { openWithContext } = useChatDrawer()
  const [space, setSpace] = useState<any>(null)
  const [spaceTasks, setSpaceTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      try {
        const spaceData = await getSpaceById(params.id)
        if (!spaceData) {
          return notFound()
        }
        setSpace(spaceData)

        const allTasks = await getTasks()
        const filteredTasks = allTasks.filter((task) => task.space_id === params.id)
        setSpaceTasks(filteredTasks)
      } catch (error) {
        console.error("Error loading space data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading space...</p>
        </div>
      </div>
    )
  }

  if (!space) {
    return notFound()
  }

  const handleOpenMentor = () => {
    openWithContext(space.title)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/spaces">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className={`h-4 w-4 rounded-full ${space.color || "bg-gray-500"}`} />
              <h1 className="text-3xl font-bold tracking-tight">{space.title}</h1>
            </div>
            <p className="text-muted-foreground">{space.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SidebarTrigger className="md:hidden" />
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit Space</span>
          </Button>
          <Button variant="outline" onClick={handleOpenMentor}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Talk to {space.title} Mentor
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks in {space.title}</CardTitle>
          <CardDescription>Manage tasks in this space.</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskList initialTasks={spaceTasks} />
        </CardContent>
      </Card>
    </div>
  )
}
