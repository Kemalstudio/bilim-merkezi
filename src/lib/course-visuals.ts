import { Calculator, Code2, FlaskConical, Palette, Megaphone, Languages, Briefcase, Puzzle, Sparkles, type LucideIcon } from "lucide-react";

export const categoryIcons: Record<string, LucideIcon> = {
  programming: Code2,
  design: Palette,
  marketing: Megaphone,
  languages: Languages,
  business: Briefcase,
  growth: Sparkles,
  math: Calculator,
  science: FlaskConical,
  creative: Puzzle,
};

export function getCategoryIcon(slug: string): LucideIcon {
  return categoryIcons[slug] ?? Sparkles;
}

const levelLabels: Record<string, string> = {
  BEGINNER: "Начальный",
  INTERMEDIATE: "Средний",
  ADVANCED: "Продвинутый",
};

/** Russian level name for the admin panel; the public site uses the formatter. */
export function getLevelLabel(level: string) {
  return levelLabels[level] ?? level;
}
