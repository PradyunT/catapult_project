"use client"
import { cn } from "@/lib/utils"

// Types
type ScheduleItem = {
  id: string
  task_id: string | null
  title: string
  start_time: string
  end_time: string
  date: string
  notes: string | null
  tasks?: {
    title: string
    priority: string
    completed: boolean
  } | null
}

interface DailyScheduleProps {
  initialSchedule?: ScheduleItem[]
}

// Define the time range for the schedule (7 AM to 11 PM = 16 hours)
const START_HOUR = 7
const END_HOUR = 23
const TOTAL_HOURS = END_HOUR - START_HOUR

const timeSlots = Array.from({ length: TOTAL_HOURS }, (_, i) => {
  const hour = i + START_HOUR
  return `${hour.toString().padStart(2, "0")}:00`
})

export function DailySchedule({ initialSchedule = [] }: DailyScheduleProps) {
  const getEventPosition = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)

    // Extract hours and minutes and convert to decimal hours
    const startHour = startDate.getHours() + startDate.getMinutes() / 60
    const endHour = endDate.getHours() + endDate.getMinutes() / 60

    // Calculate position as percentage of the total schedule height
    // Clamp values to ensure they're within our display range
    const clampedStartHour = Math.max(START_HOUR, Math.min(END_HOUR, startHour))
    const clampedEndHour = Math.max(START_HOUR, Math.min(END_HOUR, endHour))

    // Calculate position and height as percentages
    const startPercentage = ((clampedStartHour - START_HOUR) / TOTAL_HOURS) * 100
    const heightPercentage = ((clampedEndHour - clampedStartHour) / TOTAL_HOURS) * 100

    // Ensure minimum height for visibility
    const finalHeight = Math.max(3, heightPercentage)

    return {
      top: `${startPercentage}%`,
      height: `${finalHeight}%`,
    }
  }

  const getEventColor = (item: ScheduleItem) => {
    // If it's linked to a task, use the task's priority
    if (item.tasks) {
      switch (item.tasks.priority) {
        case "high":
          return "bg-red-100 border-red-300 text-red-800"
        case "medium":
          return "bg-yellow-100 border-yellow-300 text-yellow-800"
        case "low":
          return "bg-green-100 border-green-300 text-green-800"
        default:
          return "bg-blue-100 border-blue-300 text-blue-800"
      }
    }

    // Otherwise, use the title to determine the type
    const title = item.title.toLowerCase()
    if (title.includes("work") || title.includes("meeting") || title.includes("project")) {
      return "bg-blue-100 border-blue-300 text-blue-800"
    } else if (title.includes("study") || title.includes("learn") || title.includes("read")) {
      return "bg-purple-100 border-purple-300 text-purple-800"
    } else if (title.includes("break") || title.includes("lunch") || title.includes("dinner")) {
      return "bg-orange-100 border-orange-300 text-orange-800"
    } else {
      return "bg-green-100 border-green-300 text-green-800"
    }
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // For debugging
  const debugTimeInfo = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const startHour = startDate.getHours() + startDate.getMinutes() / 60
    const endHour = endDate.getHours() + endDate.getMinutes() / 60
    const duration = endHour - startHour
    return `${startHour.toFixed(2)} to ${endHour.toFixed(2)} (${duration.toFixed(2)} hours)`
  }

  return (
    <div className="relative h-[600px] w-full overflow-y-auto">
      <div className="flex h-full">
        {/* Time labels */}
        <div className="w-16 flex-shrink-0 pr-2">
          {timeSlots.map((time) => (
            <div key={time} className="flex h-12 items-center justify-end text-xs text-muted-foreground">
              {time}
            </div>
          ))}
        </div>

        {/* Schedule grid */}
        <div className="relative flex-1">
          {/* Grid lines */}
          {timeSlots.map((time, index) => (
            <div
              key={time}
              className="absolute left-0 right-0 h-px bg-border"
              style={{ top: `${(index / timeSlots.length) * 100}%` }}
            />
          ))}

          {/* Events */}
          {initialSchedule.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No schedule items for today</p>
            </div>
          ) : (
            initialSchedule.map((event) => {
              const { top, height } = getEventPosition(event.start_time, event.end_time)
              return (
                <div
                  key={event.id}
                  className={cn(
                    "absolute left-1 right-1 rounded-md border p-2 text-sm overflow-hidden",
                    getEventColor(event),
                  )}
                  style={{ top, height, minHeight: "2rem" }}
                  title={debugTimeInfo(event.start_time, event.end_time)}
                >
                  <div className="font-medium truncate">{event.title}</div>
                  <div className="text-xs truncate">
                    {formatTime(event.start_time)} - {formatTime(event.end_time)}
                  </div>
                  {event.notes && <div className="mt-1 text-xs opacity-80 line-clamp-2">{event.notes}</div>}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
