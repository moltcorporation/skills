import { createAdminClient } from "@/lib/supabase/admin";
import { createGitHubRepo, GITHUB_ORG, slugify, setRepoSecret } from "@/lib/github";
import { createNeonProject } from "@/lib/neon";
import { createVercelProject } from "@/lib/vercel";
import { slackLog } from "@/lib/slack";
import { revalidateTag } from "next/cache";

/**
 * Provision all infrastructure for a new product:
 * 1. Create Neon database
 * 2. Create GitHub repo from template
 * 3. Set DATABASE_URL as GitHub Actions secret
 * 4. Create Vercel project with DATABASE_URL env var
 *
 * Runs async — caller should not await unless they need to block.
 */
export async function provisionProduct(productId: string) {
  const supabase = createAdminClient();

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("name, description")
    .eq("id", productId)
    .single();

  if (fetchError || !product) {
    console.error("[provisioning] Product not found:", fetchError?.message);
    throw new Error(`Product not found: ${fetchError?.message}`);
  }

  // 1. Provision Neon database
  let databaseUrl: string;
  try {
    const neon = await createNeonProject(product.name);
    databaseUrl = neon.databaseUrl;

    await supabase
      .from("products")
      .update({ neon_project_id: neon.projectId })
      .eq("id", productId);

    revalidateTag(`product-${productId}`, "max");
    await slackLog(`🗄️ Neon database provisioned for product ${productId}`);
  } catch (err) {
    console.error("[provisioning] Neon failed:", err);
    throw err;
  }

  // 2. Create GitHub repo
  let repoName: string;
  try {
    const baseSlug = slugify(product.name);
    repoName = baseSlug;
    let suffix = 2;

    // Collision check against github_repo_url
    while (true) {
      const candidateUrl = `https://github.com/${GITHUB_ORG}/${repoName}`;
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("github_repo_url", candidateUrl);

      if (!count) break;
      repoName = `${baseSlug}-${suffix}`;
      suffix++;
    }

    const { repoId, repoUrl } = await createGitHubRepo(
      product.name,
      product.description ?? "",
      repoName,
    );

    await supabase
      .from("products")
      .update({ github_repo_url: repoUrl, github_repo_id: repoId })
      .eq("id", productId);

    revalidateTag(`product-${productId}`, "max");
    await slackLog(`📦 GitHub repo created: ${repoName}`);
  } catch (err) {
    console.error("[provisioning] GitHub failed:", err);
    throw err;
  }

  // 3. Set DATABASE_URL secret on GitHub repo
  try {
    await setRepoSecret(repoName, "DATABASE_URL", databaseUrl);
    await slackLog(`🔑 DATABASE_URL secret set on ${repoName}`);
  } catch (err) {
    console.error("[provisioning] GitHub secret failed:", err);
    throw err;
  }

  // 4. Create Vercel project
  try {
    const { projectId, vercelUrl } = await createVercelProject(repoName, {
      DATABASE_URL: databaseUrl,
    });

    await supabase
      .from("products")
      .update({ live_url: vercelUrl, vercel_project_id: projectId })
      .eq("id", productId);

    revalidateTag(`product-${productId}`, "max");
    await slackLog(`🚀 Vercel project deployed for product ${productId}`);
  } catch (err) {
    console.error("[provisioning] Vercel failed:", err);
    throw err;
  }
}
