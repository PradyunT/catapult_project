import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/sidebar-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { ChatDrawerProvider } from "@/components/chat-drawer-provider"
import { ChatDrawer } from "@/components/chat-drawer"
import { Toaster } from "@/components/ui/toaster"
import { SidebarTrigger } from "@/components/sidebar-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sensei AI",
  description: "Your personal AI mentor and productivity assistant",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="sensei-theme"
        >
          <SidebarProvider defaultOpen={false}>
            <ChatDrawerProvider>
              <div className="flex min-h-screen min-w-[90vw]">
                <AppSidebar />
                <main className="flex-1 overflow-auto">
                  <div className="sticky top-0 z-10 flex items-center h-16 px-4 border-b bg-background">
                    <SidebarTrigger className="mr-4" />
                    <div className="font-semibold">Sensei AI</div>
                  </div>
                  <div className="p-4 w-full">{children}</div>
                </main>
                <ChatDrawer />
              </div>
              <Toaster />
            </ChatDrawerProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'