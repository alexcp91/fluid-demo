import { useState, type CSSProperties } from "react"
import { Badge } from "@/components/ui/badge"
import { ColorPickerPopover } from "@/components/ui/color-picker"
import { RadioGroup, RadioItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { SizeProvider } from "@/lib/size-context"
import { useShape } from "@/lib/shape-context"
import { useThemeContext, type Theme } from "@/lib/theme-context"
import { cn } from "@/lib/utils"
import { SettingsCard } from "./settings-card"

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
]

const ACCENT_SWATCHES = [
  "#3B82F6",
  "#6366F1",
  "#14B8A6",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#171717",
]

type Density = "comfortable" | "compact"

export function AppearanceSection() {
  const { theme, setTheme } = useThemeContext()
  const [accent, setAccent] = useState("#3B82F6")
  const [density, setDensity] = useState<Density>("comfortable")
  const [uiScale, setUiScale] = useState(100)
  const [motion, setMotion] = useState(true)
  const [proximity, setProximity] = useState(true)
  const [springFeel, setSpringFeel] = useState(true)

  return (
    <div className="flex flex-col gap-4">
      <SettingsCard
        title="Color mode"
        description={
          <>
            Follow the system appearance, or lock light / dark. Press{" "}
            <kbd className="font-mono text-caption text-muted-foreground">
              T
            </kbd>{" "}
            to cycle quickly.
          </>
        }
      >
        <SizeProvider size="compact">
          <RadioGroup
            value={theme}
            onValueChange={(v) => setTheme(v as Theme)}
          >
            {THEME_OPTIONS.map((opt, i) => (
              <RadioItem
                key={opt.value}
                index={i}
                value={opt.value}
                label={opt.label}
              />
            ))}
          </RadioGroup>
        </SizeProvider>
      </SettingsCard>

      <SettingsCard
        title="Accent"
        description="Used for highlights and preview chips in this demo."
      >
        <div className="flex flex-wrap items-center gap-3">
          <ColorPickerPopover
            value={accent}
            onValueChange={(next) => setAccent(next)}
            swatches={ACCENT_SWATCHES}
            triggerLabel="Accent"
            triggerShowValue
          />
          <AccentPreview accent={accent} />
          <Badge variant="dot" color="gray">
            {accent.toUpperCase()}
          </Badge>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Density & scale"
        description="Comfortable controls are taller; compact fits denser rails."
      >
        <div className="flex flex-col gap-5">
          <SizeProvider size="compact">
            <RadioGroup
              value={density}
              onValueChange={(v) => setDensity(v as Density)}
            >
              <RadioItem index={0} value="comfortable" label="Comfortable" />
              <RadioItem index={1} value="compact" label="Compact" />
            </RadioGroup>
          </SizeProvider>
          <Slider
            label="Scale"
            value={uiScale}
            onChange={(v) => setUiScale(typeof v === "number" ? v : v[0])}
            min={90}
            max={120}
            step={5}
            showValue
            valuePosition="right"
            formatValue={(v) => `${v}%`}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Motion"
        description="Turn down animation if you prefer calmer interfaces."
      >
        <SizeProvider size="compact">
          <div className="flex flex-col gap-2">
            <Switch
              label="Reduce motion"
              checked={!motion}
              onToggle={() => setMotion((v) => !v)}
            />
            <Switch
              label="Proximity hover"
              checked={proximity}
              onToggle={() => setProximity((v) => !v)}
            />
            <Switch
              label="Spring interactions"
              checked={springFeel}
              onToggle={() => setSpringFeel((v) => !v)}
            />
          </div>
        </SizeProvider>
      </SettingsCard>
    </div>
  )
}

function AccentPreview({ accent }: { accent: string }) {
  const shape = useShape()
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-2 bg-muted px-3 text-caption text-muted-foreground",
        shape.button,
        "shadow-[inset_3px_0_0_var(--settings-accent)]"
      )}
      style={{ "--settings-accent": accent } as CSSProperties}
    >
      Preview chip
    </span>
  )
}
