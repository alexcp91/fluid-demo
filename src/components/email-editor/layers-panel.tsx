import { useRef, useState, type DragEvent } from "react"
import {
  Image as ImageIcon,
  Type,
  AlignLeft,
  MousePointerClick,
  PanelTop,
  Footprints,
  Columns2,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SizeProvider } from "@/lib/size-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip } from "@/components/ui/tooltip"
import type { ContainerId, NodeId } from "@/email/ids"
import { resolveContentInsertTarget } from "@/email/insert-target"
import { useEmailStore } from "@/email/store"
import { ancestorsOf, childrenOf, nodeAt, walk } from "@/email/tree"
import { DragHandle } from "./drag-handle"
import { PALETTE_BLOCK_MIME } from "./palette-drag"
import {
  BLOCK_LABELS,
  BLOCK_TYPES,
  type BlockType,
  type EmailDocument,
  type EmailNode,
  nodeLabel,
} from "./types"

const LAYER_NODE_MIME = "application/x-fluid-email-layer"

type DropEdge = "before" | "after" | "into"

interface DropHint {
  id: string
  edge: DropEdge
}

const BLOCK_ICONS: Record<BlockType, LucideIcon> = {
  header: PanelTop,
  image: ImageIcon,
  heading: Type,
  paragraph: AlignLeft,
  button: MousePointerClick,
  footer: Footprints,
}

function iconForNode(node: EmailNode): LucideIcon {
  if (node.type === "row" || node.type === "column") return Columns2
  if (node.type === "body") return AlignLeft
  return BLOCK_ICONS[node.type]
}

function isNestableContainer(node: EmailNode): boolean {
  return node.type === "row" || node.type === "column"
}

function edgeFromPointer(node: EmailNode, event: DragEvent): DropEdge {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const ratio = (event.clientY - rect.top) / Math.max(rect.height, 1)
  if (isNestableContainer(node)) {
    if (ratio < 0.28) return "before"
    if (ratio > 0.72) return "after"
    return "into"
  }
  return ratio < 0.5 ? "before" : "after"
}

function isUnder(
  document: EmailDocument,
  id: string,
  ancestorId: string
): boolean {
  let current = nodeAt(document, id)
  while (current) {
    if (current.id === ancestorId) return true
    if (!current.parent) return false
    current = nodeAt(document, current.parent)
  }
  return false
}

function enclosingColumn(
  document: EmailDocument,
  id: string
): EmailNode | null {
  const self = nodeAt(document, id)
  if (!self) return null
  if (self.type === "column") return self
  for (const ancestor of ancestorsOf(document, id as NodeId)) {
    if (ancestor.type === "column") return ancestor
  }
  return null
}

function siblingInsert(
  document: EmailDocument,
  dragged: EmailNode,
  dropNode: EmailNode,
  edge: "before" | "after"
): { into: ContainerId; before: NodeId | null } | null {
  if (!dropNode.parent) return null
  const parent = nodeAt(document, dropNode.parent)
  if (
    !parent ||
    (parent.type !== "body" &&
      parent.type !== "column" &&
      parent.type !== "row")
  )
    return null

  if (parent.type === "row" && dragged.type !== "column") return null
  if (parent.type !== "row" && dragged.type === "column") return null

  const into = dropNode.parent as ContainerId
  if (edge === "before") return { into, before: dropNode.id as NodeId }

  const siblings = childrenOf(document, into)
  const index = siblings.findIndex((child) => child.id === dropNode.id)
  const next = index >= 0 ? siblings[index + 1] : undefined
  return { into, before: (next?.id as NodeId | undefined) ?? null }
}

function hintForAppend(
  document: EmailDocument,
  column: EmailNode,
  draggedId: string
): DropHint {
  const kids = childrenOf(document, column.id as ContainerId).filter(
    (child) => child.id !== draggedId
  )
  const last = kids[kids.length - 1]
  if (last) return { id: last.id, edge: "after" }
  return { id: column.id, edge: "into" }
}

function hintForInsertStart(
  document: EmailDocument,
  column: EmailNode,
  draggedId: string
): DropHint {
  const first = childrenOf(document, column.id as ContainerId).find(
    (child) => child.id !== draggedId
  )
  if (first) return { id: first.id, edge: "before" }
  return { id: column.id, edge: "into" }
}

/**
 * Resolve layers drop. Leaves can't sit under a row, so hovering the next
 * column / the column chrome remaps to nest inside the column — especially
 * "append last", which was nearly impossible from the tree.
 */
