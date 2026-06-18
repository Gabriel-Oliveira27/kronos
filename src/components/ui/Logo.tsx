import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  withWordmark = true,
  size = 32,
  className,
}: {
  withWordmark?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/logo.png"
        alt="Kronos"
        width={size}
        height={size}
        className="rounded-[22%]"
        priority
      />
      {withWordmark && (
        <span className="font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          Kronos
        </span>
      )}
    </span>
  );
}
