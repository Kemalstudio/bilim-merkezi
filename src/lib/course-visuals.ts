import { Code2, Palette, Megaphone, Languages, Briefcase, Sparkles, type LucideIcon } from "lucide-react";

export const categoryIcons: Record<string, LucideIcon> = {
  programming: Code2,
  design: Palette,
  marketing: Megaphone,
  languages: Languages,
  business: Briefcase,
  growth: Sparkles,
};

export function getCategoryIcon(slug: string): LucideIcon {
  return categoryIcons[slug] ?? Sparkles;
}

const levelLabels: Record<string, string> = {
  BEGINNER: "Начальный",
  INTERMEDIATE: "Средний",
  ADVANCED: "Продвинутый",
};

export function getLevelLabel(level: string) {
  return levelLabels[level] ?? level;
}
