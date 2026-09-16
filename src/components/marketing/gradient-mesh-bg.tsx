import { cn } from "@/lib/utils";

export function GradientMeshBg({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="animate-mesh-a absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-start/20 blur-3xl" />
      <div className="animate-mesh-b absolute right-0 top-20 h-[28rem] w-[28rem] rounded-full bg-brand-end/20 blur-3xl" />
      <div className="animate-mesh-c absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-brand-mid/15 blur-3xl" />
    </div>
  );
}
