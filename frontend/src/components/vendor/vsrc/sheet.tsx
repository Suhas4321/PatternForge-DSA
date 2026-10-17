"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { mergeGlass, type GlassPreset, type LiquidGlassOptions } from "./react";
import { GlassSurface } from "./glass-surface";
import { cn } from "./utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

const sheetVariants = cva(
  "animate-glass-in fixed z-50 flex flex-col gap-4 p-8 text-foreground outline-none",
  {
    variants: {
      side: {
        right: "inset-y-3 right-3 w-full max-w-sm",
        left: "inset-y-3 left-3 w-full max-w-sm",
        bottom: "inset-x-3 bottom-3 max-h-[60vh]",
        top: "inset-x-3 top-3 max-h-[60vh]",
      },
    },
    defaultVariants: { side: "right" },
  },
);

/** Sheets are large; softer optics keep the map cheap (PLAN perf guardrail). */
const SHEET_OPTICS: LiquidGlassOptions = { scale: -80, mapBlur: 16 };

function SheetContent({
  className,
  children,
  side,
  glass,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof sheetVariants> & { glass?: LiquidGlassOptions | GlassPreset | false }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="animate-glass-in fixed inset-0 z-50 bg-background/70" />
      <GlassSurface asChild glass={mergeGlass(SHEET_OPTICS, glass)}>
        <DialogPrimitive.Content
          data-slot="sheet-content"
          className={cn(sheetVariants({ side }), className)}
          {...props}
        >
          {children}
          <DialogPrimitive.Close
            aria-label="Close"
            className={cn(
              "absolute top-4 right-4 rounded-full p-1.5 text-muted-foreground transition-colors",
              "outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </GlassSurface>
    </DialogPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-display text-2xl leading-tight", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription };
