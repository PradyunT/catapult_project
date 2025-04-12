export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          due_date: string
          repeated: boolean
          completed: boolean
          category: string | null
          priority: string
          space_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          due_date: string
          repeated?: boolean
          completed?: boolean
          category?: string | null
          priority: string
          space_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          due_date?: string
          repeated?: boolean
          completed?: boolean
          category?: string | null
          priority?: string
          space_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      schedule: {
        Row: {
          id: string
          task_id: string | null
          title: string
          start_time: string
          end_time: string
          date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id?: string | null
          title: string
          start_time: string
          end_time: string
          date: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string | null
          title?: string
          start_time?: string
          end_time?: string
          date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      spaces: {
        Row: {
          id: string
          title: string
          description: string | null
          color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          color?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
