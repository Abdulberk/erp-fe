"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface Tab {
  href: string;
  label: string;
  /** AI anahtarı yoksa kapalı sekmeler. */
  disabled?: boolean;
  disabledReason?: string;
}

/**
 * Sekme yerine ayrı rotalar kullanılıyor; bu bileşen yalnızca aktif rotayı
 * işaretliyor. Her sayfa kendi URL'inde paylaşılabilir ve temiz bir ekran
 * görüntüsü veriyor.
 */
export function NavTabs({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Veri seti bölümleri" className="scroll-x -mb-px">
      <ul className="flex min-w-max items-stretch gap-1">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          if (tab.disabled) {
            return (
              <li key={tab.href}>
                <span
                  aria-disabled="true"
                  title={tab.disabledReason}
                  className="block cursor-not-allowed border-b-2 border-transparent px-3 py-2.5 text-[13px] text-ink-muted opacity-55"
                >
                  {tab.label}
                </span>
              </li>
            );
          }
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "block border-b-2 px-3 py-2.5 text-[13px] transition-colors",
                  active
                    ? "border-ink-1 font-semibold text-ink-1"
                    : "border-transparent text-ink-2 hover:border-axis hover:text-ink-1",
                ].join(" ")}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
