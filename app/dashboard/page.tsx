import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ListTodo } from "lucide-react"
import { TaskList } from "@/components/task-list"
import { DailySchedule } from "@/components/daily-schedule"
import { getTasks, getTodayTasks } from "@/app/actions/task-actions"
import { getScheduleForDate } from "@/app/actions/schedule-actions"
import { SeedButton } from "@/components/seed-button"
import { checkDatabaseHasData } from "@/app/actions/db-init-actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Database } from "lucide-react"
import { checkDatabaseSeeded } from "@/app/actions/system-settings-actions"

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
  const today = new Date().toISOString().split("T")[0]
  const allTasks = await getTasks()
  const todayTasks = await getTodayTasks()
  const scheduleItems = await getScheduleForDate(today)

  const totalTasks = allTasks.length

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your day.</p>
        </div>
      </div>

      {/* Single card for Total Tasks */}
      <Card className="max-w-xs mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <ListTodo className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTasks}</div>
        </CardContent>
      </Card>

      {/* Two-column layout for tasks and schedule */}
      <div className="grid gap-6 md:grid-cols-2 w-full mt-6">
        {/* Tasks column */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Today's Tasks</CardTitle>
            <CardDescription>View and manage your tasks for today.</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskList initialTasks={todayTasks} />
          </CardContent>
        </Card>

        {/* Schedule column */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Daily Schedule</CardTitle>
            <CardDescription>Your visual schedule for today.</CardDescription>
          </CardHeader>
          <CardContent>
            <DailySchedule initialSchedule={scheduleItems} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
