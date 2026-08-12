import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bold, Italic, Underline } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip } from "@/components/ui/tooltip"
import { ColorPickerPopover } from "@/components/ui/color-picker"
import { SizeProvider } from "@/lib/size-context"
import { spring } from "@/lib/springs"

interface FormatToolbarProps {
  selected: string | null
  /** Heading / paragraph only — never buttons or plain fields. */
  richCapable: boolean
}

const SWATCHES = [
  "#171717",
  "#737373",
  "#EF4444",
  "#F59E0B",
  "#22C55E",
  "#6B97FF",
  "#8B5CF6",
  "#EC4899",
]

const TOOLBAR_GAP = 10
const TOOLBAR_HEIGHT = 40
const ESTIMATED_WIDTH = 180

function query(cmd: string) {
  try {
    return document.queryCommandState(cmd)
  } catch {
    return false
  }
}

function rgbToHex(value: string): string {
  if (!value) return "#171717"
  if (value.startsWith("#")) return value
  const m = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (!m) return "#171717"
  const hex = [m[1], m[2], m[3]]
    .map((n) => Number(n).toString(16).padStart(2, "0"))
    .join("")
  return `#${hex}`
}

function queryForeColor(): string {
  try {
    return rgbToHex(document.queryCommandValue("foreColor") || "")
  } catch {
    return "#171717"
  }
}

function editableFromNode(node: Node | null): HTMLElement | null {
  if (!node) return null
  const el =
    node instanceof Element
      ? node.closest("[contenteditable=true]")
      : node.parentElement?.closest("[contenteditable=true]")
  return el as HTMLElement | null
}

function activeEditable(): HTMLElement | null {
  return editableFromNode(window.getSelection()?.anchorNode ?? null)
}

function commitEditable(el?: HTMLElement | null) {
  ;(el ?? activeEditable())?.dispatchEvent(new Event("input", { bubbles: true }))
}

function run(cmd: string) {
  document.execCommand(cmd, false)
  commitEditable()
}

/** Layers panel and canvas both stamp `data-block-id` — prefer the canvas
 *  editable block so toolbar geometry isn’t tied to the sidebar row. */
function canvasBlockEl(blockId: string): HTMLElement | null {
  const nodes = [...document.querySelectorAll(`[data-block-id="${blockId}"]`)].filter(
    (n): n is HTMLElement => n instanceof HTMLElement
  )
  const withEditable = nodes.find((n) =>
    n.querySelector("[contenteditable=true]")
  )
  if (withEditable) return withEditable
  const sortable = nodes.find((n) => n.hasAttribute("data-sortable-item"))
  if (sortable) return sortable
  return nodes[0] ?? null
}

function rangeInBlock(range: Range, blockId: string): boolean {
  const block = canvasBlockEl(blockId)
  if (!block) return false
  return block.contains(range.commonAncestorContainer)
}

/**
 * Non-collapsed selection inside the selected block’s contenteditable.
 * Block chrome / collapsed caret / outside rich text → null.
 */
function textRangeInSelectedBlock(blockId: string): Range | null {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null

  const range = sel.getRangeAt(0)
  if (!rangeInBlock(range, blockId)) return null

  const editable = editableFromNode(range.commonAncestorContainer)
  if (!editable) return null

  const block = canvasBlockEl(blockId)
  if (!block || !block.contains(editable)) return null

  return range
}

function clampPos(top: number, left: number) {
  const pad = 8
  const half = ESTIMATED_WIDTH / 2
  return {
    top: Math.min(Math.max(pad, top), window.innerHeight - TOOLBAR_HEIGHT - pad),
    left: Math.min(
      Math.max(half + pad, left),
      window.innerWidth - half - pad
    ),
  }
}

/** First visible line of a range — getBoundingClientRect can span a huge box
 *  when the editable has collapsed width / stacked glyphs. */
function rectForRange(range: Range): DOMRect | null {
  const rects = range.getClientRects()
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i]
    if (rect.width > 0 || rect.height > 0) return rect
  }
  const fallback = range.getBoundingClientRect()
  if (fallback.width > 0 || fallback.height > 0) return fallback
  return null
}

function posFromRect(rect: DOMRect) {
  // Prefer above the selection; flip below when there isn’t room.
  let top = rect.top - TOOLBAR_HEIGHT - TOOLBAR_GAP
  if (top < 8) top = rect.bottom + TOOLBAR_GAP
  return clampPos(top, rect.left + rect.width / 2)
}

function applyForeColor(color: string, range: Range | null) {
  if (!range || range.collapsed) return

  const sel = window.getSelection()
  if (!sel) return

  const editable =
    editableFromNode(range.commonAncestorContainer) ?? activeEditable()

  // Restore the saved range without relying on focus staying in the editable —
  // the color popover may own focus while dragging.
  sel.removeAllRanges()
  sel.addRange(range)

  document.execCommand("styleWithCSS", false, "true")
  document.execCommand("foreColor", false, color)
  commitEditable(editable)

  if (sel.rangeCount > 0) {
    return sel.getRangeAt(0).cloneRange()
  }
  return range.cloneRange()
}

