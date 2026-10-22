/**
 * GENERATED – do not edit by hand. Regenerate after every migration with
 *
 *   npm run types:db
 *
 * (scripts/gen-db-types.sh: Supabase CLI over SUPABASE_DB_URL from
 * .env.local, schema study_v2 only). The client in supabaseClient.ts is
 * typed with this file, so a write to a column that does not exist in the
 * database fails the type-check instead of failing at runtime.
 */
/* eslint-disable */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  study_v2: {
    Tables: {
      ending_questions: {
        Row: {
          agrees_silence: string | null;
          created_at: string;
          id: number;
          is_informed: string | null;
          participant_number: string;
          wants_deletion: string | null;
        };
        ComputedFields: never;
        Insert: {
          agrees_silence?: string | null;
          created_at?: string;
          id?: number;
          is_informed?: string | null;
          participant_number: string;
          wants_deletion?: string | null;
        };
        Update: {
          agrees_silence?: string | null;
          created_at?: string;
          id?: number;
          is_informed?: string | null;
          participant_number?: string;
          wants_deletion?: string | null;
        };
        Relationships: [];
      };
      final_ratings: {
        Row: {
          bus_empathy: number | null;
          created_at: string;
          doctor_empathy: number | null;
          exaggeration: number | null;
          faking: number | null;
          id: number;
          participant_number: string;
          pension_empathy: number | null;
          study_purpose: string | null;
          suppression: number | null;
          understating: number | null;
        };
        ComputedFields: never;
        Insert: {
          bus_empathy?: number | null;
          created_at?: string;
          doctor_empathy?: number | null;
          exaggeration?: number | null;
          faking?: number | null;
          id?: number;
          participant_number: string;
          pension_empathy?: number | null;
          study_purpose?: string | null;
          suppression?: number | null;
          understating?: number | null;
        };
        Update: {
          bus_empathy?: number | null;
          created_at?: string;
          doctor_empathy?: number | null;
          exaggeration?: number | null;
          faking?: number | null;
          id?: number;
          participant_number?: string;
          pension_empathy?: number | null;
          study_purpose?: string | null;
          suppression?: number | null;
          understating?: number | null;
        };
        Relationships: [];
      };
      form_data: {
        Row: {
          age: number | null;
          chronic_pain: boolean | null;
          context_order: string | null;
          created_at: string;
          current_activity: string | null;
          current_activity_detail: string | null;
          education: string | null;
          ethnicity: string | null;
          gender: string | null;
          id: number;
          pain_location: string | null;
          participant_number: string;
          private_pain_experience: boolean | null;
          private_pain_relation: string | null;
          professional_pain_activity: string | null;
          professional_pain_experience: boolean | null;
          sona_id: string | null;
          study_group: string;
          wants_vp_hours: boolean | null;
        };
        ComputedFields: never;
        Insert: {
          age?: number | null;
          chronic_pain?: boolean | null;
          context_order?: string | null;
          created_at?: string;
          current_activity?: string | null;
          current_activity_detail?: string | null;
          education?: string | null;
          ethnicity?: string | null;
          gender?: string | null;
          id?: number;
          pain_location?: string | null;
          participant_number: string;
          private_pain_experience?: boolean | null;
          private_pain_relation?: string | null;
          professional_pain_activity?: string | null;
          professional_pain_experience?: boolean | null;
          sona_id?: string | null;
          study_group: string;
          wants_vp_hours?: boolean | null;
        };
        Update: {
          age?: number | null;
          chronic_pain?: boolean | null;
          context_order?: string | null;
          created_at?: string;
          current_activity?: string | null;
          current_activity_detail?: string | null;
          education?: string | null;
          ethnicity?: string | null;
          gender?: string | null;
          id?: number;
          pain_location?: string | null;
          participant_number?: string;
          private_pain_experience?: boolean | null;
          private_pain_relation?: string | null;
          professional_pain_activity?: string | null;
          professional_pain_experience?: boolean | null;
          sona_id?: string | null;
          study_group?: string;
          wants_vp_hours?: boolean | null;
        };
        Relationships: [];
      };
      photo_ratings: {
        Row: {
          attractiveness: number | null;
          aura: number | null;
          created_at: string;
          empathy: number | null;
          id: number;
          participant_number: string;
          photo_filename: string;
          photo_index: number;
          stress_level: number | null;
          sympathy: number | null;
          trustworthiness: number | null;
          valence: number | null;
        };
        ComputedFields: never;
        Insert: {
          attractiveness?: number | null;
          aura?: number | null;
          created_at?: string;
          empathy?: number | null;
          id?: number;
          participant_number: string;
          photo_filename: string;
          photo_index: number;
          stress_level?: number | null;
          sympathy?: number | null;
          trustworthiness?: number | null;
          valence?: number | null;
        };
        Update: {
          attractiveness?: number | null;
          aura?: number | null;
          created_at?: string;
          empathy?: number | null;
          id?: number;
          participant_number?: string;
          photo_filename?: string;
          photo_index?: number;
          stress_level?: number | null;
          sympathy?: number | null;
          trustworthiness?: number | null;
          valence?: number | null;
        };
        Relationships: [];
      };
      progress: {
        Row: {
          participant_number: string;
          phase: number;
          position: Json | null;
          study_group: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          participant_number: string;
          phase: number;
          position?: Json | null;
          study_group: string;
          updated_at?: string;
        };
        Update: {
          participant_number?: string;
          phase?: number;
          position?: Json | null;
          study_group?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trial_plans: {
        Row: {
          context_order: string;
          created_at: string;
          participant_number: string;
          plan: NonNullable<Json>;
          study_group: string;
        };
        ComputedFields: never;
        Insert: {
          context_order: string;
          created_at?: string;
          participant_number: string;
          plan: NonNullable<Json>;
          study_group: string;
        };
        Update: {
          context_order?: string;
          created_at?: string;
          participant_number?: string;
          plan?: NonNullable<Json>;
          study_group?: string;
        };
        Relationships: [];
      };
      video_ratings: {
        Row: {
          action_rating: number | null;
          audio_type: string;
          context: string | null;
          created_at: string;
          credibility_rating: number;
          difficulty_rating: number;
          id: number;
          instruction_end_reason: string | null;
          pain_rating: number;
          participant_number: string;
          person_id: string | null;
          study_group: string;
          trial_end_reason: string | null;
          video_filename: string;
          video_index: number;
          video_type: string | null;
        };
        ComputedFields: never;
        Insert: {
          action_rating?: number | null;
          audio_type: string;
          context?: string | null;
          created_at?: string;
          credibility_rating: number;
          difficulty_rating: number;
          id?: number;
          instruction_end_reason?: string | null;
          pain_rating: number;
          participant_number: string;
          person_id?: string | null;
          study_group: string;
          trial_end_reason?: string | null;
          video_filename: string;
          video_index: number;
          video_type?: string | null;
        };
        Update: {
          action_rating?: number | null;
          audio_type?: string;
          context?: string | null;
          created_at?: string;
          credibility_rating?: number;
          difficulty_rating?: number;
          id?: number;
          instruction_end_reason?: string | null;
          pain_rating?: number;
          participant_number?: string;
          person_id?: string | null;
          study_group?: string;
          trial_end_reason?: string | null;
          video_filename?: string;
          video_index?: number;
          video_type?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      v_balance_check: {
        Row: {
          audio_type: string | null;
          context: string | null;
          n: number | null;
          participant_number: string | null;
          video_type: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  study_v2: {
    Enums: {},
  },
} as const;
