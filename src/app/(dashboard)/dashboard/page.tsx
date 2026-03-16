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
  "#1B96FF",
  "#9B59B6",
  "#06A59A",
  "#0176D3",
  "#032D60",
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

const STAT_STYLES = [
  { gradient: "from-[#0176D3] to-[#1B96FF]", glow: "glow-blue" },
  { gradient: "from-[#9B59B6] to-[#C39BD3]", glow: "glow-purple" },
  { gradient: "from-[#06A59A] to-[#48C9B0]", glow: "glow-teal" },
  { gradient: "from-[#0176D3] to-[#9B59B6]", glow: "glow-blue" },
];

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
      <h2 className="text-2xl font-bold text-gradient-sf">ダッシュボード</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card
            key={stat.title}
            className="group relative overflow-hidden rounded-2xl border-border/30 glass-card transition-all duration-300 hover:border-[#0176D3]/30 hover:glow-blue-sm"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${STAT_STYLES[index].gradient} transition-shadow duration-300 group-hover:${STAT_STYLES[index].glow}`}
              >
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.format(stat.value)}
              </div>
            </CardContent>
            {/* Subtle gradient accent at bottom */}
            <div className={`absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r ${STAT_STYLES[index].gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl border-border/30 glass-card">
          <CardHeader>
            <CardTitle className="text-gradient-sf">月別報酬推移</CardTitle>
            <CardDescription>過去6ヶ月の報酬合計</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {stats.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" tick={{ fill: "rgba(255,255,255,0.5)" }} />
                  <YAxis tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} stroke="rgba(255,255,255,0.4)" tick={{ fill: "rgba(255,255,255,0.5)" }} />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      "合計",
                    ]}
                    contentStyle={{
                      backgroundColor: "rgba(3, 45, 96, 0.9)",
                      border: "1px solid rgba(27, 150, 255, 0.3)",
                      borderRadius: "12px",
                      backdropFilter: "blur(12px)",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="total" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1B96FF" />
                      <stop offset="100%" stopColor="#0176D3" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                データがありません
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/30 glass-card">
          <CardHeader>
            <CardTitle className="text-gradient-sf">報酬内訳</CardTitle>
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
                    stroke="rgba(0,0,0,0.2)"
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
                      backgroundColor: "rgba(3, 45, 96, 0.9)",
                      border: "1px solid rgba(27, 150, 255, 0.3)",
                      borderRadius: "12px",
                      backdropFilter: "blur(12px)",
                      color: "#fff",
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
  );
}
