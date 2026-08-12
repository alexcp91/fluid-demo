import {
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react"
import { cn } from "@/lib/utils"

interface InlineTextProps
  extends Omit<HTMLAttributes<HTMLElement>, "onChange" | "onSelect"> {
  value: string
  onChange: (value: string) => void
  onEditStart?: () => void
  /** When true, value is treated as HTML (bold/italic/etc). */
  rich?: boolean
  multiline?: boolean
  as?: "span" | "p" | "h2" | "div"
  placeholder?: string
}

function write(el: HTMLElement, value: string, rich: boolean) {
  if (rich) {
    if (el.innerHTML !== value) el.innerHTML = value || ""
  } else if (el.textContent !== value) {
    el.textContent = value || ""
  }
}

/** Canvas-native editable text — Tabular-style click-to-type. */
export function InlineText({
  value,
  onChange,
  onEditStart,
  rich = false,
  multiline = false,
  as: Tag = "span",
  placeholder,
  className,
  ...props
}: InlineTextProps) {
  const ref = useRef<HTMLElement | null>(null)
  const focused = useRef(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || focused.current) return
    write(el, value, rich)
  }, [value, rich])

  function commit() {
    const el = ref.current
    if (!el) return
    const next = rich ? el.innerHTML : (el.textContent ?? "")
    if (next !== value) onChange(next)
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (!multiline && e.key === "Enter") {
      e.preventDefault()
      focused.current = false
      commit()
      ref.current?.blur()
    }
    if (
      (e.metaKey || e.ctrlKey) &&
      ["b", "i", "u"].includes(e.key.toLowerCase())
    ) {
      window.setTimeout(commit, 0)
    }
  }

  return (
    <Tag
      ref={(node) => {
        ref.current = node
        if (node && !focused.current) write(node, value, rich)
      }}
      role="textbox"
      contentEditable
      suppressContentEditableWarning
      aria-label={placeholder}
      data-placeholder={placeholder}
      spellCheck
      onFocus={() => {
        focused.current = true
        onEditStart?.()
      }}
      onBlur={() => {
        focused.current = false
        commit()
      }}
      onInput={() => commit()}
      onKeyDown={onKeyDown}
      className={cn(
        "min-w-[1ch] outline-none",
        "empty:before:pointer-events-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60",
        "caret-[color:var(--focus-ring,#6B97FF)]",
        className
      )}
      {...props}
    />
  )
}
