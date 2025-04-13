"use client"

import { Brain, CheckSquare, Calendar, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"

// Define props for the component
interface FeaturesSectionProps {
  onSignUpClick: () => void // Function to handle the click
}

// Accept the onSignUpClick prop
export function FeaturesSection({ onSignUpClick }: FeaturesSectionProps) {
  return (
    <section id="features" className="py-16 md:py-24 bg-muted/50">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Features</div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              Everything you need to stay organized
            </h2>
            <p className="max-w-[900px] mx-auto text-muted-foreground md:text-xl/relaxed">
              Jarvis combines powerful organization tools with AI assistance to help you manage your life and achieve
              your goals.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:gap-12">
          <div className="flex flex-col gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">AI Mentor Chat</h3>
            <p className="text-muted-foreground">
              Get personalized guidance and daily overviews from an AI assistant that learns your preferences and habits
              to provide meaningful advice tailored to your needs.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <CheckSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Smart To-Do & Spaces</h3>
            <p className="text-muted-foreground">
              Organize tasks by priority, due date, or space. Create custom workspaces for different areas of your life
              to keep everything neatly categorized.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Schedule & Goal Tracking</h3>
            <p className="text-muted-foreground">
              Visual planner that combines your daily schedule with goal tracking. Set meaningful goals, break them into
              milestones, and track your progress alongside your daily activities.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Integrations</h3>
            <p className="text-muted-foreground">
              Connect Brightspace, Outlook, Google Calendar, and more. Bring all your productivity tools into one
              seamless experience for maximum efficiency.
            </p>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="flex flex-col items-center space-y-6 rounded-xl bg-muted p-6 sm:p-8 md:p-10 max-w-3xl">
            <div className="text-center">
              <h3 className="text-2xl font-bold sm:text-3xl mb-2">Ready to transform your productivity?</h3>
              <p className="text-muted-foreground text-lg">
                Join thousands of students and professionals already using Jarvis to organize their lives and achieve
                their goals.
              </p>
            </div>
            <Button
              size="lg"
              className="bg-primary text-primary-foreground px-8 py-6 text-base"
              onClick={onSignUpClick}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
