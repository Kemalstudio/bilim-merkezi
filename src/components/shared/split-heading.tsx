"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { revealsDisabled } from "@/lib/scroll-reveal";

gsap.registerPlugin(ScrollTrigger, SplitText);

type SplitHeadingProps = {
  as?: "h1" | "h2" | "h3";
  children: string;
  className?: string;
  id?: string;
};

/**
 * A heading whose lines slide up from behind a mask as it scrolls into view.
 *
 * SplitText rewrites the heading's DOM, so the inner element is keyed by its text: a locale
 * switch (router.refresh) remounts it instead of React patching text nodes that are gone.
 */
export function SplitHeading(props: SplitHeadingProps) {
  return <SplitHeadingInner key={props.children} {...props} />;
}

function SplitHeadingInner({ as: Tag = "h2", children, className, id }: SplitHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const heading = ref.current;
    if (!heading || revealsDisabled()) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      SplitText.create(heading, {
        type: "lines",
        mask: "lines",
        linesClass: "split-line",
        // Re-splits once web fonts load or the width changes, so line breaks stay correct.
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 120,
            duration: 0.9,
            ease: "power4.out",
            stagger: 0.08,
            scrollTrigger: { trigger: heading, start: "top 88%", once: true },
          }),
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <Tag ref={ref} id={id} className={className}>
      {children}
    </Tag>
  );
}
