// components/ui/suggested-tasks-card.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { X, CheckCheck, XSquare, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SuggestedPlan, SuggestedTask } from "@/types/plan"; // Import shared types

// Component props interface
interface SuggestedTasksCardProps {
  plan: SuggestedPlan;
  isSavingTasks: boolean;
  onUpdateStatus: (taskId: string, status: "accepted" | "rejected") => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSave: () => void;
  onDismiss: () => void;
}

// Export the component
export function SuggestedTasksCard({
  plan,
  isSavingTasks,
  onUpdateStatus,
  onAcceptAll,
  onRejectAll,
  onSave,
  onDismiss,
}: SuggestedTasksCardProps) {
  const countAcceptedTasks = plan.tasks.filter((t) => t.status === "accepted").length ?? 0;

  // Returns the JSX for the card's content structure
  return (
    <>
      <CardHeader className="px-4 py-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">Suggested Plan for: "{plan.goal}"</CardTitle>
          <Button variant="ghost" size="sm" onClick={onDismiss} disabled={isSavingTasks}>
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss Plan</span>
          </Button>
        </div>
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={onAcceptAll} disabled={isSavingTasks}>
            <CheckCheck className="mr-1 h-4 w-4" /> Accept All Pending
          </Button>
          <Button size="sm" variant="outline" onClick={onRejectAll} disabled={isSavingTasks}>
            <XSquare className="mr-1 h-4 w-4" /> Reject All Pending
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-4 py-2 max-h-[calc(100vh-18rem)] overflow-y-auto">
        {" "}
        {/* Adjusted height calculation */}
        <ul className="space-y-2">
          {plan.tasks.map((task) => (
            <li
              key={task.id}
              className={cn(
                "flex items-center justify-between p-2 rounded border bg-background/50 dark:bg-background/20",
                task.status === "accepted" && "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700",
                task.status === "rejected" && "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 opacity-60"
              )}>
              <div className="text-sm">
                <p className={cn(task.status === "rejected" && "line-through")}>{task.description}</p>
                <p className="text-xs text-muted-foreground">Due: {task.due_date}</p>
              </div>
              {task.status === "pending" && (
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/50"
                    onClick={() => onUpdateStatus(task.id, "accepted")}
                    disabled={isSavingTasks}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50"
                    onClick={() => onUpdateStatus(task.id, "rejected")}
                    disabled={isSavingTasks}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {task.status === "accepted" && <Check className="h-5 w-5 text-green-600 ml-2" />}
              {task.status === "rejected" && <X className="h-5 w-5 text-red-600 ml-2" />}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="px-4 py-3 flex justify-end bg-muted/50">
        <Button onClick={onSave} disabled={isSavingTasks || countAcceptedTasks === 0} size="sm">
          {isSavingTasks && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save {countAcceptedTasks} Accepted Tasks
        </Button>
      </CardFooter>
    </>
  );
}
