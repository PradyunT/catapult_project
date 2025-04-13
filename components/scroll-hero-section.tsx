"use client"
import { ContainerScroll } from "@/components/ui/container-scroll-animation"

export function ScrollHeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      {/* Title, tagline, and description at the top */}
      <div className="container flex flex-col items-center text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Jarvis</h1>
        <p className="text-xl font-medium text-primary">Your AI mentor for life organization.</p>
        <p className="max-w-[600px] text-muted-foreground md:text-lg/relaxed lg:text-base/relaxed xl:text-lg/relaxed">
          Jarvis is a productivity platform that brings together your tasks, calendar, and goals—with help from an AI
          mentor who guides you to achieve what matters most in your life.
        </p>
      </div>

      {/* Scroll animation container with placeholder for image */}
      <div className="w-full mt-8">
        <ContainerScroll titleComponent={<></>}>
          <div className="w-full h-full flex items-center justify-center bg-muted rounded-xl">
            <div className="text-center p-8">
              <p className="text-muted-foreground mb-2">Dashboard Preview</p>
              <p className="text-sm text-muted-foreground">Add your image here</p>
            </div>
          </div>
        </ContainerScroll>
      </div>
    </section>
  )
}
