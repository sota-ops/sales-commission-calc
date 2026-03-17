"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, FileText, Calculator, TrendingUp, Trophy, Crown, Medal } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type MemberRanking = {
  id: string;
  name: string;
  totalSales: number;
  totalProfit: number;
  contractCount: number;
  commission: number;
  rank: number | null;
};

type DashboardStats = {
  memberCount: number;
  contractCount: number;
  totalCommissions: number;
  averageCompensation: number;
  monthlyTrend: { month: string; total: number }[];
  commissionBreakdown: { name: string; value: number }[];
  memberRanking: MemberRanking[];
};

const COLORS = [
  "oklch(0.55 0.15 250)",
  "oklch(0.6 0.12 170)",
  "oklch(0.55 0.14 30)",
  "oklch(0.6 0.1 290)",
  "oklch(0.55 0.1 60)",
];

function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

const STAT_ICONS = [Users, FileText, Calculator, TrendingUp];

const emptyStats: DashboardStats = {
  memberCount: 0,
  contractCount: 0,
  totalCommissions: 0,
  averageCompensation: 0,
  monthlyTrend: [],
  commissionBreakdown: [],
  memberRanking: [],
};

export default function DashboardPage() {
  const [fromMonth, setFromMonth] = useState(getCurrentYearMonth());
  const [toMonth, setToMonth] = useState(getCurrentYearMonth());
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback((from: string, to: string) => {
    setLoading(true);
    fetch(`/api/dashboard?from=${from}&to=${to}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data);
        }
      })
      .catch(() => {
        // Dashboard will show zeros
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData(fromMonth, toMonth);
  }, [fromMonth, toMonth, fetchData]);

  const statCards = [
    {
      title: "営業メンバー",
      value: stats.memberCount,
      icon: Users,
      format: (v: number) => `${v}名`,
    },
    {
      title: "契約数",
      value: stats.contractCount,
      icon: FileText,
      format: (v: number) => `${v}件`,
    },
    {
      title: "報酬総額",
      value: stats.totalCommissions,
      icon: Calculator,
      format: formatCurrency,
    },
    {
      title: "平均報酬",
      value: stats.averageCompensation,
      icon: TrendingUp,
      format: formatCurrency,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">ダッシュボード</h2>

        {/* Month Range Selector */}
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">対象月</Label>
          <Input
            type="month"
            value={fromMonth}
            onChange={(e) => {
              setFromMonth(e.target.value);
              if (e.target.value > toMonth) setToMonth(e.target.value);
            }}
            className="w-[160px]"
          />
          <span className="text-sm text-muted-foreground">〜</span>
          <Input
            type="month"
            value={toMonth}
            onChange={(e) => {
              setToMonth(e.target.value);
              if (e.target.value < fromMonth) setFromMonth(e.target.value);
            }}
            className="w-[160px]"
          />
        </div>
      </div>

      {/* Loading overlay */}
      <div className={`transition-opacity duration-200 ${loading ? "opacity-50" : "opacity-100"}`}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.format(stat.value)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Member Ranking Table */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              個人別ランキング
            </CardTitle>
            <CardDescription>
              {fromMonth === toMonth ? fromMonth : `${fromMonth} 〜 ${toMonth}`} の売上・利益・契約数・歩合報酬
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.memberRanking.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">順位</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">名前</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">売上</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">粗利</th>
                      <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">契約数</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">歩合報酬</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.memberRanking.map((member, index) => (
                      <tr
                        key={member.id}
                        className="border-b last:border-0 transition-colors hover:bg-muted/50"
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            {index === 0 ? (
                              <Crown className="h-5 w-5 text-yellow-500" />
                            ) : index === 1 ? (
                              <Medal className="h-5 w-5 text-gray-400" />
                            ) : index === 2 ? (
                              <Medal className="h-5 w-5 text-amber-600" />
                            ) : (
                              <span className="ml-1 text-sm text-muted-foreground">{index + 1}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-medium">{member.name}</span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="text-sm">{formatCurrency(member.totalSales)}</span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="text-sm text-emerald-600">{formatCurrency(member.totalProfit)}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-full bg-primary/10 px-2 text-sm font-medium text-primary">
                            {member.contractCount}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="font-semibold text-primary">{formatCurrency(member.commission)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                データがありません
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>月別報酬推移</CardTitle>
              <CardDescription>
                {fromMonth === toMonth ? fromMonth : `${fromMonth} 〜 ${toMonth}`} の月別推移
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {stats.monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#9ca3af" tick={{ fill: "#6b7280" }} />
                    <YAxis tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} stroke="#9ca3af" tick={{ fill: "#6b7280" }} />
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(Number(value)),
                        "合計",
                      ]}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Bar dataKey="total" fill="oklch(0.55 0.15 250)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  データがありません
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>報酬内訳</CardTitle>
              <CardDescription>
                {fromMonth === toMonth ? fromMonth : `${fromMonth} 〜 ${toMonth}`} のカテゴリ別報酬配分
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {stats.commissionBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.commissionBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {stats.commissionBreakdown.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value))]}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  データがありません
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
