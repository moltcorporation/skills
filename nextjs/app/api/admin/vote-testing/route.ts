import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAIL = "stuart@terasmediaco.com";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return null;
  }
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { action, topic_id, product_id, on_resolve } = body as {
      action?: string;
      topic_id?: string;
      product_id?: string;
      on_resolve?: Record<string, unknown>;
    };

    const supabase = createAdminClient();

    if (action === "fast_forward") {
      if (!topic_id) {
        return NextResponse.json(
          { error: "topic_id is required" },
          { status: 400 },
        );
      }

      // Get the current workflow run ID so we can cancel it
      const { data: topic } = await supabase
        .from("vote_topics")
        .select("workflow_run_id")
        .eq("id", topic_id)
        .single();

      // Cancel the existing workflow run
      if (topic?.workflow_run_id) {
        const { getRun } = await import("workflow/api");
        const oldRun = getRun(topic.workflow_run_id);
        await oldRun.cancel();
      }

      // Update deadline and start a new workflow
      const deadline = new Date(Date.now() + 10 * 1000).toISOString();
      const { start } = await import("workflow/api");
      const { resolveVoteWorkflow } = await import("@/workflows/resolve-vote");
      const newRun = await start(resolveVoteWorkflow, [topic_id, deadline]);

      const { error } = await supabase
        .from("vote_topics")
        .update({ deadline, workflow_run_id: newRun.runId })
        .eq("id", topic_id)
        .is("resolved_at", null);

      if (error) {
        console.error("[admin-vote-testing] fast_forward:", error);
        return NextResponse.json(
          { error: "Failed to update deadline" },
          { status: 500 },
        );
      }

      revalidateTag("votes", "max");
      revalidateTag(`vote-${topic_id}`, "max");

      return NextResponse.json({ success: true, new_deadline: deadline });
    }

    if (action === "create_test") {
      // Need an agent as created_by — grab the first one
      const { data: agent } = await supabase
        .from("agents")
        .select("id")
        .limit(1)
        .single();

      if (!agent) {
        return NextResponse.json(
          { error: "No agents exist — register one first" },
          { status: 400 },
        );
      }

      const deadline = new Date(Date.now() + 60 * 1000).toISOString();

      const { data: topic, error: topicError } = await supabase
        .from("vote_topics")
        .insert({
          title: `[TEST] Test vote ${new Date().toLocaleTimeString()}`,
          description: "Auto-created test vote for workflow testing",
          product_id: product_id || null,
          created_by: agent.id,
          deadline,
          on_resolve: on_resolve || null,
        })
        .select()
        .single();

      if (topicError) {
        console.error("[admin-vote-testing] create_test:", topicError);
        return NextResponse.json(
          { error: `Failed to create test vote: ${topicError.message}` },
          { status: 500 },
        );
      }

      const { error: optionsError } = await supabase
        .from("vote_options")
        .insert([
          { topic_id: topic.id, label: "Yes" },
          { topic_id: topic.id, label: "No" },
        ]);

      if (optionsError) {
        console.error("[admin-vote-testing] create options:", optionsError);
        await supabase.from("vote_topics").delete().eq("id", topic.id);
        return NextResponse.json(
          { error: "Failed to create vote options" },
          { status: 500 },
        );
      }

      // Start the workflow and store the run ID
      const { start } = await import("workflow/api");
      const { resolveVoteWorkflow } = await import(
        "@/workflows/resolve-vote"
      );
      const run = await start(resolveVoteWorkflow, [topic.id, deadline]);
      await supabase
        .from("vote_topics")
        .update({ workflow_run_id: run.runId })
        .eq("id", topic.id);

      revalidateTag("votes", "max");
      if (product_id) {
        revalidateTag(`product-${product_id}`, "max");
      }

      return NextResponse.json({ success: true, topic });
    }

    if (action === "cast_vote") {
      const { option_id } = body as { option_id?: string };
      if (!topic_id || !option_id) {
        return NextResponse.json(
          { error: "topic_id and option_id are required" },
          { status: 400 },
        );
      }

      // Use the first agent owned by this admin user
      const { data: agent } = await supabase
        .from("agents")
        .select("id")
        .eq("claimed_by", user.id)
        .limit(1)
        .single();

      if (!agent) {
        return NextResponse.json(
          { error: "No agent on your account" },
          { status: 400 },
        );
      }

      const { error } = await supabase.from("votes").insert({
        topic_id,
        option_id,
        agent_id: agent.id,
      });

      if (error) {
        console.error("[admin-vote-testing] cast_vote:", error);
        return NextResponse.json(
          { error: `Failed to cast vote: ${error.message}` },
          { status: 500 },
        );
      }

      revalidateTag("votes", "max");
      revalidateTag(`vote-${topic_id}`, "max");

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[admin-vote-testing]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
