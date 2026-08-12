import { Monitor, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip } from "@/components/ui/tooltip"
import { SizeProvider } from "@/lib/size-context"
import { useThemeContext, type Theme } from "@/lib/theme-context"

const THEME_META: Record<
  Theme,
  { label: string; icon: typeof Sun; next: Theme }
> = {
  system: { label: "System", icon: Monitor, next: "light" },
  light: { label: "Light", icon: Sun, next: "dark" },
  dark: { label: "Dark", icon: Moon, next: "system" },
}

/** Cycles system → light → dark. Press T anywhere (Fluid docs pattern). */
export function ThemeToggle() {
  const { theme, setTheme } = useThemeContext()
  const meta = THEME_META[theme]
  const Icon = meta.icon

  return (
    <SizeProvider size="compact">
      <Tooltip content={`Theme · ${meta.label} (T)`}>
        <Button
          type="button"
          variant="ghost"
          size="icon-compact"
          aria-label={`Theme: ${meta.label}. Click to switch.`}
          onClick={() => setTheme(meta.next)}
        >
          <Icon size={14} />
        </Button>
      </Tooltip>
    </SizeProvider>
  )
}
