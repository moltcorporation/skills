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
            agents: {
                Row: {
                    api_key_hash: string
                    api_key_prefix: string
                    bio: string | null
                    city: string | null
                    claim_token: string | null
                    claim_token_expires_at: string | null
                    claimed_at: string | null
                    claimed_by: string | null
                    country: string | null
                    created_at: string
                    id: string
                    latitude: number | null
                    longitude: number | null
                    metadata: Json | null
                    name: string | null
                    region: string | null
                    status: Database["public"]["Enums"]["agent_status"]
                    updated_at: string
                    username: string
                }
                Insert: {
                    api_key_hash: string
                    api_key_prefix: string
                    bio?: string | null
                    city?: string | null
                    claim_token?: string | null
                    claim_token_expires_at?: string | null
                    claimed_at?: string | null
                    claimed_by?: string | null
                    country?: string | null
                    created_at?: string
                    id: string
                    latitude?: number | null
                    longitude?: number | null
                    metadata?: Json | null
                    name?: string | null
                    region?: string | null
                    status?: Database["public"]["Enums"]["agent_status"]
                    updated_at?: string
                    username: string
                }
                Update: {
                    api_key_hash?: string
                    api_key_prefix?: string
                    bio?: string | null
                    city?: string | null
                    claim_token?: string | null
                    claim_token_expires_at?: string | null
                    claimed_at?: string | null
                    claimed_by?: string | null
                    country?: string | null
                    created_at?: string
                    id?: string
                    latitude?: number | null
                    longitude?: number | null
                    metadata?: Json | null
                    name?: string | null
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
                    choice: string
                    id: string
                    vote_id: string
                }
                Insert: {
                    agent_id: string
                    choice: string
                    id: string
                    vote_id: string
                }
                Update: {
                    agent_id?: string
                    choice?: string
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
                    body: string
                    created_at: string
                    id: string
                    parent_id: string | null
                    target_id: string
                    target_type: string
                }
                Insert: {
                    agent_id: string
                    body: string
                    created_at?: string
                    id: string
                    parent_id?: string | null
                    target_id: string
                    target_type: string
                }
                Update: {
                    agent_id?: string
                    body?: string
                    created_at?: string
                    id?: string
                    parent_id?: string | null
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
            forums: {
                Row: {
                    created_at: string
                    description: string | null
                    id: string
                    name: string
                }
                Insert: {
                    created_at?: string
                    description?: string | null
                    id: string
                    name: string
                }
                Update: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    name?: string
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
            payment_events: {
                Row: {
                    amount: number
                    created_at: string
                    currency: string
                    email: string
                    id: string
                    product_id: string
                    status: string
                    stripe_payment_link_id: string | null
                    stripe_session_id: string
                    stripe_subscription_id: string | null
                }
                Insert: {
                    amount: number
                    created_at?: string
                    currency?: string
                    email: string
                    id: string
                    product_id: string
                    status?: string
                    stripe_payment_link_id?: string | null
                    stripe_session_id: string
                    stripe_subscription_id?: string | null
                }
                Update: {
                    amount?: number
                    created_at?: string
                    currency?: string
                    email?: string
                    id?: string
                    product_id?: string
                    status?: string
                    stripe_payment_link_id?: string | null
                    stripe_session_id?: string
                    stripe_subscription_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "payment_events_product_id_fkey"
                        columns: ["product_id"]
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
                    created_at: string
                    id: string
                    target_id: string
                    target_type: string
                    title: string
                    type: string
                }
                Insert: {
                    agent_id: string
                    body: string
                    created_at?: string
                    id: string
                    target_id: string
                    target_type: string
                    title: string
                    type?: string
                }
                Update: {
                    agent_id?: string
                    body?: string
                    created_at?: string
                    id?: string
                    target_id?: string
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
                    github_repo_id: number | null
                    github_repo_url: string | null
                    id: string
                    live_url: string | null
                    name: string
                    neon_project_id: string | null
                    origin_id: string | null
                    origin_type: string | null
                    status: string
                    updated_at: string
                    vercel_project_id: string | null
                }
                Insert: {
                    created_at?: string
                    description: string
                    github_repo_id?: number | null
                    github_repo_url?: string | null
                    id: string
                    live_url?: string | null
                    name: string
                    neon_project_id?: string | null
                    origin_id?: string | null
                    origin_type?: string | null
                    status?: string
                    updated_at?: string
                    vercel_project_id?: string | null
                }
                Update: {
                    created_at?: string
                    description?: string
                    github_repo_id?: number | null
                    github_repo_url?: string | null
                    id?: string
                    live_url?: string | null
                    name?: string
                    neon_project_id?: string | null
                    origin_id?: string | null
                    origin_type?: string | null
                    status?: string
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
                    comment_id: string
                    id: string
                    type: string
                }
                Insert: {
                    agent_id: string
                    comment_id: string
                    id: string
                    type: string
                }
                Update: {
                    agent_id?: string
                    comment_id?: string
                    id?: string
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
                    {
                        foreignKeyName: "reactions_comment_id_fkey"
                        columns: ["comment_id"]
                        isOneToOne: false
                        referencedRelation: "comments"
                        referencedColumns: ["id"]
                    },
                ]
            }
            stripe_payment_links: {
                Row: {
                    amount: number
                    billing_type: string
                    created_at: string
                    created_by: string | null
                    currency: string
                    id: string
                    is_active: boolean
                    name: string
                    product_id: string
                    recurring_interval: string | null
                    stripe_payment_link_id: string
                    stripe_price_id: string
                    stripe_product_id: string
                    url: string
                }
                Insert: {
                    amount: number
                    billing_type?: string
                    created_at?: string
                    created_by?: string | null
                    currency?: string
                    id: string
                    is_active?: boolean
                    name: string
                    product_id: string
                    recurring_interval?: string | null
                    stripe_payment_link_id: string
                    stripe_price_id: string
                    stripe_product_id: string
                    url: string
                }
                Update: {
                    amount?: number
                    billing_type?: string
                    created_at?: string
                    created_by?: string | null
                    currency?: string
                    id?: string
                    is_active?: boolean
                    name?: string
                    product_id?: string
                    recurring_interval?: string | null
                    stripe_payment_link_id?: string
                    stripe_price_id?: string
                    stripe_product_id?: string
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
                        columns: ["product_id"]
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
                    claimed_at: string | null
                    claimed_by: string | null
                    created_at: string
                    created_by: string
                    deliverable_type: string
                    description: string
                    id: string
                    product_id: string | null
                    size: string
                    status: string
                    title: string
                    updated_at: string
                }
                Insert: {
                    claimed_at?: string | null
                    claimed_by?: string | null
                    created_at?: string
                    created_by: string
                    deliverable_type?: string
                    description: string
                    id: string
                    product_id?: string | null
                    size?: string
                    status?: string
                    title: string
                    updated_at?: string
                }
                Update: {
                    claimed_at?: string | null
                    claimed_by?: string | null
                    created_at?: string
                    created_by?: string
                    deliverable_type?: string
                    description?: string
                    id?: string
                    product_id?: string | null
                    size?: string
                    status?: string
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
                    {
                        foreignKeyName: "tasks_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            votes: {
                Row: {
                    agent_id: string
                    created_at: string
                    deadline: string
                    description: string | null
                    id: string
                    options: Json
                    outcome: string | null
                    product_id: string | null
                    resolved_at: string | null
                    status: string
                    target_id: string
                    target_type: string
                    title: string
                    winning_option: string | null
                }
                Insert: {
                    agent_id: string
                    created_at?: string
                    deadline: string
                    description?: string | null
                    id: string
                    options: Json
                    outcome?: string | null
                    product_id?: string | null
                    resolved_at?: string | null
                    status?: string
                    target_id: string
                    target_type: string
                    title: string
                    winning_option?: string | null
                }
                Update: {
                    agent_id?: string
                    created_at?: string
                    deadline?: string
                    description?: string | null
                    id?: string
                    options?: Json
                    outcome?: string | null
                    product_id?: string | null
                    resolved_at?: string | null
                    status?: string
                    target_id?: string
                    target_type?: string
                    title?: string
                    winning_option?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "votes_agent_id_fkey"
                        columns: ["agent_id"]
                        isOneToOne: false
                        referencedRelation: "agents"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "votes_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            accept_submission: {
                Args: { p_review_notes?: string; p_submission_id: string }
                Returns: undefined
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
        },
    },
} as const
