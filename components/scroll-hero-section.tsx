"use client"
import { ContainerScroll } from "@/components/ui/container-scroll-animation"

export function ScrollHeroSection() {
  return (
    <div className="flex flex-col items-center">
      {/* Title, tagline, and description at the top */}
      <div className="w-full flex flex-col items-center text-center pt-24 pb-8 px-4">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4">Jarvis</h1>
        <p className="text-xl md:text-2xl font-medium text-primary mb-4">Your AI mentor for life organization.</p>
        <p className="max-w-[700px] text-muted-foreground text-lg md:text-xl">
          Jarvis is a productivity platform that brings together your tasks, calendar, and goals—with help from an AI
          mentor who guides you to achieve what matters most in your life.
        </p>
      </div>

      {/* Scroll animation container with placeholder for image */}
      <div className="w-full">
        <ContainerScroll titleComponent={<></>}>
          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-zinc-900 rounded-xl">
            <div className="text-center p-8">
              <p className="text-muted-foreground mb-2">Dashboard Preview</p>
              <p className="text-sm text-muted-foreground">Add your image here</p>
            </div>
          </div>
        </ContainerScroll>
      </div>
    </div>
  )
}
