"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BRAND_SERIES_COLOR, CHART_AXIS_COLOR, CHART_GRID_COLOR } from "@/lib/chart-colors";
import type { ExamPoint } from "@/lib/children-data";

/**
 * A child's exam history as a percentage of the maximum score, so exams marked
 * out of 100 and out of 40 sit on one comparable axis. Single series — the
 * question a parent has is "is it going up?", not "how do subjects compare?".
 */
export function ExamProgressChart({
  exams,
  averagePercent,
}: {
  exams: ExamPoint[];
  averagePercent: number | null;
}) {
  const data = exams.map((exam) => ({
    label: new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(
      new Date(exam.examDate)
    ),
    percent: exam.percent,
    examName: exam.examName,
    score: exam.score,
    maxScore: exam.maxScore,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="exam-progress-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND_SERIES_COLOR} stopOpacity={0.28} />
            <stop offset="100%" stopColor={BRAND_SERIES_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="label"
          stroke={CHART_AXIS_COLOR}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          unit="%"
          stroke={CHART_AXIS_COLOR}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        {averagePercent != null && (
          <ReferenceLine
            y={averagePercent}
            stroke={CHART_AXIS_COLOR}
            strokeDasharray="4 4"
            label={{
              value: `среднее ${averagePercent}%`,
              position: "insideTopRight",
              fill: CHART_AXIS_COLOR,
              fontSize: 11,
            }}
          />
        )}
        <Tooltip
          cursor={{ stroke: CHART_GRID_COLOR }}
          contentStyle={{ borderRadius: 12, border: `1px solid ${CHART_GRID_COLOR}`, fontSize: 13 }}
          formatter={(value, _name, item) => [
            `${value}% · ${item.payload.score} из ${item.payload.maxScore}`,
            item.payload.examName,
          ]}
        />
        <Area
          type="monotone"
          dataKey="percent"
          stroke={BRAND_SERIES_COLOR}
          strokeWidth={2.5}
          fill="url(#exam-progress-fill)"
          dot={{ r: 4, fill: BRAND_SERIES_COLOR }}
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
