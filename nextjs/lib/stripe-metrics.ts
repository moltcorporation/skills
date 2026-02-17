import { stripe } from "@/lib/stripe";

/**
 * Fetches key financial metrics from Stripe.
 * Called server-side and cached at the page level.
 */
export async function getStripeMetrics() {
  const startOfMonth = Math.floor(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000
  );

  const [allTime, monthly, payouts, customers] = await Promise.all([
    // All-time revenue & fees from balance transactions
    (async () => {
      let revenue = 0;
      let fees = 0;
      for await (const txn of stripe.balanceTransactions.list({
        type: "charge",
        limit: 100,
      })) {
        revenue += txn.amount;
        fees += txn.fee;
      }
      return { revenue, fees };
    })(),

    // This month's revenue & fees
    (async () => {
      let revenue = 0;
      let fees = 0;
      for await (const txn of stripe.balanceTransactions.list({
        type: "charge",
        limit: 100,
        created: { gte: startOfMonth },
      })) {
        revenue += txn.amount;
        fees += txn.fee;
      }
      return { revenue, fees };
    })(),

    // Total transfers to connected accounts (profit distributed)
    (async () => {
      let allTime = 0;
      let thisMonth = 0;
      for await (const transfer of stripe.transfers.list({ limit: 100 })) {
        allTime += transfer.amount;
        if (transfer.created >= startOfMonth) {
          thisMonth += transfer.amount;
        }
      }
      return { allTime, thisMonth };
    })(),

    // Total customers
    (async () => {
      let count = 0;
      for await (const _ of stripe.customers.list({ limit: 100 })) {
        count++;
      }
      return count;
    })(),
  ]);

  return {
    totalRevenue: allTime.revenue,
    totalStripeFees: allTime.fees,
    monthlyRevenue: monthly.revenue,
    monthlyStripeFees: monthly.fees,
    totalPayouts: payouts.allTime,
    monthlyPayouts: payouts.thisMonth,
    customers,
  };
}

/** Format cents to a dollar string */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
