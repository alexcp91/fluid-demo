import { useRef, type ReactNode } from "react"
import { Copy, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEmailStore, useSelectedBlock } from "@/email/store"
import { Button } from "@/components/ui/button"
import { Tooltip } from "@/components/ui/tooltip"
import { FormatToolbar } from "./format-toolbar"
import { InlineText } from "./inline-text"
import { DragHandle } from "./drag-handle"
import { DropSlot } from "./drop-slot"
import { useSortableBlocks } from "./use-sortable-blocks"
import {
  BG_CLASS,
  BLOCK_LABELS,
  GAP_CLASS,
  PADDING_CLASS,
  RICH_BLOCK_TYPES,
  type Align,
  type EmailBlock,
} from "./types"

function SelectableBlock({
  id,
  label,
  selected,
  hidden,
  sortable = true,
  onSelect,
  className,
  children,
}: {
  id: string
  label?: string
  selected: boolean
  hidden?: boolean
  sortable?: boolean
  onSelect: (id: string) => void
  className?: string
  children: ReactNode
}) {
  const duplicateBlock = useEmailStore((s) => s.duplicateBlock)
  const removeBlock = useEmailStore((s) => s.removeBlock)

  return (
    <div
      data-block-id={id}
      data-sortable-item={sortable ? true : undefined}
      role="group"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect(id)
        }
      }}
      className={cn(
        "group/block relative w-full rounded-md text-left outline-none transition-[box-shadow,background-color,opacity] duration-80",
        "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
        selected
          ? "ring-2 ring-[color:var(--focus-ring,#6B97FF)] ring-offset-2 ring-offset-card"
          : "hover:ring-1 hover:ring-border",
        hidden && "opacity-40",
        className
      )}
    >
      {sortable ? (
        <DragHandle className="absolute left-0.5 top-1.5 z-10 opacity-0 transition-opacity duration-80 group-hover/block:opacity-100 group-focus-within/block:opacity-100" />
      ) : null}
      {selected && (
        <span className="pointer-events-none absolute -top-2.5 left-7 z-10 rounded bg-[color:var(--focus-ring,#6B97FF)] px-1.5 py-0.5 text-[10px] font-medium text-white">
          {label ?? "Block"}
        </span>
      )}
      {selected && (
        <div
          className="absolute -top-3 right-1 z-10 flex items-center gap-0.5 rounded-md bg-card p-0.5 shadow-surface-2 ring-1 ring-border"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Tooltip content="Duplicate block">
            <Button
              type="button"
              variant="ghost"
              size="icon-compact"
              aria-label="Duplicate block"
              onClick={() => duplicateBlock(id)}
            >
              <Copy size={14} strokeWidth={1.75} />
            </Button>
          </Tooltip>
          <Tooltip content="Delete block">
            <Button
              type="button"
              variant="ghost"
              size="icon-compact"
              aria-label="Delete block"
              onClick={() => removeBlock(id)}
            >
              <Trash2 size={14} strokeWidth={1.75} />
            </Button>
          </Tooltip>
        </div>
      )}
      <div className={sortable ? "pl-5" : "pl-1"}>{children}</div>
    </div>
  )
}

function alignClass(align: Align) {
  if (align === "center") return "text-center items-center"
  if (align === "right") return "text-right items-end"
  return "text-left items-start"
}

