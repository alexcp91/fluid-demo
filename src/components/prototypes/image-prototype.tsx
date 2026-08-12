import { useCallback, useState, type CSSProperties, type ReactNode } from "react"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Braces,
  Circle,
  ExternalLink,
  Eye,
  EyeOff,
  ImageIcon,
  Link2,
  Plus,
  Square,
  Squircle,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ColorPickerPopover } from "@/components/ui/color-picker"
import { Tooltip } from "@/components/ui/tooltip"
import {
  CompactField,
  IconToggleGroup,
  InspectorFields,
  SegmentGroup,
  type SegOption,
} from "@/components/email-editor/inspector-controls"
import { SizeProvider } from "@/lib/size-context"
import { useShape } from "@/lib/shape-context"
import { useSize } from "@/lib/size-context"
import { cn } from "@/lib/utils"
import { DimField, IndependentToggle, MiniPx } from "./image-fields"
import {
  applyShapePreset,
  matchShapePreset,
  matchSizePreset,
  applySizePreset,
  type ShapeChoice,
  type SizePreset,
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
  type ImageChrome,
  type ImagePrototypeState,
  type ImageSource,
  type SizeMode,
} from "./image-state"

const FILE_OPTIONS: SegOption<ImageSource>[] = [
  { value: "landscape", label: "Photo" },
  { value: "portrait", label: "Tall" },
  { value: "icon", label: "Icon" },
]

const SIZE_PRESET_OPTIONS: SegOption<SizePreset>[] = [
  { value: "auto", label: "Hug" },
  { value: "fill", label: "Fill" },
  { value: "fixed", label: "Fixed" },
]

const HEIGHT_MODE_OPTIONS: SegOption<SizeMode>[] = [
  { value: "auto", label: "Hug" },
  { value: "fixed", label: "Fixed" },
  { value: "max", label: "Max" },
]

const ALIGN_OPTIONS: SegOption<ImageChrome["align"]>[] = [
  { value: "left", icon: AlignLeft, title: "Left" },
  { value: "center", icon: AlignCenter, title: "Center" },
  { value: "right", icon: AlignRight, title: "Right" },
]

const VALIGN_OPTIONS: SegOption<ImageChrome["vAlign"]>[] = [
  { value: "top", icon: AlignVerticalJustifyStart, title: "Top" },
  {
    value: "middle",
    icon: AlignVerticalJustifyCenter,
    title: "Middle",
  },
  { value: "bottom", icon: AlignVerticalJustifyEnd, title: "Bottom" },
]

const VISIBILITY_OPTIONS: SegOption<"shown" | "hidden">[] = [
  { value: "shown", icon: Eye, title: "Shown" },
  { value: "hidden", icon: EyeOff, title: "Hidden" },
]

