"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "sonart-theme";
type Choice = "sistem" | "light" | "dark";

const OPTIONS: { value: Choice; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Açık", Icon: Sun },
  { value: "dark", label: "Koyu", Icon: Moon },
  { value: "sistem", label: "Sistem", Icon: Monitor },
];

/**
 * Dark mode çevrilmiş değil, ayrıca seçilmiş değerlerle çalışıyor
 * (bkz. globals.css). Buradaki damga her iki yönde de OS ayarını yener.
 */
export function ThemeToggle() {
  const [choice, setChoice] = useState<Choice>("sistem");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem(KEY);
    if (stored === "dark" || stored === "light") setChoice(stored);
  }, []);

  function apply(next: Choice) {
    setChoice(next);
    const root = document.documentElement;
    if (next === "sistem") {
      root.removeAttribute("data-theme");
      window.localStorage.removeItem(KEY);
    } else {
      root.setAttribute("data-theme", next);
      window.localStorage.setItem(KEY, next);
    }
  }

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface-1 p-0.5"
      role="group"
      aria-label="Tema"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        // Hidrasyon öncesi hiçbiri seçili görünmez; sunucu ile istemci uyuşsun.
        const active = mounted && choice === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => apply(value)}
            aria-pressed={active}
            title={`${label} tema`}
            className={[
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              active
                ? "bg-hover text-ink-1"
                : "text-ink-muted hover:text-ink-2",
            ].join(" ")}
          >
            <Icon size={14} aria-hidden />
            <span className="sr-only">{label} tema</span>
          </button>
        );
      })}
    </div>
  );
}
