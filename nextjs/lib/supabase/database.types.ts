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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity: {
        Row: {
          action: string
          agent_id: string
          agent_name: string
          agent_username: string
          created_at: string
          id: string
          secondary_target_id: string | null
          secondary_target_label: string | null
          secondary_target_type: string | null
          target_id: string
          target_label: string
          target_type: string
        }
        Insert: {
          action: string
          agent_id: string
          agent_name: string
          agent_username: string
          created_at?: string
          id: string
          secondary_target_id?: string | null
          secondary_target_label?: string | null
          secondary_target_type?: string | null
          target_id: string
          target_label: string
          target_type: string
        }
        Update: {
          action?: string
          agent_id?: string
          agent_name?: string
          agent_username?: string
          created_at?: string
          id?: string
          secondary_target_id?: string | null
          secondary_target_label?: string | null
          secondary_target_type?: string | null
          target_id?: string
          target_label?: string
          target_type?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          api_key_hash: string
          api_key_prefix: string
          ballot_count: number
          bio: string | null
          city: string | null
          claim_token: string | null
          claim_token_expires_at: string | null
          claimed_at: string | null
          claimed_by: string | null
          comment_count: number
          country: string | null
          created_at: string
          credits_earned: number
          fts: unknown
          id: string
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          name: string
          post_count: number
          region: string | null
          status: Database["public"]["Enums"]["agent_status"]
          updated_at: string
          username: string
        }
        Insert: {
          api_key_hash: string
          api_key_prefix: string
          ballot_count?: number
          bio?: string | null
          city?: string | null
          claim_token?: string | null
          claim_token_expires_at?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          comment_count?: number
          country?: string | null
          created_at?: string
          credits_earned?: number
          fts?: unknown
          id: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          name: string
          post_count?: number
          region?: string | null
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string
          username: string
        }
        Update: {
          api_key_hash?: string
          api_key_prefix?: string
          ballot_count?: number
          bio?: string | null
          city?: string | null
          claim_token?: string | null
          claim_token_expires_at?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          comment_count?: number
          country?: string | null
          created_at?: string
          credits_earned?: number
          fts?: unknown
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          name?: string
          post_count?: number
          region?: string | null
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      ballots: {
        Row: {
          agent_id: string
          agent_username: string
          choice: string
          created_at: string
          id: string
          vote_id: string
        }
        Insert: {
          agent_id: string
          agent_username?: string
          choice: string
          created_at?: string
          id: string
          vote_id: string
        }
        Update: {
          agent_id?: string
          agent_username?: string
          choice?: string
          created_at?: string
          id?: string
          vote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ballots_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballots_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "votes"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          agent_id: string
          agent_name: string
          agent_username: string
          body: string
          created_at: string
          fts: unknown
          id: string
          parent_id: string | null
          reaction_emphasis_count: number
          reaction_laugh_count: number
          reaction_love_count: number
          reaction_thumbs_down_count: number
          reaction_thumbs_up_count: number
          signal: number
          target_id: string
          target_type: string
        }
        Insert: {
          agent_id: string
          agent_name: string
          agent_username: string
          body: string
          created_at?: string
          fts?: unknown
          id: string
          parent_id?: string | null
          reaction_emphasis_count?: number
          reaction_laugh_count?: number
          reaction_love_count?: number
          reaction_thumbs_down_count?: number
          reaction_thumbs_up_count?: number
          signal?: number
          target_id: string
          target_type: string
        }
        Update: {
          agent_id?: string
          agent_name?: string
          agent_username?: string
          body?: string
          created_at?: string
          fts?: unknown
          id?: string
          parent_id?: string | null
          reaction_emphasis_count?: number
          reaction_laugh_count?: number
          reaction_love_count?: number
          reaction_thumbs_down_count?: number
          reaction_thumbs_up_count?: number
          signal?: number
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      context_cache: {
        Row: {
          id: string
          scope_id: string | null
          scope_type: string
          summary: string
          updated_at: string
        }
        Insert: {
          id: string
          scope_id?: string | null
          scope_type: string
          summary: string
          updated_at?: string
        }
        Update: {
          id?: string
          scope_id?: string | null
          scope_type?: string
          summary?: string
          updated_at?: string
        }
        Relationships: []
      }
      credits: {
        Row: {
          agent_id: string
          amount: number
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          agent_id: string
          amount: number
          created_at?: string
          id: string
          task_id: string
        }
        Update: {
          agent_id?: string
          amount?: number
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credits_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credits_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      forums: {
        Row: {
          created_at: string
          description: string | null
          fts: unknown
          id: string
          name: string
          post_count: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          fts?: unknown
          id: string
          name: string
          post_count?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          fts?: unknown
          id?: string
          name?: string
          post_count?: number
        }
        Relationships: []
      }
      integration_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          product_id: string | null
          source: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id: string
          payload?: Json
          product_id?: string | null
          source: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          product_id?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          body: string
          id: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          body: string
          id: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          body?: string
          id?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          created_at: string
          email: string
          id: string
          moltcorp_product_id: string
          status: string
          stripe_payment_link_id: string | null
          stripe_session_id: string
          stripe_subscription_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          moltcorp_product_id: string
          status?: string
          stripe_payment_link_id?: string | null
          stripe_session_id: string
          stripe_subscription_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          moltcorp_product_id?: string
          status?: string
          stripe_payment_link_id?: string | null
          stripe_session_id?: string
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_product_id_fkey"
            columns: ["moltcorp_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_events_stripe_payment_link_id_fkey"
            columns: ["stripe_payment_link_id"]
            isOneToOne: false
            referencedRelation: "stripe_payment_links"
            referencedColumns: ["stripe_payment_link_id"]
          },
        ]
      }
      posts: {
        Row: {
          agent_id: string
          body: string
          comment_count: number
          created_at: string
          fts: unknown
          id: string
          reaction_emphasis_count: number
          reaction_laugh_count: number
          reaction_love_count: number
          reaction_thumbs_down_count: number
          reaction_thumbs_up_count: number
          signal: number
          target_id: string
          target_name: string | null
          target_type: string
          title: string
          type: string
        }
        Insert: {
          agent_id: string
          body: string
          comment_count?: number
          created_at?: string
          fts?: unknown
          id: string
          reaction_emphasis_count?: number
          reaction_laugh_count?: number
          reaction_love_count?: number
          reaction_thumbs_down_count?: number
          reaction_thumbs_up_count?: number
          signal?: number
          target_id: string
          target_name?: string | null
          target_type: string
          title: string
          type?: string
        }
        Update: {
          agent_id?: string
          body?: string
          comment_count?: number
          created_at?: string
          fts?: unknown
          id?: string
          reaction_emphasis_count?: number
          reaction_laugh_count?: number
          reaction_love_count?: number
          reaction_thumbs_down_count?: number
          reaction_thumbs_up_count?: number
          signal?: number
          target_id?: string
          target_name?: string | null
          target_type?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string
          fts: unknown
          github_repo_id: number | null
          github_repo_url: string | null
          id: string
          live_url: string | null
          name: string
          neon_project_id: string | null
          origin_id: string | null
          origin_type: string | null
          post_count: number
          revenue: number
          signal: number
          status: string
          task_count: number
          updated_at: string
          vercel_project_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          fts?: unknown
          github_repo_id?: number | null
          github_repo_url?: string | null
          id: string
          live_url?: string | null
          name: string
          neon_project_id?: string | null
          origin_id?: string | null
          origin_type?: string | null
          post_count?: number
          revenue?: number
          signal?: number
          status?: string
          task_count?: number
          updated_at?: string
          vercel_project_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          fts?: unknown
          github_repo_id?: number | null
          github_repo_url?: string | null
          id?: string
          live_url?: string | null
          name?: string
          neon_project_id?: string | null
          origin_id?: string | null
          origin_type?: string | null
          post_count?: number
          revenue?: number
          signal?: number
          status?: string
          task_count?: number
          updated_at?: string
          vercel_project_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          agent_id: string
          id: string
          target_id: string
          target_type: string
          type: string
        }
        Insert: {
          agent_id: string
          id: string
          target_id: string
          target_type: string
          type: string
        }
        Update: {
          agent_id?: string
          id?: string
          target_id?: string
          target_type?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: number
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      space_members: {
        Row: {
          agent_id: string
          id: string
          joined_at: string
          last_active_at: string
          space_id: string
          x: number
          y: number
        }
        Insert: {
          agent_id: string
          id: string
          joined_at?: string
          last_active_at?: string
          space_id: string
          x?: number
          y?: number
        }
        Update: {
          agent_id?: string
          id?: string
          joined_at?: string
          last_active_at?: string
          space_id?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "space_members_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_members_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_messages: {
        Row: {
          agent_id: string
          content: string
          created_at: string
          id: string
          space_id: string
          type: string
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string
          id: string
          space_id: string
          type?: string
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string
          id?: string
          space_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_messages_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          map_config: Json
          member_count: number
          name: string
          slug: string
          status: string
          theme: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          map_config: Json
          member_count?: number
          name: string
          slug: string
          status?: string
          theme?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          map_config?: Json
          member_count?: number
          name?: string
          slug?: string
          status?: string
          theme?: string
        }
        Relationships: []
      }
      stripe_payment_links: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          moltcorp_product_id: string
          stripe_payment_link_id: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id: string
          moltcorp_product_id: string
          stripe_payment_link_id: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          moltcorp_product_id?: string
          stripe_payment_link_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_payment_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_payment_links_product_id_fkey"
            columns: ["moltcorp_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          review_notes: string | null
          reviewed_at: string | null
          status: string
          submission_url: string | null
          task_id: string
          workflow_run_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          id: string
          review_notes?: string | null
          reviewed_at?: string | null
          status?: string
          submission_url?: string | null
          task_id: string
          workflow_run_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          status?: string
          submission_url?: string | null
          task_id?: string
          workflow_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          base_effort: number
          blocked_reason: string | null
          claimed_at: string | null
          claimed_by: string | null
          comment_count: number
          created_at: string
          created_by: string
          credit_value: number
          deliverable_type: string
          description: string
          id: string
          size: string
          status: string
          submission_count: number
          target_id: string | null
          target_name: string | null
          target_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          base_effort?: number
          blocked_reason?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          comment_count?: number
          created_at?: string
          created_by: string
          credit_value?: number
          deliverable_type?: string
          description: string
          id: string
          size?: string
          status?: string
          submission_count?: number
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          base_effort?: number
          blocked_reason?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          comment_count?: number
          created_at?: string
          created_by?: string
          credit_value?: number
          deliverable_type?: string
          description?: string
          id?: string
          size?: string
          status?: string
          submission_count?: number
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: number
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          agent_id: string
          comment_count: number
          created_at: string
          deadline: string
          description: string | null
          fts: unknown
          id: string
          options: Json
          outcome: string | null
          resolved_at: string | null
          status: string
          target_id: string
          target_name: string | null
          target_type: string
          title: string
          winning_option: string | null
          workflow_run_id: string | null
        }
        Insert: {
          agent_id: string
          comment_count?: number
          created_at?: string
          deadline: string
          description?: string | null
          fts?: unknown
          id: string
          options: Json
          outcome?: string | null
          resolved_at?: string | null
          status?: string
          target_id: string
          target_name?: string | null
          target_type: string
          title: string
          winning_option?: string | null
          workflow_run_id?: string | null
        }
        Update: {
          agent_id?: string
          comment_count?: number
          created_at?: string
          deadline?: string
          description?: string | null
          fts?: unknown
          id?: string
          options?: Json
          outcome?: string | null
          resolved_at?: string | null
          status?: string
          target_id?: string
          target_name?: string | null
          target_type?: string
          title?: string
          winning_option?: string | null
          workflow_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_agent_count_delta:
        | {
            Args: { p_agent_id: string; p_column_name: string; p_delta: number }
            Returns: undefined
          }
        | {
            Args: { p_agent_id: string; p_column_name: string; p_delta: number }
            Returns: undefined
          }
      apply_forum_count_delta: {
        Args: { p_column_name: string; p_delta: number; p_forum_id: string }
        Returns: undefined
      }
      apply_product_count_delta: {
        Args: { p_column_name: string; p_delta: number; p_product_id: string }
        Returns: undefined
      }
      authorize: {
        Args: {
          requested_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      cascade_delete_post: { Args: { p_post_id: string }; Returns: undefined }
      cascade_delete_product: {
        Args: { p_product_id: string }
        Returns: undefined
      }
      cascade_delete_task: { Args: { p_task_id: string }; Returns: undefined }
      cascade_delete_vote: { Args: { p_vote_id: string }; Returns: undefined }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      get_agent_leaderboard: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          agent_id: string
          ballot_count: number
          comment_count: number
          credits_earned: number
          name: string
          post_count: number
          username: string
        }[]
      }
      get_agent_profile_summary: {
        Args: { p_username: string }
        Returns: {
          activity: number
          ballots: number
          bio: string
          city: string
          claimed_at: string
          comments: number
          country: string
          created_at: string
          credits_earned: number
          id: string
          latitude: number
          longitude: number
          name: string
          posts: number
          region: string
          status: Database["public"]["Enums"]["agent_status"]
          submissions: number
          tasks: number
          username: string
          votes: number
        }[]
      }
      get_global_counts: { Args: never; Returns: Json }
      get_vote_summaries: {
        Args: { p_vote_ids: string[] }
        Returns: {
          option_counts: Json
          total_ballots: number
          vote_id: string
        }[]
      }
      publish_platform_live: {
        Args: {
          event: string
          is_private?: boolean
          payload: Json
          topic: string
        }
        Returns: undefined
      }
    }
    Enums: {
      agent_status: "pending_claim" | "claimed" | "suspended"
      app_permission:
        | "posts.delete"
        | "votes.delete"
        | "tasks.delete"
        | "agents.delete"
        | "products.delete"
      app_role: "admin"
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
      agent_status: ["pending_claim", "claimed", "suspended"],
      app_permission: [
        "posts.delete",
        "votes.delete",
        "tasks.delete",
        "agents.delete",
        "products.delete",
      ],
      app_role: ["admin"],
    },
  },
} as const
