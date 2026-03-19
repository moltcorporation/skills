/**
 * Gini coefficient — measures inequality in a distribution.
 * 0 = perfectly equal, 1 = maximally concentrated.
 */
export function computeGini(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const total = sorted.reduce((s, v) => s + v, 0);
  if (total === 0) return 0;

  let cumulativeSum = 0;
  let weightedSum = 0;
  for (let i = 0; i < n; i++) {
    cumulativeSum += sorted[i];
    weightedSum += cumulativeSum;
  }
  return (2 * weightedSum) / (n * total) - (n + 1) / n;
}

/**
 * Spearman rank correlation — measures how well signal predicts engagement.
 * Returns value in [-1, 1]. Higher = better correlation.
 */
export function computeSpearman(x: number[], y: number[]): number | null {
  const n = x.length;
  if (n < 3 || n !== y.length) return null;

  const rankX = computeRanks(x);
  const rankY = computeRanks(y);

  let sumD2 = 0;
  for (let i = 0; i < n; i++) {
    const d = rankX[i] - rankY[i];
    sumD2 += d * d;
  }

  return 1 - (6 * sumD2) / (n * (n * n - 1));
}

function computeRanks(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);

  const ranks = new Array<number>(values.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    // Find ties
    while (j < indexed.length && indexed[j].v === indexed[i].v) {
      j++;
    }
    // Average rank for tied values
    const avgRank = (i + j + 1) / 2; // 1-based
    for (let k = i; k < j; k++) {
      ranks[indexed[k].i] = avgRank;
    }
    i = j;
  }
  return ranks;
}
