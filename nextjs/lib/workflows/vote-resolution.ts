import { runSystemAgent } from "@/lib/ai/system-agent";
import { extendVoteDeadline, getVoteDetail, resolveVote } from "@/lib/data/votes";
import { platformConfig } from "@/lib/platform-config";
import { slackLog } from "@/lib/slack";
import { sleep } from "workflow";

// ======================================================
// Step functions ("use step" — full Node.js access)
// ======================================================

async function countBallots(voteId: string) {
  "use step";

  console.log(`[vote-workflow] counting ballots for vote ${voteId}`);
  const { data } = await getVoteDetail(voteId);
  if (!data) throw new Error(`Vote ${voteId} not found`);

  const { vote, tally } = data;
  const totalBallots = Object.values(tally).reduce((sum, n) => sum + n, 0);
  console.log(`[vote-workflow] vote ${voteId}: ${totalBallots} ballot(s), tally:`, tally);

  if (totalBallots === 0) {
    console.log(`[vote-workflow] vote ${voteId}: no ballots → no_quorum`);
    return { winningOption: null, outcome: "no_quorum", isTie: false };
  }

  const maxCount = Math.max(...Object.values(tally));
  const topOptions = Object.entries(tally).filter(([, count]) => count === maxCount);

  if (topOptions.length > 1) {
    console.log(`[vote-workflow] vote ${voteId}: tie between ${topOptions.map(([opt]) => opt).join(", ")}`);
    return {
      winningOption: null,
      outcome: `tie between: ${topOptions.map(([opt]) => opt).join(", ")}`,
      isTie: true,
    };
  }

  const winningOption = topOptions[0][0];
  console.log(`[vote-workflow] vote ${voteId}: winner "${winningOption}" (${maxCount}/${totalBallots})`);
  return {
    winningOption,
    outcome: `approved: ${winningOption} (${maxCount}/${totalBallots} votes)`,
    isTie: false,
  };
}

async function persistResolution(
  voteId: string,
  result: { winningOption: string | null; outcome: string },
) {
  "use step";

  console.log(`[vote-workflow] persisting resolution for vote ${voteId}: ${result.outcome}`);
  await resolveVote({
    voteId,
    winningOption: result.winningOption,
    outcome: result.outcome,
  });
  console.log(`[vote-workflow] vote ${voteId} resolved successfully`);

  await slackLog(`Vote ${voteId} resolved: ${result.outcome}`);
}

async function extendDeadline(voteId: string) {
  "use step";

  console.log(`[vote-workflow] extending deadline for tied vote ${voteId}`);
  const { newDeadline } = await extendVoteDeadline({ voteId });
  await slackLog(
    `Vote ${voteId} tied — deadline extended by ${platformConfig.voting.tieExtensionHours}h to ${newDeadline}`,
  );

  return { newDeadline };
}

async function invokeSystemAgent(voteId: string) {
  "use step";

  console.log(`[vote-workflow] triggering system agent for vote ${voteId}`);
  await runSystemAgent({
    prompt: `A vote has closed. The vote ID is ${voteId}. Read the vote to understand the decision, then take the appropriate platform action.`,
    trigger: { type: "vote_resolution", id: voteId },
  });
}

// ======================================================
// Workflow function ("use workflow" — sandboxed, durable)
// ======================================================

export async function voteResolutionWorkflow(
  voteId: string,
  deadline: string,
) {
  "use workflow";

  console.log(`[vote-workflow] started for vote ${voteId}, deadline: ${deadline}`);

  // Sleep until the deadline (skip if already passed)
  const msUntilDeadline = new Date(deadline).getTime() - Date.now();
  if (msUntilDeadline > 0) {
    console.log(`[vote-workflow] sleeping ${Math.round(msUntilDeadline / 1000)}s until deadline`);
    await sleep(`${msUntilDeadline}ms`);
  }

  console.log(`[vote-workflow] deadline reached for vote ${voteId}, counting ballots`);

  // Recount loop — handles ties by extending and re-sleeping
  while (true) {
    const result = await countBallots(voteId);

    // No ballots → close with no_quorum, no agent
    if (result.outcome === "no_quorum") {
      await persistResolution(voteId, result);
      console.log(`[vote-workflow] vote ${voteId} finished (no_quorum)`);
      return;
    }

    // Tie → extend deadline, sleep, recount
    if (result.isTie) {
      const { newDeadline } = await extendDeadline(voteId);
      const extensionMs = new Date(newDeadline).getTime() - Date.now();
      if (extensionMs > 0) {
        console.log(`[vote-workflow] sleeping ${Math.round(extensionMs / 1000)}s until extended deadline`);
        await sleep(`${extensionMs}ms`);
      }
      continue;
    }

    // Winner → resolve and invoke system agent
    await persistResolution(voteId, result);
    await invokeSystemAgent(voteId);
    console.log(`[vote-workflow] vote ${voteId} finished (resolved + agent triggered)`);
    return;
  }
}
