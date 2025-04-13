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
import Link from "next/link" // Import Link

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Jarvis",
  description: "Your personal AI mentor and productivity assistant",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
              <div className="flex min-h-screen min-w-[99vw]">
                <AppSidebar />
                <main className="flex-1 overflow-auto mx-auto">
                  <div className="sticky top-0 z-10 flex items-center h-16 px-4 border-b bg-background">
                    <SidebarTrigger className="mr-4" />
                    {/* Change the text to a clickable button linking to /dashboard */}
                    <Link
                      href="http://localhost:3000/dashboard"
                      className="font-semibold cursor-pointer hover:underline"
                    >
                      Sensei AI
                    </Link>
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
