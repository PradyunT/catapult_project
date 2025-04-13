import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="py-12 md:py-24 lg:py-32 xl:py-36">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_600px] lg:gap-12 xl:grid-cols-[1fr_700px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">Jarvis</h1>
              <p className="text-lg font-medium text-primary md:text-xl">Your AI mentor for life organization.</p>
              <p className="max-w-[600px] text-muted-foreground md:text-lg/relaxed lg:text-base/relaxed xl:text-lg/relaxed">
                Jarvis is a productivity platform that brings together your tasks, calendar, and goals—with help from an
                AI mentor who guides you to achieve what matters most in your life.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button size="lg" className="bg-primary text-primary-foreground">
                Sign Up
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            {/* Placeholder for dashboard image */}
            <div className="w-full h-[400px] flex items-center justify-center bg-gray-100 dark:bg-zinc-900 rounded-xl border">
              <div className="text-center p-8">
                <p className="text-muted-foreground mb-2">Dashboard Preview</p>
                <p className="text-sm text-muted-foreground">Add your image here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
