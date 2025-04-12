"use client"

import * as React from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

type ChatDrawerContextType = {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
  context: string | null
  setContext: (context: string | null) => void
  openWithContext: (context: string) => void
}

const ChatDrawerContext = React.createContext<ChatDrawerContextType | undefined>(undefined)

export function useChatDrawer() {
  const context = React.useContext(ChatDrawerContext)
  if (!context) {
    throw new Error("useChatDrawer must be used within a ChatDrawerProvider")
  }
  return context
}

export function ChatDrawerProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [context, setContext] = React.useState<string | null>(null)

  const toggle = React.useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const open = React.useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  const openWithContext = React.useCallback((newContext: string) => {
    setContext(newContext)
    setIsOpen(true)
  }, [])

  const value = React.useMemo<ChatDrawerContextType>(
    () => ({ isOpen, toggle, open, close, context, setContext, openWithContext }),
    [isOpen, toggle, open, close, context, setContext, openWithContext],
  )

  return (
    <ChatDrawerContext.Provider value={value}>
      {children}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-md md:top-4 md:bottom-auto"
        onClick={toggle}
      >
        <MessageSquare className="h-5 w-5" />
        <span className="sr-only">Toggle AI Chat</span>
      </Button>
    </ChatDrawerContext.Provider>
  )
}
