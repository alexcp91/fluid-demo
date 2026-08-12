import { useRef, type CSSProperties, type ReactNode } from "react"
import { Copy, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEmailStore, useSelectedNode } from "@/email/store"
import { childrenOf } from "@/email/tree"
import type { ContainerId } from "@/email/ids"
import { Button } from "@/components/ui/button"
import { Tooltip } from "@/components/ui/tooltip"
import { FormatToolbar } from "./format-toolbar"
import { InlineText } from "./inline-text"
import { DragHandle } from "./drag-handle"
import { DropSlot } from "./drop-slot"
import { useCanvasSortable } from "./use-canvas-sortable"
import {
  BG_CLASS,
  BLOCK_LABELS,
  GAP_CLASS,
  PADDING_CLASS,
  RICH_BLOCK_TYPES,
  type Align,
  type EmailDocument,
  type EmailNode,
} from "./types"

function SelectableBlock({
  id,
  label,
  selected,
  hidden,
  sortable = true,
  nodeType,
  onSelect,
  className,
  style,
  children,
}: {
  id: string
  label?: string
  selected: boolean
  hidden?: boolean
  sortable?: boolean
  nodeType?: string
  onSelect: (id: string) => void
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  const duplicateNode = useEmailStore((s) => s.duplicateNode)
  const removeNode = useEmailStore((s) => s.removeNode)

  return (
    <div
      data-block-id={id}
      data-node-type={nodeType}
      data-sortable-item={sortable ? true : undefined}
      role="group"
      tabIndex={0}
      style={style}
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
        className,
        selected
          ? "ring-2 ring-[color:var(--focus-ring,#6B97FF)] ring-offset-2 ring-offset-card"
          : "hover:ring-1 hover:ring-border",
        hidden && "opacity-40"
      )}
    >
      {sortable ? (
        <DragHandle className="absolute left-0.5 top-1.5 z-10 opacity-50 transition-opacity duration-80 group-hover/block:opacity-100 group-focus-within/block:opacity-100" />
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
              onClick={() => duplicateNode(id)}
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
              onClick={() => removeNode(id)}
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
  node,
  doc,
  selectedId,
}: {
  node: EmailNode
  doc: EmailDocument
  selectedId: string | null
}) {
  const select = useEmailStore((s) => s.select)
  const updateNode = useEmailStore((s) => s.updateNode)
  const setText = useEmailStore((s) => s.setText)
  const device = useEmailStore((s) => s.device)
  const selected = selectedId === node.id
  const label =
    node.type === "row" || node.type === "column"
      ? node.type === "row"
        ? "Row"
        : "Column"
      : node.type === "body"
        ? "Body"
        : BLOCK_LABELS[node.type]
  const { chrome } = node
  const shell = cn(
    PADDING_CLASS[chrome.padding],
    BG_CLASS[chrome.background],
    "rounded-md"
  )
  const hidden = !chrome.visible

  if (node.type === "header") {
    return (
      <SelectableBlock
        id={node.id}
        nodeType={node.type}
        label={label}
        selected={selected}
        hidden={hidden}
        sortable
        onSelect={select}
        className={shell}
      >
        <div className={cn("flex flex-col gap-0.5", alignClass(chrome.align))}>
          {node.showLogo && (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-[11px] font-medium text-background">
              {(node.brand.replace(/<[^>]+>/g, "") || "F").slice(0, 1)}
            </div>
          )}
          <InlineText
            as="span"
            value={node.brand}
            onChange={(brand) => updateNode(node.id, node.type, { brand })}
            onEditStart={() => select(node.id)}
            className="text-subtitle font-medium tracking-tight text-foreground"
            placeholder="Brand"
          />
          <InlineText
            as="span"
            value={node.tagline}
            onChange={(tagline) => updateNode(node.id, node.type, { tagline })}
            onEditStart={() => select(node.id)}
            className="text-caption text-muted-foreground"
            placeholder="Tagline"
          />
        </div>
      </SelectableBlock>
    )
  }

  if (node.type === "image") {
    return (
      <SelectableBlock
        id={node.id}
        nodeType={node.type}
        label={label}
        selected={selected}
        hidden={hidden}
        sortable
        onSelect={select}
        className={shell}
      >
        <div
          className={cn(
            "flex h-36 w-full flex-col items-center justify-center gap-1 bg-muted text-caption text-muted-foreground",
            node.rounded ? "rounded-lg" : "rounded-none",
            node.fit === "contain" && "border border-dashed border-border",
            node.href && "ring-1 ring-border/60"
          )}
          title={node.href || undefined}
        >
          <InlineText
            as="span"
            value={node.alt}
            onChange={(alt) => updateNode(node.id, node.type, { alt })}
            onEditStart={() => select(node.id)}
            placeholder="Alt text"
          />
          <InlineText
            as="span"
            value={node.caption}
            onChange={(caption) => updateNode(node.id, node.type, { caption })}
            onEditStart={() => select(node.id)}
            className="text-[11px] opacity-70"
            placeholder="Caption"
          />
        </div>
      </SelectableBlock>
    )
  }

  if (node.type === "heading") {
    return (
      <SelectableBlock
        id={node.id}
        nodeType={node.type}
        label={label}
        selected={selected}
        hidden={hidden}
        sortable
        onSelect={select}
        className={shell}
      >
        <div className={cn("w-full", alignClass(chrome.align))}>
          <InlineText
            as="h2"
            rich
            value={node.text}
            onChange={(text) => setText(node.id, text)}
            onEditStart={() => select(node.id)}
            className={cn(
              "block w-full font-medium tracking-tight text-foreground",
              node.size === "lg" && "text-title",
              node.size === "md" && "text-subtitle",
              node.size === "sm" && "text-body"
            )}
            placeholder="Heading"
          />
        </div>
      </SelectableBlock>
    )
  }

  if (node.type === "paragraph") {
    return (
      <SelectableBlock
        id={node.id}
        nodeType={node.type}
        label={label}
        selected={selected}
        hidden={hidden}
        sortable
        onSelect={select}
        className={shell}
      >
        <div className={cn("w-full", alignClass(chrome.align))}>
          <InlineText
            as="p"
            rich
            multiline
            value={node.text}
            onChange={(text) => setText(node.id, text)}
            onEditStart={() => select(node.id)}
            className={cn(
              "block w-full text-body leading-relaxed",
              node.muted ? "text-muted-foreground" : "text-foreground"
            )}
            placeholder="Write something…"
          />
        </div>
      </SelectableBlock>
    )
  }

  if (node.type === "button") {
    return (
      <SelectableBlock
        id={node.id}
        nodeType={node.type}
        label={label}
        selected={selected}
        hidden={hidden}
        sortable
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
              node.fullWidth && "w-full",
              node.style === "filled" &&
                "rounded-full bg-foreground text-background",
              node.style === "outline" &&
                "rounded-full ring-1 ring-border text-foreground",
              node.style === "text" && "rounded-md text-foreground underline"
            )}
          >
            <InlineText
              as="span"
              value={node.label}
              onChange={(next) =>
                updateNode(node.id, node.type, { label: next })
              }
              onEditStart={() => select(node.id)}
              placeholder="Button"
            />
          </span>
        </div>
      </SelectableBlock>
    )
  }

  if (node.type === "row") {
    const columns = childrenOf(doc, node.id as ContainerId).filter(
      (child) => child.type === "column"
    )
    return (
      <SelectableBlock
        id={node.id}
        nodeType="row"
        label="Row"
        selected={selected}
        hidden={hidden}
        sortable
        onSelect={select}
        className={cn(
          shell,
          selected
            ? undefined
            : "ring-1 ring-dashed ring-border/70"
        )}
      >
        <div
          data-sortable-container
          data-parent-id={node.id}
          data-container-kind="row"
          className={cn(
            "email-sortable flex w-full",
            GAP_CLASS[node.gap],
            node.stackOnMobile && device === "mobile"
              ? "flex-col"
              : "flex-row",
            "items-stretch"
          )}
        >
          {columns.length === 0 ? (
            <p className="pointer-events-none px-2 py-4 text-center text-[11px] text-muted-foreground">
              Empty row
            </p>
          ) : (
            columns.map((column) => (
              <BlockView
                key={column.id}
                node={column}
                doc={doc}
                selectedId={selectedId}
              />
            ))
          )}
        </div>
      </SelectableBlock>
    )
  }

  if (node.type === "column") {
    return (
      <SelectableBlock
        id={node.id}
        nodeType="column"
        label="Column"
        selected={selected}
        hidden={hidden}
        sortable
        onSelect={select}
        style={{ flexGrow: node.flex }}
        className={cn(
          shell,
          "flex min-h-28 min-w-0 flex-1 flex-col self-stretch",
          selected ? undefined : "ring-1 ring-dashed ring-border/60"
        )}
      >
        <div
          className={cn(
            "flex min-h-28 flex-1 flex-col",
            node.vAlign === "middle" && "justify-center",
            node.vAlign === "bottom" && "justify-end"
          )}
        >
          <ContainerChildren
            doc={doc}
            parent={node.id as ContainerId}
            selectedId={selectedId}
            kind="column"
            emptyLabel="Drop a block into this column"
          />
        </div>
      </SelectableBlock>
    )
  }

  if (node.type === "body") return null

  return (
    <SelectableBlock
      id={node.id}
      nodeType={node.type}
      label={label}
      selected={selected}
      hidden={hidden}
      sortable
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
          value={node.company}
          onChange={(company) => updateNode(node.id, node.type, { company })}
          onEditStart={() => select(node.id)}
          className="text-caption text-foreground"
          placeholder="Company"
        />
        <InlineText
          as="span"
          value={node.address}
          onChange={(address) => updateNode(node.id, node.type, { address })}
          onEditStart={() => select(node.id)}
          className="text-caption text-muted-foreground"
          placeholder="Address"
        />
        {node.showUnsubscribe && (
          <span className="text-caption text-muted-foreground underline">
            Unsubscribe
          </span>
        )}
        {node.showSocial && (
          <span className="text-caption text-muted-foreground">
            Twitter · LinkedIn · GitHub
          </span>
        )}
      </div>
    </SelectableBlock>
  )
}

