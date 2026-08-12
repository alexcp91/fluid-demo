import { useState, type DragEvent } from "react"
import { cn } from "@/lib/utils"
import { useEmailStore } from "@/email/store"
import { readPaletteBlockType } from "./palette-drag"

/**
 * Drop target between canvas blocks (or empty container). Visible only while a
 * palette block type is being dragged.
 */
export function DropSlot({
  into,
  index,
  empty,
}: {
  into: string
  index: number
  /** Tall empty-canvas drop area */
  empty?: boolean
}) {
  const paletteDragType = useEmailStore((s) => s.paletteDragType)
  const insertLeafAt = useEmailStore((s) => s.insertLeafAt)
  const setPaletteDragType = useEmailStore((s) => s.setPaletteDragType)
  const [over, setOver] = useState(false)

  if (!paletteDragType) return null

  function accept(e: DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    return true
  }

  return (
    <div
      role="presentation"
      data-drop-slot
      data-drop-into={into}
      data-drop-index={index}
      onDragEnter={(e) => {
        if (accept(e)) setOver(true)
      }}
      onDragOver={(e) => {
        accept(e)
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return
        setOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setOver(false)
        const type =
          readPaletteBlockType(e.dataTransfer) ?? paletteDragType
        if (type) insertLeafAt(type, into, index)
        setPaletteDragType(null)
      }}
      className={cn(
        "relative flex w-full shrink-0 items-center justify-center transition-[min-height,background-color] duration-80",
        empty
          ? cn(
              "min-h-24 rounded-lg border border-dashed px-3 py-8",
              over
                ? "border-[color:var(--focus-ring,#6B97FF)] bg-[color-mix(in_oklab,var(--focus-ring,#6B97FF)_8%,transparent)]"
                : "border-border bg-muted/30"
            )
          : cn("z-[1] -my-0.5 min-h-2.5", over && "min-h-4")
      )}
    >
      {empty ? (
        <p
          className={cn(
            "text-center text-caption transition-colors duration-80",
            over ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Drop to add {paletteDragType}
        </p>
      ) : (
        <div
          className={cn(
            "pointer-events-none h-0.5 w-full rounded-full transition-[background-color,transform,opacity] duration-80",
            over
              ? "scale-y-150 bg-[color:var(--focus-ring,#6B97FF)] opacity-100"
              : "bg-[color-mix(in_oklab,var(--focus-ring,#6B97FF)_35%,transparent)] opacity-70"
          )}
        />
      )}
    </div>
  )
}
