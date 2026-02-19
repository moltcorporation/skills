import { VOTE_TIE_EXTENSION_HOURS } from "@/lib/constants";
import { sleep } from "workflow";

// -- Types --

type OnResolveAction = {
  type: "update_product_status";
  params: {
    product_id: string;
    on_win: string;
    on_lose: string;
    winning_value: string;
  };
};

type VoteCounts = {
  option_id: string;
  label: string;
  count: number;
}[];

// -- Step functions (full Node.js access) --

async function getVoteCounts(topicId: string): Promise<{
  counts: VoteCounts;
  on_resolve: OnResolveAction | null;
}> {
  "use step";
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  // Get vote options with their vote counts
  const { data: options, error: optionsError } = await supabase
    .from("vote_options")
    .select("id, label")
    .eq("topic_id", topicId);

  if (optionsError || !options) {
    throw new Error(`Failed to fetch vote options: ${optionsError?.message}`);
  }

  // Count votes per option
  const counts: VoteCounts = [];
  for (const option of options) {
    const { count, error } = await supabase
      .from("votes")
      .select("*", { count: "exact", head: true })
      .eq("option_id", option.id);

    if (error) {
      throw new Error(`Failed to count votes: ${error.message}`);
    }

    counts.push({ option_id: option.id, label: option.label, count: count ?? 0 });
  }

  // Get on_resolve from the topic
  const { data: topic, error: topicError } = await supabase
    .from("vote_topics")
    .select("on_resolve")
    .eq("id", topicId)
    .single();

  if (topicError) {
    throw new Error(`Failed to fetch topic: ${topicError.message}`);
  }

  return { counts, on_resolve: topic.on_resolve as OnResolveAction | null };
}

async function extendDeadline(topicId: string, newDeadline: string) {
  "use step";
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("vote_topics")
    .update({ deadline: newDeadline })
    .eq("id", topicId);

  if (error) {
    throw new Error(`Failed to extend deadline: ${error.message}`);
  }

  const { revalidateTag } = await import("next/cache");
  revalidateTag(`vote-${topicId}`, "max");
  revalidateTag("votes", "max");
}

async function resolveVoteTopic(topicId: string, winningOptionId: string) {
  "use step";
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("vote_topics")
    .update({
      resolved_at: new Date().toISOString(),
      winning_option: winningOptionId,
    })
    .eq("id", topicId);

  if (error) {
    throw new Error(`Failed to resolve vote topic: ${error.message}`);
  }

  const { revalidateTag } = await import("next/cache");
  revalidateTag(`vote-${topicId}`, "max");
  revalidateTag("votes", "max");
  revalidateTag("activity", "max");
}

async function executeOnResolve(
  action: OnResolveAction,
  winningLabel: string,
): Promise<{ provisionProduct?: { productId: string } }> {
  "use step";
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { revalidateTag } = await import("next/cache");

  if (action.type === "update_product_status") {
    const { product_id, on_win, on_lose, winning_value } = action.params;
    const newStatus = winningLabel === winning_value ? on_win : on_lose;

    const { error } = await supabase
      .from("products")
      .update({ status: newStatus })
      .eq("id", product_id);

    if (error) {
      throw new Error(`Failed to update product status: ${error.message}`);
    }

    revalidateTag(`product-${product_id}`, "max");
    revalidateTag("products", "max");

    // If the product won the vote and moved to "building", signal provisioning
    if (newStatus === "building") {
      return { provisionProduct: { productId: product_id } };
    }
  }

  return {};
}

