// app/chat/page.tsx
"use client";

import { batchCreateTasks } from "@/app/actions/task-actions";
import * as React from "react";
import { useChat } from "ai/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SidebarTrigger } from "@/components/sidebar-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Brain, ListTodo, RefreshCw, Send, Check, X, CheckCheck, XSquare, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { SuggestedTasksCard } from "@/components/suggested-tasks-card";
import type { SuggestedPlan, PlanResponse, SuggestedTask } from "@/types/plan";

export default function ChatPage() {
  // Chat state
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: handleChatSubmit,
    isLoading: isChatLoading,
    append,
  } = useChat({
    api: "/api/chat", // Your general chat API endpoint
    initialMessages: [
      { id: "initial-greeting", role: "assistant", content: "Hello! I'm your AI mentor. How can I help you today?" },
    ],
  });

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Plan Generation State
  const [isPlanDialogOpen, setIsPlanDialogOpen] = React.useState(false);
  const [goalInput, setGoalInput] = React.useState("");
  const [suggestedPlan, setSuggestedPlan] = React.useState<SuggestedPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = React.useState(false);
  const [planError, setPlanError] = React.useState<string | null>(null);
  const [isSavingTasks, setIsSavingTasks] = React.useState(false);

  // Scroll effect
  React.useEffect(() => {
    // Attempt to scroll only if the ref is attached
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [messages, suggestedPlan]); // Re-run when messages OR plan visibility changes

  // --- Handlers ---
  const handleDailyOverview = () => {
    if (isChatLoading) return;
    append({ role: "user", content: "Generate a daily overview for me based on my tasks." });
  };

  const handleSuggestTasks = () => {
    if (isChatLoading) return;
    append({ role: "user", content: "Can you suggest some relevant tasks based on my current tasks or spaces?" });
  };

  const handleGeneratePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim() || isGeneratingPlan) return;

    setIsGeneratingPlan(true);
    setPlanError(null);
    setSuggestedPlan(null);

    try {
      const response = await fetch("/api/generate-plan", {
        // Calls the dedicated plan generation endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goalInput }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response." })); // Graceful handling if error isn't JSON
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      const planData: PlanResponse = await response.json();

      if (!planData || !Array.isArray(planData.tasks)) {
        throw new Error("Received invalid data format from API.");
      }

      const planToSet: SuggestedPlan = {
        goal: planData.goal,
        tasks: planData.tasks.map((task, index) => ({
          ...task, // Includes title and description from API
          status: "pending",
          id: `task-${Date.now()}-${index}`,
        })),
      };
      setSuggestedPlan(planToSet);
      setIsPlanDialogOpen(false);
      setGoalInput("");
      toast({ title: "Plan generated successfully!", description: "Review the suggested tasks below." });
    } catch (error: any) {
      console.error("Failed to generate plan:", error);
      setPlanError(error.message || "An unknown error occurred.");
      toast({ title: "Failed to generate plan", description: error.message || "Please try again.", variant: "destructive" });
      setSuggestedPlan(null);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const updateTaskStatus = (taskId: string, status: "accepted" | "rejected") => {
    setSuggestedPlan((prevPlan) => {
      if (!prevPlan) return null;
      return {
        ...prevPlan,
        tasks: prevPlan.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
      };
    });
  };

  const handleAcceptAll = () => {
    setSuggestedPlan((prevPlan) => {
      if (!prevPlan) return null;
      return {
        ...prevPlan,
        tasks: prevPlan.tasks.map((task) => (task.status === "pending" ? { ...task, status: "accepted" } : task)),
      };
    });
  };

  const handleRejectAll = () => {
    setSuggestedPlan((prevPlan) => {
      if (!prevPlan) return null;
      return {
        ...prevPlan,
        tasks: prevPlan.tasks.map((task) => (task.status === "pending" ? { ...task, status: "rejected" } : task)),
      };
    });
  };

  const handleSaveAcceptedTasks = async () => {
    if (!suggestedPlan) return;
    setIsSavingTasks(true);

    // Updated Mapping: Include title
    const acceptedTasksToSave = suggestedPlan.tasks
      .filter((task) => task.status === "accepted")
      .map((task) => ({
        title: task.title, // Pass the title
        description: task.description,
        due_date: task.due_date,
      }));

    if (acceptedTasksToSave.length === 0) {
      toast({ title: "No tasks accepted", description: "Please accept tasks before saving.", variant: "default" });
      setIsSavingTasks(false);
      return;
    }

    // Call the Server Action
    const result = await batchCreateTasks(acceptedTasksToSave);

    if (result.success) {
      toast({
        title: "Tasks Saved Successfully!",
        description: `${result.count ?? acceptedTasksToSave.length} tasks added to your list.`,
      });
      setSuggestedPlan(null); // Clear suggestions on success -> Switches back to chat view
    } else {
      toast({
        title: "Failed to Save Tasks",
        description: result.error || "An unknown error occurred.",
        variant: "destructive",
      });
    }

    setIsSavingTasks(false);
  };

  const countAcceptedTasks = suggestedPlan?.tasks.filter((t) => t.status === "accepted").length ?? 0;

  const handleDismissPlan = () => {
    setSuggestedPlan(null);
  }; // Switches back to chat view
  // --- End Handlers ---

  // --- JSX Return ---
  return (
    <div className="space-y-6">
      {/* Header */}
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
        {/* Main Content Area */}
        <div className="md:col-span-3">
          {/* Conditional Rendering: Plan Review OR Chat */}
          {suggestedPlan ? (
            // Render Plan Review Card
            <Card className="flex h-[calc(100vh-12rem)] flex-col">
              <SuggestedTasksCard
                plan={suggestedPlan}
                isSavingTasks={isSavingTasks}
                onUpdateStatus={updateTaskStatus}
                onAcceptAll={handleAcceptAll}
                onRejectAll={handleRejectAll}
                onSave={handleSaveAcceptedTasks}
                onDismiss={handleDismissPlan}
              />
            </Card>
          ) : (
            // Render Chat Card
            <Card className="flex h-[calc(100vh-12rem)] flex-col">
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-lg font-medium">Chat with Sensei AI</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4">
                {/* Chat messages list */}
                <div className="flex flex-col space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "prose dark:prose-invert", // For markdown styling
                          "whitespace-pre-wrap rounded-lg px-3 py-2 max-w-[80%]",
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {/* Loading indicator for chat responses */}
                  {isChatLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
                    <div className="flex justify-start">
                      <div className="rounded-lg bg-muted px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  {/* Empty div at the end for scrolling */}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
              {/* Chat input form */}
              <CardFooter className="p-4 pt-2">
                <form onSubmit={handleChatSubmit} className="flex w-full space-x-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    disabled={isChatLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isChatLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                  </Button>
                </form>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Actions Column */}
        <div className="space-y-4">
          {/* AI Actions Card */}
          <Card>
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm font-medium">AI Actions</CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-2">
              <div className="space-y-2">
                {/* Generate Plan Dialog Trigger */}
                <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start" disabled={isChatLoading || isGeneratingPlan}>
                      <Brain className="mr-2 h-4 w-4" /> Generate Plan from Goal
                    </Button>
                  </DialogTrigger>
                  {/* Generate Plan Dialog Content */}
                  <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleGeneratePlanSubmit}>
                      <DialogHeader>
                        <DialogTitle>Generate Task Plan</DialogTitle>
                        <DialogDescription>
                          Enter your goal below, and Sensei AI will generate a step-by-step task plan.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="goal" className="text-right">
                            {" "}
                            Goal{" "}
                          </Label>
                          <Input
                            id="goal"
                            value={goalInput}
                            onChange={(e) => setGoalInput(e.target.value)}
                            placeholder="e.g., Learn web development in 6 months"
                            className="col-span-3"
                            required
                            disabled={isGeneratingPlan}
                          />
                        </div>
                        {planError && <p className="text-sm text-destructive col-span-4 px-1">{planError}</p>}
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isGeneratingPlan || !goalInput.trim()}>
                          {isGeneratingPlan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Generate Plan
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                {/* Other Action Buttons */}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleDailyOverview}
                  disabled={isChatLoading || isGeneratingPlan || !!suggestedPlan}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Generate Daily Overview
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleSuggestTasks}
                  disabled={isChatLoading || isGeneratingPlan || !!suggestedPlan}>
                  <ListTodo className="mr-2 h-4 w-4" /> Suggest Tasks
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
