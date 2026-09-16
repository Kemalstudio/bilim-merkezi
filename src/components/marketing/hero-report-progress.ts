import { gsap } from "gsap";

/** How long before the line arrives (as a share of the line) a checkpoint starts to pop. */
const POP_LEAD = 0.06;
const popEase = gsap.parseEase("back.out(3)");
const clamp01 = gsap.utils.clamp(0, 1);
const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
const formatChange = (change: number) => (change > 0 ? `+${change}` : change < 0 ? `−${-change}` : "±0");

export type ReportProgress = {
  /** Shows the report at `t` (0 = first week, 1 = last week). */
  render: (t: number) => void;
  /** Clears everything render wrote, back to the final week the markup holds. */
  reset: () => void;
};

/**
 * Walks the hero report card through its weeks: the line draws that far with the chart area
 * revealed behind it, each checkpoint pops as the line reaches it, and the week, the score
 * (dips included), its change and the topic bars follow along.
 */
export function createReportProgress(card: HTMLElement): ReportProgress | null {
  const line = card.querySelector<SVGPathElement>("[data-hv-line]");
  const reveal = card.querySelector<SVGRectElement>("[data-report-reveal]");
  const week = card.querySelector<HTMLElement>("[data-report-week]");
  const score = card.querySelector<HTMLElement>("[data-report-score]");
  const delta = card.querySelector<HTMLElement>("[data-report-delta]");
  const points = Array.from(card.querySelectorAll<SVGCircleElement>("[data-hv-point]"));
  const topics = Array.from(card.querySelectorAll<HTMLElement>("[data-report-topic]")).map((topic) => ({
    bar: topic.querySelector<HTMLElement>("[data-report-bar]"),
    percent: topic.querySelector<HTMLElement>("[data-report-percent]"),
    from: Number(topic.dataset.from),
    to: Number(topic.dataset.to),
  }));
  if (!line || !reveal || !week || !score || !delta || points.length < 2) return null;

  const length = line.getTotalLength();
  const scores = points.map((point) => Number(point.dataset.score));
  const firstWeek = Number(week.dataset.from);
  const lastWeek = Number(week.dataset.to);
  const fullReveal = reveal.getAttribute("width") ?? "0";

  // Share of the line drawn by the time it reaches `x`; the path only ever runs left to right.
  const shareAtX = (x: number) => {
    let low = 0;
    let high = length;
    for (let step = 0; step < 24; step++) {
      const mid = (low + high) / 2;
      if (line.getPointAtLength(mid).x < x) low = mid;
      else high = mid;
    }
    return high / length;
  };
  const reachedAt = points.map((point) => shareAtX(Number(point.getAttribute("cx"))));

  const scoreAt = (t: number) => {
    for (let i = 1; i < points.length; i++) {
      if (t <= reachedAt[i]) {
        const span = reachedAt[i] - reachedAt[i - 1] || 1;
        return lerp(scores[i - 1], scores[i], clamp01((t - reachedAt[i - 1]) / span));
      }
    }
    return scores[scores.length - 1];
  };

  const setText = (t: number) => {
    const current = Math.round(scoreAt(t));
    score.textContent = String(current);
    delta.textContent = formatChange(current - scores[0]);
    week.textContent = String(Math.round(lerp(firstWeek, lastWeek, t)));
    topics.forEach(({ bar, percent, from, to }) => {
      const value = Math.round(lerp(from, to, t));
      if (bar) bar.style.width = `${value}%`;
      if (percent) percent.textContent = `${value}%`;
    });
  };

  return {
    render(t) {
      const drawn = length * t;
      line.style.strokeDasharray = `${length}`;
      line.style.strokeDashoffset = `${length - drawn}`;
      reveal.setAttribute("width", String(line.getPointAtLength(drawn).x));
      points.forEach((point, i) => {
        const scale = i === 0 ? 1 : popEase(clamp01((t - reachedAt[i]) / POP_LEAD + 1));
        gsap.set(point, { scale, transformOrigin: "50% 50%" });
      });
      setText(t);
    },
    reset() {
      line.style.strokeDasharray = "";
      line.style.strokeDashoffset = "";
      reveal.setAttribute("width", fullReveal);
      gsap.set(points, { clearProps: "transform" });
      setText(1);
    },
  };
}
