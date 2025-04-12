"use client"

import * as React from "react"
import { Clock, Filter, MoreHorizontal, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { createTask, toggleTaskCompletion, deleteTask } from "@/app/actions/task-actions"
import { toast } from "@/components/ui/use-toast"

// Types
type Task = {
  id: string
  title: string
  description: string | null
  due_date: string
  repeated: boolean
  completed: boolean
  category: string | null
  priority: string
  space_id: string | null
  spaces?: {
    title: string
    color: string | null
  } | null
}

type SortOption = "priority" | "dueDate" | "space"
type FilterOption = "all" | "completed" | "pending" | string

interface TaskListProps {
  initialTasks?: Task[]
}

export function TaskList({ initialTasks = [] }: TaskListProps) {
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks)
  const [sortBy, setSortBy] = React.useState<SortOption>("dueDate")
  const [filterBy, setFilterBy] = React.useState<FilterOption>("all")
  const [newTaskTitle, setNewTaskTitle] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Update local state when initialTasks changes
  React.useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  const handleToggleComplete = async (taskId: string, currentStatus: boolean) => {
    // Optimistic update
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed: !currentStatus } : task)))

    try {
      await toggleTaskCompletion(taskId, !currentStatus)
    } catch (error) {
      // Revert on error
      setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed: currentStatus } : task)))
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      })
    }
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      const newTask = {
        title: newTaskTitle,
        description: "",
        due_date: new Date().toISOString(),
        priority: "medium",
      }

      const createdTask = await createTask(newTask)

      if (createdTask) {
        setTasks([...tasks, createdTask])
        setNewTaskTitle("")
        toast({
          title: "Task created",
          description: "Your task has been created successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    // Optimistic update
    const taskToDelete = tasks.find((task) => task.id === taskId)
    const updatedTasks = tasks.filter((task) => task.id !== taskId)
    setTasks(updatedTasks)

    try {
      const success = await deleteTask(taskId)

      if (!success) {
        throw new Error("Failed to delete task")
      }

      toast({
        title: "Task deleted",
        description: "Your task has been deleted successfully",
      })
    } catch (error) {
      // Revert on error
      if (taskToDelete) {
        setTasks([...updatedTasks, taskToDelete])
      }

      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      })
    }
  }

  const sortedAndFilteredTasks = React.useMemo(() => {
    let filteredTasks = [...tasks]

    // Apply filters
    if (filterBy === "completed") {
      filteredTasks = filteredTasks.filter((task) => task.completed)
    } else if (filterBy === "pending") {
      filteredTasks = filteredTasks.filter((task) => !task.completed)
    } else if (filterBy !== "all") {
      // Filter by space
      filteredTasks = filteredTasks.filter((task) => task.space_id === filterBy)
    }

    // Apply sorting
    return filteredTasks.sort((a, b) => {
      if (sortBy === "priority") {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return (
          priorityOrder[a.priority as keyof typeof priorityOrder] -
          priorityOrder[b.priority as keyof typeof priorityOrder]
        )
      } else if (sortBy === "dueDate") {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      } else if (sortBy === "space") {
        return (a.spaces?.title || "").localeCompare(b.spaces?.title || "")
      }
      return 0
    })
  }, [tasks, sortBy, filterBy])

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setFilterBy("all")}>All Tasks</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBy("pending")}>Pending</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBy("completed")}>Completed</DropdownMenuItem>
              {tasks.some((task) => task.spaces?.title === "Work") && (
                <DropdownMenuItem onClick={() => setFilterBy("work")}>Work Space</DropdownMenuItem>
              )}
              {tasks.some((task) => task.spaces?.title === "Study") && (
                <DropdownMenuItem onClick={() => setFilterBy("study")}>Study Space</DropdownMenuItem>
              )}
              {tasks.some((task) => task.spaces?.title === "Personal") && (
                <DropdownMenuItem onClick={() => setFilterBy("personal")}>Personal Space</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Clock className="mr-2 h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setSortBy("dueDate")}>Due Date</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("priority")}>Priority</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("space")}>Space</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <form onSubmit={handleAddTask} className="flex items-center space-x-2">
        <Input
          placeholder="Add a new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="flex-1"
          disabled={isSubmitting}
        />
        <Button type="submit" size="sm" disabled={isSubmitting || !newTaskTitle.trim()}>
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add task</span>
        </Button>
      </form>

      <div className="space-y-2">
        {sortedAndFilteredTasks.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">No tasks found</p>
          </div>
        ) : (
          sortedAndFilteredTasks.map((task) => (
            <div
              key={task.id}
              className={cn("flex items-start justify-between rounded-lg border p-3", task.completed && "bg-muted/50")}
            >
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => handleToggleComplete(task.id, task.completed)}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <div className="flex items-center">
                    <p className={cn("font-medium", task.completed && "line-through text-muted-foreground")}>
                      {task.title}
                    </p>
                    <div className={cn("ml-2 h-2 w-2 rounded-full", getPriorityColor(task.priority))} />
                  </div>
                  {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                  <div className="flex items-center space-x-2">
                    {task.spaces && (
                      <Badge variant="outline" className="text-xs">
                        {task.spaces.title}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{formatDueDate(task.due_date)}</span>
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteTask(task.id)}>Delete</DropdownMenuItem>
                  <DropdownMenuItem>Move to Space</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
