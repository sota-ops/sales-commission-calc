import type { MonthlyCompensationResult } from "@/types";

/**
 * 報酬額に基づいてランキングを算出する
 * 同額は同順位（タイ）
 */
export function calculateRanking(
  results: readonly MonthlyCompensationResult[]
): MonthlyCompensationResult[] {
  const sorted = [...results].sort(
    (a, b) => b.totalCompensation - a.totalCompensation
  );

  let currentRank = 1;

  return sorted.map((result, index) => {
    if (
      index > 0 &&
      result.totalCompensation < sorted[index - 1].totalCompensation
    ) {
      currentRank = index + 1;
    }

    return { ...result, rank: currentRank };
  });
}
