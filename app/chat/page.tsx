"use client"

import * as React from "react"
import { SidebarTrigger } from "@/components/sidebar-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Brain, ListTodo, RefreshCw, Send } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ChatPage() {
  const [messages, setMessages] = React.useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hello! I'm your AI mentor. How can I help you today?" },
  ])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Add user message
    const userMessage = { role: "user" as const, content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm a placeholder response. In the full implementation, I would use the Gemini 2.0 Flash model to generate a proper response based on your message.",
        },
      ])
      setIsLoading(false)
    }, 1000)
  }

  const handleBreakdownGoals = () => {
    setMessages((prev) => [...prev, { role: "user", content: "Can you help me break down my goals?" }])
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'd be happy to help you break down your goals! What specific goal would you like to work on? For example, you could say something like 'I want to work at Microsoft in 2 years' or 'I want to learn web development', and I'll help you create a step-by-step plan with actionable tasks.",
        },
      ])
      setIsLoading(false)
    }, 1000)
  }

  const handleDailyOverview = () => {
    setMessages((prev) => [...prev, { role: "user", content: "Generate a daily overview for me." }])
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `# Daily Overview

Based on your tasks and schedule, here's what you need to focus on today:

## High Priority Tasks
- Complete project proposal (due today at 5:00 PM)
- Study for exam (due tomorrow)

## Schedule
- 9:00 AM - 10:00 AM: Team Meeting
- 10:30 AM - 12:00 PM: Project Work
- 2:00 PM - 4:00 PM: Study Session

## Resources Used
- Your task list
- Your calendar
- Your study materials

Would you like me to help you prioritize these tasks or suggest a study plan?`,
        },
      ])
      setIsLoading(false)
    }, 1500)
  }

  // Scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">AI Mentor</h1>
          <p className="text-muted-foreground">Chat with your personal AI mentor.</p>
        </div>
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-3">
          <Card className="flex h-[calc(100vh-12rem)] flex-col">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-lg font-medium">Chat with Sensei AI</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col space-y-4">
                {messages.map((message, index) => (
                  <div key={index} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 max-w-[80%]",
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-muted px-3 py-2">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground delay-75"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground delay-150"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-2">
              <form onSubmit={handleSubmit} className="flex w-full space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm font-medium">AI Actions</CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-2">
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleBreakdownGoals}
                  disabled={isLoading}
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Break Down Goals
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleDailyOverview}
                  disabled={isLoading}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate Daily Overview
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled={isLoading}>
                  <ListTodo className="mr-2 h-4 w-4" />
                  Suggest Tasks
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
