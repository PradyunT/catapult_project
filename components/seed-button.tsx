"use client"

import { Button } from "@/components/ui/button"
import { seedDatabase } from "@/app/actions/seed-actions"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function SeedButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSeed = async () => {
    setIsLoading(true)
    try {
      const result = await seedDatabase()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        // Refresh the page to show the new data
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to seed database: " + String(error),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSeed} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Seeding...
        </>
      ) : (
        "Seed Database"
      )}
    </Button>
  )
}
