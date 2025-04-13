"use client";

import * as React from "react";
import { useChat } from "ai/react";
import ReactMarkdown from "react-markdown"; // Import the component
import remarkGfm from "remark-gfm"; // Import the GFM plugin
import { SidebarTrigger } from "@/components/sidebar-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Brain, ListTodo, RefreshCw, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: "/api/chat",
    initialMessages: [
      { id: "initial-greeting", role: "assistant", content: "Hello! I'm your AI mentor. How can I help you today?" },
    ],
  });

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Handlers for AI Action Buttons ---
  const handleBreakdownGoals = () => {
    if (isLoading) return;
    append({ role: "user", content: "Can you help me break down my goals?" });
  };

  const handleDailyOverview = () => {
    if (isLoading) return;
    append({ role: "user", content: "Generate a daily overview for me based on my tasks." });
  };

  const handleSuggestTasks = () => {
    if (isLoading) return;
    append({ role: "user", content: "Can you suggest some relevant tasks based on my current tasks or spaces?" });
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
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
        {/* Chat Interface Column */}
        <div className="md:col-span-3">
          <Card className="flex h-[calc(100vh-12rem)] flex-col">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-lg font-medium">Chat with Sensei AI</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        // Keep styling for the bubble itself
                        "prose dark:prose-invert", // Add prose for basic markdown styling (optional but helpful)
                        "whitespace-pre-wrap rounded-lg px-3 py-2 max-w-[80%]",
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                      {/* Use ReactMarkdown to render the content */}
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
                {/* Loading indicator */}
                {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-muted px-3 py-2">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.1s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            {/* Footer / Input section */}
            <CardFooter className="p-4 pt-2">
              <form onSubmit={handleSubmit} className="flex w-full space-x-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
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

        {/* AI Actions Column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm font-medium">AI Actions</CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-2">
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleBreakdownGoals} disabled={isLoading}>
                  <Brain className="mr-2 h-4 w-4" />
                  Break Down Goals
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleDailyOverview} disabled={isLoading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Create Daily Overview
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleSuggestTasks} disabled={isLoading}>
                  <ListTodo className="mr-2 h-4 w-4" />
                  Suggest Tasks
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