function ContainerChildren({
  doc,
  parent,
  selectedId,
  emptyLabel,
  kind,
}: {
  doc: EmailDocument
  parent: ContainerId
  selectedId: string | null
  emptyLabel: string
  kind: "body" | "column"
}) {
  const paletteDragType = useEmailStore((s) => s.paletteDragType)
  const children = childrenOf(doc, parent)
  const isPaletteDragging = Boolean(paletteDragType)

  if (isPaletteDragging) {
    return (
      <div className="flex min-h-12 flex-col gap-1">
        {children.length === 0 ? (
          <DropSlot into={parent} index={0} empty />
        ) : (
          <>
            <DropSlot into={parent} index={0} />
            {children.map((child, index) => (
              <div key={child.id} className="contents">
                <BlockView node={child} doc={doc} selectedId={selectedId} />
                <DropSlot into={parent} index={index + 1} />
              </div>
            ))}
          </>
        )}
      </div>
    )
  }

  return (
    <div
      data-sortable-container
      data-parent-id={parent}
      data-container-kind={kind}
      className={cn(
        "email-sortable flex flex-col gap-1 rounded-md",
        kind === "column" ? "min-h-28 flex-1" : "min-h-12"
      )}
    >
      {children.map((child) => (
        <BlockView
          key={child.id}
          node={child}
          doc={doc}
          selectedId={selectedId}
        />
      ))}
      {children.length === 0 && (
        <p className="pointer-events-none px-3 py-5 text-center text-[11px] text-muted-foreground">
          {emptyLabel}
        </p>
      )}
    </div>
  )
}

