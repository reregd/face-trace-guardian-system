export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      enhanced_sync_logs: {
        Row: {
          created_at: string | null
          id: number
          metadata: Json | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          metadata?: Json | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: number
          metadata?: Json | null
          type?: string
        }
        Relationships: []
      }
      event_logs: {
        Row: {
          camera: string | null
          confidence: number | null
          created_at: string | null
          face_id: number | null
          id: number
          image_path: string | null
          location: Json | null
          match_status: Database["public"]["Enums"]["detection_status"]
          metadata: Json | null
          timestamp: string | null
        }
        Insert: {
          camera?: string | null
          confidence?: number | null
          created_at?: string | null
          face_id?: number | null
          id?: number
          image_path?: string | null
          location?: Json | null
          match_status: Database["public"]["Enums"]["detection_status"]
          metadata?: Json | null
          timestamp?: string | null
        }
        Update: {
          camera?: string | null
          confidence?: number | null
          created_at?: string | null
          face_id?: number | null
          id?: number
          image_path?: string | null
          location?: Json | null
          match_status?: Database["public"]["Enums"]["detection_status"]
          metadata?: Json | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_logs_face_id_fkey"
            columns: ["face_id"]
            isOneToOne: false
            referencedRelation: "faces"
            referencedColumns: ["id"]
          },
        ]
      }
      face_embeddings: {
        Row: {
          embedding: string
          id: number
          image_url: string
          metadata: Json | null
          name: string | null
          user_id: string | null
        }
        Insert: {
          embedding: string
          id?: never
          image_url: string
          metadata?: Json | null
          name?: string | null
          user_id?: string | null
        }
        Update: {
          embedding?: string
          id?: never
          image_url?: string
          metadata?: Json | null
          name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      face_vectors: {
        Row: {
          created_at: string | null
          embedding: string
          id: number
        }
        Insert: {
          created_at?: string | null
          embedding: string
          id?: number
        }
        Update: {
          created_at?: string | null
          embedding?: string
          id?: number
        }
        Relationships: []
      }
      faces: {
        Row: {
          created_at: string | null
          embeddings: number[]
          id: number
          image_path: string | null
          metadata: Json | null
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          embeddings: number[]
          id?: number
          image_path?: string | null
          metadata?: Json | null
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          embeddings?: number[]
          id?: number
          image_path?: string | null
          metadata?: Json | null
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_similar_faces: {
        Args:
          | Record<PropertyKey, never>
          | {
              input_embedding: string
              similarity_threshold?: number
              max_results?: number
            }
          | {
              input_embedding: string
              similarity_threshold?: number
              max_results?: number
            }
          | { input_image: string; similarity_threshold?: number }
        Returns: {
          face_id: number
          similarity: number
        }[]
      }
    }
    Enums: {
      detection_status: "known" | "unknown" | "pending"
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
      detection_status: ["known", "unknown", "pending"],
    },
  },
} as const
