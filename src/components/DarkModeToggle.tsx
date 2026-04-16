import { useEffect, useState } from "react";
import { Moon, Sun, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark" | "indigo";

const THEMES: { key: Theme; icon: typeof Sun; label: string }[] = [
  { key: "light", icon: Sun, label: "Light" },
  { key: "dark", icon: Moon, label: "Dark" },
  { key: "indigo", icon: Sparkles, label: "Indigo" },
];

const DarkModeToggle = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored && ["light", "dark", "indigo"].includes(stored)) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "indigo");
    if (theme === "dark") root.classList.add("dark");
    if (theme === "indigo") root.classList.add("indigo");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const cycle = () => {
    const idx = THEMES.findIndex((t) => t.key === theme);
    setTheme(THEMES[(idx + 1) % THEMES.length].key);
  };

  const current = THEMES.find((t) => t.key === theme)!;
  const Icon = current.icon;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-full"
      onClick={cycle}
      aria-label={`Theme: ${current.label}`}
      title={`Theme: ${current.label}`}
    >
      <Icon className="w-4 h-4" />
    </Button>
  );
};

export { DarkModeToggle };