export function EmailCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const doc = useEmailStore((s) => s.doc)
  const selected = useEmailStore((s) => s.selectedId)
  const device = useEmailStore((s) => s.device)
  const paletteDragType = useEmailStore((s) => s.paletteDragType)
  const moveNode = useEmailStore((s) => s.moveNode)
  const select = useEmailStore((s) => s.select)
  const selectedNode = useSelectedNode()

  const width = device === "mobile" ? 360 : Number(doc.meta.width)
  const richCapable = Boolean(
    selectedNode &&
      selectedNode.type !== "body" &&
      selectedNode.type !== "row" &&
      selectedNode.type !== "column" &&
      RICH_BLOCK_TYPES.includes(selectedNode.type)
  )
  const isPaletteDragging = Boolean(paletteDragType)
  // Recreate Sortable only when containers appear/disappear (new row/column).
  const layoutKey = Object.values(doc.nodes)
    .filter(
      (node) =>
        node.type === "body" ||
        node.type === "column" ||
        node.type === "row"
    )
    .map((node) => node.id)
    .sort()
    .join("|")

  useCanvasSortable(canvasRef, {
    enabled: !isPaletteDragging,
    layoutKey,
    onMove: ({ id, into, before }) => moveNode(id, into, before),
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
              : "Drag grips to reorder — blocks, columns, and rows"}
          </span>
        </div>

        <div
          ref={canvasRef}
          className="flex w-full flex-col gap-1 rounded-xl bg-card p-3 shadow-surface-3"
          style={{ maxWidth: width + 24 }}
          onClick={(e) => e.stopPropagation()}
        >
          {doc.meta.showPreheader && (
            <p className="px-3 pb-2 text-caption text-muted-foreground">
              {doc.meta.previewText}
            </p>
          )}

          <ContainerChildren
            doc={doc}
            parent={doc.root}
            selectedId={selected}
            kind="body"
            emptyLabel="Click or drag a block from the palette to get started"
          />
        </div>
      </div>
    </div>
  )
}
