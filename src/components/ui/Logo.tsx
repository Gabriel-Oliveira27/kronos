import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  withWordmark = true,
  withIcon = true,
  size = 32,
  className,
  wordmarkClassName,
}: {
  withWordmark?: boolean;
  withIcon?: boolean;
  size?: number;
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {withIcon && (
        <Image
          src="/logo.png"
          alt="Kronos"
          width={size}
          height={size}
          className="rounded-[22%]"
          priority
        />
      )}
      {withWordmark && (
        <span
          className={cn(
            "font-display font-semibold tracking-tight",
            wordmarkClassName ?? "text-lg text-slate-900 dark:text-white"
          )}
        >
          Kronos
        </span>
      )}
    </span>
  );
}
