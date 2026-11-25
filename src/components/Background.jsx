import * as React from "react";
import { cn } from "@/lib/utils";

export default function AnimatedBackground({
  children,
  className,
  ...props
}) {
  return (
    <div
      data-slot="cinematic-dark-background"
      className={cn(
        "fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#030712]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
