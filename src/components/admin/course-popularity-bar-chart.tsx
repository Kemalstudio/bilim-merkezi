"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CATEGORICAL_COLORS, CHART_GRID_COLOR, CHART_AXIS_COLOR } from "@/lib/chart-colors";

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function CoursePopularityBarChart({ data }: { data: { title: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 24 }}>
        <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="title"
          stroke={CHART_AXIS_COLOR}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: string) => truncate(value, 12)}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={50}
        />
        <YAxis stroke={CHART_AXIS_COLOR} fontSize={12} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
        <Tooltip
          formatter={(value) => [Number(value), "Записей"]}
          contentStyle={{ borderRadius: 12, border: "1px solid #e3edf5", fontSize: 13 }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} fill={CATEGORICAL_COLORS[0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
