"use client";

import * as React from "react";
import { X, Send, Loader2 } from "lucide-react";
import { useChatDrawer } from "@/components/chat-drawer-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useChat } from "ai/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatDrawer() {
  const { isOpen, close, context } = useChatDrawer();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // --- Use useChat Hook ---
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages,
    append,
  } = useChat({
    api: "/api/chat", // Point this to your chat API route
  });

  // --- Effect to set initial message based on context ---
  React.useEffect(() => {
    if (context && messages.length === 0) {
      setMessages([
        {
          id: `initial-context-${context}`,
          role: "assistant",
          content: `Hello! How can I help you with the "${context}" space today?`,
        },
      ]);
    } else if (!context && messages.length === 0) {
      setMessages([
        {
          id: "initial-default",
          role: "assistant",
          content: "Hello! How can I help?",
        },
      ]);
    }
  }, [context, messages.length, setMessages]);

  // --- Effect to scroll to bottom on messages change ---
  React.useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // --- Modified handleSubmit to pass extra "options" if needed ---
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    /**
     * Optionally, you can pass extra body data to your server if your
     * useChat config supports it. For example:
     *
     * handleSubmit(e, {
     *   options: {
     *     body: {
     *       prompt: "You are a specialized agent..."
     *     }
     *   }
     * });
     *
     * The crucial part is that `useChat`/`ai/react` must accept an `options`
     * param in the handleSubmit signature. If not, you can just call handleSubmit(e).
     */

    handleSubmit(e, {
      options: {
        body: {
          // Give it a property name like "prompt" or "systemPrompt"
          systemPrompt:
          "You are a AI assistant to help people organize. Answer the first question with \"I am Jarvis, your personal AI \"",
        },
      },
    });
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-40 w-full max-w-xs transform border-l bg-background shadow-xl transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <Card className="flex h-full flex-col rounded-none border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-medium">AI Assistant</CardTitle>
            {context && (
              <Badge variant="secondary" className="text-xs">
                {context}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={close}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </CardHeader>
        <ScrollArea className="flex-1">
          <CardContent className="p-4">
            <div className="flex flex-col space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex text-sm", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-md px-2.5 py-1.5",
                      "max-w-[90%]",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {/* Render assistant messages with markdown */}
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-md bg-muted px-2.5 py-1.5">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-start">
                  <div className="rounded-md border border-destructive bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
                    Error: {error.message || "Failed to get response."}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </ScrollArea>
        <CardFooter className="border-t p-3">
          <form onSubmit={handleFormSubmit} className="flex w-full space-x-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask anything..."
              disabled={isLoading}
              className="flex-1 h-9 text-sm"
            />
            <Button
              type="submit"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
