"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

type Indicator = { left: number; width: number; ready: boolean };

/**
 * The white pill behind the active tab is one element that slides between tabs, rather than a
 * background each tab switches on and off — so changing tabs moves it instead of blinking.
 */
function TabsList({ className, children, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = React.useState<Indicator>({ left: 0, width: 0, ready: false });

  React.useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () => {
      const active = list.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
      if (!active) return;
      setIndicator((previous) => ({
        left: active.offsetLeft,
        width: active.offsetWidth,
        // The first position is set without animation; only later changes slide.
        ready: previous.width > 0,
      }));
    };

    measure();
    // Radix flips data-state on the triggers; resizing (fonts, language, window) moves them too.
    const mutations = new MutationObserver(measure);
    mutations.observe(list, { attributes: true, attributeFilter: ["data-state"], subtree: true });
    const resizes = new ResizeObserver(measure);
    resizes.observe(list);
    list.querySelectorAll('[role="tab"]').forEach((tab) => resizes.observe(tab));
    return () => {
      mutations.disconnect();
      resizes.disconnect();
    };
  }, []);

  return (
    <TabsPrimitive.List
      ref={listRef}
      className={cn("relative inline-flex items-center gap-1 rounded-full bg-surface-sunken p-1", className)}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-1 left-0 rounded-full bg-surface shadow-glow-sm",
          indicator.ready && "transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        )}
        style={{
          width: indicator.width,
          transform: `translateX(${indicator.left}px)`,
          opacity: indicator.width > 0 ? 1 : 0,
        }}
      />
      {children}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative z-10 rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition-colors duration-300 cursor-pointer",
        "data-[state=active]:text-ink",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-start",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("mt-4", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