function resolveLayerDrop(
  document: EmailDocument,
  draggedId: string,
  dropNode: EmailNode,
  edge: DropEdge,
  layers: { node: EmailNode }[]
): { into: ContainerId; before: NodeId | null; hint: DropHint } | null {
  const dragged = nodeAt(document, draggedId)
  if (!dragged || dragged.id === dropNode.id) return null
  if (dragged.type === "body") return null

  // Column chrome: leaves nest in (top = start, else = append last).
  if (dropNode.type === "column" && dragged.type !== "column") {
    if (edge === "before") {
      const kids = childrenOf(document, dropNode.id as ContainerId).filter(
        (child) => child.id !== draggedId
      )
      return {
        into: dropNode.id as ContainerId,
        before: (kids[0]?.id as NodeId | undefined) ?? null,
        hint: hintForInsertStart(document, dropNode, draggedId),
      }
    }
    return {
      into: dropNode.id as ContainerId,
      before: null,
      hint: hintForAppend(document, dropNode, draggedId),
    }
  }

  if (edge === "into" && dropNode.type === "row") {
    if (dragged.type === "column")
      return {
        into: dropNode.id as ContainerId,
        before: null,
        hint: { id: dropNode.id, edge: "into" },
      }
    const columns = childrenOf(document, dropNode.id as ContainerId).filter(
      (child) => child.type === "column"
    )
    const column = columns[0]
    if (!column) return null
    return {
      into: column.id as ContainerId,
      before: null,
      hint: hintForAppend(document, column, draggedId),
    }
  }

  const siblingEdge = edge === "into" ? "before" : edge
  const sibling = siblingInsert(document, dragged, dropNode, siblingEdge)
  if (sibling) {
    return {
      ...sibling,
      hint: { id: dropNode.id, edge: siblingEdge },
    }
  }

  // Leaf hovered before the next layer after a column's subtree → append
  // last in that column (the usual "I want this at the bottom" miss).
  if (dragged.type !== "column" && edge === "before") {
    const dropIndex = layers.findIndex((entry) => entry.node.id === dropNode.id)
    const prev = dropIndex > 0 ? layers[dropIndex - 1]?.node : undefined
    if (prev) {
      const leftColumn = enclosingColumn(document, prev.id)
      if (
        leftColumn &&
        !isUnder(document, dropNode.id, leftColumn.id) &&
        leftColumn.id !== dropNode.id
      ) {
        return {
          into: leftColumn.id as ContainerId,
          before: null,
          hint: hintForAppend(document, leftColumn, draggedId),
        }
      }
    }
  }

  return null
}

function LayerRow({
  node,
  depth,
  selected,
  draggingId,
  dropHint,
  onSelect,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  node: EmailNode
  depth: number
  selected: string | null
  draggingId: string | null
  dropHint: DropHint | null
  onSelect: (id: string) => void
  onDragStart: (id: string, event: DragEvent) => void
  onDragEnd: () => void
  onDragOver: (id: string, event: DragEvent) => void
  onDrop: (id: string, event: DragEvent) => void
}) {
  const Icon = iconForNode(node)
  const isSelected = selected === node.id
  const hidden = !node.chrome.visible
  const isDragging = draggingId === node.id
  const hint = dropHint?.id === node.id && draggingId !== node.id ? dropHint : null

  return (
    <li
      data-block-id={node.id}
      data-node-type={node.type}
      draggable
      onDragStart={(event) => onDragStart(node.id, event)}
      onDragEnd={onDragEnd}
      onDragOver={(event) => onDragOver(node.id, event)}
      onDrop={(event) => onDrop(node.id, event)}
      className={cn(
        "relative flex items-center gap-1 rounded-lg pr-1 outline-none transition-colors duration-80",
        isSelected
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        hint?.edge === "into" &&
          "bg-[color-mix(in_oklab,var(--focus-ring,#6B97FF)_12%,transparent)]",
        isDragging && "opacity-40",
        hidden && "opacity-45"
      )}
      style={{ paddingLeft: depth * 10 }}
    >
      {hint?.edge === "before" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-1 top-0 z-10 h-0.5 -translate-y-1/2 rounded-full bg-[color:var(--focus-ring,#6B97FF)]"
        />
      )}
      {hint?.edge === "after" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-1 bottom-0 z-10 h-0.5 translate-y-1/2 rounded-full bg-[color:var(--focus-ring,#6B97FF)]"
        />
      )}
      <DragHandle className="opacity-70" />
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1.5 pr-2 text-left outline-none",
          "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
        )}
      >
        <Icon size={14} strokeWidth={isSelected ? 2 : 1.5} />
        <span className="flex-1 truncate text-[12px]">
          {nodeLabel(node.type)}
        </span>
        {hidden && (
          <span className="text-[10px] uppercase tracking-wide opacity-70">
            Hidden
          </span>
        )}
      </button>
    </li>
  )
}

