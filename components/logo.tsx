import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  variant?: "full" | "mark";
};

export function Logo({ className, variant = "full" }: LogoProps) {
  return <span className={cn("n-logo", variant === "mark" && "n-logo-mark-only", className)}>
    <span className="n-logo-mark" aria-hidden="true" />
    {variant === "full" && <span className="n-logo-wordmark">NANSEN <b>360</b><small>NoScope</small></span>}
  </span>;
}
