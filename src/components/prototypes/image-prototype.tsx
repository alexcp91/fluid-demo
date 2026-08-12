import { useCallback, useState, type CSSProperties, type ReactNode } from "react"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Eye,
  EyeOff,
  ImageIcon,
  Link2,
  Minus,
  Monitor,
  MonitorSmartphone,
  Plus,
  Smartphone,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabItem, TabPanel } from "@/components/ui/tabs"
import {
  CompactField,
  IconToggleGroup,
  InspectorFields,
  InspectorSection,
  PropRow,
  SegmentGroup,
  type SegOption,
} from "@/components/email-editor/inspector-controls"
import { SizeProvider, useSize } from "@/lib/size-context"
import { useShape } from "@/lib/shape-context"
import { cn } from "@/lib/utils"
import {
  SOURCE_BYTES,
  SOURCE_LABEL,
  SOURCE_SRC,
  alignItems,
  cornerRadius,
  defaultImagePrototype,
  displayedWidth,
  fillClass,
  imageAlt,
  intrinsicWidth,
  justifyContent,
  paddingClass,
  previewWidth,
  type ImagePrototypeState,
  type SizingModel,
} from "./image-state"

const WIDTH_MODE_OPTIONS: SegOption<ImagePrototypeState["widthMode"]>[] = [
  { value: "auto", label: "AUTO" },
  { value: "fixed", label: "FIXED" },
  { value: "max", label: "MAX" },
]

const SIZE_PRESET_OPTIONS: SegOption<ImagePrototypeState["sizePreset"]>[] = [
  { value: "hug", label: "Hug" },
  { value: "half", label: "Half" },
  { value: "fill", label: "Fill" },
]

const SOURCE_OPTIONS: SegOption<ImagePrototypeState["source"]>[] = [
  { value: "landscape", label: "Photo" },
  { value: "portrait", label: "Portrait" },
]

const FIT_OPTIONS: SegOption<ImagePrototypeState["fit"]>[] = [
  { value: "cover", label: "Cover" },
  { value: "contain", label: "Contain" },
]

const CORNER_OPTIONS: SegOption<ImagePrototypeState["corners"]>[] = [
  { value: "none", label: "None" },
  { value: "soft", label: "Soft" },
  { value: "round", label: "Round" },
  { value: "pill", label: "Pill" },
]

const PADDING_OPTIONS: SegOption<ImagePrototypeState["padding"]>[] = [
  { value: "none", label: "0" },
  { value: "sm", label: "S" },
  { value: "md", label: "M" },
  { value: "lg", label: "L" },
]

const FILL_OPTIONS: SegOption<ImagePrototypeState["fill"]>[] = [
  { value: "none", label: "None" },
  { value: "muted", label: "Muted" },
  { value: "accent", label: "Accent" },
]

const ALIGN_OPTIONS: SegOption<ImagePrototypeState["align"]>[] = [
  { value: "left", icon: AlignLeft, title: "Align left" },
  { value: "center", icon: AlignCenter, title: "Align center" },
  { value: "right", icon: AlignRight, title: "Align right" },
]

const VALIGN_OPTIONS: SegOption<ImagePrototypeState["vAlign"]>[] = [
  {
    value: "top",
    icon: AlignVerticalJustifyStart,
    title: "Align top",
  },
  {
    value: "middle",
    icon: AlignVerticalJustifyCenter,
    title: "Align middle",
  },
  {
    value: "bottom",
    icon: AlignVerticalJustifyEnd,
    title: "Align bottom",
  },
]

const VISIBILITY_OPTIONS: SegOption<"shown" | "hidden">[] = [
  { value: "shown", icon: Eye, title: "Shown" },
  { value: "hidden", icon: EyeOff, title: "Hidden" },
]

const LINK_OPTIONS: SegOption<"off" | "on">[] = [
  { value: "off", label: "Off" },
  { value: "on", label: "On" },
]

const DECORATIVE_OPTIONS: SegOption<"off" | "on">[] = [
  { value: "off", label: "Text" },
  { value: "on", label: "Skip" },
]

const DEVICE_OPTIONS: SegOption<ImagePrototypeState["device"]>[] = [
  { value: "all", icon: MonitorSmartphone, title: "Desktop and mobile" },
  { value: "desktop", icon: Monitor, title: "Desktop only" },
  { value: "mobile", icon: Smartphone, title: "Mobile only" },
]