export function LayersPanel() {
  const suppressClickRef = useRef(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropHint, setDropHint] = useState<DropHint | null>(null)
  const doc = useEmailStore((s) => s.doc)
  const selected = useEmailStore((s) => s.selectedId)
  const select = useEmailStore((s) => s.select)
  const insertLeaf = useEmailStore((s) => s.insertLeaf)
  const insertRow = useEmailStore((s) => s.insertRow)
  const removeNode = useEmailStore((s) => s.removeNode)
  const moveNode = useEmailStore((s) => s.moveNode)
  const setPaletteDragType = useEmailStore((s) => s.setPaletteDragType)
  const layers = [...walk(doc)]
  const insertionTarget = resolveContentInsertTarget(doc, selected)

  function onLayerDragStart(id: string, event: DragEvent) {
    suppressClickRef.current = false
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData(LAYER_NODE_MIME, id)
    event.dataTransfer.setData("text/plain", id)
    setDraggingId(id)
  }

  function onLayerDragEnd() {
    setDraggingId(null)
    setDropHint(null)
  }

  function onLayerDragOver(id: string, event: DragEvent) {
    if (!draggingId || draggingId === id) return
    const dropNode = nodeAt(doc, id)
    if (!dropNode) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    const edge = edgeFromPointer(dropNode, event)
    const resolved = resolveLayerDrop(doc, draggingId, dropNode, edge, layers)
    const nextHint = resolved?.hint ?? null
    if (dropHint?.id !== nextHint?.id || dropHint?.edge !== nextHint?.edge)
      setDropHint(nextHint)
  }

  function onLayerDrop(id: string, event: DragEvent) {
    event.preventDefault()
    event.stopPropagation()
    const draggedId =
      event.dataTransfer.getData(LAYER_NODE_MIME) || draggingId
    const dropNode = nodeAt(doc, id)
    const edge = dropNode ? edgeFromPointer(dropNode, event) : "before"
    setDraggingId(null)
    setDropHint(null)
    if (!draggedId || !dropNode) return
    const target = resolveLayerDrop(doc, draggedId, dropNode, edge, layers)
    if (!target) return
    moveNode(draggedId, target.into, target.before)
  }

  return (
    <SizeProvider size="compact">
      <aside className="flex h-full w-56 shrink-0 flex-col gap-3 overflow-auto border-r border-border bg-card p-3">
        <header className="flex items-center justify-between px-1 pt-1">
          <h2 className="text-caption font-medium text-muted-foreground">
            Layers
          </h2>
          <Badge variant="dot" color="gray">
            {layers.length}
          </Badge>
        </header>

        <section className="flex flex-col gap-1.5">
          <p className="px-1 text-[11px] text-muted-foreground/80">
            Click inserts into selection (row → first column)
          </p>
          <div className="grid grid-cols-2 gap-1">
            {BLOCK_TYPES.map((type) => {
              const Icon = BLOCK_ICONS[type]
              return (
                <button
                  key={type}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    suppressClickRef.current = false
                    e.dataTransfer.effectAllowed = "copy"
                    e.dataTransfer.setData(PALETTE_BLOCK_MIME, type)
                    e.dataTransfer.setData("text/plain", type)
                    setPaletteDragType(type)
                  }}
                  onDragEnd={() => {
                    suppressClickRef.current = true
                    setPaletteDragType(null)
                  }}
                  onClick={() => {
                    if (suppressClickRef.current) {
                      suppressClickRef.current = false
                      return
                    }
                    insertLeaf(type, insertionTarget)
                  }}
                  className={cn(
                    "flex cursor-grab items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[11px] text-muted-foreground outline-none transition-colors duration-80 active:cursor-grabbing",
                    "hover:bg-muted/60 hover:text-foreground",
                    "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
                  )}
                >
                  <Icon size={12} strokeWidth={1.75} />
                  {BLOCK_LABELS[type]}
                </button>
              )
            })}
          </div>
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-start"
            leadingIcon={Columns2}
            onClick={() => insertRow(2, insertionTarget)}
          >
            2-column row
          </Button>
        </section>

        <div className="h-px bg-border" />

        <p className="px-1 text-[11px] text-muted-foreground/80">
          Drag any layer — blue line = order, highlight = nest into
        </p>

        <ul className="flex flex-col gap-0.5">
          {layers.map(({ node, depth }) => (
            <LayerRow
              key={node.id}
              node={node}
              depth={depth}
              selected={selected}
              draggingId={draggingId}
              dropHint={dropHint}
              onSelect={select}
              onDragStart={onLayerDragStart}
              onDragEnd={onLayerDragEnd}
              onDragOver={onLayerDragOver}
              onDrop={onLayerDrop}
            />
          ))}
        </ul>

        {layers.length === 0 && (
          <p className="px-2 text-[11px] text-muted-foreground">
            No blocks yet — add one above.
          </p>
        )}

        <div className="mt-auto flex flex-col gap-1">
          {selected && (
            <Tooltip content="Remove selected block">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start text-muted-foreground"
                leadingIcon={Trash2}
                onClick={() => removeNode(selected)}
              >
                Delete block
              </Button>
            </Tooltip>
          )}
          <button
            type="button"
            onClick={() => select(null)}
            className={cn(
              "rounded-lg px-2 py-1.5 text-left text-[12px] text-muted-foreground outline-none transition-colors duration-80",
              "hover:bg-muted/60 hover:text-foreground",
              "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
              selected === null && "bg-accent text-foreground"
            )}
          >
            Document settings
          </button>
        </div>
      </aside>
    </SizeProvider>
  )
}
