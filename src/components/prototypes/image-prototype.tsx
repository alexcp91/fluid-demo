import { useCallback, useState, type CSSProperties, type ReactNode } from "react"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Droplet,
  Eye,
  EyeOff,
  ImageIcon,
  LayoutTemplate,
  Link2,
  Monitor,
  Plus,
  Smartphone,
  Type,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ColorPickerPopover } from "@/components/ui/color-picker"
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
import { SizeProvider } from "@/lib/size-context"
import { useShape } from "@/lib/shape-context"
import { cn } from "@/lib/utils"
import { CornerGrid, NumStepper, QuadRow } from "./image-fields"
import {
  SOURCE_BYTES,
  SOURCE_LABEL,
  SOURCE_SRC,
  activeChrome,
  alignItems,
  cornerCss,
  defaultImagePrototype,
  displayedWidth,
  justifyContent,
  patchChrome,
  previewBox,
  quadCss,
  resolvedSrc,
  setCorner,
  setQuad,
  toggleCornerLink,
  toggleQuadLink,
  type BackgroundKind,
  type BorderStyle,
  type ImageChrome,
  type ImagePrototypeState,
  type ImageSource,
  type SizeMode,
  type SourceMode,
} from "./image-state"

type Density = "core" | "plus" | "full"

const SOURCE_MODE_OPTIONS: SegOption<SourceMode>[] = [
  { value: "upload", label: "File" },
  { value: "url", label: "URL" },
  { value: "icons", label: "Icon" },
]

const CORE_FILE_OPTIONS: SegOption<ImageSource>[] = [
  { value: "landscape", label: "Photo" },
  { value: "portrait", label: "Tall" },
  { value: "icon", label: "Icon" },
]

const UPLOAD_FILE_OPTIONS: SegOption<ImageSource>[] = [
  { value: "landscape", label: "Photo" },
  { value: "portrait", label: "Tall" },
]

const SIZE_MODE_OPTIONS: SegOption<SizeMode>[] = [
  { value: "auto", label: "AUTO" },
  { value: "fixed", label: "FIXED" },
  { value: "max", label: "MAX" },
]

const ALIGN_OPTIONS: SegOption<ImageChrome["align"]>[] = [
  { value: "left", icon: AlignLeft, title: "Align left" },
  { value: "center", icon: AlignCenter, title: "Align center" },
  { value: "right", icon: AlignRight, title: "Align right" },
]

const VALIGN_OPTIONS: SegOption<ImageChrome["vAlign"]>[] = [
  { value: "top", icon: AlignVerticalJustifyStart, title: "Align top" },
  {
    value: "middle",
    icon: AlignVerticalJustifyCenter,
    title: "Align middle",
  },
  { value: "bottom", icon: AlignVerticalJustifyEnd, title: "Align bottom" },
]

const VISIBILITY_OPTIONS: SegOption<"shown" | "hidden">[] = [
  { value: "shown", icon: Eye, title: "Shown" },
  { value: "hidden", icon: EyeOff, title: "Hidden" },
]

const DEVICE_OPTIONS: SegOption<ImagePrototypeState["device"]>[] = [
  { value: "desktop", icon: Monitor, title: "Desktop" },
  { value: "mobile", icon: Smartphone, title: "Mobile" },
]

const ON_OFF: SegOption<"off" | "on">[] = [
  { value: "off", label: "Off" },
  { value: "on", label: "On" },
]

const BORDER_STYLE_OPTIONS: SegOption<BorderStyle>[] = [
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dash" },
  { value: "dotted", label: "Dot" },
]

const BACKGROUND_OPTIONS: SegOption<BackgroundKind>[] = [
  { value: "none", label: "None" },
  { value: "color", label: "Color" },
  { value: "image", label: "Image" },
]

const BACKGROUND_SIMPLE: SegOption<BackgroundKind>[] = [
  { value: "none", label: "None" },
  { value: "color", label: "Color" },
]

function useImagePrototype() {
  const [state, setState] = useState(defaultImagePrototype)
  const patch = useCallback((next: Partial<ImagePrototypeState>) => {
    setState((prev) => ({ ...prev, ...next }))
  }, [])
  const patchActive = useCallback((next: Partial<ImageChrome>) => {
    setState((prev) => patchChrome(prev, next))
  }, [])
  return [state, patch, patchActive] as const
}

