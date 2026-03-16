import type { CommissionRule, ContractForCalc, CommissionDetail } from "@/types";

/**
 * クロスセルボーナスを計算する
 * 他の営業が担当している顧客に別商品を販売した場合のボーナス
 */
export function calculateCrossSellBonus(
  contracts: readonly ContractForCalc[],
  rules: readonly CommissionRule[]
): { total: number; details: CommissionDetail[] } {
  const crossSellRules = rules
    .filter((r) => r.type === "cross_sell")
    .sort((a, b) => a.tierMin - b.tierMin);

  if (crossSellRules.length === 0) {
    return { total: 0, details: [] };
  }

  const crossSellContracts = contracts.filter(
    (c) => c.isCrossSell && c.status !== "cancelled"
  );

  const details: CommissionDetail[] = [];
  let total = 0;

  for (const contract of crossSellContracts) {
    let contractBonus = 0;

    for (const rule of crossSellRules) {
      const tierMax = rule.tierMax ?? Infinity;
      if (
        contract.grossProfit >= rule.tierMin &&
        contract.grossProfit < tierMax
      ) {
        contractBonus = contract.grossProfit * rule.rate + rule.flatBonus;
        break;
      }
    }

    if (contractBonus > 0) {
      total += contractBonus;
      details.push({
        contractId: contract.id,
        commissionType: "cross_sell",
        amount: Math.round(contractBonus),
        note: `クロスセル 粗利${contract.grossProfit.toLocaleString()}円`,
      });
    }
  }

  return { total: Math.round(total), details };
}
