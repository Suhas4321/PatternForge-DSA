"use client";

import * as React from "react";
import { mergeGlass, type GlassPreset, type LiquidGlassOptions } from "./react";
import { GlassSurface } from "./glass-surface";
import { cn } from "./utils";

const DOCK_OPTICS: LiquidGlassOptions = {
  scale: -64,
  chroma: 5,
  border: 0.14,
  mapBlur: 10,
  blur: 3,
  saturate: 1.5,
  fallbackBlur: 3,
};

/**
 * The signature piece: a floating glass bar mirroring the brand board's
 * docked nav. Fixed bottom-center by default; unset `position` via className
 * to inline it. Children are DockItems (and anything else glass-free).
 */
function Dock({
  className,
  glass,
  ...props
}: React.ComponentProps<"nav"> & { glass?: LiquidGlassOptions | GlassPreset | false }) {
  return (
    <GlassSurface asChild glass={mergeGlass(DOCK_OPTICS, glass)}>
      <nav
        data-slot="dock"
        className={cn(
          "fixed bottom-6 left-1/2 z-40 -translate-x-1/2",
          "flex items-center gap-1 rounded-full p-2",
          className,
        )}
        {...props}
      />
    </GlassSurface>
  );
}

function DockItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dock-item"
      className={cn(
        "flex items-center [&>a]:flex [&>a]:size-10 [&>a]:items-center [&>a]:justify-center [&>a]:rounded-full",
        "[&>a]:text-foreground [&>a]:transition-[background-color,transform] [&>a]:outline-none",
        "[&>a:hover]:bg-foreground/10 [&>a:hover]:scale-110 [&>a:focus-visible]:ring-2 [&>a:focus-visible]:ring-ring",
        "[&_svg]:size-5 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

function DockSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dock-separator" className={cn("mx-1 h-6 w-px bg-foreground/15", className)} {...props} />;
}

export { Dock, DockItem, DockSeparator };
