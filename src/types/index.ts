import { z } from "zod";

// ── Shared Zod Schemas ────────────────────────────

export const teamSchema = z.object({
  name: z.string().min(1, "チーム名は必須です"),
});

export const salesMemberSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  role: z.enum(["admin", "manager", "viewer"]),
  teamId: z.string().uuid().nullable(),
  baseSalary: z.coerce.number().min(0, "固定給は0以上で入力してください"),
  joinDate: z.string().min(1, "入社日は必須です"),
});

export const customerSchema = z.object({
  name: z.string().min(1, "顧客名は必須です"),
  industry: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(1, "商品名は必須です"),
  category: z.string().min(1, "カテゴリは必須です"),
  initialPrice: z.coerce.number().min(0),
  monthlyPrice: z.coerce.number().min(0),
  isRecurring: z.boolean(),
});

export const contractSchema = z.object({
  memberId: z.string().uuid("担当者を選択してください"),
  customerId: z.string().uuid("顧客を選択してください"),
  productId: z.string().uuid("商品を選択してください"),
  status: z.enum(["active", "cancelled", "pending"]),
  contractDate: z.string().min(1, "契約日は必須です"),
  initialAmount: z.coerce.number().min(0),
  monthlyAmount: z.coerce.number().min(0),
  grossProfit: z.coerce.number().min(0),
  isCrossSell: z.boolean(),
  note: z.string().optional(),
});

export const commissionRuleSchema = z.object({
  title: z.string().optional(),
  type: z.enum(["gross_profit", "stock", "cross_sell", "company_profit"]),
  tierMin: z.coerce.number().min(0),
  tierMax: z.coerce.number().nullable(),
  rate: z.coerce.number().min(0).max(1),
  flatBonus: z.coerce.number().min(0),
  description: z.string().optional(),
});

export const companyProfitSchema = z.object({
  yearMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "YYYY-MM形式で入力してください"),
  totalRevenue: z.coerce.number().min(0),
  totalCost: z.coerce.number().min(0),
});

// ── Inferred Types ────────────────────────────────
export type TeamInput = z.infer<typeof teamSchema>;
export type SalesMemberInput = z.infer<typeof salesMemberSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type ContractInput = z.infer<typeof contractSchema>;
export type CommissionRuleInput = z.infer<typeof commissionRuleSchema>;
export type CompanyProfitInput = z.infer<typeof companyProfitSchema>;

// ── Commission Calculation Types ──────────────────
export type CommissionRule = {
  type: "gross_profit" | "stock" | "cross_sell" | "company_profit";
  tierMin: number;
  tierMax: number | null;
  rate: number;
  flatBonus: number;
};

export type ContractForCalc = {
  id: string;
  memberId: string;
  customerId: string;
  productId: string;
  status: "active" | "cancelled" | "pending";
  contractDate: string;
  initialAmount: number;
  monthlyAmount: number;
  grossProfit: number;
  isCrossSell: boolean;
  isRecurring: boolean;
};

export type MemberForCalc = {
  id: string;
  name: string;
  baseSalary: number;
  teamId: string | null;
};

export type CompanyProfitForCalc = {
  yearMonth: string;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
};

export type MonthlyCompensationResult = {
  memberId: string;
  memberName: string;
  yearMonth: string;
  baseSalary: number;
  grossProfitIncentive: number;
  stockIncentive: number;
  crossSellBonus: number;
  companyProfitBonus: number;
  totalCompensation: number;
  rank?: number;
  details: CommissionDetail[];
};

export type CommissionDetail = {
  contractId: string;
  commissionType: "gross_profit" | "stock" | "cross_sell" | "company_profit";
  amount: number;
  note: string;
};