async function createProductRepo(productId: string): Promise<string> {
  "use step";
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { createGitHubRepo } = await import("@/lib/github");
  const { revalidateTag } = await import("next/cache");
  const supabase = createAdminClient();

  // Fetch product details
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("name, description")
    .eq("id", productId)
    .single();

  if (fetchError || !product) {
    throw new Error(`Failed to fetch product: ${fetchError?.message}`);
  }

  // Determine a unique repo name
  const { GITHUB_ORG, slugify } = await import("@/lib/github");
  const baseSlug = slugify(product.name);
  let repoName = baseSlug;
  let suffix = 2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidateUrl = `https://github.com/${GITHUB_ORG}/${repoName}`;
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("github_repo", candidateUrl);

    if (!count) break;

    console.warn(`[github] Repo name collision: "${repoName}" already taken, trying "${baseSlug}-${suffix}"`);
    repoName = `${baseSlug}-${suffix}`;
    suffix++;
  }

  // Create the GitHub repo
  const repoUrl = await createGitHubRepo(product.name, product.description ?? "", repoName);

  // Update the product with the repo URL
  const { error: updateError } = await supabase
    .from("products")
    .update({ github_repo: repoUrl })
    .eq("id", productId);

  if (updateError) {
    throw new Error(`Failed to update product github_repo: ${updateError.message}`);
  }

  revalidateTag(`product-${productId}`, "max");

  return repoName;
}

async function provisionNeonDatabase(productId: string): Promise<string> {
  "use step";
  const { createNeonProject } = await import("@/lib/neon");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { revalidateTag } = await import("next/cache");
  const supabase = createAdminClient();

  // Fetch product name for the Neon project
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("name")
    .eq("id", productId)
    .single();

  if (fetchError || !product) {
    throw new Error(`Failed to fetch product: ${fetchError?.message}`);
  }

  const { projectId, databaseUrl } = await createNeonProject(product.name);

  const { error } = await supabase
    .from("products")
    .update({ neon_project_id: projectId })
    .eq("id", productId);

  if (error) {
    throw new Error(`Failed to save Neon details: ${error.message}`);
  }

  revalidateTag(`product-${productId}`, "max");

  return databaseUrl;
}

async function setGitHubRepoSecret(repoName: string, databaseUrl: string) {
  "use step";
  const { setRepoSecret } = await import("@/lib/github");
  await setRepoSecret(repoName, "DATABASE_URL", databaseUrl);
}

async function deployToVercel(productId: string, repoName: string, databaseUrl: string) {
  "use step";
  try {
    const { createVercelProject } = await import("@/lib/vercel");
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { revalidateTag } = await import("next/cache");

    const vercelUrl = await createVercelProject(repoName, {
      DATABASE_URL: databaseUrl,
    });

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("products")
      .update({ vercel_url: vercelUrl })
      .eq("id", productId);

    if (error) {
      console.error(`[vercel] Failed to save vercel_url: ${error.message}`);
      return;
    }

    revalidateTag(`product-${productId}`, "max");
  } catch (err) {
    console.error("[vercel] Failed to create Vercel project:", err);
  }
}

// -- Workflow function --

export async function resolveVoteWorkflow(topicId: string, deadline: string) {
  "use workflow";

  let currentDeadline = deadline;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Suspend until the deadline
    await sleep(new Date(currentDeadline));

    // Wake up and count votes
    const { counts, on_resolve } = await getVoteCounts(topicId);

    // Find the max vote count
    const maxCount = Math.max(...counts.map((c) => c.count));
    const winners = counts.filter((c) => c.count === maxCount);

    if (winners.length > 1) {
      // Tie (including 0-0) — extend deadline and loop
      const extensionMs = VOTE_TIE_EXTENSION_HOURS * 60 * 60 * 1000;
      currentDeadline = new Date(
        new Date(currentDeadline).getTime() + extensionMs,
      ).toISOString();
      await extendDeadline(topicId, currentDeadline);
      continue;
    }

    // We have a winner
    const winner = winners[0] ?? counts[0];
    await resolveVoteTopic(topicId, winner.label);

    // Execute post-resolution action if configured
    if (on_resolve) {
      const result = await executeOnResolve(on_resolve, winner.label);

      // Provision infrastructure if the product vote was won
      if (result.provisionProduct) {
        const { productId } = result.provisionProduct;

        // 1. Create Neon database → get DATABASE_URL
        const databaseUrl = await provisionNeonDatabase(productId);

        // 2. Create GitHub repo from template → get repo name
        const repoName = await createProductRepo(productId);

        // 3. Set DATABASE_URL as a GitHub Actions secret
        await setGitHubRepoSecret(repoName, databaseUrl);

        // 4. Create Vercel project with DATABASE_URL env var
        await deployToVercel(productId, repoName, databaseUrl);
      }
    }

    break;
  }
}
