import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log("Seeding database...");

  // Teams
  const [team1, team2] = await db
    .insert(schema.teams)
    .values([
      { name: "第1営業部" },
      { name: "第2営業部" },
    ])
    .returning();

  console.log("Teams created");

  // Members
  const [m1, m2, m3] = await db
    .insert(schema.salesMembers)
    .values([
      {
        name: "田中太郎",
        email: "tanaka@example.com",
        role: "admin",
        teamId: team1.id,
        baseSalary: "300000",
        joinDate: "2024-04-01",
      },
      {
        name: "鈴木花子",
        email: "suzuki@example.com",
        role: "manager",
        teamId: team1.id,
        baseSalary: "250000",
        joinDate: "2024-06-01",
      },
      {
        name: "佐藤健",
        email: "sato@example.com",
        role: "viewer",
        teamId: team2.id,
        baseSalary: "220000",
        joinDate: "2025-01-15",
      },
    ])
    .returning();

  console.log("Members created");

  // Customers
  const [cust1, cust2, cust3] = await db
    .insert(schema.customers)
    .values([
      { name: "ABC株式会社", industry: "IT" },
      { name: "DEF商事", industry: "商社" },
      { name: "GHI工業", industry: "製造" },
    ])
    .returning();

  console.log("Customers created");

  // Products
  const [p1, p2, p3] = await db
    .insert(schema.products)
    .values([
      {
        name: "クラウドERP",
        category: "SaaS",
        unitPrice: "100000",
        isRecurring: true,
      },
      {
        name: "導入コンサルティング",
        category: "サービス",
        unitPrice: "500000",
        isRecurring: false,
      },
      {
        name: "保守サポート",
        category: "サポート",
        unitPrice: "30000",
        isRecurring: true,
      },
    ])
    .returning();

  console.log("Products created");

  // Contracts
  await db.insert(schema.contracts).values([
    {
      memberId: m1.id,
      customerId: cust1.id,
      productId: p1.id,
      status: "active",
      contractDate: "2026-03-05",
      monthlyAmount: "100000",
      grossProfit: "200000",
      isCrossSell: false,
    },
    {
      memberId: m1.id,
      customerId: cust2.id,
      productId: p2.id,
      status: "active",
      contractDate: "2026-03-10",
      monthlyAmount: "500000",
      grossProfit: "350000",
      isCrossSell: false,
    },
    {
      memberId: m2.id,
      customerId: cust1.id,
      productId: p3.id,
      status: "active",
      contractDate: "2026-02-01",
      monthlyAmount: "30000",
      grossProfit: "15000",
      isCrossSell: true,
    },
    {
      memberId: m2.id,
      customerId: cust3.id,
      productId: p1.id,
      status: "active",
      contractDate: "2026-03-15",
      monthlyAmount: "100000",
      grossProfit: "180000",
      isCrossSell: false,
    },
    {
      memberId: m3.id,
      customerId: cust2.id,
      productId: p1.id,
      status: "active",
      contractDate: "2026-01-20",
      monthlyAmount: "100000",
      grossProfit: "150000",
      isCrossSell: false,
    },
    {
      memberId: m3.id,
      customerId: cust3.id,
      productId: p2.id,
      status: "active",
      contractDate: "2026-03-01",
      monthlyAmount: "300000",
      grossProfit: "220000",
      isCrossSell: true,
    },
  ]);

  console.log("Contracts created");

  // Commission Rules
  await db.insert(schema.commissionRules).values([
    {
      type: "gross_profit",
      tierMin: "0",
      tierMax: "100000",
      rate: "0.05",
      flatBonus: "0",
      description: "粗利10万円まで 5%",
    },
    {
      type: "gross_profit",
      tierMin: "100000",
      tierMax: "300000",
      rate: "0.10",
      flatBonus: "0",
      description: "粗利10-30万円 10%",
    },
    {
      type: "gross_profit",
      tierMin: "300000",
      tierMax: null,
      rate: "0.15",
      flatBonus: "0",
      description: "粗利30万円超 15%",
    },
    {
      type: "stock",
      tierMin: "0",
      tierMax: "200000",
      rate: "0.03",
      flatBonus: "0",
      description: "ストック月額20万円まで 3%",
    },
    {
      type: "stock",
      tierMin: "200000",
      tierMax: null,
      rate: "0.05",
      flatBonus: "0",
      description: "ストック月額20万円超 5%",
    },
    {
      type: "cross_sell",
      tierMin: "0",
      tierMax: null,
      rate: "0.05",
      flatBonus: "5000",
      description: "クロスセル 粗利5% + 5,000円",
    },
    {
      type: "company_profit",
      tierMin: "0",
      tierMax: null,
      rate: "0.02",
      flatBonus: "0",
      description: "会社利益の2%を全員で分配",
    },
  ]);

  console.log("Commission rules created");

  // Company Profit
  await db.insert(schema.companyProfitMonthly).values([
    {
      yearMonth: "2026-01",
      totalRevenue: "8000000",
      totalCost: "5000000",
      netProfit: "3000000",
    },
    {
      yearMonth: "2026-02",
      totalRevenue: "9500000",
      totalCost: "5500000",
      netProfit: "4000000",
    },
    {
      yearMonth: "2026-03",
      totalRevenue: "12000000",
      totalCost: "7000000",
      netProfit: "5000000",
    },
  ]);

  console.log("Company profits created");
  console.log("Seed complete!");

  await client.end();
}

seed().catch(console.error);
