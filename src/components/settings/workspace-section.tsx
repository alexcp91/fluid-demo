import { useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckboxGroup, CheckboxItem } from "@/components/ui/checkbox-group"
import { InputGroup, InputField } from "@/components/ui/input-group"
import { RadioGroup, RadioItem } from "@/components/ui/radio-group"
import { SizeProvider } from "@/lib/size-context"
import { useShape } from "@/lib/shape-context"
import { cn } from "@/lib/utils"
import { SettingsCard } from "./settings-card"

const WORKSPACE_PRESETS = [
  {
    id: "focused",
    title: "Focused",
    description: "Quiet chrome and compact density for writing.",
  },
  {
    id: "studio",
    title: "Studio",
    description: "Full inspector, live preview, and layer rail.",
  },
  {
    id: "review",
    title: "Review",
    description: "Comments-first layout with approval shortcuts.",
  },
] as const

type WorkspacePreset = (typeof WORKSPACE_PRESETS)[number]["id"]

const SURFACES = [
  "Layers panel",
  "Format toolbar",
  "Live HTML preview",
  "Autosave indicator",
] as const

export function WorkspaceSection() {
  const shape = useShape()
  const [workspaceName, setWorkspaceName] = useState("Fluid Demo")
  const [handle, setHandle] = useState("alex")
  const [preset, setPreset] = useState<WorkspacePreset>("studio")
  const [width, setWidth] = useState("640")
  const [features, setFeatures] = useState(() => new Set([0, 1, 3]))
  const checkedFeatureIndices = useMemo(() => features, [features])

  function toggleFeature(index: number) {
    setFeatures((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <SettingsCard
        title="General"
        description="Workspace name and public handle."
        footer={
          <Button type="button" size="compact">
            Save
          </Button>
        }
      >
        <InputGroup className="w-full">
          <InputField
            index={0}
            label="Workspace"
            value={workspaceName}
            onChange={setWorkspaceName}
          />
          <InputField
            index={1}
            label="Handle"
            value={handle}
            onChange={setHandle}
            icon={User}
          />
        </InputGroup>
      </SettingsCard>

      <SettingsCard
        title="Default layout"
        description="Applied when someone opens the email editor."
      >
        <div className="flex flex-col gap-2">
          {WORKSPACE_PRESETS.map((item) => {
            const selected = preset === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPreset(item.id)}
                className={cn(
                  "flex items-start justify-between gap-3 px-3.5 py-3 text-left outline-none transition-colors duration-80",
                  shape.item,
                  selected
                    ? "bg-accent text-foreground"
                    : "hover:bg-muted/60",
                  "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]"
                )}
              >
                <div className="min-w-0 flex flex-col gap-0.5">
                  <span className="text-body font-medium tracking-tight">
                    {item.title}
                  </span>
                  <span className="text-caption text-muted-foreground">
                    {item.description}
                  </span>
                </div>
                {selected ? (
                  <Badge color="blue" variant="dot" size="compact">
                    Active
                  </Badge>
                ) : null}
              </button>
            )
          })}
        </div>
      </SettingsCard>

      <SettingsCard
        title="Editor surfaces"
        description="Choose which panels stay available while editing."
      >
        <SizeProvider size="compact">
          <CheckboxGroup checkedIndices={checkedFeatureIndices}>
            {SURFACES.map((label, index) => (
              <CheckboxItem
                key={label}
                index={index}
                label={label}
                checked={features.has(index)}
                onToggle={() => toggleFeature(index)}
              />
            ))}
          </CheckboxGroup>
        </SizeProvider>
      </SettingsCard>

      <SettingsCard
        title="Canvas width"
        description="Default email width for new documents."
      >
        <SizeProvider size="compact">
          <RadioGroup value={width} onValueChange={setWidth}>
            <RadioItem index={0} value="600" label="600px" />
            <RadioItem index={1} value="640" label="640px" />
            <RadioItem index={2} value="720" label="720px" />
          </RadioGroup>
        </SizeProvider>
        <div className="pt-1">
          <Button asChild variant="secondary" size="compact">
            <Link to="/email-editor">Open editor</Link>
          </Button>
        </div>
      </SettingsCard>
    </div>
  )
}
