"use client";

import { Moon, Sun } from "lucide-react";
import { useRef, useState, type TouchEvent } from "react";

import {
  THEME_COOKIE_MAX_AGE_SECONDS,
  THEME_COOKIE_NAME,
  type ThemePreference,
} from "@/lib/theme-shared";

const options: Array<{
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export function ThemeToggleClient({
  initialTheme,
  variant = "segmented",
}: {
  initialTheme: ThemePreference;
  variant?: "segmented" | "icon";
}) {
  const [theme, setTheme] = useState(initialTheme);
  const handledTouch = useRef(false);

  function selectTheme(nextTheme: ThemePreference) {
    setTheme(nextTheme);
    writeThemeCookie(nextTheme);
    applyTheme(nextTheme);
  }

  function handleTouchEnd(
    event: TouchEvent<HTMLButtonElement>,
    nextTheme: ThemePreference,
  ) {
    event.preventDefault();
    handledTouch.current = true;
    selectTheme(nextTheme);
    window.setTimeout(() => {
      handledTouch.current = false;
    }, 700);
  }

  if (variant === "icon") {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const Icon = nextTheme === "dark" ? Moon : Sun;

    return (
      <button
        type="button"
        className="icon-button"
        aria-label={`Switch to ${nextTheme} mode`}
        title={`Switch to ${nextTheme} mode`}
        aria-pressed={theme === "dark"}
        onClick={() => {
          if (handledTouch.current) return;
          selectTheme(nextTheme);
        }}
        onTouchEnd={(event) => handleTouchEnd(event, nextTheme)}
      >
        <Icon aria-hidden="true" size={21} />
      </button>
    );
  }

  return (
    <div
      className="grid grid-cols-2 gap-1 rounded-full border border-[var(--brand-line)] bg-[var(--brand-soft)] p-1"
      role="group"
      aria-label="Appearance"
    >
      {options.map((option) => {
        const active = theme === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => {
              if (handledTouch.current) return;
              selectTheme(option.value);
            }}
            onTouchEnd={(event) => handleTouchEnd(event, option.value)}
            className={`min-h-11 touch-manipulation rounded-full px-3 text-sm font-semibold transition ${
              active
                ? "bg-[var(--brand-card)] text-[var(--brand-teal)] shadow-sm"
                : "text-[var(--brand-muted)] hover:text-[var(--brand-ink)]"
            }`}
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              <Icon aria-hidden="true" size={15} />
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function writeThemeCookie(theme: ThemePreference) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${THEME_COOKIE_NAME}=${encodeURIComponent(
    theme,
  )}; Max-Age=${THEME_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

function applyTheme(theme: ThemePreference) {
  const dark = theme === "dark";

  document.documentElement.classList.toggle("dark", dark);
  document.body.classList.toggle("dark", dark);
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
}
