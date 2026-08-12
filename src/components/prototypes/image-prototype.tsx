import { useCallback, useState, type CSSProperties, type ReactNode } from "react"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Circle,
  Droplet,
  Eye,
  EyeOff,
  ImageIcon,
  LayoutTemplate,
  Link2,
  Plus,
  Square,
  Squircle,
  Type,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ColorPickerPopover } from "@/components/ui/color-picker"
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
  applyBorderPreset,
  applyShapePreset,
  applySizePreset,
  applySpacePreset,
  defaultSectionModes,
  matchBorderPreset,
  matchShapePreset,
  matchSizePreset,
  matchSpacePreset,
  type BorderChoice,
  type SectionId,
  type SectionMode,
  type ShapeChoice,
  type SizePreset,
  type SpaceChoice,
} from "./image-presets"
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

const MODE_OPTIONS: SegOption<SectionMode>[] = [
  { value: "simple", label: "Simple" },
  { value: "adjust", label: "Adjust" },
]

const SOURCE_MODE_OPTIONS: SegOption<SourceMode>[] = [
  { value: "upload", label: "File" },
  { value: "url", label: "URL" },
  { value: "icons", label: "Icon" },
]

const FILE_OPTIONS: SegOption<ImageSource>[] = [
  { value: "landscape", label: "Photo" },
  { value: "portrait", label: "Tall" },
  { value: "icon", label: "Icon" },
]

const UPLOAD_FILE_OPTIONS: SegOption<ImageSource>[] = [
  { value: "landscape", label: "Photo" },
  { value: "portrait", label: "Tall" },
]

