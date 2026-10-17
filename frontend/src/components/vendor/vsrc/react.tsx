"use client";

import * as React from "react";
import { liquidGlass, mergeGlass, GLASS_PRESETS } from "./engine";
import type { GlassMode, GlassPreset, LiquidGlassOptions } from "./engine";

export type { GlassMode, GlassPreset, LiquidGlassOptions };
export { mergeGlass, GLASS_PRESETS };

/**
 * Apply liquid glass to `element` once it is mounted. Returns the active mode
 * ("refract" | "frosted" | "reduced" | "none"), so callers can adapt styling.
 * Pass `false` instead of options to disable the effect (e.g. a ghost variant)
 * — hooks can't be called conditionally, a sentinel can.
 *
 * The element is taken by value (not a ref) on purpose: some Radix portals
 * (Select) mount their content in a LATER commit than the wrapping surface, so
 * a ref read once in an effect would miss the node. Driving the effect off the
 * element identity re-applies the moment the node attaches.
 */
export function useLiquidGlass<T extends HTMLElement>(
  element: T | null,
  options?: LiquidGlassOptions | GlassPreset | false,
): GlassMode {
  const [mode, setMode] = React.useState<GlassMode>("none");
  // Key on option values, not object identity — inline objects would
  // otherwise tear down and rebuild the filter every render.
  const optionsKey = JSON.stringify(options ?? {});

  React.useEffect(() => {
    if (!element || optionsKey === "false") return;
    const glass = liquidGlass(element, JSON.parse(optionsKey) as LiquidGlassOptions);
    setMode(glass.mode);
    return () => {
      glass.destroy();
      setMode("none");
    };
  }, [element, optionsKey]);

  return mode;
}

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optics forwarded to the engine: a preset name, an options object, or `false` to disable. */
  glass?: LiquidGlassOptions | GlassPreset | false;
}

/**
 * Unstyled refraction primitive: a div with the liquid-glass effect wired up.
 * Material dressing (tint, speculars, shadows, radius) is the caller's CSS —
 * the registry's `glass-surface` component adds the styled V-/Src material.
 */
export const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(
  function GlassSurface({ glass, ...props }, forwardedRef) {
    // Node in state (not a ref) so useLiquidGlass re-applies when it attaches.
    const [node, setNode] = React.useState<HTMLDivElement | null>(null);
    useLiquidGlass(node, glass);
    const composedRef = React.useCallback(
      (element: HTMLDivElement | null) => {
        setNode(element);
        if (typeof forwardedRef === "function") forwardedRef(element);
        else if (forwardedRef) forwardedRef.current = element;
      },
      [forwardedRef],
    );
    return <div ref={composedRef} {...props} />;
  },
);
