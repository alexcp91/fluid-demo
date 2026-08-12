import { useState, type ReactNode } from "react"
import { ChevronDown, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InputField, InputGroup } from "@/components/ui/input-group"
import { Tabs, TabsList, TabItem } from "@/components/ui/tabs"
import { Tooltip } from "@/components/ui/tooltip"
import { useShape } from "@/lib/shape-context"
import { useSize } from "@/lib/size-context"
import { cn } from "@/lib/utils"

/** Collapsible inspector section — Fluid caption rhythm, ladder icon size. */
export function InspectorSection({
  title,
  icon: Icon,
  hint,
  defaultOpen = true,
  children,
}: {
  title: string
  icon?: LucideIcon
  hint?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const size = useSize()

  return (
    <section className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-1.5 px-0.5 text-left outline-none",
          "text-caption text-muted-foreground transition-colors duration-80",
          "hover:text-foreground",
          "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
          size.control
        )}
      >
        <ChevronDown
          size={size.icon - 2}
          strokeWidth={2}
          className={cn(
            "shrink-0 text-muted-foreground/70 transition-transform duration-150",
            !open && "-rotate-90"
          )}
          aria-hidden
        />
        {Icon ? (
          <Icon
            size={size.icon - 2}
            strokeWidth={1.75}
            className="shrink-0"
            aria-hidden
          />
        ) : null}
        <span className="flex-1 truncate font-medium tracking-wide">
          {title}
        </span>
        {hint ? (
          <span className="shrink-0 tabular-nums text-muted-foreground/70">
            {hint}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="flex flex-col gap-1.5 pb-3 pt-0.5">{children}</div>
      ) : null}
    </section>
  )
}

/** Label-left / control-right property row — aligns to compact control height. */
export function PropRow({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  const size = useSize()

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-0.5",
        size.control,
        className
      )}
    >
      <span className="w-[4rem] shrink-0 truncate text-caption text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
        {children}
      </div>
    </div>
  )
}

/** Proximity-aware field stack for inspector text inputs. */
export function InspectorFields({ children }: { children: ReactNode }) {
  return (
    <InputGroup className="w-full max-w-none gap-1.5" size="compact">
      {children}
    </InputGroup>
  )
}

/** Compact field — Fluid InputField with hidden label (placeholder carries meaning). */
export function CompactField({
  label,
  value,
  onChange,
  icon: Icon,
  placeholder,
  hint,
  index,
}: {
  label: string
  value: string
  onChange: (next: string) => void
  icon?: LucideIcon
  placeholder?: string
  hint?: string
  index: number
}) {
  return (
    <div className="flex flex-col gap-1">
      <InputField
        index={index}
        label={label}
        labelHidden
        icon={Icon}
        value={value}
        onChange={onChange}
        placeholder={placeholder ?? label}
      />
      {hint ? (
        <p className="px-2 text-caption leading-snug text-muted-foreground/80">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export interface SegOption<T extends string> {
  value: T
  label?: string
  icon?: LucideIcon
  title?: string
}

/**
 * Compact segmented control — Fluid Tabs (spring indicator, proximity hover,
 * surface lift) instead of DIY bordered boxes.
 */
export function SegmentGroup<T extends string>({
  value,
  options,
  onChange,
  className,
  grow = true,
}: {
  value: T
  options: SegOption<T>[]
  onChange: (next: T) => void
  className?: string
  grow?: boolean
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as T)}
      size="compact"
      className={cn(grow && "w-full", className)}
    >
      <TabsList className={cn(grow && "w-full")}>
        {options.map((opt) => (
          <TabItem
            key={opt.value}
            value={opt.value}
            label={opt.label ?? opt.title ?? opt.value}
            icon={opt.icon}
            title={opt.title}
            className={cn(
              grow && "min-w-0 flex-1 justify-center px-1.5",
              !opt.label && opt.icon && "px-1"
            )}
          />
        ))}
      </TabsList>
    </Tabs>
  )
}

/**
 * Icon-only exclusive group — Fluid ghost icon buttons with `active`,
 * sitting in the same muted / shape track as TabsList.
 */
export function IconToggleGroup<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T
  options: SegOption<T>[]
  onChange: (next: T) => void
  className?: string
}) {
  const shape = useShape()
  const size = useSize()

  return (
    <div
      role="group"
      className={cn(
        // Match TabsList chrome: muted track + segment pad so outer height
        // lands on the compact ladder (28px) with h-6 icon buttons inside.
        "inline-flex items-center gap-0.5 bg-muted",
        size.segmentPad,
        shape.container,
        className
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value
        const Icon = opt.icon
        if (!Icon) return null
        return (
          <Tooltip
            key={opt.value}
            content={opt.title ?? opt.label ?? opt.value}
            side="bottom"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-compact"
              active={selected}
              aria-pressed={selected}
              aria-label={opt.title ?? opt.label ?? opt.value}
              onClick={() => onChange(opt.value)}
              className="h-6 w-6"
            >
              <Icon size={size.icon} strokeWidth={selected ? 2 : 1.5} />
            </Button>
          </Tooltip>
        )
      })}
    </div>
  )
}

/**
 * Compact boolean — Fluid Button tertiary + `active` (press surface, focus ring)
 * instead of a DIY ringed chip.
 */
export function BoolChip({
  checked,
  onChange,
  icon: Icon,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  icon?: LucideIcon
  label: string
}) {
  return (
    <Button
      type="button"
      variant="tertiary"
      size="compact"
      active={checked}
      aria-pressed={checked}
      leadingIcon={Icon}
      onClick={() => onChange(!checked)}
      className="min-w-0"
    >
      {label}
    </Button>
  )
}
