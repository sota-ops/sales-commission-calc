import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ──────────────────────────────────────────
export const roleEnum = pgEnum("role", ["admin", "manager", "viewer"]);
export const contractStatusEnum = pgEnum("contract_status", [
  "active",
  "cancelled",
  "pending",
]);
export const commissionTypeEnum = pgEnum("commission_type", [
  "gross_profit",
  "stock",
  "cross_sell",
  "company_profit",
]);

// ── Teams ──────────────────────────────────────────
export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Sales Members ──────────────────────────────────
export const salesMembers = pgTable("sales_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: roleEnum("role").default("viewer").notNull(),
  teamId: uuid("team_id").references(() => teams.id),
  baseSalary: numeric("base_salary", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  joinDate: date("join_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Customers ──────────────────────────────────────
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  industry: text("industry"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Products ───────────────────────────────────────
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  initialPrice: numeric("initial_price", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  monthlyPrice: numeric("monthly_price", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Contracts ──────────────────────────────────────
export const contracts = pgTable("contracts", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: uuid("member_id")
    .references(() => salesMembers.id)
    .notNull(),
  customerId: uuid("customer_id")
    .references(() => customers.id)
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  status: contractStatusEnum("status").default("active").notNull(),
  contractDate: date("contract_date").notNull(),
  initialAmount: numeric("initial_amount", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  monthlyAmount: numeric("monthly_amount", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  grossProfit: numeric("gross_profit", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  isCrossSell: boolean("is_cross_sell").default(false).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Commission Rules ───────────────────────────────
export const commissionRules = pgTable("commission_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title"),
  type: commissionTypeEnum("type").notNull(),
  tierMin: numeric("tier_min", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  tierMax: numeric("tier_max", { precision: 12, scale: 2 }),
  rate: numeric("rate", { precision: 5, scale: 4 }).notNull(),
  flatBonus: numeric("flat_bonus", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Company Profit Monthly ─────────────────────────
export const companyProfitMonthly = pgTable("company_profit_monthly", {
  id: uuid("id").defaultRandom().primaryKey(),
  yearMonth: text("year_month").notNull(), // "2026-03"
  totalRevenue: numeric("total_revenue", { precision: 14, scale: 2 })
    .default("0")
    .notNull(),
  totalCost: numeric("total_cost", { precision: 14, scale: 2 })
    .default("0")
    .notNull(),
  netProfit: numeric("net_profit", { precision: 14, scale: 2 })
    .default("0")
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Activity Scores ────────────────────────────────
export const activityScores = pgTable("activity_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: uuid("member_id")
    .references(() => salesMembers.id)
    .notNull(),
  yearMonth: text("year_month").notNull(),
  newContracts: integer("new_contracts").default(0).notNull(),
  meetingCount: integer("meeting_count").default(0).notNull(),
  callCount: integer("call_count").default(0).notNull(),
  score: numeric("score", { precision: 8, scale: 2 })
    .default("0")
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Monthly Commissions ────────────────────────────
export const monthlyCommissions = pgTable("monthly_commissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  memberId: uuid("member_id")
    .references(() => salesMembers.id)
    .notNull(),
  yearMonth: text("year_month").notNull(),
  baseSalary: numeric("base_salary", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  grossProfitIncentive: numeric("gross_profit_incentive", {
    precision: 12,
    scale: 2,
  })
    .default("0")
    .notNull(),
  stockIncentive: numeric("stock_incentive", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  crossSellBonus: numeric("cross_sell_bonus", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  companyProfitBonus: numeric("company_profit_bonus", {
    precision: 12,
    scale: 2,
  })
    .default("0")
    .notNull(),
  totalCompensation: numeric("total_compensation", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  rank: integer("rank"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ── Monthly Commission Details ─────────────────────
export const monthlyCommissionDetails = pgTable(
  "monthly_commission_details",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    monthlyCommissionId: uuid("monthly_commission_id")
      .references(() => monthlyCommissions.id)
      .notNull(),
    contractId: uuid("contract_id")
      .references(() => contracts.id)
      .notNull(),
    commissionType: commissionTypeEnum("commission_type").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    note: text("note"),
  }
);

// ── Relations ──────────────────────────────────────
export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(salesMembers),
}));

export const salesMembersRelations = relations(
  salesMembers,
  ({ one, many }) => ({
    team: one(teams, {
      fields: [salesMembers.teamId],
      references: [teams.id],
    }),
    contracts: many(contracts),
    activityScores: many(activityScores),
    monthlyCommissions: many(monthlyCommissions),
  })
);

export const customersRelations = relations(customers, ({ many }) => ({
  contracts: many(contracts),
}));

export const productsRelations = relations(products, ({ many }) => ({
  contracts: many(contracts),
}));

export const contractsRelations = relations(contracts, ({ one }) => ({
  member: one(salesMembers, {
    fields: [contracts.memberId],
    references: [salesMembers.id],
  }),
  customer: one(customers, {
    fields: [contracts.customerId],
    references: [customers.id],
  }),
  product: one(products, {
    fields: [contracts.productId],
    references: [products.id],
  }),
}));

export const monthlyCommissionsRelations = relations(
  monthlyCommissions,
  ({ one, many }) => ({
    member: one(salesMembers, {
      fields: [monthlyCommissions.memberId],
      references: [salesMembers.id],
    }),
    details: many(monthlyCommissionDetails),
  })
);

export const monthlyCommissionDetailsRelations = relations(
  monthlyCommissionDetails,
  ({ one }) => ({
    monthlyCommission: one(monthlyCommissions, {
      fields: [monthlyCommissionDetails.monthlyCommissionId],
      references: [monthlyCommissions.id],
    }),
    contract: one(contracts, {
      fields: [monthlyCommissionDetails.contractId],
      references: [contracts.id],
    }),
  })
);
