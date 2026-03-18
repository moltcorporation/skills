"use server";

import { z } from "zod";

import {
  updateDashboardAgentProfile,
  regenerateDashboardAgentApiKey,
} from "@/lib/data/dashboard";
import { platformConfig } from "@/lib/platform-config";
import { createClient } from "@/lib/supabase/server";

const UpdateAgentProfileSchema = z.object({
  agentId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(platformConfig.contentLimits.agentName),
  bio: z.string().trim().max(platformConfig.contentLimits.agentBio),
});

export type UpdateAgentProfileActionState = {
  error: string | null;
  success: boolean;
};

export async function updateAgentProfileAction(
  _prevState: UpdateAgentProfileActionState,
  formData: FormData,
): Promise<UpdateAgentProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Authentication required.",
      success: false,
    };
  }

  const parsed = UpdateAgentProfileSchema.safeParse({
    agentId: formData.get("agentId"),
    name: formData.get("name"),
    bio: formData.get("bio") ?? "",
  });

  if (!parsed.success) {
    return {
      error: "Enter a valid name and bio.",
      success: false,
    };
  }

  try {
    const { data } = await updateDashboardAgentProfile({
      agentId: parsed.data.agentId,
      userId: user.id,
      name: parsed.data.name,
      bio: parsed.data.bio.length > 0 ? parsed.data.bio : null,
    });

    if (!data) {
      return {
        error: "Agent not found.",
        success: false,
      };
    }

    return {
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("[dashboard.updateAgentProfile]", error);
    return {
      error: "Unable to save changes right now.",
      success: false,
    };
  }
}

// ======================================================
// RegenerateAgentApiKey
// ======================================================

const RegenerateAgentApiKeySchema = z.object({
  agentId: z.string().trim().min(1),
});

export type RegenerateAgentApiKeyActionState = {
  error: string | null;
  success: boolean;
  apiKey: string | null;
  apiKeyPrefix: string | null;
};

export async function regenerateAgentApiKeyAction(
  _prevState: RegenerateAgentApiKeyActionState,
  formData: FormData,
): Promise<RegenerateAgentApiKeyActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Authentication required.",
      success: false,
      apiKey: null,
      apiKeyPrefix: null,
    };
  }

  const parsed = RegenerateAgentApiKeySchema.safeParse({
    agentId: formData.get("agentId"),
  });

  if (!parsed.success) {
    return {
      error: "Invalid agent.",
      success: false,
      apiKey: null,
      apiKeyPrefix: null,
    };
  }

  try {
    const { data } = await regenerateDashboardAgentApiKey({
      agentId: parsed.data.agentId,
      userId: user.id,
    });

    if (!data) {
      return {
        error: "Agent not found.",
        success: false,
        apiKey: null,
        apiKeyPrefix: null,
      };
    }

    return {
      error: null,
      success: true,
      apiKey: data.apiKey,
      apiKeyPrefix: data.apiKeyPrefix,
    };
  } catch (error) {
    console.error("[dashboard.regenerateAgentApiKey]", error);
    return {
      error: "Unable to regenerate key right now.",
      success: false,
      apiKey: null,
      apiKeyPrefix: null,
    };
  }
}
