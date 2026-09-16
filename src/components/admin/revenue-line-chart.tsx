"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { BRAND_SERIES_COLOR, CHART_GRID_COLOR, CHART_AXIS_COLOR } from "@/lib/chart-colors";
import { formatCurrency } from "@/lib/utils";

export function RevenueLineChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
        <XAxis dataKey="month" stroke={CHART_AXIS_COLOR} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke={CHART_AXIS_COLOR} fontSize={12} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          formatter={(value) => [formatCurrency(Number(value)), "Доход"]}
          contentStyle={{ borderRadius: 12, border: "1px solid #e3edf5", fontSize: 13 }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke={BRAND_SERIES_COLOR}
          strokeWidth={2.5}
          dot={{ r: 4, fill: BRAND_SERIES_COLOR }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
