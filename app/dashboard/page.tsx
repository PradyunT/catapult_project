import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ListTodo, Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { TaskList } from "@/components/task-list"
import { DailySchedule } from "@/components/daily-schedule"
import { getTasks, getTodayTasks } from "@/app/actions/task-actions"
import { getScheduleForDate } from "@/app/actions/schedule-actions"
import { SeedButton } from "@/components/seed-button"
import { checkDatabaseHasData } from "@/app/actions/db-init-actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Database } from "lucide-react"
import { checkDatabaseSeeded } from "@/app/actions/system-settings-actions"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

export default async function DashboardPage() {
  // Check if database has data
  const hasData = await checkDatabaseHasData()

  // Try to check if database has been seeded, but handle potential errors
  let isSeeded = false
  try {
    isSeeded = await checkDatabaseSeeded()
  } catch (error) {
    console.error("Error checking if database is seeded:", error)
    // Continue with isSeeded = false
  }

  // If database doesn't have data and hasn't been marked as seeded, show a message to seed the database
  if (!hasData && !isSeeded) {
    return (
      <div className="w-full">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to Sensei AI!</p>
        </div>

        <Alert className="mt-6">
          <Database className="h-4 w-4" />
          <AlertTitle>Database is empty</AlertTitle>
          <AlertDescription>
            Your database tables are set up, but there's no data yet. Click the button below to seed your database with
            sample data.
          </AlertDescription>
        </Alert>

        <div className="flex justify-center mt-6">
          <SeedButton />
        </div>
      </div>
    )
  }

  // Get data
  const today = new Date()
  const allTasks = await getTasks()
  const todayTasks = await getTodayTasks()
  const scheduleItems = await getScheduleForDate(today.toISOString().split("T")[0])

  const totalTasks = allTasks.length
  const completedTasks = todayTasks.filter(task => task.completed).length
  const pendingTasks = todayTasks.filter(task => !task.completed).length
  const completionPercentage = todayTasks.length > 0 ? (completedTasks / todayTasks.length) * 100 : 0

  return (
    <div className="w-full space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your daily overview</p>
          </div>
        </div>
        <Separator />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">All tasks in your system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTasks.length}</div>
            <p className="text-xs text-muted-foreground">Tasks scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <p className="text-xs text-muted-foreground">Tasks completed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground">Tasks remaining today</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Progress</CardTitle>
          <CardDescription>Track your task completion for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completion Rate</span>
              <span className="text-sm font-medium">{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tasks column */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Today's Tasks</CardTitle>
            <CardDescription>View and manage your tasks for today</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskList initialTasks={todayTasks} />
          </CardContent>
        </Card>

        {/* Schedule column */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Daily Schedule</CardTitle>
            <CardDescription>Your visual schedule for today</CardDescription>
          </CardHeader>
          <CardContent>
            <DailySchedule initialSchedule={scheduleItems} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