const SHAPE_OPTIONS: SegOption<ShapeChoice>[] = [
  { value: "square", icon: Square, title: "Square" },
  { value: "rounded", icon: Squircle, title: "Rounded" },
  { value: "circle", icon: Circle, title: "Circle" },
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

function FigSection({
  title,
  onAdd,
  addLabel,
  children,
}: {
  title: string
  onAdd?: () => void
  addLabel?: string
  children?: ReactNode
}) {
  return (
    <section className="border-b border-border/60 px-3 py-2 last:border-b-0">
      <div className="mb-1 flex h-6 items-center">
        <h4 className="min-w-0 flex-1 text-[11px] font-medium tracking-wide text-muted-foreground">
          {title}
        </h4>
        {onAdd ? (
          <Tooltip content={addLabel ?? `Add ${title}`} side="bottom">
            <Button
              type="button"
              variant="ghost"
              size="icon-compact"
              aria-label={addLabel ?? `Add ${title}`}
              onClick={onAdd}
              className="h-6 w-6"
            >
              <Plus size={14} strokeWidth={1.5} />
            </Button>
          </Tooltip>
        ) : null}
      </div>
      {children ? (
        <div className="flex flex-col gap-1">{children}</div>
      ) : null}
    </section>
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
      </div>
    </div>
  )
}

function AppearanceRow({
  color,
  onColorChange,
  onRemove,
  children,
}: {
  color: string
  onColorChange: (next: string) => void
  onRemove: () => void
  children?: ReactNode
}) {
  return (
    <div className="flex items-center gap-1">
      <ColorPickerPopover
        value={color}
        onValueChange={onColorChange}
        triggerShowValue
        size="compact"
        triggerClassName="min-w-0 flex-1 justify-start"
      />
      {children}
      <Tooltip content="Remove" side="bottom">
        <Button
          type="button"
          variant="ghost"
          size="icon-compact"
          aria-label="Remove"
          onClick={onRemove}
          className="h-7 w-7 shrink-0"
        >
          <X size={14} strokeWidth={1.5} />
        </Button>
      </Tooltip>
    </div>
  )
}

function PaddingEditor({
  value,
  onEdgeChange,
  onToggleLink,
}: {
  value: ImageChrome["padding"]
  onEdgeChange: (edge: "top" | "right" | "bottom" | "left", next: number) => void
  onToggleLink: () => void
}) {
  if (value.linked) {
    return (
      <div className="flex items-center gap-1">
        <DimField
          label="P"
          value={value.top}
          min={0}
          max={80}
          onChange={(next) => onEdgeChange("top", next)}
        />
        <IndependentToggle
          kind="padding"
          linked={value.linked}
          onToggle={onToggleLink}
        />
      </div>
    )
  }

  return (
    <div className="flex items-start gap-1">
      <div className="grid flex-1 grid-cols-3 grid-rows-3 gap-0.5">
        <span />
        <MiniPx
          label="Padding top"
          value={value.top}
          onChange={(next) => onEdgeChange("top", next)}
        />
        <span />
        <MiniPx
          label="Padding left"
          value={value.left}
          onChange={(next) => onEdgeChange("left", next)}
        />
        <span className="bg-muted/40" />
        <MiniPx
          label="Padding right"
          value={value.right}
          onChange={(next) => onEdgeChange("right", next)}
        />
        <span />
        <MiniPx
          label="Padding bottom"
          value={value.bottom}
          onChange={(next) => onEdgeChange("bottom", next)}
        />
        <span />
      </div>
      <IndependentToggle
        kind="padding"
        linked={value.linked}
        onToggle={onToggleLink}
      />
    </div>
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
  const chrome = activeChrome(state)
  const shapeChoice = matchShapePreset(chrome.corners)
  const [urlOpen, setUrlOpen] = useState(state.sourceMode === "url")

  return (
    <SizeProvider size="compact">
      <aside className="flex max-h-[28rem] w-full shrink-0 flex-col overflow-auto border-t border-border bg-card lg:max-h-none lg:w-[15.5rem] lg:border-t-0 lg:border-l">
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-3 py-2">
          <span className="flex h-8 w-8 shrink-0 overflow-hidden rounded-md bg-muted">
            <img
              src={resolvedSrc(state)}
              alt=""
              className="h-full w-full object-cover"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-foreground">
              {SOURCE_LABEL[state.source]}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {SOURCE_BYTES[state.source]}
            </p>
          </div>
          <Tooltip content={urlOpen ? "Use file" : "From URL"} side="bottom">
            <Button
              type="button"
              variant="ghost"
              size="icon-compact"
              active={urlOpen}
              aria-pressed={urlOpen}
              aria-label={urlOpen ? "Use file" : "From URL"}
              onClick={() => {
                const next = !urlOpen
                setUrlOpen(next)
                onPatch({
                  sourceMode: next ? "url" : "upload",
                })
              }}
              className="h-7 w-7"
            >
              <Link2 size={14} strokeWidth={urlOpen ? 2 : 1.5} />
            </Button>
          </Tooltip>
        </header>

        <div className="px-3 py-2">
          {urlOpen ? (
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
          ) : (
            <SegmentGroup
              value={state.source}
              onChange={(source) => onPatch({ source, sourceMode: "upload" })}
              options={FILE_OPTIONS}
            />
          )}
        </div>

        <FigSection title="Content">
          <InspectorFields>
            <CompactField
              index={0}
              label="Alt text"
              value={state.alt}
              onChange={(alt) => onPatch({ alt })}
              placeholder="Alt text"
            />
            <CompactField
              index={1}
              label="Link URL"
              icon={Link2}
              value={state.href}
              onChange={(href) => onPatch({ href })}
              placeholder="Link"
            />
          </InspectorFields>
          <div className="flex justify-end gap-0.5">
            <Tooltip content="Dynamic content" side="bottom">
              <Button
                type="button"
                variant="ghost"
                size="icon-compact"
                active={state.dynamicContent}
                aria-pressed={state.dynamicContent}
                aria-label="Dynamic content"
                onClick={() =>
                  onPatch({ dynamicContent: !state.dynamicContent })
                }
                className="h-7 w-7"
              >
                <Braces
                  size={14}
                  strokeWidth={state.dynamicContent ? 2 : 1.5}
                />
              </Button>
            </Tooltip>
            <Tooltip content="Open in new tab" side="bottom">
              <Button
                type="button"
                variant="ghost"
                size="icon-compact"
                active={state.openInNewTab}
                disabled={!state.href.trim()}
                aria-pressed={state.openInNewTab}
                aria-label="Open in new tab"
                onClick={() => onPatch({ openInNewTab: !state.openInNewTab })}
                className="h-7 w-7"
              >
                <ExternalLink
                  size={14}
                  strokeWidth={state.openInNewTab ? 2 : 1.5}
                />
              </Button>
            </Tooltip>
          </div>
        </FigSection>

        <FigSection title="Layout">
          <div className="flex items-center justify-between gap-1">
            <IconToggleGroup
              value={chrome.align}
              onChange={(align) => onPatchChrome({ align })}
              options={ALIGN_OPTIONS}
            />
            <IconToggleGroup
              value={chrome.vAlign}
              onChange={(vAlign) => onPatchChrome({ vAlign })}
              options={VALIGN_OPTIONS}
            />
            <IconToggleGroup
              value={chrome.visible ? "shown" : "hidden"}
              onChange={(value) =>
                onPatchChrome({ visible: value === "shown" })
              }
              options={VISIBILITY_OPTIONS}
            />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <DimField
              label="W"
              value={displayedWidth(chrome, state.source)}
              disabled={chrome.widthMode === "auto"}
              onChange={(widthPx) => onPatchChrome({ widthPx })}
            />
            <DimField
              label="H"
              value={chrome.heightPx}
              disabled={chrome.heightMode === "auto"}
              min={40}
              onChange={(heightPx) =>
                onPatchChrome({ heightPx, heightMode: "fixed" })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <SegmentGroup
              value={matchSizePreset(chrome.widthMode)}
              onChange={(preset) => onPatchChrome(applySizePreset(preset))}
              options={SIZE_PRESET_OPTIONS}
            />
            <SegmentGroup
              value={chrome.heightMode}
              onChange={(heightMode) => onPatchChrome({ heightMode })}
              options={HEIGHT_MODE_OPTIONS}
            />
          </div>
        </FigSection>

        <FigSection title="Appearance">
          <div className="flex items-center gap-1">
            <IconToggleGroup
              value={shapeChoice}
              onChange={(preset) => {
                if (preset === "custom") return
                onPatchChrome({ corners: applyShapePreset(preset) })
              }}
              options={SHAPE_OPTIONS}
            />
            <DimField
              label="R"
              value={chrome.corners.topLeft}
              min={0}
              max={120}
              onChange={(next) =>
                onPatchChrome({
                  corners: setCorner(chrome.corners, "topLeft", next),
                })
              }
            />
            <IndependentToggle
              kind="corners"
              linked={chrome.corners.linked}
              onToggle={() =>
                onPatchChrome({
                  corners: toggleCornerLink(chrome.corners),
                })
              }
            />
          </div>
          {chrome.corners.linked ? null : (
            <div className="grid grid-cols-2 gap-1 pl-0.5">
              {(
                [
                  ["topLeft", "TL"],
                  ["topRight", "TR"],
                  ["bottomLeft", "BL"],
                  ["bottomRight", "BR"],
                ] as const
              ).map(([edge, label]) => (
                <DimField
                  key={edge}
                  label={label}
                  value={chrome.corners[edge]}
                  min={0}
                  max={120}
                  onChange={(next) =>
                    onPatchChrome({
                      corners: setCorner(chrome.corners, edge, next),
                    })
                  }
                />
              ))}
            </div>
          )}
        </FigSection>

        <FigSection
          title="Fill"
          onAdd={
            chrome.background === "none"
              ? () => onPatchChrome({ background: "color" })
              : undefined
          }
        >
          {chrome.background === "none" ? null : (
            <AppearanceRow
              color={chrome.backgroundColor}
              onColorChange={(backgroundColor) =>
                onPatchChrome({ backgroundColor, background: "color" })
              }
              onRemove={() => onPatchChrome({ background: "none" })}
            >
              <FillTypeToggle
                value={chrome.background}
                onChange={(background) => onPatchChrome({ background })}
              />
            </AppearanceRow>
          )}
        </FigSection>

        <FigSection
          title="Stroke"
          onAdd={
            chrome.borderEnabled
              ? undefined
              : () => onPatchChrome({ borderEnabled: true })
          }
        >
          {chrome.borderEnabled ? (
            <AppearanceRow
              color={chrome.border.color}
              onColorChange={(color) =>
                onPatchChrome({
                  border: { ...chrome.border, color },
                })
              }
              onRemove={() => onPatchChrome({ borderEnabled: false })}
            >
              <DimField
                label="W"
                value={chrome.border.width}
                min={1}
                max={16}
                onChange={(width) =>
                  onPatchChrome({ border: { ...chrome.border, width } })
                }
              />
            </AppearanceRow>
          ) : null}
        </FigSection>

        <FigSection title="Spacing">
          <PaddingEditor
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
          <DimField
            label="M"
            value={chrome.margin.top}
            min={0}
            max={80}
            onChange={(next) =>
              onPatchChrome({
                margin: setQuad(chrome.margin, "top", next),
              })
            }
          />
        </FigSection>
      </aside>
    </SizeProvider>
  )
}

function FillTypeToggle({
  value,
  onChange,
}: {
  value: BackgroundKind
  onChange: (next: BackgroundKind) => void
}) {
  const size = useSize()
  const isImage = value === "image"

  return (
    <Tooltip content={isImage ? "Solid fill" : "Image fill"} side="bottom">
      <Button
        type="button"
        variant="ghost"
        size="icon-compact"
        active={isImage}
        aria-pressed={isImage}
        aria-label={isImage ? "Solid fill" : "Image fill"}
        onClick={() => onChange(isImage ? "color" : "image")}
        className="h-7 w-7 shrink-0"
      >
        <ImageIcon size={size.icon} strokeWidth={isImage ? 2 : 1.5} />
      </Button>
    </Tooltip>
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
