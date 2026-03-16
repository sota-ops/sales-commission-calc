import { describe, it, expect } from "vitest";
import { calculateGrossProfitIncentive } from "@/lib/commissions/gross-profit-incentive";
import type { CommissionRule, ContractForCalc } from "@/types";

function makeContract(overrides: Partial<ContractForCalc> = {}): ContractForCalc {
  return {
    id: "c1",
    memberId: "m1",
    customerId: "cust1",
    productId: "p1",
    status: "active",
    contractDate: "2026-03-01",
    initialAmount: 0,
    monthlyAmount: 100000,
    grossProfit: 50000,
    isCrossSell: false,
    isRecurring: false,
    ...overrides,
  };
}

const tieredRules: CommissionRule[] = [
  { type: "gross_profit", tierMin: 0, tierMax: 100000, rate: 0.05, flatBonus: 0 },
  { type: "gross_profit", tierMin: 100000, tierMax: 300000, rate: 0.1, flatBonus: 0 },
  { type: "gross_profit", tierMin: 300000, tierMax: null, rate: 0.15, flatBonus: 0 },
];

describe("calculateGrossProfitIncentive", () => {
  it("should return 0 when no rules exist", () => {
    const contracts = [makeContract()];
    const result = calculateGrossProfitIncentive(contracts, []);
    expect(result.total).toBe(0);
    expect(result.details).toHaveLength(0);
  });

  it("should return 0 when no contracts exist", () => {
    const result = calculateGrossProfitIncentive([], tieredRules);
    expect(result.total).toBe(0);
  });

  it("should apply single tier correctly", () => {
    // 50,000 gross profit -> 50,000 * 0.05 = 2,500
    const contracts = [makeContract({ grossProfit: 50000 })];
    const result = calculateGrossProfitIncentive(contracts, tieredRules);
    expect(result.total).toBe(2500);
  });

  it("should apply tiered rates correctly across tiers", () => {
    // 250,000 gross profit:
    // Tier 1: 100,000 * 0.05 = 5,000
    // Tier 2: 150,000 * 0.10 = 15,000
    // Total = 20,000
    const contracts = [makeContract({ grossProfit: 250000 })];
    const result = calculateGrossProfitIncentive(contracts, tieredRules);
    expect(result.total).toBe(20000);
  });

  it("should apply all three tiers", () => {
    // 500,000 gross profit:
    // Tier 1: 100,000 * 0.05 = 5,000
    // Tier 2: 200,000 * 0.10 = 20,000
    // Tier 3: 200,000 * 0.15 = 30,000
    // Total = 55,000
    const contracts = [makeContract({ grossProfit: 500000 })];
    const result = calculateGrossProfitIncentive(contracts, tieredRules);
    expect(result.total).toBe(55000);
  });

  it("should sum gross profit across multiple contracts", () => {
    // Two contracts: 60,000 + 40,000 = 100,000 total
    // Tier 1: 100,000 * 0.05 = 5,000
    const contracts = [
      makeContract({ id: "c1", grossProfit: 60000 }),
      makeContract({ id: "c2", grossProfit: 40000 }),
    ];
    const result = calculateGrossProfitIncentive(contracts, tieredRules);
    expect(result.total).toBe(5000);
    expect(result.details).toHaveLength(2);
  });

  it("should exclude cancelled contracts", () => {
    const contracts = [
      makeContract({ id: "c1", grossProfit: 100000 }),
      makeContract({ id: "c2", grossProfit: 50000, status: "cancelled" }),
    ];
    const result = calculateGrossProfitIncentive(contracts, tieredRules);
    // Only 100,000 counted: 100,000 * 0.05 = 5,000
    expect(result.total).toBe(5000);
  });

  it("should handle flat bonus correctly", () => {
    const rulesWithBonus: CommissionRule[] = [
      { type: "gross_profit", tierMin: 0, tierMax: 100000, rate: 0.05, flatBonus: 10000 },
    ];
    const contracts = [makeContract({ grossProfit: 50000 })];
    const result = calculateGrossProfitIncentive(contracts, rulesWithBonus);
    // 50,000 * 0.05 + 10,000 = 12,500
    expect(result.total).toBe(12500);
  });
});
