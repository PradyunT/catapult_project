'use client'

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { format, addDays, isToday } from "date-fns"
import { useRouter } from "next/navigation"

interface DateNavigationProps {
  currentDate: Date
}

export function DateNavigation({ currentDate }: DateNavigationProps) {
  const router = useRouter()

  const handleDateChange = (date: Date) => {
    router.push(`/dashboard?date=${date.toISOString().split('T')[0]}`)
  }

  return (
    <div className="flex items-center space-x-2">
      <Button 
        variant="outline" 
        size="icon"
        className="h-8 w-8"
        onClick={() => handleDateChange(addDays(currentDate, -1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center space-x-2 px-2 py-1 rounded-md border">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {format(currentDate, "MMM d, yyyy")}
        </span>
      </div>

      <Button 
        variant="outline" 
        size="icon"
        className="h-8 w-8"
        onClick={() => handleDateChange(addDays(currentDate, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isToday(currentDate) && (
        <Button 
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => router.push('/dashboard')}
        >
          Today
        </Button>
      )}
    </div>
  )
} 