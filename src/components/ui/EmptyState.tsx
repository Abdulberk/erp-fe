import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface Props {
  title: string;
  description?: string;
  Icon?: LucideIcon;
  children?: React.ReactNode;
  /** Kart çerçevesi olmadan, bir kartın içinde kullanmak için. */
  bare?: boolean;
}

export function EmptyState({
  title,
  description,
  Icon = Inbox,
  children,
  bare = false,
}: Props) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        bare ? "" : "rounded-xl border border-dashed border-border",
      ].join(" ")}
    >
      <Icon size={22} className="text-ink-muted" aria-hidden />
      <p className="mt-3 text-sm font-medium text-ink-1">{title}</p>
      {description ? (
        <p className="mt-1 max-w-md text-[13px] text-ink-muted">{description}</p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