const PX_MIN = 40
const PX_MAX = 600
const PX_STEP = 10
const CROP_HEIGHT = 168

function useImagePrototype(initial?: Partial<ImagePrototypeState>) {
  const [state, setState] = useState(() => ({
    ...defaultImagePrototype(),
    ...initial,
  }))
  const patch = useCallback((next: Partial<ImagePrototypeState>) => {
    setState((prev) => ({ ...prev, ...next }))
  }, [])
  return [state, patch] as const
}

function PxStepper({
  value,
  onChange,
  disabled = false,
}: {
  value: number
  onChange: (next: number) => void
  disabled?: boolean
}) {
  const shape = useShape()
  const size = useSize()

  function clamp(next: number): number {
    return Math.min(PX_MAX, Math.max(PX_MIN, next))
  }

  return (
    <div
      className={cn(
        "inline-flex items-center bg-muted",
        size.segmentPad,
        shape.container
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-compact"
        disabled={disabled || value <= PX_MIN}
        aria-label="Decrease width"
        onClick={() => onChange(clamp(value - PX_STEP))}
        className="h-6 w-6"
      >
        <Minus size={size.icon} strokeWidth={1.75} />
      </Button>
      <input
        type="text"
        inputMode="numeric"
        disabled={disabled}
        aria-label="Width in pixels"
        value={String(value)}
        onChange={(event) => {
          const parsed = Number(event.target.value)
          if (!Number.isFinite(parsed)) return
          onChange(clamp(Math.round(parsed)))
        }}
        className={cn(
          "w-9 bg-transparent text-center tabular-nums text-foreground outline-none",
          size.text,
          disabled && "text-muted-foreground"
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-compact"
        disabled={disabled || value >= PX_MAX}
        aria-label="Increase width"
        onClick={() => onChange(clamp(value + PX_STEP))}
        className="h-6 w-6"
      >
        <Plus size={size.icon} strokeWidth={1.75} />
      </Button>
    </div>
  )
}

function ImagePreview({
  state,
  sizing,
}: {
  state: ImagePrototypeState
  sizing: SizingModel
}) {
  const shape = useShape()
  const box = previewWidth(state, sizing)
  const alt = imageAlt(state)
  const cropStyle: CSSProperties = {
    width: "100%",
    height: CROP_HEIGHT,
    borderRadius: cornerRadius(state.corners),
  }

  return (
    <div className="flex min-h-[22rem] flex-1 flex-col bg-muted/60 p-5">
      <div
        className={cn(
          "mx-auto flex w-full max-w-[22rem] flex-1 flex-col bg-card shadow-surface-3",
          shape.container
        )}
      >
        <div
          className={cn(
            "flex min-h-[14rem] flex-1",
            fillClass(state.fill),
            paddingClass(state.padding)
          )}
          style={{
            alignItems: alignItems(state.vAlign),
            justifyContent: justifyContent(state.align),
          }}
        >
          <figure
            className={cn(
              "flex min-w-0 flex-col gap-1.5",
              !state.visible && "opacity-40"
            )}
            style={{ width: box.width, maxWidth: box.maxWidth }}
          >
            <div
              className={cn(
                "overflow-hidden",
                state.fit === "contain" && "bg-muted",
                state.linked && "ring-1 ring-border"
              )}
              style={cropStyle}
            >
              <img
                src={SOURCE_SRC[state.source]}
                alt={alt}
                className={cn(
                  "h-full w-full",
                  state.fit === "cover" ? "object-cover" : "object-contain"
                )}
              />
            </div>
            {state.caption ? (
              <figcaption className="text-caption text-muted-foreground">
                {state.caption}
              </figcaption>
            ) : null}
          </figure>
        </div>
        <PreviewMeta state={state} sizing={sizing} />
      </div>
    </div>
  )
}

function PreviewMeta({
  state,
  sizing,
}: {
  state: ImagePrototypeState
  sizing: SizingModel
}) {
  const widthLabel =
    sizing === "preset"
      ? sizePresetLabel(state.sizePreset)
      : widthModeLabel(state)

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-3 py-2">
      <Badge variant="dot" color={state.visible ? "green" : "gray"}>
        {state.visible ? "Shown" : "Hidden"}
      </Badge>
      <Badge variant="dot" color="gray">
        {widthLabel}
      </Badge>
      <Badge variant="dot" color="gray">
        {state.fit}
      </Badge>
      {state.linked ? (
        <Badge variant="dot" color="blue">
          Linked
        </Badge>
      ) : null}
      {state.device !== "all" ? (
        <Badge variant="dot" color="amber">
          {state.device === "desktop" ? "Desktop only" : "Mobile only"}
        </Badge>
      ) : null}
    </div>
  )
}

function sizePresetLabel(preset: ImagePrototypeState["sizePreset"]): string {
  switch (preset) {
    case "hug":
      return "Hug"
    case "half":
      return "Half"
    case "fill":
      return "Fill"
    default: {
      const exhaustive: never = preset
      throw new Error(`Unhandled size preset: ${exhaustive}`)
    }
  }
}

function widthModeLabel(state: ImagePrototypeState): string {
  switch (state.widthMode) {
    case "auto":
      return `AUTO ${intrinsicWidth(state.source)}`
    case "fixed":
      return `FIXED ${state.widthPx}`
    case "max":
      return `MAX ${state.widthPx}`
    default: {
      const exhaustive: never = state.widthMode
      throw new Error(`Unhandled width mode: ${exhaustive}`)
    }
  }
}

function SourceRow({
  state,
  onPatch,
}: {
  state: ImagePrototypeState
  onPatch: (next: Partial<ImagePrototypeState>) => void
}) {
  return (
    <>
      <PropRow label="File">
        <SegmentGroup
          value={state.source}
          onChange={(source) => onPatch({ source })}
          options={SOURCE_OPTIONS}
        />
      </PropRow>
      <div className="flex items-center gap-2 px-0.5 py-0.5">
        <span
          className="flex h-8 w-8 shrink-0 overflow-hidden bg-muted"
          style={{ borderRadius: 6 }}
        >
          <img
            src={SOURCE_SRC[state.source]}
            alt=""
            className="h-full w-full object-cover"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-caption font-medium text-foreground">
            {SOURCE_LABEL[state.source]}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {SOURCE_BYTES[state.source]}
          </p>
        </div>
        <ImageIcon
          size={14}
          strokeWidth={1.5}
          className="text-muted-foreground"
        />
      </div>
    </>
  )
}

function ContentFields({
  state,
  onPatch,
}: {
  state: ImagePrototypeState
  onPatch: (next: Partial<ImagePrototypeState>) => void
}) {
  return (
    <>
      <PropRow label="Alt">
        <SegmentGroup
          value={state.decorative ? "on" : "off"}
          onChange={(value) => onPatch({ decorative: value === "on" })}
          options={DECORATIVE_OPTIONS}
        />
      </PropRow>
      <InspectorFields>
        <CompactField
          index={0}
          label="Alt text"
          value={state.alt}
          onChange={(alt) => onPatch({ alt })}
          placeholder={state.decorative ? "Decorative" : "Describe the image"}
          disabled={state.decorative}
        />
      </InspectorFields>
      <PropRow label="Link">
        <SegmentGroup
          value={state.linked ? "on" : "off"}
          onChange={(value) => onPatch({ linked: value === "on" })}
          options={LINK_OPTIONS}
        />
      </PropRow>
      <InspectorFields>
        <CompactField
          index={0}
          label="URL"
          icon={Link2}
          value={state.href}
          onChange={(href) => onPatch({ href })}
          placeholder="https://"
          disabled={!state.linked}
        />
        <CompactField
          index={1}
          label="Caption"
          value={state.caption}
          onChange={(caption) => onPatch({ caption })}
          placeholder="Optional caption"
        />
      </InspectorFields>
    </>
  )
}

function LayoutToggles({
  state,
  onPatch,
  sizing,
}: {
  state: ImagePrototypeState
  onPatch: (next: Partial<ImagePrototypeState>) => void
  sizing: SizingModel
}) {
  return (
    <>
      {sizing === "width-mode" ? (
        <>
          <PropRow label="Width">
            <SegmentGroup
              value={state.widthMode}
              onChange={(widthMode) => onPatch({ widthMode })}
              options={WIDTH_MODE_OPTIONS}
            />
          </PropRow>
          <PropRow label="Px">
            <PxStepper
              value={displayedWidth(state)}
              disabled={state.widthMode === "auto"}
              onChange={(widthPx) => onPatch({ widthPx })}
            />
          </PropRow>
        </>
      ) : (
        <PropRow label="Size">
          <SegmentGroup
            value={state.sizePreset}
            onChange={(sizePreset) => onPatch({ sizePreset })}
            options={SIZE_PRESET_OPTIONS}
          />
        </PropRow>
      )}
      <PropRow label="Align">
        <IconToggleGroup
          value={state.align}
          onChange={(align) => onPatch({ align })}
          options={ALIGN_OPTIONS}
        />
      </PropRow>
      <PropRow label="Vertical">
        <IconToggleGroup
          value={state.vAlign}
          onChange={(vAlign) => onPatch({ vAlign })}
          options={VALIGN_OPTIONS}
        />
      </PropRow>
      <PropRow label="Fit">
        <SegmentGroup
          value={state.fit}
          onChange={(fit) => onPatch({ fit })}
          options={FIT_OPTIONS}
        />
      </PropRow>
    </>
  )
}

function ChromeToggles({
  state,
  onPatch,
}: {
  state: ImagePrototypeState
  onPatch: (next: Partial<ImagePrototypeState>) => void
}) {
  return (
    <>
      <PropRow label="Corners">
        <SegmentGroup
          value={state.corners}
          onChange={(corners) => onPatch({ corners })}
          options={CORNER_OPTIONS}
        />
      </PropRow>
      <PropRow label="Padding">
        <SegmentGroup
          value={state.padding}
          onChange={(padding) => onPatch({ padding })}
          options={PADDING_OPTIONS}
        />
      </PropRow>
      <PropRow label="Fill">
        <SegmentGroup
          value={state.fill}
          onChange={(fill) => onPatch({ fill })}
          options={FILL_OPTIONS}
        />
      </PropRow>
      <PropRow label="Visibility">
        <IconToggleGroup
          value={state.visible ? "shown" : "hidden"}
          onChange={(value) => onPatch({ visible: value === "shown" })}
          options={VISIBILITY_OPTIONS}
        />
      </PropRow>
      <PropRow label="Device">
        <IconToggleGroup
          value={state.device}
          onChange={(device) => onPatch({ device })}
          options={DEVICE_OPTIONS}
        />
      </PropRow>
    </>
  )
}

function PanelChrome({ children }: { children: ReactNode }) {
  return (
    <SizeProvider size="compact">
      <aside className="flex w-full shrink-0 flex-col overflow-auto border-t border-border bg-card lg:w-[18.5rem] lg:border-t-0 lg:border-l">
        {children}
      </aside>
    </SizeProvider>
  )
}

function PanelHeader({ title }: { title: string }) {
  return (
    <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
      <h3 className="min-w-0 flex-1 truncate text-body font-medium tracking-tight">
        {title}
      </h3>
      <Badge variant="dot" color="gray">
        image
      </Badge>
    </header>
  )
}

function WidthModesPanel({
  state,
  onPatch,
}: {
  state: ImagePrototypeState
  onPatch: (next: Partial<ImagePrototypeState>) => void
}) {
  return (
    <PanelChrome>
      <PanelHeader title="Image" />
      <div className="flex flex-col px-3 py-2.5">
        <InspectorSection title="File" icon={ImageIcon}>
          <SourceRow state={state} onPatch={onPatch} />
        </InspectorSection>
        <InspectorSection title="Content" icon={Link2}>
          <ContentFields state={state} onPatch={onPatch} />
        </InspectorSection>
        <InspectorSection title="Layout" icon={AlignCenter}>
          <LayoutToggles state={state} onPatch={onPatch} sizing="width-mode" />
        </InspectorSection>
        <InspectorSection title="Chrome" icon={Eye}>
          <ChromeToggles state={state} onPatch={onPatch} />
        </InspectorSection>
      </div>
    </PanelChrome>
  )
}

function PresetsPanel({
  state,
  onPatch,
}: {
  state: ImagePrototypeState
  onPatch: (next: Partial<ImagePrototypeState>) => void
}) {
  return (
    <PanelChrome>
      <PanelHeader title="Image" />
      <div className="flex flex-col px-3 py-2.5">
        <InspectorSection title="File" icon={ImageIcon}>
          <SourceRow state={state} onPatch={onPatch} />
        </InspectorSection>
        <InspectorSection title="Content" icon={Link2}>
          <ContentFields state={state} onPatch={onPatch} />
        </InspectorSection>
        <InspectorSection title="Layout" icon={AlignCenter}>
          <LayoutToggles state={state} onPatch={onPatch} sizing="preset" />
        </InspectorSection>
        <InspectorSection title="Chrome" icon={Eye}>
          <ChromeToggles state={state} onPatch={onPatch} />
        </InspectorSection>
      </div>
    </PanelChrome>
  )
}

function SidePanelCandidate({
  state,
  onPatch,
}: {
  state: ImagePrototypeState
  onPatch: (next: Partial<ImagePrototypeState>) => void
}) {
  const [tab, setTab] = useState("customize")

  return (
    <PanelChrome>
      <PanelHeader title="Image" />
      <div className="flex flex-1 flex-col px-3 py-2.5">
        <Tabs value={tab} onValueChange={setTab} size="compact">
          <TabsList className="w-full">
            <TabItem
              value="customize"
              label="Customize"
              className="min-w-0 flex-1 justify-center"
            />
            <TabItem
              value="style"
              label="Edit styles"
              className="min-w-0 flex-1 justify-center"
            />
          </TabsList>
          <TabPanel value="customize" className="pt-2.5">
            <InspectorSection title="Image" icon={ImageIcon}>
              <SourceRow state={state} onPatch={onPatch} />
            </InspectorSection>
            <InspectorSection title="Content" icon={Link2}>
              <ContentFields state={state} onPatch={onPatch} />
            </InspectorSection>
          </TabPanel>
          <TabPanel value="style" className="pt-2.5">
            <InspectorSection title="Layout" icon={AlignCenter}>
              <LayoutToggles
                state={state}
                onPatch={onPatch}
                sizing="width-mode"
              />
            </InspectorSection>
            <InspectorSection title="Appearance" icon={Eye}>
              <ChromeToggles state={state} onPatch={onPatch} />
            </InspectorSection>
          </TabPanel>
        </Tabs>
      </div>
    </PanelChrome>
  )
}

function PrototypeStage({
  title,
  description,
  sizing,
  panel,
}: {
  title: string
  description: string
  sizing: SizingModel
  panel: (
    state: ImagePrototypeState,
    onPatch: (next: Partial<ImagePrototypeState>) => void
  ) => ReactNode
}) {
  const [state, patch] = useImagePrototype(
    sizing === "preset" ? { sizePreset: "fill" } : undefined
  )
  const shape = useShape()

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-subtitle font-medium tracking-tight">{title}</h3>
        <p className="max-w-2xl text-caption text-muted-foreground">
          {description}
        </p>
      </div>
      <div
        className={cn(
          "flex flex-col overflow-hidden bg-card shadow-surface-3 lg:flex-row",
          shape.container
        )}
      >
        <ImagePreview state={state} sizing={sizing} />
        {panel(state, patch)}
      </div>
    </section>
  )
}

export function ImagePrototypeGallery() {
  return (
    <div className="flex flex-col gap-8">
      <PrototypeStage
        title="Width modes"
        description="Tabular's width model. AUTO hugs the file. FIXED is an exact px. MAX is fluid up to a cap. The stepper stays when AUTO is on, just disabled."
        sizing="width-mode"
        panel={(state, onPatch) => (
          <WidthModesPanel state={state} onPatch={onPatch} />
        )}
      />
      <PrototypeStage
        title="Presets"
        description="No pixel field. Hug, half, and fill cover the cases we actually use in a 600px email. Corners and padding stay four-step groups."
        sizing="preset"
        panel={(state, onPatch) => (
          <PresetsPanel state={state} onPatch={onPatch} />
        )}
      />
      <PrototypeStage
        title="Side panel"
        description="Same width as the editor inspector, with Customize / Edit styles. Content (file, alt, link) on one tab, layout and chrome on the other."
        sizing="width-mode"
        panel={(state, onPatch) => (
          <SidePanelCandidate state={state} onPatch={onPatch} />
        )}
      />
    </div>
  )
}
