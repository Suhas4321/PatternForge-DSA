"use client";

import * as React from "react";
import { GlassSurface } from "./glass-surface";
import { cn } from "./utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export function Skeleton({ className, glass = true, ...props }: SkeletonProps) {
  if (glass) {
    return (
      <GlassSurface
        className={cn("animate-pulse bg-white/5 rounded-md", className)}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn("animate-pulse rounded-md bg-white/5", className)}
      {...props}
    />
  );
}
