import { ScrollHeroSection } from "@/components/scroll-hero-section"
import { FeaturesSection } from "@/components/features-section"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl">Jarvis</span>
          </div>
          <div className="flex items-center gap-4">

            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" size="sm">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <ScrollHeroSection />
        <div id="features">
          <FeaturesSection />
        </div>
      </main>
    </div>
  )
}
