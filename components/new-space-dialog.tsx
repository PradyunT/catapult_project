"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface NewSpaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateSpace: (data: { title: string; description: string; color: string }) => void
}

const colorOptions = [
  { value: "bg-red-500", label: "Red", textColor: "text-red-500" },
  { value: "bg-blue-500", label: "Blue", textColor: "text-blue-500" },
  { value: "bg-green-500", label: "Green", textColor: "text-green-500" },
  { value: "bg-yellow-500", label: "Yellow", textColor: "text-yellow-500" },
  { value: "bg-purple-500", label: "Purple", textColor: "text-purple-500" },
  { value: "bg-pink-500", label: "Pink", textColor: "text-pink-500" },
  { value: "bg-indigo-500", label: "Indigo", textColor: "text-indigo-500" },
  { value: "bg-orange-500", label: "Orange", textColor: "text-orange-500" },
]

export function NewSpaceDialog({ open, onOpenChange, onCreateSpace }: NewSpaceDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("bg-blue-500")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ title?: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const newErrors: { title?: string } = {}
    if (!title.trim()) {
      newErrors.title = "Title is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      await onCreateSpace({ title, description, color })
      resetForm()
    } catch (error) {
      console.error("Error in form submission:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setColor("bg-blue-500")
    setErrors({})
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Space</DialogTitle>
            <DialogDescription>
              Create a new space to organize your tasks. Give it a name, description, and color.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="flex items-center justify-between">
                Title
                {errors.title && <span className="text-xs text-red-500">{errors.title}</span>}
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (e.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, title: undefined }))
                  }
                }}
                placeholder="Work, Personal, Study..."
                className={errors.title ? "border-red-500" : ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tasks related to..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <RadioGroup value={color} onValueChange={setColor} className="grid grid-cols-4 gap-2">
                {colorOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                    <Label
                      htmlFor={option.value}
                      className={`flex items-center justify-center w-full p-2 border rounded-md cursor-pointer hover:bg-accent ${
                        color === option.value ? "border-primary" : "border-input"
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`h-4 w-4 rounded-full ${option.value} mr-2`} />
                        <span className="text-xs">{option.label}</span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Space"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
