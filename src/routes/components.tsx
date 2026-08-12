import { useMemo, useState, type ReactNode } from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
  Bell,
  Copy,
  Info,
  Layout,
  Palette,
  Shield,
} from "lucide-react"
import { Badge, type BadgeColor } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFeature,
  CardFooter,
  CardGroup,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CheckboxGroup, CheckboxItem } from "@/components/ui/checkbox-group"
import {
  ColorPicker,
  ColorPickerPopover,
} from "@/components/ui/color-picker"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { InputGroup, InputField } from "@/components/ui/input-group"
import { RadioGroup, RadioItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabItem, TabPanel } from "@/components/ui/tabs"
import { Tooltip } from "@/components/ui/tooltip"
import { SizeProvider } from "@/lib/size-context"
import { useShape } from "@/lib/shape-context"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/components")({
  component: ComponentsPage,
})

const BADGE_COLORS: BadgeColor[] = [
  "gray",
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "violet",
  "pink",
]

const SWATCHES = [
  "#3B82F6",
  "#14B8A6",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#171717",
]

function ComponentsPage() {
  const shape = useShape()
  const [tab, setTab] = useState("controls")
  const [checked, setChecked] = useState(() => new Set([0, 1]))
  const [radio, setRadio] = useState("a")
  const [on, setOn] = useState(true)
  const [range, setRange] = useState<[number, number]>([20, 70])
  const [steps, setSteps] = useState(0.7)
  const [color, setColor] = useState("#3B82F6")
  const [name, setName] = useState("Fluid")
  const [selectedCard, setSelectedCard] = useState(1)
  const checkedIndices = useMemo(() => checked, [checked])

  function toggleCheck(index: number) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-8 py-10">
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-display font-medium tracking-tight">
              Components
            </h1>
            <Badge variant="dot" color="violet">
              Fluid Functionalism
            </Badge>
          </div>
          <p className="max-w-2xl text-body text-muted-foreground">
            A living gallery of the Fluid controls wired into this demo —
            buttons, badges, tabs, inputs, pickers, and cards on the size
            ladder and surface tokens.
          </p>
        </header>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabItem value="controls" label="Controls" icon={Layout} />
            <TabItem value="color" label="Color" icon={Palette} />
            <TabItem value="feedback" label="Feedback" icon={Bell} />
          </TabsList>

          <TabPanel value="controls" className="flex flex-col gap-5 pt-6">
            <GalleryCard
              title="Buttons"
              description="Primary, secondary, tertiary, ghost — compact size."
            >
              <SizeProvider size="compact">
                <div className="flex flex-wrap gap-2">
                  <Button type="button">Primary</Button>
                  <Button type="button" variant="secondary">
                    Secondary
                  </Button>
                  <Button type="button" variant="tertiary">
                    Tertiary
                  </Button>
                  <Button type="button" variant="ghost">
                    Ghost
                  </Button>
                  <Button type="button" leadingIcon={Copy}>
                    With icon
                  </Button>
                  <Button type="button" loading>
                    Loading
                  </Button>
                </div>
              </SizeProvider>
            </GalleryCard>

            <GalleryCard
              title="Badges"
              description="Solid and dot variants across the color map."
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {BADGE_COLORS.map((color) => (
                    <Badge key={color} color={color}>
                      {color}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {BADGE_COLORS.map((color) => (
                    <Badge key={`dot-${color}`} color={color} variant="dot">
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>
            </GalleryCard>

            <GalleryCard
              title="Switch · Radio · Checkbox"
              description="Proximity hover and merge/split on contiguous checks."
            >
              <SizeProvider size="compact">
                <div className="grid gap-5 md:grid-cols-3">
                  <div className="flex flex-col gap-2">
                    <p className="text-caption text-muted-foreground">Switch</p>
                    <Switch
                      label="Enabled"
                      checked={on}
                      onToggle={() => setOn((v) => !v)}
                    />
                    <Switch
                      label="Disabled"
                      checked
                      onToggle={() => undefined}
                      disabled
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-caption text-muted-foreground">Radio</p>
                    <RadioGroup value={radio} onValueChange={setRadio}>
                      <RadioItem index={0} value="a" label="Option A" />
                      <RadioItem index={1} value="b" label="Option B" />
                      <RadioItem index={2} value="c" label="Option C" />
                    </RadioGroup>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-caption text-muted-foreground">
                      Checkbox
                    </p>
                    <CheckboxGroup checkedIndices={checkedIndices}>
                      {["Alpha", "Beta", "Gamma", "Delta"].map((label, i) => (
                        <CheckboxItem
                          key={label}
                          index={i}
                          label={label}
                          checked={checked.has(i)}
                          onToggle={() => toggleCheck(i)}
                        />
                      ))}
                    </CheckboxGroup>
                  </div>
                </div>
              </SizeProvider>
            </GalleryCard>

            <GalleryCard
              title="Sliders"
              description="Single, range, and discrete step list."
            >
              <div className="flex flex-col gap-6">
                <Slider
                  label="Range"
                  value={range}
                  onChange={(v) =>
                    setRange(
                      Array.isArray(v) ? (v as [number, number]) : [v, v]
                    )
                  }
                  min={0}
                  max={100}
                  step={1}
                  showValue
                  valuePosition="right"
                  formatValue={(v) => `${v}`}
                />
                <Slider
                  label="Steps"
                  value={steps}
                  onChange={(v) =>
                    setSteps(typeof v === "number" ? v : v[0])
                  }
                  steps={[0.1, 0.5, 0.7, 1.1, 1.3]}
                  showSteps
                  showValue
                  valuePosition="right"
                  formatValue={(v) => v.toFixed(1)}
                />
              </div>
            </GalleryCard>

            <GalleryCard
              title="Inputs"
              description="Grouped fields with shared proximity hover."
            >
              <InputGroup className="w-full max-w-md">
                <InputField
                  index={0}
                  label="Name"
                  value={name}
                  onChange={setName}
                />
                <InputField
                  index={1}
                  label="Project"
                  value="fluid-demo"
                  onChange={() => undefined}
                  icon={Shield}
                />
              </InputGroup>
            </GalleryCard>
          </TabPanel>

          <TabPanel value="color" className="flex flex-col gap-5 pt-6">
            <GalleryCard
              title="Color picker popover"
              description="Trigger + portalled panel with swatches."
            >
              <ColorPickerPopover
                value={color}
                onValueChange={setColor}
                swatches={SWATCHES}
                triggerLabel="Fill"
                triggerShowValue
              />
            </GalleryCard>

            <GalleryCard
              title="Color picker panel"
              description="Inline saturation square, hue, alpha, and channels."
            >
              <div className="max-w-sm">
                <ColorPicker
                  value={color}
                  onValueChange={setColor}
                  swatches={SWATCHES}
                />
              </div>
            </GalleryCard>
          </TabPanel>

          <TabPanel value="feedback" className="flex flex-col gap-5 pt-6">
            <GalleryCard
              title="Tooltip"
              description="Grouped delay via ambient TooltipProvider."
            >
              <div className="flex flex-wrap gap-2">
                <Tooltip content="Settings tip">
                  <Button type="button" variant="secondary" size="compact">
                    Hover me
                  </Button>
                </Tooltip>
                <Tooltip content="Copy to clipboard" side="bottom">
                  <Button
                    type="button"
                    variant="ghost"
                    size="compact"
                    leadingIcon={Copy}
                  >
                    Copy
                  </Button>
                </Tooltip>
                <Tooltip content="More info" side="right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-compact"
                    leadingIcon={Info}
                    aria-label="Info"
                  />
                </Tooltip>
              </div>
            </GalleryCard>

            <GalleryCard
              title="Dialog"
              description="Spring open/close on the surface ladder."
            >
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="secondary" size="compact">
                    Open dialog
                  </Button>
                </DialogTrigger>
                <DialogContent size="sm">
                  <DialogHeader>
                    <DialogTitle>Example dialog</DialogTitle>
                    <DialogDescription>
                      Content sits on an elevated surface above the overlay.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost" type="button">
                        Close
                      </Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button type="button">Confirm</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </GalleryCard>

            <GalleryCard
              title="Cards"
              description="Outlined separated tiles with selection fill."
            >
              <CardGroup separated columns={1} border="outlined">
                {[
                  {
                    title: "Proximity",
                    description: "Hover preview fills neighbouring rows.",
                  },
                  {
                    title: "Selection",
                    description: "Persistent selected weight on the title.",
                  },
                  {
                    title: "Actions",
                    description: "Footer buttons sit above the stretch hit area.",
                  },
                ].map((item, index) => (
                  <Card
                    key={item.title}
                    index={index}
                    selected={selectedCard === index}
                    onClick={() => setSelectedCard(index)}
                    label={item.title}
                  >
                    <CardHeader>
                      <CardTitle>{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Badge
                        color={selectedCard === index ? "blue" : "gray"}
                        variant="dot"
                      >
                        {selectedCard === index ? "Selected" : "Idle"}
                      </Badge>
                    </CardFooter>
                  </Card>
                ))}
              </CardGroup>
            </GalleryCard>

            <GalleryCard title="Features">
              <div className="flex flex-col gap-3">
                <CardFeature
                  icon={Palette}
                  title="Shape provider"
                  description={`Active shape radius · ${shape.container}`}
                />
                <CardFeature
                  icon={Layout}
                  title="Size ladder"
                  description="Default 36px controls, compact 28px in dense chrome."
                />
              </div>
            </GalleryCard>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  )
}

function GalleryCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  const shape = useShape()
  return (
    <section
      className={cn(
        "flex flex-col gap-4 bg-card p-5 shadow-surface-3",
        shape.container
      )}
    >
      <div className="flex flex-col gap-0.5">
        <h2 className="text-subtitle font-medium tracking-tight">{title}</h2>
        {description ? (
          <p className="text-caption text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}