const SIZE_PRESET_OPTIONS: SegOption<SizePreset>[] = [
  { value: "auto", label: "Auto" },
  { value: "fill", label: "Fill" },
  { value: "fixed", label: "Fixed" },
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

const ON_OFF: SegOption<"off" | "on">[] = [
  { value: "off", label: "Off" },
  { value: "on", label: "On" },
]

const SHAPE_OPTIONS: SegOption<ShapeChoice>[] = [
  { value: "square", icon: Square, title: "Square" },
  { value: "rounded", icon: Squircle, title: "Rounded" },
  { value: "circle", icon: Circle, title: "Circle" },
]

const SPACE_OPTIONS: SegOption<SpaceChoice>[] = [
  { value: "none", label: "None" },
  { value: "tight", label: "Tight" },
  { value: "room", label: "Room" },
]

const BORDER_PRESET_OPTIONS: SegOption<BorderChoice>[] = [
  { value: "none", label: "None" },
  { value: "line", label: "Line" },
  { value: "strong", label: "Strong" },
]

const BORDER_STYLE_OPTIONS: SegOption<BorderStyle>[] = [
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dash" },
  { value: "dotted", label: "Dot" },
]

const FILL_SIMPLE: SegOption<BackgroundKind | "custom">[] = [
  { value: "none", label: "None" },
  { value: "color", label: "Color" },
]

const FILL_ADJUST: SegOption<BackgroundKind>[] = [
  { value: "none", label: "None" },
  { value: "color", label: "Color" },
  { value: "image", label: "Image" },
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

function ModeToggle({
  value,
  onChange,
}: {
  value: SectionMode
  onChange: (next: SectionMode) => void
}) {
  return (
    <SegmentGroup
      grow={false}
      value={value}
      onChange={onChange}
      options={MODE_OPTIONS}
    />
  )
}

function ImagePreview({ state }: { state: ImagePrototypeState }) {
  const shape = useShape()
  const chrome = activeChrome(state)
  const box = previewBox(chrome, state.source)
  const src = resolvedSrc(state)
  const linked = state.href.trim().length > 0

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
    <div className="flex min-h-[22rem] flex-1 flex-col overflow-hidden bg-muted/60 p-5">
      <div
        className={cn(
          "mx-auto flex w-full flex-1 flex-col bg-card shadow-surface-3",
          shape.container
        )}
        style={{ maxWidth: "22rem" }}
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
  mode,
}: {
  state: ImagePrototypeState
  onPatch: (next: Partial<ImagePrototypeState>) => void
  mode: SectionMode
}) {
  const uploadSource = state.source === "icon" ? "landscape" : state.source

  return (
    <>
      {mode === "simple" ? (
        <>
          <PropRow label="File">
            <SegmentGroup
              value={state.source}
              onChange={(source) => onPatch({ source, sourceMode: "upload" })}
              options={FILE_OPTIONS}
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
    </>
  )
}

function ContentSection({
  state,
  onPatch,
  mode,
}: {
  state: ImagePrototypeState
  onPatch: (next: Partial<ImagePrototypeState>) => void
  mode: SectionMode
}) {
  return (
    <>
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
      {mode === "adjust" ? (
        <PropRow label="Dynamic">
          <SegmentGroup
            value={state.dynamicContent ? "on" : "off"}
            onChange={(value) => onPatch({ dynamicContent: value === "on" })}
            options={ON_OFF}
          />
        </PropRow>
      ) : null}
    </>
  )
}

function LayoutSection({
  state,
  chrome,
  onPatchChrome,
  mode,
}: {
  state: ImagePrototypeState
  chrome: ImageChrome
  onPatchChrome: (next: Partial<ImageChrome>) => void
  mode: SectionMode
}) {
  return (
    <>
      <PropRow label="Visibility">
        <IconToggleGroup
          value={chrome.visible ? "shown" : "hidden"}
          onChange={(value) => onPatchChrome({ visible: value === "shown" })}
          options={VISIBILITY_OPTIONS}
        />
      </PropRow>
      {mode === "simple" ? (
        <PropRow label="Width">
          <SegmentGroup
            value={matchSizePreset(chrome.widthMode)}
            onChange={(preset) => onPatchChrome(applySizePreset(preset))}
            options={SIZE_PRESET_OPTIONS}
          />
        </PropRow>
      ) : (
        <>
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
        </>
      )}
      <PropRow label="Align">
        <IconToggleGroup
          value={chrome.align}
          onChange={(align) => onPatchChrome({ align })}
          options={ALIGN_OPTIONS}
        />
      </PropRow>
      {mode === "adjust" ? (
        <PropRow label="Vertical">
          <IconToggleGroup
            value={chrome.vAlign}
            onChange={(vAlign) => onPatchChrome({ vAlign })}
            options={VALIGN_OPTIONS}
          />
        </PropRow>
      ) : null}
    </>
  )
}

function SpacingSection({
  chrome,
  onPatchChrome,
  mode,
}: {
  chrome: ImageChrome
  onPatchChrome: (next: Partial<ImageChrome>) => void
  mode: SectionMode
}) {
  const shape = matchShapePreset(chrome.corners)
  const padding = matchSpacePreset(chrome.padding)

  return mode === "simple" ? (
    <>
      <PropRow label="Shape">
        <IconToggleGroup
          value={shape}
          onChange={(preset) => {
            if (preset === "custom") return
            onPatchChrome({ corners: applyShapePreset(preset) })
          }}
          options={SHAPE_OPTIONS}
        />
      </PropRow>
      <PropRow label="Padding">
        <SegmentGroup
          value={padding}
          onChange={(preset) => {
            if (preset === "custom") return
            onPatchChrome({ padding: applySpacePreset(preset) })
          }}
          options={SPACE_OPTIONS}
        />
      </PropRow>
    </>
  ) : (
    <>
      <PropRow label="Radius">
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
      </PropRow>
      <PropRow label="Padding">
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
      </PropRow>
      <PropRow label="Margin">
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
      </PropRow>
    </>
  )
}

function BorderSection({
  chrome,
  onPatchChrome,
  mode,
}: {
  chrome: ImageChrome
  onPatchChrome: (next: Partial<ImageChrome>) => void
  mode: SectionMode
}) {
  const preset = matchBorderPreset(chrome.borderEnabled, chrome.border)

  if (mode === "simple") {
    return (
      <PropRow label="Stroke">
        <SegmentGroup
          value={preset}
          onChange={(next) => {
            if (next === "custom") return
            onPatchChrome(applyBorderPreset(chrome.border, next))
          }}
          options={BORDER_PRESET_OPTIONS}
        />
      </PropRow>
    )
  }

  return chrome.borderEnabled ? (
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
  )
}

function FillSection({
  chrome,
  onPatchChrome,
  mode,
}: {
  chrome: ImageChrome
  onPatchChrome: (next: Partial<ImageChrome>) => void
  mode: SectionMode
}) {
  const simpleValue =
    chrome.background === "image" ? "custom" : chrome.background

  return (
    <>
      <PropRow label="Fill">
        {mode === "simple" ? (
          <SegmentGroup
            value={simpleValue}
            onChange={(background) => {
              if (background === "custom") return
              onPatchChrome({ background })
            }}
            options={FILL_SIMPLE}
          />
        ) : (
          <SegmentGroup
            value={chrome.background}
            onChange={(background) => onPatchChrome({ background })}
            options={FILL_ADJUST}
          />
        )}
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
    </>
  )
}

function PanelChrome({ children }: { children: ReactNode }) {
  return (
    <SizeProvider size="compact">
      <aside className="flex max-h-[28rem] w-full shrink-0 flex-col overflow-auto border-t border-border bg-card lg:max-h-none lg:w-[18.5rem] lg:border-t-0 lg:border-l">
        {children}
      </aside>
    </SizeProvider>
  )
}

function ImagePanel({
  state,
  onPatch,
  onPatchChrome,
}: {
  state: ImagePrototypeState
  onPatch: (next: Partial<ImagePrototypeState>) => void
  onPatchChrome: (next: Partial<ImageChrome>) => void
}) {
  const [modes, setModes] = useState(defaultSectionModes)
  const chrome = activeChrome(state)

  function setMode(id: SectionId, mode: SectionMode) {
    setModes((prev) => ({ ...prev, [id]: mode }))
  }

  return (
    <PanelChrome>
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-3 py-2.5">
        <h3 className="min-w-0 flex-1 truncate text-body font-medium tracking-tight">
          Image
        </h3>
      </header>
      <div className="flex flex-1 flex-col px-3 py-2.5">
        <InspectorSection
          title="Image"
          icon={ImageIcon}
          action={
            <ModeToggle
              value={modes.image}
              onChange={(mode) => setMode("image", mode)}
            />
          }
        >
          <SourceSection
            state={state}
            onPatch={onPatch}
            mode={modes.image}
          />
        </InspectorSection>
        <InspectorSection
          title="Content"
          icon={Type}
          action={
            <ModeToggle
              value={modes.content}
              onChange={(mode) => setMode("content", mode)}
            />
          }
        >
          <ContentSection
            state={state}
            onPatch={onPatch}
            mode={modes.content}
          />
        </InspectorSection>
        <InspectorSection
          title="Layout"
          icon={LayoutTemplate}
          action={
            <ModeToggle
              value={modes.layout}
              onChange={(mode) => setMode("layout", mode)}
            />
          }
        >
          <LayoutSection
            state={state}
            chrome={chrome}
            onPatchChrome={onPatchChrome}
            mode={modes.layout}
          />
        </InspectorSection>
        <InspectorSection
          title="Spacing"
          icon={LayoutTemplate}
          action={
            <ModeToggle
              value={modes.spacing}
              onChange={(mode) => setMode("spacing", mode)}
            />
          }
        >
          <SpacingSection
            chrome={chrome}
            onPatchChrome={onPatchChrome}
            mode={modes.spacing}
          />
        </InspectorSection>
        <InspectorSection
          title="Border"
          icon={LayoutTemplate}
          action={
            <ModeToggle
              value={modes.border}
              onChange={(mode) => setMode("border", mode)}
            />
          }
        >
          <BorderSection
            chrome={chrome}
            onPatchChrome={onPatchChrome}
            mode={modes.border}
          />
        </InspectorSection>
        <InspectorSection
          title="Fill"
          icon={Droplet}
          action={
            <ModeToggle
              value={modes.fill}
              onChange={(mode) => setMode("fill", mode)}
            />
          }
        >
          <FillSection
            chrome={chrome}
            onPatchChrome={onPatchChrome}
            mode={modes.fill}
          />
        </InspectorSection>
      </div>
    </PanelChrome>
  )
}

export function ImagePrototypeGallery() {
  const [state, patch, patchChrome] = useImagePrototype()
  const shape = useShape()

  return (
    <section className="flex flex-col gap-3" data-prototype="core">
      <div
        className={cn(
          "flex flex-col overflow-hidden bg-card shadow-surface-3 lg:h-[38rem] lg:flex-row",
          shape.container
        )}
      >
        <ImagePreview state={state} />
        <ImagePanel
          state={state}
          onPatch={patch}
          onPatchChrome={patchChrome}
        />
      </div>
    </section>
  )
}
