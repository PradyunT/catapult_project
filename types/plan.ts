// types/plan.ts
export interface SuggestedTask {
  title: string; // Added title
  description: string;
  due_date: string;
  status: "pending" | "accepted" | "rejected";
  id: string; // Temp frontend ID
}

export interface PlanResponse {
  goal: string;
  tasks: {
    title: string; // Added title
    description: string;
    due_date: string;
  }[];
}

export interface SuggestedPlan {
  goal: string;
  tasks: SuggestedTask[];
}
