export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academy_progress: {
        Row: {
          done: boolean
          id: string
          step_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          done?: boolean
          id?: string
          step_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          done?: boolean
          id?: string
          step_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "sim_users"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_steps: {
        Row: {
          active: boolean
          created_at: string
          id: string
          is_failing: boolean
          label: string
          order: number
          step_id: string
          sub: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          is_failing?: boolean
          label: string
          order: number
          step_id: string
          sub?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          is_failing?: boolean
          label?: string
          order?: number
          step_id?: string
          sub?: string
          updated_at?: string
        }
        Relationships: []
      }
      cohort_config: {
        Row: {
          active: boolean
          created_at: string
          id: string
          max_day: number
          min_day: number
          name: Database["public"]["Enums"]["cohort_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          max_day: number
          min_day: number
          name: Database["public"]["Enums"]["cohort_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          max_day?: number
          min_day?: number
          name?: Database["public"]["Enums"]["cohort_type"]
          updated_at?: string
        }
        Relationships: []
      }
      experiment_config: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      intervention_rules: {
        Row: {
          action: Database["public"]["Enums"]["intervention_action"]
          active: boolean
          cohort: Database["public"]["Enums"]["cohort_type"]
          created_at: string
          friction: Database["public"]["Enums"]["friction_type"]
          id: string
          label: string
          updated_at: string
        }
        Insert: {
          action: Database["public"]["Enums"]["intervention_action"]
          active?: boolean
          cohort: Database["public"]["Enums"]["cohort_type"]
          created_at?: string
          friction: Database["public"]["Enums"]["friction_type"]
          id?: string
          label: string
          updated_at?: string
        }
        Update: {
          action?: Database["public"]["Enums"]["intervention_action"]
          active?: boolean
          cohort?: Database["public"]["Enums"]["cohort_type"]
          created_at?: string
          friction?: Database["public"]["Enums"]["friction_type"]
          id?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          created_at: string
          email: string
          id: string
          inviter_user_id: string
          status: Database["public"]["Enums"]["invite_status"]
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          inviter_user_id: string
          status?: Database["public"]["Enums"]["invite_status"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          inviter_user_id?: string
          status?: Database["public"]["Enums"]["invite_status"]
        }
        Relationships: [
          {
            foreignKeyName: "invites_inviter_user_id_fkey"
            columns: ["inviter_user_id"]
            isOneToOne: false
            referencedRelation: "sim_users"
            referencedColumns: ["id"]
          },
        ]
      }
      modal_events: {
        Row: {
          cohort: Database["public"]["Enums"]["cohort_type"] | null
          created_at: string
          event_type: Database["public"]["Enums"]["modal_event_type"]
          id: string
          user_id: string | null
        }
        Insert: {
          cohort?: Database["public"]["Enums"]["cohort_type"] | null
          created_at?: string
          event_type: Database["public"]["Enums"]["modal_event_type"]
          id?: string
          user_id?: string | null
        }
        Update: {
          cohort?: Database["public"]["Enums"]["cohort_type"] | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["modal_event_type"]
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      org_baselines: {
        Row: {
          activation_rate: number
          created_at: string
          id: string
          ninety_day_churn: number
          seats_per_account: number
          time_to_first_value_days: number
          updated_at: string
        }
        Insert: {
          activation_rate: number
          created_at?: string
          id?: string
          ninety_day_churn: number
          seats_per_account: number
          time_to_first_value_days: number
          updated_at?: string
        }
        Update: {
          activation_rate?: number
          created_at?: string
          id?: string
          ninety_day_churn?: number
          seats_per_account?: number
          time_to_first_value_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activated: boolean
          churned: boolean
          company: string
          created_at: string
          day_in_journey: number
          display_name: string
          id: string
          product_role: string
          seats_active: number
          surveyed: boolean
          updated_at: string
        }
        Insert: {
          activated?: boolean
          churned?: boolean
          company?: string
          created_at?: string
          day_in_journey?: number
          display_name?: string
          id: string
          product_role?: string
          seats_active?: number
          surveyed?: boolean
          updated_at?: string
        }
        Update: {
          activated?: boolean
          churned?: boolean
          company?: string
          created_at?: string
          day_in_journey?: number
          display_name?: string
          id?: string
          product_role?: string
          seats_active?: number
          surveyed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      sim_users: {
        Row: {
          activated: boolean
          churned: boolean
          company: string
          created_at: string
          day_in_journey: number
          id: string
          name: string
          role: string
          seats_active: number
          surveyed: boolean
          updated_at: string
        }
        Insert: {
          activated?: boolean
          churned?: boolean
          company: string
          created_at?: string
          day_in_journey?: number
          id: string
          name: string
          role: string
          seats_active?: number
          surveyed?: boolean
          updated_at?: string
        }
        Update: {
          activated?: boolean
          churned?: boolean
          company?: string
          created_at?: string
          day_in_journey?: number
          id?: string
          name?: string
          role?: string
          seats_active?: number
          surveyed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      survey_questions: {
        Row: {
          active: boolean
          cohort: Database["public"]["Enums"]["cohort_type"] | null
          created_at: string
          friction: Database["public"]["Enums"]["friction_type"] | null
          id: string
          options: Json
          order: number
          prompt: string
          question_type: Database["public"]["Enums"]["survey_question_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          cohort?: Database["public"]["Enums"]["cohort_type"] | null
          created_at?: string
          friction?: Database["public"]["Enums"]["friction_type"] | null
          id?: string
          options?: Json
          order: number
          prompt: string
          question_type: Database["public"]["Enums"]["survey_question_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          cohort?: Database["public"]["Enums"]["cohort_type"] | null
          created_at?: string
          friction?: Database["public"]["Enums"]["friction_type"] | null
          id?: string
          options?: Json
          order?: number
          prompt?: string
          question_type?: Database["public"]["Enums"]["survey_question_type"]
          updated_at?: string
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          cohort: Database["public"]["Enums"]["cohort_type"]
          created_at: string
          free_text: string
          friction: Database["public"]["Enums"]["friction_type"]
          id: string
          intervention: Database["public"]["Enums"]["intervention_action"]
          intervention_accepted: boolean | null
          q1: string
          q2: string
          q3: string
          user_id: string
        }
        Insert: {
          cohort: Database["public"]["Enums"]["cohort_type"]
          created_at?: string
          free_text?: string
          friction: Database["public"]["Enums"]["friction_type"]
          id?: string
          intervention: Database["public"]["Enums"]["intervention_action"]
          intervention_accepted?: boolean | null
          q1: string
          q2: string
          q3: string
          user_id: string
        }
        Update: {
          cohort?: Database["public"]["Enums"]["cohort_type"]
          created_at?: string
          free_text?: string
          friction?: Database["public"]["Enums"]["friction_type"]
          id?: string
          intervention?: Database["public"]["Enums"]["intervention_action"]
          intervention_accepted?: boolean | null
          q1?: string
          q2?: string
          q3?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "sim_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_entitlements: {
        Row: {
          created_at: string
          discount_activated_at: string | null
          id: string
          team_discount_activated: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_activated_at?: string | null
          id?: string
          team_discount_activated?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discount_activated_at?: string | null
          id?: string
          team_discount_activated?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "end_user" | "admin"
      cohort_type: "day14" | "day45"
      friction_type: "usability" | "value" | "admin"
      intervention_action:
        | "book_cs_call"
        | "unlock_team_discount"
        | "send_tutorial"
        | "send_roi_report"
        | "no_action"
      invite_status: "pending" | "accepted"
      modal_event_type: "impression" | "dismissal" | "submit"
      survey_question_type: "friction_pick" | "friction_drilldown"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["end_user", "admin"],
      cohort_type: ["day14", "day45"],
      friction_type: ["usability", "value", "admin"],
      intervention_action: [
        "book_cs_call",
        "unlock_team_discount",
        "send_tutorial",
        "send_roi_report",
        "no_action",
      ],
      invite_status: ["pending", "accepted"],
      modal_event_type: ["impression", "dismissal", "submit"],
      survey_question_type: ["friction_pick", "friction_drilldown"],
    },
  },
} as const