function ImagePreview({
  state,
  density,
}: {
  state: ImagePrototypeState
  density: Density
}) {
  const shape = useShape()
  const chrome = activeChrome(state)
  const box = previewBox(chrome, state.source)
  const src = resolvedSrc(state)
  const linked = state.href.trim().length > 0
  const canvasWidth = state.device === "mobile" ? "17rem" : "22rem"

  const blockStyle: CSSProperties = {
    width: box.width,
    maxWidth: box.maxWidth,
    margin: quadCss(chrome.margin),
    padding: quadCss(chrome.padding),
    borderRadius: cornerCss(chrome.corners),
    border: chrome.borderEnabled
      ? `${chrome.border.width}px ${chrome.border.style} ${chrome.border.color}`
      : "none",
    backgroundColor:
      chrome.background === "color" ? chrome.backgroundColor : undefined,
    backgroundImage:
      chrome.background === "image" ? `url(${SOURCE_SRC.landscape})` : undefined,
    backgroundSize: chrome.background === "image" ? "cover" : undefined,
  }

  const imgStyle: CSSProperties = {
    width: "100%",
    height: box.height,
    maxHeight: box.maxHeight === "none" ? undefined : box.maxHeight,
    objectFit: chrome.heightMode === "fixed" ? "cover" : "contain",
    borderRadius: cornerCss(chrome.corners),
  }

  return (
    <div className="flex min-h-[22rem] flex-1 flex-col bg-muted/60 p-5">
      <div
        className={cn(
          "mx-auto flex w-full flex-1 flex-col bg-card shadow-surface-3",
          shape.container
        )}
        style={{ maxWidth: canvasWidth }}
      >
        <div
          className="flex min-h-[14rem] flex-1"
          style={{
            alignItems: alignItems(chrome.vAlign),
            justifyContent: justifyContent(chrome.align),
          }}
        >
          <figure
            className={cn("min-w-0", !chrome.visible && "opacity-40")}
            style={blockStyle}
          >
            <img
              src={src}
              alt={state.alt}
              className={cn("block", linked && "ring-1 ring-border")}
              style={imgStyle}
            />
          </figure>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-3 py-2">
          <Badge variant="dot" color={chrome.visible ? "green" : "gray"}>
            {chrome.visible ? "Shown" : "Hidden"}
          </Badge>
          {density === "full" ? (
            <Badge variant="dot" color="gray">
              {state.device === "mobile" ? "Mobile" : "Desktop"}
            </Badge>
          ) : null}
          <Badge variant="dot" color="gray">
            {sizeModeLabel(
              chrome.widthMode,
              displayedWidth(chrome, state.source)
            )}
          </Badge>
          {linked ? (
            <Badge variant="dot" color="blue">
              {state.openInNewTab ? "Link · new tab" : "Link"}
            </Badge>
          ) : null}
          {state.dynamicContent ? (
            <Badge variant="dot" color="violet">
              Dynamic
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function sizeModeLabel(mode: SizeMode, px: number): string {
  switch (mode) {
    case "auto":
      return `AUTO ${px}`
    case "fixed":
      return `FIXED ${px}`
    case "max":
      return `MAX ${px}`
    default: {
      const exhaustive: never = mode
      throw new Error(`Unhandled size mode: ${exhaustive}`)
    }
  }
}

function FileMeta({ source }: { source: ImageSource }) {
  return (
    <div className="flex items-center gap-2 px-0.5 py-0.5">
      <span className="flex h-8 w-8 shrink-0 overflow-hidden rounded-md bg-muted">
        <img
          src={SOURCE_SRC[source]}
          alt=""
          className="h-full w-full object-cover"
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-caption font-medium text-foreground">
          {SOURCE_LABEL[source]}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {SOURCE_BYTES[source]}
        </p>
      </div>
      <ImageIcon
        size={14}
        strokeWidth={1.5}
        className="text-muted-foreground"
      />
    </div>
  )
}

function SourceSection({
  state,
  onPatch,
  density,
}: {
  state: ImagePrototypeState
  onPatch: (next: Partial<ImagePrototypeState>) => void
  density: Density
}) {
  const uploadSource = state.source === "icon" ? "landscape" : state.source

  return (
    <InspectorSection title="Image" icon={ImageIcon}>
      {density === "core" ? (
        <>
          <PropRow label="File">
            <SegmentGroup
              value={state.source}
              onChange={(source) => onPatch({ source, sourceMode: "upload" })}
              options={CORE_FILE_OPTIONS}
            />
          </PropRow>
          <FileMeta source={state.source} />
        </>
      ) : (
        <>
          <PropRow label="Source">
            <SegmentGroup
              value={state.sourceMode}
              onChange={(sourceMode) => {
                if (sourceMode === "icons") {
                  onPatch({ sourceMode, source: "icon" })
                  return
                }
                if (state.source === "icon") {
                  onPatch({ sourceMode, source: "landscape" })
                  return
                }
                onPatch({ sourceMode })
              }}
              options={SOURCE_MODE_OPTIONS}
            />
          </PropRow>
          {state.sourceMode === "upload" ? (
            <>
              <PropRow label="File">
                <SegmentGroup
                  value={uploadSource}
                  onChange={(source) => onPatch({ source })}
                  options={UPLOAD_FILE_OPTIONS}
                />
              </PropRow>
              <FileMeta source={state.source} />
            </>
          ) : null}
          {state.sourceMode === "url" ? (
            <InspectorFields>
              <CompactField
                index={0}
                label="Image URL"
                icon={Link2}
                value={state.imageUrl}
                onChange={(imageUrl) => onPatch({ imageUrl })}
                placeholder="https://"
              />
            </InspectorFields>
          ) : null}
          {state.sourceMode === "icons" ? <FileMeta source="icon" /> : null}
        </>
      )}
    </InspectorSection>
  )
}

function ContentSection({
  state,
  onPatch,
  density,
}: {
  state: ImagePrototypeState
  onPatch: (next: Partial<ImagePrototypeState>) => void
  density: Density
}) {
  return (
    <InspectorSection title="Content" icon={Type}>
      <InspectorFields>
        <CompactField
          index={0}
          label="Alt text"
          value={state.alt}
          onChange={(alt) => onPatch({ alt })}
          placeholder="Describe the image"
        />
        <CompactField
          index={1}
          label="Link URL"
          icon={Link2}
          value={state.href}
          onChange={(href) => onPatch({ href })}
          placeholder="https://"
        />
      </InspectorFields>
      <PropRow label="New tab">
        <SegmentGroup
          value={state.openInNewTab ? "on" : "off"}
          onChange={(value) => onPatch({ openInNewTab: value === "on" })}
          options={ON_OFF}
        />
      </PropRow>
      {density !== "core" ? (
        <PropRow label="Dynamic">
          <SegmentGroup
            value={state.dynamicContent ? "on" : "off"}
            onChange={(value) => onPatch({ dynamicContent: value === "on" })}
            options={ON_OFF}
          />
        </PropRow>
      ) : null}
    </InspectorSection>
  )
}

function LayoutSection({
  state,
  chrome,
  onPatchChrome,
}: {
  state: ImagePrototypeState
  chrome: ImageChrome
  onPatchChrome: (next: Partial<ImageChrome>) => void
}) {
  return (
    <InspectorSection title="Layout" icon={LayoutTemplate}>
      <PropRow label="Visibility">
        <IconToggleGroup
          value={chrome.visible ? "shown" : "hidden"}
          onChange={(value) => onPatchChrome({ visible: value === "shown" })}
          options={VISIBILITY_OPTIONS}
        />
      </PropRow>
      <PropRow label="Width">
        <SegmentGroup
          value={chrome.widthMode}
          onChange={(widthMode) => onPatchChrome({ widthMode })}
          options={SIZE_MODE_OPTIONS}
        />
      </PropRow>
      <PropRow label="W">
        <NumStepper
          value={displayedWidth(chrome, state.source)}
          disabled={chrome.widthMode === "auto"}
          onChange={(widthPx) => onPatchChrome({ widthPx })}
        />
      </PropRow>
      <PropRow label="Height">
        <SegmentGroup
          value={chrome.heightMode}
          onChange={(heightMode) => onPatchChrome({ heightMode })}
          options={SIZE_MODE_OPTIONS}
        />
      </PropRow>
      <PropRow label="H">
        <NumStepper
          value={chrome.heightPx}
          disabled={chrome.heightMode === "auto"}
          min={40}
          onChange={(heightPx) => onPatchChrome({ heightPx })}
        />
      </PropRow>
      <PropRow label="Align">
        <IconToggleGroup
          value={chrome.align}
          onChange={(align) => onPatchChrome({ align })}
          options={ALIGN_OPTIONS}
        />
      </PropRow>
      <PropRow label="Vertical">
        <IconToggleGroup
          value={chrome.vAlign}
          onChange={(vAlign) => onPatchChrome({ vAlign })}
          options={VALIGN_OPTIONS}
        />
      </PropRow>
    </InspectorSection>
  )
}

function SpacingSection({
  chrome,
  onPatchChrome,
  density,
}: {
  chrome: ImageChrome
  onPatchChrome: (next: Partial<ImageChrome>) => void
  density: Density
}) {
  return (
    <InspectorSection title="Spacing" icon={LayoutTemplate}>
      <PropRow label="Radius">
        {density === "core" ? (
          <NumStepper
            value={chrome.corners.topLeft}
            min={0}
            max={80}
            step={2}
            onChange={(next) =>
              onPatchChrome({
                corners: setCorner(chrome.corners, "topLeft", next),
              })
            }
          />
        ) : (
          <CornerGrid
            value={chrome.corners}
            onCornerChange={(edge, next) =>
              onPatchChrome({
                corners: setCorner(chrome.corners, edge, next),
              })
            }
            onToggleLink={() =>
              onPatchChrome({ corners: toggleCornerLink(chrome.corners) })
            }
          />
        )}
      </PropRow>
      <PropRow label="Padding">
        {density === "core" ? (
          <NumStepper
            value={chrome.padding.top}
            min={0}
            max={80}
            step={2}
            onChange={(next) =>
              onPatchChrome({
                padding: setQuad(chrome.padding, "top", next),
              })
            }
          />
        ) : (
          <QuadRow
            label="Padding"
            value={chrome.padding}
            onEdgeChange={(edge, next) =>
              onPatchChrome({
                padding: setQuad(chrome.padding, edge, next),
              })
            }
            onToggleLink={() =>
              onPatchChrome({ padding: toggleQuadLink(chrome.padding) })
            }
          />
        )}
      </PropRow>
      <PropRow label="Margin">
        {density === "core" ? (
          <NumStepper
            value={chrome.margin.top}
            min={0}
            max={80}
            step={2}
            onChange={(next) =>
              onPatchChrome({
                margin: setQuad(chrome.margin, "top", next),
              })
            }
          />
        ) : (
          <QuadRow
            label="Margin"
            value={chrome.margin}
            onEdgeChange={(edge, next) =>
              onPatchChrome({
                margin: setQuad(chrome.margin, edge, next),
              })
            }
            onToggleLink={() =>
              onPatchChrome({ margin: toggleQuadLink(chrome.margin) })
            }
          />
        )}
      </PropRow>
    </InspectorSection>
  )
}

function BorderSection({
  chrome,
  onPatchChrome,
}: {
  chrome: ImageChrome
  onPatchChrome: (next: Partial<ImageChrome>) => void
}) {
  return (
    <InspectorSection title="Border" icon={LayoutTemplate}>
      {chrome.borderEnabled ? (
        <>
          <PropRow label="Width">
            <NumStepper
              value={chrome.border.width}
              min={1}
              max={16}
              step={1}
              onChange={(width) =>
                onPatchChrome({ border: { ...chrome.border, width } })
              }
            />
          </PropRow>
          <PropRow label="Style">
            <SegmentGroup
              value={chrome.border.style}
              onChange={(style) =>
                onPatchChrome({ border: { ...chrome.border, style } })
              }
              options={BORDER_STYLE_OPTIONS}
            />
          </PropRow>
          <PropRow label="Color">
            <ColorPickerPopover
              value={chrome.border.color}
              onValueChange={(color) =>
                onPatchChrome({ border: { ...chrome.border, color } })
              }
              triggerLabel="Border"
              triggerShowValue
              size="compact"
            />
          </PropRow>
          <PropRow label="Border">
            <Button
              type="button"
              variant="ghost"
              size="compact"
              onClick={() => onPatchChrome({ borderEnabled: false })}
            >
              Remove
            </Button>
          </PropRow>
        </>
      ) : (
        <PropRow label="Border">
          <Button
            type="button"
            variant="tertiary"
            size="compact"
            leadingIcon={Plus}
            onClick={() => onPatchChrome({ borderEnabled: true })}
          >
            Add
          </Button>
        </PropRow>
      )}
    </InspectorSection>
  )
}

function BackgroundSection({
  chrome,
  onPatchChrome,
  density,
}: {
  chrome: ImageChrome
  onPatchChrome: (next: Partial<ImageChrome>) => void
  density: Density
}) {
  return (
    <InspectorSection title="Background" icon={Droplet}>
      <PropRow label="Fill">
        <SegmentGroup
          value={chrome.background}
          onChange={(background) => onPatchChrome({ background })}
          options={
            density === "core" ? BACKGROUND_SIMPLE : BACKGROUND_OPTIONS
          }
        />
      </PropRow>
      {chrome.background === "color" ? (
        <PropRow label="Color">
          <ColorPickerPopover
            value={chrome.backgroundColor}
            onValueChange={(backgroundColor) =>
              onPatchChrome({ backgroundColor })
            }
            triggerLabel="Fill"
            triggerShowValue
            size="compact"
          />
        </PropRow>
      ) : null}
    </InspectorSection>
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

function ImagePanel({
  density,
  state,
  onPatch,
  onPatchChrome,
}: {
  density: Density
  state: ImagePrototypeState
  onPatch: (next: Partial<ImagePrototypeState>) => void
  onPatchChrome: (next: Partial<ImageChrome>) => void
}) {
  const [tab, setTab] = useState("customize")
  const chrome = activeChrome(state)

  const customize = (
    <>
      <SourceSection state={state} onPatch={onPatch} density={density} />
      <ContentSection state={state} onPatch={onPatch} density={density} />
    </>
  )

  const styles = (
    <>
      {density === "full" ? (
        <InspectorSection title="Device" icon={Monitor}>
          <PropRow label="Mode">
            <IconToggleGroup
              value={state.device}
              onChange={(device) => onPatch({ device })}
              options={DEVICE_OPTIONS}
            />
          </PropRow>
          <p className="px-0.5 text-[11px] leading-snug text-muted-foreground">
            Mobile overwrites desktop for the styles below.
          </p>
        </InspectorSection>
      ) : null}
      <LayoutSection
        state={state}
        chrome={chrome}
        onPatchChrome={onPatchChrome}
      />
      <SpacingSection
        chrome={chrome}
        onPatchChrome={onPatchChrome}
        density={density}
      />
      <BorderSection chrome={chrome} onPatchChrome={onPatchChrome} />
      <BackgroundSection
        chrome={chrome}
        onPatchChrome={onPatchChrome}
        density={density}
      />
    </>
  )

  return (
    <PanelChrome>
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <h3 className="min-w-0 flex-1 truncate text-body font-medium tracking-tight">
          Image
        </h3>
        <Badge variant="dot" color="gray">
          {density}
        </Badge>
      </header>
      <div className="flex flex-1 flex-col px-3 py-2.5">
        {density === "core" ? (
          <>
            {customize}
            {styles}
          </>
        ) : (
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
              {customize}
            </TabPanel>
            <TabPanel value="style" className="pt-2.5">
              {styles}
            </TabPanel>
          </Tabs>
        )}
      </div>
    </PanelChrome>
  )
}

function PrototypeStage({
  title,
  description,
  density,
}: {
  title: string
  description: string
  density: Density
}) {
  const [state, patch, patchChrome] = useImagePrototype()
  const shape = useShape()

  return (
    <section className="flex flex-col gap-3" data-prototype={density}>
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
        <ImagePreview state={state} density={density} />
        <ImagePanel
          density={density}
          state={state}
          onPatch={patch}
          onPatchChrome={patchChrome}
        />
      </div>
    </section>
  )
}

export function ImagePrototypeGallery() {
  return (
    <div className="flex flex-col gap-8">
      <PrototypeStage
        density="core"
        title="Core"
        description="One list. Same Image functions with linked values: file, alt, link, new tab, visibility, AUTO / FIXED / MAX size, align, radius, padding, margin, border, fill color."
      />
      <PrototypeStage
        density="plus"
        title="Plus"
        description="Splits Customize / Edit styles. Adds a URL source, dynamic content, unlinkable corners and sides, and a background-image fill."
      />
      <PrototypeStage
        density="full"
        title="Full"
        description="Everything in Plus, plus desktop / mobile style overrides. Mobile overwrites desktop."
      />
    </div>
  )
}
