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
      agencies: {
        Row: {
          address: string | null
          city: string | null
          country: string
          created_at: string
          description: string | null
          documents: Json
          email: string
          id: string
          legal_name: string | null
          logo_url: string | null
          name: string
          owner_id: string
          phone: string
          registration_number: string | null
          rejection_reason: string | null
          status: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country: string
          created_at?: string
          description?: string | null
          documents?: Json
          email: string
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name: string
          owner_id: string
          phone: string
          registration_number?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          description?: string | null
          documents?: Json
          email?: string
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string
          registration_number?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      alerts: {
        Row: {
          active: boolean
          created_at: string
          criteria_json: Json
          id: string
          last_matched_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          criteria_json?: Json
          id?: string
          last_matched_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          criteria_json?: Json
          id?: string
          last_matched_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip: string | null
          metadata: Json
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      boosts: {
        Row: {
          amount_usd: number
          audience: string
          created_at: string
          ends_at: string | null
          id: string
          item_id: string
          item_type: string
          plan: string
          starts_at: string | null
          stats: Json
          status: string
          stripe_session_id: string | null
          terracoins_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_usd?: number
          audience?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          item_id: string
          item_type: string
          plan: string
          starts_at?: string | null
          stats?: Json
          status?: string
          stripe_session_id?: string | null
          terracoins_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_usd?: number
          audience?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          plan?: string
          starts_at?: string | null
          stats?: Json
          status?: string
          stripe_session_id?: string | null
          terracoins_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount_usd: number
          broker_id: string
          created_at: string
          id: string
          paid_at: string | null
          property_id: string | null
          rate: number
        }
        Insert: {
          amount_usd: number
          broker_id: string
          created_at?: string
          id?: string
          paid_at?: string | null
          property_id?: string | null
          rate: number
        }
        Update: {
          amount_usd?: number
          broker_id?: string
          created_at?: string
          id?: string
          paid_at?: string | null
          property_id?: string | null
          rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "commissions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      currency_rates: {
        Row: {
          code: string
          country: string
          locale: string
          rate: number
          symbol: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          country: string
          locale?: string
          rate: number
          symbol: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          country?: string
          locale?: string
          rate?: number
          symbol?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      disputes: {
        Row: {
          created_at: string
          description: string
          id: string
          opened_by: string
          reason: string
          resolution: string | null
          status: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          opened_by: string
          reason: string
          resolution?: string | null
          status?: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          opened_by?: string
          reason?: string
          resolution?: string | null
          status?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          category: string | null
          description: string | null
          description_en: string | null
          description_fr: string | null
          enabled: boolean
          id: string
          key: string
          label_en: string | null
          label_fr: string | null
          target_countries: string[] | null
          target_roles: Database["public"]["Enums"]["app_role"][] | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          description_en?: string | null
          description_fr?: string | null
          enabled?: boolean
          id?: string
          key: string
          label_en?: string | null
          label_fr?: string | null
          target_countries?: string[] | null
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          description_en?: string | null
          description_fr?: string | null
          enabled?: boolean
          id?: string
          key?: string
          label_en?: string | null
          label_fr?: string | null
          target_countries?: string[] | null
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      foreclosures: {
        Row: {
          address: string
          ai_analysis: Json
          ai_analyzed_at: string | null
          ai_investment_score: number | null
          ai_renovation_estimate: number | null
          auction_date: string | null
          bathrooms: number | null
          bedrooms: number | null
          boosted_until: string | null
          case_number: string | null
          city: string
          country_code: string | null
          created_at: string
          default_date: string | null
          discount_percent: number | null
          estimated_market_value: number | null
          fha_eligible: boolean
          financing_available: string[]
          foreclosure_stage: string | null
          foreclosure_type: string
          id: string
          is_boosted: boolean
          is_featured: boolean
          last_synced_at: string
          lat: number | null
          lender_name: string | null
          listing_date: string | null
          listing_price: number | null
          lng: number | null
          opening_bid: number | null
          outstanding_loan: number | null
          photos: Json
          property_type: string | null
          raw_data: Json
          saves_count: number
          source: string
          source_reference: string | null
          state: string
          status: string
          surface_sqft: number | null
          updated_at: string
          va_eligible: boolean
          views_count: number
          year_built: number | null
          zip_code: string | null
        }
        Insert: {
          address: string
          ai_analysis?: Json
          ai_analyzed_at?: string | null
          ai_investment_score?: number | null
          ai_renovation_estimate?: number | null
          auction_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          boosted_until?: string | null
          case_number?: string | null
          city: string
          country_code?: string | null
          created_at?: string
          default_date?: string | null
          discount_percent?: number | null
          estimated_market_value?: number | null
          fha_eligible?: boolean
          financing_available?: string[]
          foreclosure_stage?: string | null
          foreclosure_type: string
          id?: string
          is_boosted?: boolean
          is_featured?: boolean
          last_synced_at?: string
          lat?: number | null
          lender_name?: string | null
          listing_date?: string | null
          listing_price?: number | null
          lng?: number | null
          opening_bid?: number | null
          outstanding_loan?: number | null
          photos?: Json
          property_type?: string | null
          raw_data?: Json
          saves_count?: number
          source: string
          source_reference?: string | null
          state: string
          status?: string
          surface_sqft?: number | null
          updated_at?: string
          va_eligible?: boolean
          views_count?: number
          year_built?: number | null
          zip_code?: string | null
        }
        Update: {
          address?: string
          ai_analysis?: Json
          ai_analyzed_at?: string | null
          ai_investment_score?: number | null
          ai_renovation_estimate?: number | null
          auction_date?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          boosted_until?: string | null
          case_number?: string | null
          city?: string
          country_code?: string | null
          created_at?: string
          default_date?: string | null
          discount_percent?: number | null
          estimated_market_value?: number | null
          fha_eligible?: boolean
          financing_available?: string[]
          foreclosure_stage?: string | null
          foreclosure_type?: string
          id?: string
          is_boosted?: boolean
          is_featured?: boolean
          last_synced_at?: string
          lat?: number | null
          lender_name?: string | null
          listing_date?: string | null
          listing_price?: number | null
          lng?: number | null
          opening_bid?: number | null
          outstanding_loan?: number | null
          photos?: Json
          property_type?: string | null
          raw_data?: Json
          saves_count?: number
          source?: string
          source_reference?: string | null
          state?: string
          status?: string
          surface_sqft?: number | null
          updated_at?: string
          va_eligible?: boolean
          views_count?: number
          year_built?: number | null
          zip_code?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content_encrypted: string
          created_at: string
          flag_reason: string | null
          flagged: boolean
          id: string
          property_id: string | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content_encrypted: string
          created_at?: string
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          property_id?: string | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content_encrypted?: string
          created_at?: string
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          property_id?: string | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          lang_pref: string
          terracoins: number
          verified: boolean
        }
        Insert: {
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          lang_pref?: string
          terracoins?: number
          verified?: boolean
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          lang_pref?: string
          terracoins?: number
          verified?: boolean
        }
        Relationships: []
      }
      properties: {
        Row: {
          agent_id: string
          ai_score: number | null
          boosted_until: string | null
          city: string | null
          country: string
          cover_url: string | null
          created_at: string
          description: string | null
          documents: Json
          id: string
          images: Json
          lat: number | null
          lng: number | null
          price_usd: number
          status: Database["public"]["Enums"]["property_status"]
          tf_verified: boolean
          title: string
          tour_360_url: string | null
          type: Database["public"]["Enums"]["property_type"]
          updated_at: string
        }
        Insert: {
          agent_id: string
          ai_score?: number | null
          boosted_until?: string | null
          city?: string | null
          country: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          documents?: Json
          id?: string
          images?: Json
          lat?: number | null
          lng?: number | null
          price_usd?: number
          status?: Database["public"]["Enums"]["property_status"]
          tf_verified?: boolean
          title: string
          tour_360_url?: string | null
          type?: Database["public"]["Enums"]["property_type"]
          updated_at?: string
        }
        Update: {
          agent_id?: string
          ai_score?: number | null
          boosted_until?: string | null
          city?: string | null
          country?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          documents?: Json
          id?: string
          images?: Json
          lat?: number | null
          lng?: number | null
          price_usd?: number
          status?: Database["public"]["Enums"]["property_status"]
          tf_verified?: boolean
          title?: string
          tour_360_url?: string | null
          type?: Database["public"]["Enums"]["property_type"]
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_usd: number
          buyer_id: string
          created_at: string
          escrow_released: boolean
          external_ref: string | null
          id: string
          method: Database["public"]["Enums"]["tx_method"]
          property_id: string | null
          seller_id: string
          status: Database["public"]["Enums"]["tx_status"]
          updated_at: string
        }
        Insert: {
          amount_usd: number
          buyer_id: string
          created_at?: string
          escrow_released?: boolean
          external_ref?: string | null
          id?: string
          method: Database["public"]["Enums"]["tx_method"]
          property_id?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["tx_status"]
          updated_at?: string
        }
        Update: {
          amount_usd?: number
          buyer_id?: string
          created_at?: string
          escrow_released?: boolean
          external_ref?: string | null
          id?: string
          method?: Database["public"]["Enums"]["tx_method"]
          property_id?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["tx_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "agent"
        | "buyer"
        | "contractor"
        | "broker"
        | "surveyor"
      property_status: "draft" | "active" | "pending" | "sold" | "archived"
      property_type: "land" | "house" | "apartment" | "commercial" | "farm"
      tx_method: "stripe" | "cinetpay" | "wire" | "crypto"
      tx_status: "pending" | "escrowed" | "released" | "refunded" | "failed"
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
      app_role: [
        "super_admin",
        "admin",
        "agent",
        "buyer",
        "contractor",
        "broker",
        "surveyor",
      ],
      property_status: ["draft", "active", "pending", "sold", "archived"],
      property_type: ["land", "house", "apartment", "commercial", "farm"],
      tx_method: ["stripe", "cinetpay", "wire", "crypto"],
      tx_status: ["pending", "escrowed", "released", "refunded", "failed"],
    },
  },
} as const
