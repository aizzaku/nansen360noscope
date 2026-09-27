import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ToolIconProps = {
  className?: string;
  icon: LucideIcon;
  size?: "ui" | "empty";
  tone?: "muted" | "gold" | "sage" | "steel" | "rust";
};

export function ToolIcon({ className, icon: Icon, size = "ui", tone = "muted" }: ToolIconProps) {
  return <span className={cn("n-tool-icon", `n-tool-icon-${size}`, `n-tool-icon-${tone}`, className)} aria-hidden="true">
    <Icon strokeWidth={1.4} />
  </span>;
}
