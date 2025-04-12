"use client"

import * as React from "react"
import { X } from "lucide-react"
import { useChatDrawer } from "@/components/chat-drawer-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function ChatDrawer() {
  const { isOpen, close, context } = useChatDrawer()
  const [messages, setMessages] = React.useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hello! I'm your AI assistant. How can I help you today?" },
  ])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // Update initial message when context changes
  React.useEffect(() => {
    if (context) {
      setMessages([
        {
          role: "assistant",
          content: `Hello! I'm your AI assistant for the ${context} space. How can I help you with your ${context.toLowerCase()} tasks today?`,
        },
      ])
    }
  }, [context])

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
          content: `I'm a placeholder response${context ? ` for your ${context} space` : ""}. In the full implementation, I would use the AI SDK to generate a proper response.`,
        },
      ])
      setIsLoading(false)
    }, 1000)
  }

  // Scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-40 w-full max-w-xs transform bg-background shadow-xl transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
    >
      <Card className="flex h-full flex-col rounded-none border-l">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-medium">AI Assistant</CardTitle>
            {context && (
              <Badge variant="outline" className="ml-2">
                Context: {context}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={close}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
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
            <Button type="submit" size="sm" disabled={isLoading || !input.trim()}>
              Send
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
