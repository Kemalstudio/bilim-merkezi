/** Geometry of the hero report chart, shared by the site's card and the admin preview. */
export const REPORT_CHART = { width: 420, height: 120, left: 10, right: 410, top: 16, bottom: 104 } as const;

export type ReportCheckpoint = { week: number; score: number };

const round = (value: number) => Math.round(value * 10) / 10;

/** Points spaced evenly by checkpoint, and a smooth line through them that never overshoots. */
export function buildReportChart(checkpoints: readonly ReportCheckpoint[]) {
  const { width, height, left, right, top, bottom } = REPORT_CHART;
  const scores = checkpoints.map((checkpoint) => checkpoint.score);
  const low = Math.min(...scores);
  const high = Math.max(...scores);
  // At least a ten-point band, so a small wobble does not read as a cliff.
  const span = Math.max(high - low, 10);
  const floor = (low + high) / 2 - span / 2;
  const steps = Math.max(checkpoints.length - 1, 1);

  const points = checkpoints.map((checkpoint, index) => ({
    ...checkpoint,
    x: round(left + ((right - left) * index) / steps),
    y: round(bottom - ((checkpoint.score - floor) / span) * (bottom - top)),
  }));

  // Flat tangents at every checkpoint keep each segment between its two scores.
  const linePath = points
    .map((point, index) => {
      if (index === 0) return `M${point.x} ${point.y}`;
      const previous = points[index - 1];
      const half = round((point.x - previous.x) / 2);
      return `C${round(previous.x + half)} ${previous.y} ${round(point.x - half)} ${point.y} ${point.x} ${point.y}`;
    })
    .join(" ");

  return { width, height, points, linePath, areaPath: `${linePath} L${right} ${height} L${left} ${height} Z` };
}

export const formatScoreChange = (change: number) => (change > 0 ? `+${change}` : change < 0 ? `−${-change}` : "±0");
