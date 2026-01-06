export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          trainer_id: string
          name: string
          phone: string | null
          current_rate: number
          balance: number
          credit_balance: number
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
          credit_balance?: number
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
          credit_balance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "punches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "rate_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_log: {
        Row: {
          id: string
          client_id: string | null
          trainer_id: string
          action: Database["public"]["Enums"]["audit_action"]
          details: Json | null
          previous_balance: number | null
          new_balance: number | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          trainer_id: string
          action: Database["public"]["Enums"]["audit_action"]
          details?: Json | null
          previous_balance?: number | null
          new_balance?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          trainer_id?: string
          action?: Database["public"]["Enums"]["audit_action"]
          details?: Json | null
          previous_balance?: number | null
          new_balance?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      audit_action:
        | "PUNCH_ADD"
        | "PUNCH_REMOVE"
        | "PUNCH_EDIT"
        | "PAYMENT_ADD"
        | "RATE_CHANGE"
        | "CLIENT_ADD"
        | "CLIENT_UPDATE"
        | "CLIENT_DELETE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never
