import React from "react";
import { ThemeProvider, useTheme } from "../src/primitives/ThemeProvider";
import { Button } from "../src/primitives/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../src/primitives/Card";
import { Moon, Sun, Monitor } from "lucide-react";

export default {
  title: "Design System/Dark Mode",
};

const ThemeSwitcherDemo = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className="p-8 max-w-xl mx-auto space-y-6 font-body text-[var(--ee-text)]">
      <div>
        <h2 className="text-2xl font-bold mb-1">Dark Mode Tokens (2.5)</h2>
        <p className="text-sm text-[var(--ee-muted)]">
          Current mode: <strong className="text-[var(--ee-brand)] uppercase">{theme}</strong> (Resolved: {resolvedTheme})
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={theme === "light" ? "primary" : "secondary"}
          leftIcon={<Sun className="w-4 h-4" />}
          onClick={() => setTheme("light")}
        >
          Light
        </Button>
        <Button
          variant={theme === "dark" ? "primary" : "secondary"}
          leftIcon={<Moon className="w-4 h-4" />}
          onClick={() => setTheme("dark")}
        >
          Dark
        </Button>
        <Button
          variant={theme === "system" ? "primary" : "secondary"}
          leftIcon={<Monitor className="w-4 h-4" />}
          onClick={() => setTheme("system")}
        >
          System
        </Button>
      </div>

      <Card elevated>
        <CardHeader>
          <CardTitle>Surface Contrast Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-[var(--ee-surface-base)] border border-[var(--ee-border)]">
            <span className="text-xs text-[var(--ee-muted)] block">Base Surface</span>
            <span className="text-sm font-medium">--ee-surface-base</span>
          </div>
          <div className="p-4 rounded-lg bg-[var(--ee-surface-raised)] border border-[var(--ee-border)]">
            <span className="text-xs text-[var(--ee-muted)] block">Raised Surface</span>
            <span className="text-sm font-medium">--ee-surface-raised</span>
          </div>
          <div className="p-4 rounded-lg bg-[var(--ee-surface-inset)] border border-[var(--ee-border)]">
            <span className="text-xs text-[var(--ee-muted)] block">Inset Surface</span>
            <span className="text-sm font-medium">--ee-surface-inset</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const ThemeToggle = () => (
  <ThemeProvider>
    <ThemeSwitcherDemo />
  </ThemeProvider>
);
