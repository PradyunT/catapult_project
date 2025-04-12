import { SidebarTrigger } from "@/components/sidebar-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { TaskList } from "@/components/task-list"
import { getTasks } from "@/app/actions/task-actions"

export default async function TodosPage() {
  const tasks = await getTasks()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Todo List</h1>
          <p className="text-muted-foreground">Manage all your tasks in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>View and manage all your tasks across different spaces.</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskList initialTasks={tasks} />
        </CardContent>
      </Card>
    </div>
  )
}
