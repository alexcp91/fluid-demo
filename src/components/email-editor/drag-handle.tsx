import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

/** Drag handle for Shopify Draggable — keeps contentEditable usable. */
export function DragHandle({ className }: { className?: string }) {
  return (
    <button
      type="button"
      data-drag-handle
      aria-label="Drag to reorder"
      className={cn(
        "inline-flex h-6 w-5 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground outline-none",
        "hover:bg-muted hover:text-foreground active:cursor-grabbing",
        "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <GripVertical size={14} strokeWidth={1.75} />
    </button>
  )
}