export function FormatToolbar({
  selected,
  richCapable,
}: FormatToolbarProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [marks, setMarks] = useState({
    bold: false,
    italic: false,
    underline: false,
  })
  const [color, setColor] = useState("#171717")
  const [visible, setVisible] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const savedRange = useRef<Range | null>(null)
  const lockedPos = useRef<{ top: number; left: number } | null>(null)
  const applyingColor = useRef(false)
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0

    function hide() {
      setVisible(false)
      lockedPos.current = null
      savedRange.current = null
    }

    function refresh() {
      if (!selected || !richCapable) {
        if (!pickerOpen) hide()
        return
      }

      const block = canvasBlockEl(selected)
      if (!block) {
        if (!pickerOpen) hide()
        return
      }

      // While the picker is open, freeze the toolbar — selection/focus churn
      // from the popover must not yank it around or dismiss it.
      if (pickerOpen && lockedPos.current) {
        setPos(lockedPos.current)
        setVisible(true)
        return
      }

      const range = textRangeInSelectedBlock(selected)
      if (!range) {
        if (!pickerOpen) hide()
        return
      }

      const rect = rectForRange(range)
      if (!rect) {
        if (!pickerOpen) hide()
        return
      }

      const nextPos = posFromRect(rect)
      savedRange.current = range.cloneRange()
      lockedPos.current = nextPos
      setPos(nextPos)
      setVisible(true)
      setMarks({
        bold: query("bold"),
        italic: query("italic"),
        underline: query("underline"),
      })
      if (!pickerOpen) setColor(queryForeColor())
    }

    function schedule() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(refresh)
    }

    refresh()
    document.addEventListener("selectionchange", schedule)
    window.addEventListener("scroll", schedule, true)
    window.addEventListener("resize", schedule)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener("selectionchange", schedule)
      window.removeEventListener("scroll", schedule, true)
      window.removeEventListener("resize", schedule)
    }
  }, [selected, pickerOpen, richCapable])

  // Clear sticky anchor when the selected block changes.
  useEffect(() => {
    lockedPos.current = null
    savedRange.current = null
    setPickerOpen(false)
    setVisible(false)
  }, [selected])

  return (
    <AnimatePresence>
      {visible && pos && selected && richCapable ? (
        <motion.div
          key="format-toolbar"
          ref={toolbarRef}
          className="pointer-events-auto fixed z-50 -translate-x-1/2"
          style={{ top: pos.top, left: pos.left }}
          initial={{ opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96, transition: spring.fast.exit }}
          transition={spring.fast}
          onMouseDown={(e) => {
            // Keep contentEditable selection when pressing toolbar chrome.
            // Portalled popovers handle their own guard via preserveSelection.
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={(e) => {
            // Canvas wraps a click-to-deselect handler — never let toolbar
            // clicks clear the active block mid-format.
            e.stopPropagation()
          }}
        >
          <SizeProvider size="compact">
            <div className="flex items-center gap-0.5 rounded-full bg-card p-1 shadow-surface-4 ring-1 ring-border">
              <Tooltip content="Bold ⌘B">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-compact"
                  active={marks.bold}
                  aria-label="Bold"
                  onClick={() => {
                    run("bold")
                    setMarks((m) => ({ ...m, bold: query("bold") }))
                  }}
                >
                  <Bold size={14} />
                </Button>
              </Tooltip>
              <Tooltip content="Italic ⌘I">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-compact"
                  active={marks.italic}
                  aria-label="Italic"
                  onClick={() => {
                    run("italic")
                    setMarks((m) => ({ ...m, italic: query("italic") }))
                  }}
                >
                  <Italic size={14} />
                </Button>
              </Tooltip>
              <Tooltip content="Underline ⌘U">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-compact"
                  active={marks.underline}
                  aria-label="Underline"
                  onClick={() => {
                    run("underline")
                    setMarks((m) => ({ ...m, underline: query("underline") }))
                  }}
                >
                  <Underline size={14} />
                </Button>
              </Tooltip>

              <ColorPickerPopover
                size="compact"
                value={color}
                swatches={SWATCHES}
                triggerShowValue={false}
                triggerAriaLabel="Text color"
                triggerClassName="h-7 w-7 justify-center rounded-full border-transparent px-0 hover:bg-hover"
                initialFocus={false}
                finalFocus={false}
                preserveSelection
                open={pickerOpen}
                onOpenChange={(open, details) => {
                  // Applying color restores the contentEditable selection and
                  // can briefly steal focus — don’t dismiss for that.
                  if (
                    !open &&
                    details?.reason === "focus-out" &&
                    applyingColor.current
                  ) {
                    details.cancel()
                    return
                  }

                  if (open) {
                    const sel = window.getSelection()
                    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
                      savedRange.current = sel.getRangeAt(0).cloneRange()
                    }
                    setColor(queryForeColor())
                    if (lockedPos.current) setPos(lockedPos.current)
                  }
                  setPickerOpen(open)
                }}
                onValueChange={(next) => {
                  setColor(next)
                  applyingColor.current = true
                  const nextRange = applyForeColor(next, savedRange.current)
                  if (nextRange) savedRange.current = nextRange
                  // Allow focus-out dismiss again after the sync apply.
                  queueMicrotask(() => {
                    applyingColor.current = false
                  })
                }}
              />
            </div>
          </SizeProvider>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
