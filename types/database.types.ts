// ============================================================================
// Database Types - Auto-generated from Supabase Schema
// ============================================================================
// This file will be auto-generated once you set up your Supabase project.
// Run: npx supabase gen types typescript --project-id <your-project-id> > types/database.types.ts
//
// For now, this is a placeholder with manual types based on our schema.
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AuditAction =
  | 'PUNCH_ADD'
  | 'PUNCH_REMOVE'
  | 'PUNCH_EDIT'
  | 'PAYMENT_ADD'
  | 'RATE_CHANGE'
  | 'CLIENT_ADD'
  | 'CLIENT_UPDATE'
  | 'CLIENT_DELETE'

export interface Database {
  public: {
    Tables: {
      trainers: {
        Row: {
          id: string
          phone: string
          pin_hash: string
          name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          phone: string
          pin_hash: string
          name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          phone?: string
          pin_hash?: string
          name?: string | null
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          trainer_id: string
          name: string
          phone: string | null
          current_rate: number
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trainer_id: string
          name: string
          phone?: string | null
          current_rate: number
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trainer_id?: string
          name?: string
          phone?: string | null
          current_rate?: number
          balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      punches: {
        Row: {
          id: string
          client_id: string
          punch_date: string
          created_at: string
          is_deleted: boolean
        }
        Insert: {
          id?: string
          client_id: string
          punch_date: string
          created_at?: string
          is_deleted?: boolean
        }
        Update: {
          id?: string
          client_id?: string
          punch_date?: string
          created_at?: string
          is_deleted?: boolean
        }
      }
      payments: {
        Row: {
          id: string
          client_id: string
          amount: number
          classes_added: number
          rate_at_payment: number
          payment_date: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          amount: number
          classes_added: number
          rate_at_payment: number
          payment_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          amount?: number
          classes_added?: number
          rate_at_payment?: number
          payment_date?: string
          created_at?: string
        }
      }
      rate_history: {
        Row: {
          id: string
          client_id: string
          rate: number
          effective_date: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          rate: number
          effective_date: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          rate?: number
          effective_date?: string
          created_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          client_id: string | null
          trainer_id: string
          action: AuditAction
          details: Json | null
          previous_balance: number | null
          new_balance: number | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          trainer_id: string
          action: AuditAction
          details?: Json | null
          previous_balance?: number | null
          new_balance?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          trainer_id?: string
          action?: AuditAction
          details?: Json | null
          previous_balance?: number | null
          new_balance?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      audit_action: AuditAction
    }
  }
}
