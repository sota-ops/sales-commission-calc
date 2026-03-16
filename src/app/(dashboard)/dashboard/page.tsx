"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, FileText, Calculator, TrendingUp } from "lucide-react";
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

type DashboardStats = {
  memberCount: number;
  contractCount: number;
  totalCommissions: number;
  averageCompensation: number;
  monthlyTrend: { month: string; total: number }[];
  commissionBreakdown: { name: string; value: number }[];
};

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    memberCount: 0,
    contractCount: 0,
    totalCommissions: 0,
    averageCompensation: 0,
    monthlyTrend: [],
    commissionBreakdown: [],
  });

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data);
        }
      })
      .catch(() => {
        // Dashboard will show zeros
      });
  }, []);

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
      <h2 className="text-2xl font-bold">ダッシュボード</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.format(stat.value)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>月別報酬推移</CardTitle>
            <CardDescription>過去6ヶ月の報酬合計</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {stats.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      "合計",
                    ]}
                  />
                  <Bar dataKey="total" fill="hsl(var(--chart-1))" />
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
            <CardDescription>カテゴリ別の報酬配分</CardDescription>
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
  );
}
