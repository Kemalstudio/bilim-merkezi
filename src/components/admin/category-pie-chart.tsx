"use client";

import { Pie, PieChart, Cell, Tooltip, Legend, ResponsiveContainer, type PieLabelRenderProps } from "recharts";
import { CATEGORICAL_COLORS } from "@/lib/chart-colors";

function renderCategoryLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelRenderProps) {
  // Percentage only, placed inside the ring — the legend below carries full
  // category names, so this never risks clipping against the SVG viewBox.
  const RADIAN = Math.PI / 180;
  const numericCx = Number(cx);
  const numericCy = Number(cy);
  const numericInnerRadius = Number(innerRadius);
  const numericOuterRadius = Number(outerRadius);
  const angle = Number(midAngle ?? 0);
  const radius = numericInnerRadius + (numericOuterRadius - numericInnerRadius) / 2;
  const x = numericCx + radius * Math.cos(-angle * RADIAN);
  const y = numericCy + radius * Math.sin(-angle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill="#ffffff"
      fontSize={12}
      fontWeight={600}
      stroke="rgba(13, 13, 13, 0.45)"
      strokeWidth={3}
      paintOrder="stroke"
    >
      {`${Math.round((percent ?? 0) * 100)}%`}
    </text>
  );
}

export function CategoryPieChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
          label={renderCategoryLabel}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length]}
              stroke="#ffffff"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value} записей`, name]}
          contentStyle={{ borderRadius: 12, border: "1px solid #e3edf5", fontSize: 13 }}
        />
        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
