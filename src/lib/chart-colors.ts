// Validated categorical palette (fixed order — CVD-safe for adjacent pairs;
// see dataviz skill references/palette.md). Used for multi-series charts
// (category pie, course popularity) where series must stay distinguishable.
export const CATEGORICAL_COLORS = [
  "#4a7690", // blue
  "#e0714a", // orange
  "#1fae9e", // aqua
  "#eda100", // yellow
  "#e88aa0", // magenta
  "#146a84", // green
  "#17708a", // violet
  "#d05a49", // red
];

// Brand color for single-series charts (revenue line) — safe by definition
// since there is nothing to confuse it with.
export const BRAND_SERIES_COLOR = "#12a3b8";

export const CHART_GRID_COLOR = "#e3edf5";
export const CHART_AXIS_COLOR = "#8ba3b8";
