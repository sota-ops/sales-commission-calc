import { describe, it, expect } from "vitest";
import { calculateStockIncentive } from "@/lib/commissions/stock-incentive";
import type { CommissionRule, ContractForCalc } from "@/types";

function makeContract(overrides: Partial<ContractForCalc> = {}): ContractForCalc {
  return {
    id: "c1",
    memberId: "m1",
    customerId: "cust1",
    productId: "p1",
    status: "active",
    contractDate: "2026-01-01",
    initialAmount: 0,
    monthlyAmount: 50000,
    grossProfit: 20000,
    isCrossSell: false,
    isRecurring: true,
    ...overrides,
  };
}

const stockRules: CommissionRule[] = [
  { type: "stock", tierMin: 0, tierMax: 200000, rate: 0.03, flatBonus: 0 },
  { type: "stock", tierMin: 200000, tierMax: null, rate: 0.05, flatBonus: 0 },
];

describe("calculateStockIncentive", () => {
  it("should return 0 when no rules exist", () => {
    const result = calculateStockIncentive([makeContract()], []);
    expect(result.total).toBe(0);
  });

  it("should return 0 when no recurring contracts exist", () => {
    const contracts = [makeContract({ isRecurring: false })];
    const result = calculateStockIncentive(contracts, stockRules);
    expect(result.total).toBe(0);
  });

  it("should calculate stock incentive for recurring contracts", () => {
    // 50,000 monthly * 0.03 = 1,500
    const contracts = [makeContract({ monthlyAmount: 50000 })];
    const result = calculateStockIncentive(contracts, stockRules);
    expect(result.total).toBe(1500);
  });

  it("should apply tiered rates for large stock", () => {
    // 300,000 monthly:
    // Tier 1: 200,000 * 0.03 = 6,000
    // Tier 2: 100,000 * 0.05 = 5,000
    // Total = 11,000
    const contracts = [makeContract({ monthlyAmount: 300000 })];
    const result = calculateStockIncentive(contracts, stockRules);
    expect(result.total).toBe(11000);
  });

  it("should exclude cancelled and non-recurring contracts", () => {
    const contracts = [
      makeContract({ id: "c1", monthlyAmount: 100000, isRecurring: true }),
      makeContract({ id: "c2", monthlyAmount: 50000, isRecurring: false }),
      makeContract({ id: "c3", monthlyAmount: 80000, isRecurring: true, status: "cancelled" }),
    ];
    // Only c1 counts: 100,000 * 0.03 = 3,000
    const result = calculateStockIncentive(contracts, stockRules);
    expect(result.total).toBe(3000);
  });
});
