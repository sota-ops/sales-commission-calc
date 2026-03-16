import { describe, it, expect } from "vitest";
import { calculateCrossSellBonus } from "@/lib/commissions/cross-sell-bonus";
import type { CommissionRule, ContractForCalc } from "@/types";

function makeContract(overrides: Partial<ContractForCalc> = {}): ContractForCalc {
  return {
    id: "c1",
    memberId: "m1",
    customerId: "cust1",
    productId: "p1",
    status: "active",
    contractDate: "2026-03-01",
    monthlyAmount: 100000,
    grossProfit: 50000,
    isCrossSell: true,
    isRecurring: false,
    ...overrides,
  };
}

const crossSellRules: CommissionRule[] = [
  { type: "cross_sell", tierMin: 0, tierMax: 100000, rate: 0.05, flatBonus: 5000 },
  { type: "cross_sell", tierMin: 100000, tierMax: null, rate: 0.08, flatBonus: 10000 },
];

describe("calculateCrossSellBonus", () => {
  it("should return 0 when no cross-sell contracts", () => {
    const contracts = [makeContract({ isCrossSell: false })];
    const result = calculateCrossSellBonus(contracts, crossSellRules);
    expect(result.total).toBe(0);
  });

  it("should calculate bonus for cross-sell contract in lower tier", () => {
    // 50,000 gross profit -> 50,000 * 0.05 + 5,000 = 7,500
    const contracts = [makeContract({ grossProfit: 50000 })];
    const result = calculateCrossSellBonus(contracts, crossSellRules);
    expect(result.total).toBe(7500);
    expect(result.details).toHaveLength(1);
  });

  it("should calculate bonus for cross-sell contract in upper tier", () => {
    // 150,000 gross profit -> 150,000 * 0.08 + 10,000 = 22,000
    const contracts = [makeContract({ grossProfit: 150000 })];
    const result = calculateCrossSellBonus(contracts, crossSellRules);
    expect(result.total).toBe(22000);
  });

  it("should handle multiple cross-sell contracts", () => {
    const contracts = [
      makeContract({ id: "c1", grossProfit: 50000 }),   // 50,000*0.05+5,000 = 7,500
      makeContract({ id: "c2", grossProfit: 120000 }),   // 120,000*0.08+10,000 = 19,600
    ];
    const result = calculateCrossSellBonus(contracts, crossSellRules);
    expect(result.total).toBe(27100);
    expect(result.details).toHaveLength(2);
  });

  it("should exclude cancelled contracts", () => {
    const contracts = [
      makeContract({ id: "c1", grossProfit: 50000 }),
      makeContract({ id: "c2", grossProfit: 50000, status: "cancelled" }),
    ];
    const result = calculateCrossSellBonus(contracts, crossSellRules);
    expect(result.total).toBe(7500);
  });
});