function BlockView({
  block,
  selectedId,
  nested = false,
}: {
  block: EmailBlock
  selectedId: string | null
  nested?: boolean
}) {
  const select = useEmailStore((s) => s.select)
  const updateBlock = useEmailStore((s) => s.updateBlock)
  const selected = selectedId === block.id
  const label = BLOCK_LABELS[block.type]
  const { chrome } = block
  const shell = cn(
    PADDING_CLASS[chrome.padding],
    BG_CLASS[chrome.background],
    "rounded-md"
  )
  const hidden = !chrome.visible

  if (block.type === "header") {
    return (
      <SelectableBlock
        id={block.id}
        label={label}
        selected={selected}
        hidden={hidden}
        sortable={!nested}
        onSelect={select}
        className={shell}
      >
        <div className={cn("flex flex-col gap-0.5", alignClass(chrome.align))}>
          {block.showLogo && (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-[11px] font-medium text-background">
              {(block.brand.replace(/<[^>]+>/g, "") || "F").slice(0, 1)}
            </div>
          )}
          <InlineText
            as="span"
            value={block.brand}
            onChange={(brand) => updateBlock(block.id, { brand })}
            onEditStart={() => select(block.id)}
            className="text-subtitle font-medium tracking-tight text-foreground"
            placeholder="Brand"
          />
          <InlineText
            as="span"
            value={block.tagline}
            onChange={(tagline) => updateBlock(block.id, { tagline })}
            onEditStart={() => select(block.id)}
            className="text-caption text-muted-foreground"
            placeholder="Tagline"
          />
        </div>
      </SelectableBlock>
    )
  }

  if (block.type === "image") {
    return (
      <SelectableBlock
        id={block.id}
        label={label}
        selected={selected}
        hidden={hidden}
        sortable={!nested}
        onSelect={select}
        className={shell}
      >
        <div
          className={cn(
            "flex h-36 w-full flex-col items-center justify-center gap-1 bg-muted text-caption text-muted-foreground",
            block.rounded ? "rounded-lg" : "rounded-none",
            block.fit === "contain" && "border border-dashed border-border",
            block.href && "ring-1 ring-border/60"
          )}
          title={block.href || undefined}
        >
          <InlineText
            as="span"
            value={block.alt}
            onChange={(alt) => updateBlock(block.id, { alt })}
            onEditStart={() => select(block.id)}
            placeholder="Alt text"
          />
          <InlineText
            as="span"
            value={block.caption}
            onChange={(caption) => updateBlock(block.id, { caption })}
            onEditStart={() => select(block.id)}
            className="text-[11px] opacity-70"
            placeholder="Caption"
          />
        </div>
      </SelectableBlock>
    )
  }

  if (block.type === "heading") {
    return (
      <SelectableBlock
        id={block.id}
        label={label}
        selected={selected}
        hidden={hidden}
        sortable={!nested}
        onSelect={select}
        className={shell}
      >
        <div className={cn("w-full", alignClass(chrome.align))}>
          <InlineText
            as="h2"
            rich
            value={block.text}
            onChange={(text) => updateBlock(block.id, { text })}
            onEditStart={() => select(block.id)}
            className={cn(
              "block w-full font-medium tracking-tight text-foreground",
              block.size === "lg" && "text-title",
              block.size === "md" && "text-subtitle",
              block.size === "sm" && "text-body"
            )}
            placeholder="Heading"
          />
        </div>
      </SelectableBlock>
    )
  }

  if (block.type === "paragraph") {
    return (
      <SelectableBlock
        id={block.id}
        label={label}
        selected={selected}
        hidden={hidden}
        sortable={!nested}
        onSelect={select}
        className={shell}
      >
        <div className={cn("w-full", alignClass(chrome.align))}>
          <InlineText
            as="p"
            rich
            multiline
            value={block.text}
            onChange={(text) => updateBlock(block.id, { text })}
            onEditStart={() => select(block.id)}
            className={cn(
              "block w-full text-body leading-relaxed",
              block.muted ? "text-muted-foreground" : "text-foreground"
            )}
            placeholder="Write something…"
          />
        </div>
      </SelectableBlock>
    )
  }

  if (block.type === "button") {
    return (
      <SelectableBlock
        id={block.id}
        label={label}
        selected={selected}
        hidden={hidden}
        sortable={!nested}
        onSelect={select}
        className={shell}
      >
        <div
          className={cn(
            "flex",
            chrome.align === "center" && "justify-center",
            chrome.align === "right" && "justify-end",
            chrome.align === "left" && "justify-start"
          )}
        >
          <span
            className={cn(
              "inline-flex min-h-9 min-w-[5rem] items-center justify-center px-4 text-[13px] font-medium",
              block.fullWidth && "w-full",
              block.style === "filled" &&
                "rounded-full bg-foreground text-background",
              block.style === "outline" &&
                "rounded-full ring-1 ring-border text-foreground",
              block.style === "text" && "rounded-md text-foreground underline"
            )}
          >
            <InlineText
              as="span"
              value={block.label}
              onChange={(next) => updateBlock(block.id, { label: next })}
              onEditStart={() => select(block.id)}
              placeholder="Button"
            />
          </span>
        </div>
      </SelectableBlock>
    )
  }

  if (block.type === "frame") {
    const isRow = block.direction === "row"
    const widths =
      block.widths.length === block.children.length
        ? block.widths
        : block.children.map(() => 100 / Math.max(block.children.length, 1))
    return (
      <SelectableBlock
        id={block.id}
        label={isRow ? "Row" : "Column"}
        selected={selected}
        hidden={hidden}
        sortable={!nested}
        onSelect={select}
        className={cn(shell, "ring-1 ring-dashed ring-border/70")}
      >
        <div
          className={cn(
            "flex w-full",
            GAP_CLASS[block.gap],
            isRow ? "flex-row items-stretch" : "flex-col",
            block.children.length === 0 &&
              "min-h-16 items-center justify-center"
          )}
        >
          {block.children.length === 0 ? (
            <p className="px-2 py-4 text-center text-[11px] text-muted-foreground">
              Empty {isRow ? "row" : "column"}
            </p>
          ) : (
            block.children.map((child, i) => (
              <div
                key={child.id}
                className="min-w-0"
                style={
                  isRow
                    ? {
                        flex: `1 1 ${widths[i] ?? 50}%`,
                        maxWidth: `${widths[i] ?? 50}%`,
                      }
                    : undefined
                }
              >
                <BlockView
                  block={child}
                  selectedId={selectedId}
                  nested
                />
              </div>
            ))
          )}
        </div>
      </SelectableBlock>
    )
  }

  return (
    <SelectableBlock
      id={block.id}
      label={label}
      selected={selected}
      hidden={hidden}
      sortable={!nested}
      onSelect={select}
      className={shell}
    >
      <div
        className={cn(
          "flex flex-col gap-1 border-t border-border pt-3",
          alignClass(chrome.align)
        )}
      >
        <InlineText
          as="span"
          value={block.company}
          onChange={(company) => updateBlock(block.id, { company })}
          onEditStart={() => select(block.id)}
          className="text-caption text-foreground"
          placeholder="Company"
        />
        <InlineText
          as="span"
          value={block.address}
          onChange={(address) => updateBlock(block.id, { address })}
          onEditStart={() => select(block.id)}
          className="text-caption text-muted-foreground"
          placeholder="Address"
        />
        {block.showUnsubscribe && (
          <span className="text-caption text-muted-foreground underline">
            Unsubscribe
          </span>
        )}
        {block.showSocial && (
          <span className="text-caption text-muted-foreground">
            Twitter · LinkedIn · GitHub
          </span>
        )}
      </div>
    </SelectableBlock>
  )
}

