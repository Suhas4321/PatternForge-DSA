"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { useLiquidGlass, type GlassPreset, type LiquidGlassOptions } from "./react";
import { cn } from "./utils";

/**
 * The V-/Src glass material. Refraction itself (the backdrop-filter) comes
 * from the vsrc engine; these classes are only the dressing — tint, border,
 * speculars, shadow — plus the opaque fallback the engine signals with
 * data-vsrc-glass="reduced" when the user prefers reduced transparency.
 *
 * Never nest one glass surface inside another: refraction is a per-panel
 * effect and stacked filters multiply cost without adding depth.
 */
// No position class here: asChild consumers set their own (fixed dialogs,
// sticky docks…) and a stray `relative` would win the cascade over `fixed`.
// Non-div surfaces must be positioned somehow or the ::after rim mislands.
export const glassMaterial = cn(
  "isolate overflow-hidden",
  "border border-(--glass-border) bg-(--glass-tint)",
  "shadow-[var(--glass-shadow),var(--glass-specular)]",
  // Frosted (WebKit / all iOS) can't refract — go CLEAR instead of dark:
  // near-transparent tint + single top specular + hairline rim (globals).
  "data-[vsrc-glass=frosted]:bg-(--glass-tint-frosted)",
  "data-[vsrc-glass=frosted]:shadow-[var(--glass-shadow),var(--glass-specular-frosted)]",
  "data-[vsrc-glass=reduced]:bg-card",
);

export interface GlassSurfaceProps extends React.ComponentProps<"div"> {
  asChild?: boolean;
  /** Engine optics overrides; `false` renders the material without refraction. */
  glass?: LiquidGlassOptions | GlassPreset | false;
  /** "pointer": a soft specular highlight tracks the cursor. Fine pointers only,
   *  off under reduced motion, off by default (it adds a pointermove listener). */
  specular?: "pointer";
}

function GlassSurface({ asChild, glass, specular, className, ref, ...props }: GlassSurfaceProps) {
  // Node in state (not a ref) so the effect re-applies when the node attaches —
  // some Radix portals (Select) mount content a commit after this surface.
  const [node, setNode] = React.useState<HTMLDivElement | null>(null);
  useLiquidGlass(node, glass);
  useSpecular(node, specular);
  const composedRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      setNode(element);
      if (typeof ref === "function") ref(element);
      else if (ref) ref.current = element;
    },
    [ref],
  );
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={composedRef}
      data-slot="glass-surface"
      className={cn(glassMaterial, !asChild && "relative", "rounded-(--glass-radius)", className)}
      {...props}
    />
  );
}

/**
 * Cursor-tracked specular highlight (material layer, not the engine): write the
 * pointer position into CSS vars that a `[data-vsrc-specular]::before` glare
 * reads. rAF-throttled; fine pointers only; inert under reduced motion.
 */
function useSpecular(node: HTMLElement | null, specular?: "pointer") {
  React.useEffect(() => {
    if (specular !== "pointer" || !node) return;
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    node.setAttribute("data-vsrc-specular", "");
    let raf = 0;
    let x = 0;
    let y = 0;
    const onMove = (e: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          node.style.setProperty("--spec-x", `${x}px`);
          node.style.setProperty("--spec-y", `${y}px`);
        });
      }
    };
    const onEnter = () => node.style.setProperty("--spec-o", "1");
    const onLeave = () => node.style.setProperty("--spec-o", "0");
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerenter", onEnter);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerenter", onEnter);
      node.removeEventListener("pointerleave", onLeave);
      node.removeAttribute("data-vsrc-specular");
      node.style.removeProperty("--spec-x");
      node.style.removeProperty("--spec-y");
      node.style.removeProperty("--spec-o");
    };
  }, [node, specular]);
}

export { GlassSurface };
