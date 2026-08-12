import { useRef } from "react"
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
import { useEmailStore } from "@/email/store"
import { DragHandle } from "./drag-handle"
import { PALETTE_BLOCK_MIME } from "./palette-drag"
import { useSortableBlocks } from "./use-sortable-blocks"
import {
  BLOCK_LABELS,
  BLOCK_TYPES,
  isFrame,
  type BlockType,
  type EmailBlock,
} from "./types"

const BLOCK_ICONS: Record<BlockType, LucideIcon> = {
  header: PanelTop,
  image: ImageIcon,
  heading: Type,
  paragraph: AlignLeft,
  button: MousePointerClick,
  frame: Columns2,
  footer: Footprints,
}

function LayerRow({
  block,
  depth,
  selected,
  onSelect,
}: {
  block: EmailBlock
  depth: number
  selected: string | null
  onSelect: (id: string) => void
}) {
  const Icon = BLOCK_ICONS[block.type]
  const isSelected = selected === block.id
  const hidden = !block.chrome.visible
  const label =
    block.type === "frame"
      ? block.direction === "row"
        ? "Row"
        : "Column"
      : BLOCK_LABELS[block.type]

  return (
    <>
      <li
        key={block.id}
        data-block-id={block.id}
        data-sortable-item={depth === 0 ? true : undefined}
        className={cn(
          "flex items-center gap-1 rounded-lg pr-1 outline-none transition-colors duration-80",
          isSelected
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          hidden && "opacity-45"
        )}
        style={{ paddingLeft: depth * 10 }}
      >
        {depth === 0 ? <DragHandle /> : <span className="w-4 shrink-0" />}
        <button
          type="button"
          onClick={() => onSelect(block.id)}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1.5 pr-2 text-left outline-none",
            "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
          )}
        >
          <Icon size={14} strokeWidth={isSelected ? 2 : 1.5} />
          <span className="flex-1 truncate text-[12px]">{label}</span>
          {hidden && (
            <span className="text-[10px] uppercase tracking-wide opacity-70">
              Hidden
            </span>
          )}
        </button>
      </li>
      {isFrame(block)
        ? block.children.map((child) => (
            <LayerRow
              key={child.id}
              block={child}
              depth={depth + 1}
              selected={selected}
              onSelect={onSelect}
            />
          ))
        : null}
    </>
  )
}

export function LayersPanel() {
  const listRef = useRef<HTMLUListElement>(null)
  const suppressClickRef = useRef(false)
  const blocks = useEmailStore((s) => s.doc.blocks)
  const selected = useEmailStore((s) => s.selectedId)
  const select = useEmailStore((s) => s.select)
  const insertBlock = useEmailStore((s) => s.insertBlock)
  const insertProductRow = useEmailStore((s) => s.insertProductRow)
  const removeBlock = useEmailStore((s) => s.removeBlock)
  const reorderBlocks = useEmailStore((s) => s.reorderBlocks)
  const setPaletteDragType = useEmailStore((s) => s.setPaletteDragType)

  useSortableBlocks(listRef, {
    order: blocks.map((b) => b.id),
    onReorder: reorderBlocks,
  })

  return (
    <SizeProvider size="compact">
      <aside className="flex h-full w-56 shrink-0 flex-col gap-3 overflow-auto border-r border-border bg-card p-3">
        <header className="flex items-center justify-between px-1 pt-1">
          <h2 className="text-caption font-medium text-muted-foreground">
            Layers
          </h2>
          <Badge variant="dot" color="gray">
            {blocks.length}
          </Badge>
        </header>

        <section className="flex flex-col gap-1.5">
          <p className="px-1 text-[11px] text-muted-foreground/80">
            Click or drag onto canvas
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
                    insertBlock(type)
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
            onClick={() => insertProductRow({ columns: 2 })}
          >
            2-column row
          </Button>
        </section>

        <div className="h-px bg-border" />

        <p className="px-1 text-[11px] text-muted-foreground/80">
          Drag to reorder · click to select
        </p>

        <ul ref={listRef} className="email-sortable flex flex-col gap-0.5">
          {blocks.map((block) => (
            <LayerRow
              key={block.id}
              block={block}
              depth={0}
              selected={selected}
              onSelect={select}
            />
          ))}
        </ul>

        {blocks.length === 0 && (
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
                onClick={() => removeBlock(selected)}
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