export function EmailCanvas() {
  const listRef = useRef<HTMLDivElement>(null)
  const doc = useEmailStore((s) => s.doc)
  const selected = useEmailStore((s) => s.selectedId)
  const device = useEmailStore((s) => s.device)
  const paletteDragType = useEmailStore((s) => s.paletteDragType)
  const select = useEmailStore((s) => s.select)
  const reorderBlocks = useEmailStore((s) => s.reorderBlocks)
  const selectedBlock = useSelectedBlock()

  const width = device === "mobile" ? 360 : Number(doc.meta.width)
  const richCapable = Boolean(
    selectedBlock && RICH_BLOCK_TYPES.includes(selectedBlock.type)
  )
  const isPaletteDragging = Boolean(paletteDragType)

  useSortableBlocks(listRef, {
    order: isPaletteDragging ? [] : doc.blocks.map((b) => b.id),
    onReorder: reorderBlocks,
  })

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-auto bg-muted/40 px-6 py-8">
      <FormatToolbar selected={selected} richCapable={richCapable} />

      <div
        className="mx-auto flex w-full flex-1 flex-col items-center gap-3"
        onClick={() => select(null)}
      >
        <div
          className="flex w-full items-center justify-between text-caption text-muted-foreground"
          style={{ maxWidth: width + 24 }}
        >
          <span>{device === "mobile" ? "Mobile mode" : "Desktop mode"}</span>
          <span>
            {width}px ·{" "}
            {paletteDragType
              ? `Drop to insert ${paletteDragType}`
              : "Drag handles to reorder"}
          </span>
        </div>

        <div
          className={cn(
            "flex w-full flex-col gap-1 rounded-xl bg-card p-3 shadow-surface-3 transition-[box-shadow] duration-80",
            isPaletteDragging &&
              "ring-1 ring-[color-mix(in_oklab,var(--focus-ring,#6B97FF)_40%,transparent)]"
          )}
          style={{ maxWidth: width + 24 }}
          onClick={(e) => e.stopPropagation()}
        >
          {doc.meta.showPreheader && (
            <p className="px-3 pb-2 text-caption text-muted-foreground">
              {doc.meta.previewText}
            </p>
          )}

          {isPaletteDragging ? (
            <div className="flex flex-col gap-1">
              {doc.blocks.length === 0 ? (
                <DropSlot index={0} empty />
              ) : (
                <>
                  <DropSlot index={0} />
                  {doc.blocks.map((block, i) => (
                    <div key={block.id} className="contents">
                      <BlockView block={block} selectedId={selected} />
                      <DropSlot index={i + 1} />
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <div ref={listRef} className="email-sortable flex flex-col gap-1">
              {doc.blocks.map((block) => (
                <BlockView
                  key={block.id}
                  block={block}
                  selectedId={selected}
                />
              ))}
            </div>
          )}

          {doc.blocks.length === 0 && !isPaletteDragging && (
            <p className="px-3 py-8 text-center text-caption text-muted-foreground">
              Click or drag a block from the palette to get started
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
