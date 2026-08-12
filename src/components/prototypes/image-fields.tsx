import type { LucideIcon } from "lucide-react"
import { Link2, Minus, Plus, Unlink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip } from "@/components/ui/tooltip"
import { useShape } from "@/lib/shape-context"
import { useSize } from "@/lib/size-context"
import { cn } from "@/lib/utils"
import type { CornerEdge, Corners, Quad, QuadEdge } from "./image-state"

const PX_MIN = 0
const PX_MAX = 720

export function clampPx(value: number, min = PX_MIN, max = PX_MAX): number {
  return Math.min(max, Math.max(min, value))
}

export function NumStepper({
  value,
  onChange,
  disabled = false,
  min = 40,
  max = PX_MAX,
  step = 10,
  suffix = "px",
}: {
  value: number
  onChange: (next: number) => void
  disabled?: boolean
  min?: number
  max?: number
  step?: number
  suffix?: string
}) {
  const shape = useShape()
  const size = useSize()

  return (
    <div
      className={cn(
        "inline-flex items-center bg-muted",
        size.segmentPad,
        shape.container
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-compact"
        disabled={disabled || value <= min}
        aria-label={`Decrease ${suffix}`}
        onClick={() => onChange(clampPx(value - step, min, max))}
        className="h-6 w-6"
      >
        <Minus size={size.icon} strokeWidth={1.75} />
      </Button>
      <input
        type="text"
        inputMode="numeric"
        disabled={disabled}
        aria-label={`Value in ${suffix}`}
        value={String(value)}
        onChange={(event) => {
          const parsed = Number(event.target.value)
          if (!Number.isFinite(parsed)) return
          onChange(clampPx(Math.round(parsed), min, max))
        }}
        className={cn(
          "w-9 bg-transparent text-center tabular-nums text-foreground outline-none",
          size.text,
          disabled && "text-muted-foreground"
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-compact"
        disabled={disabled || value >= max}
        aria-label={`Increase ${suffix}`}
        onClick={() => onChange(clampPx(value + step, min, max))}
        className="h-6 w-6"
      >
        <Plus size={size.icon} strokeWidth={1.75} />
      </Button>
    </div>
  )
}

function MiniPx({
  value,
  onChange,
  label,
  disabled = false,
}: {
  value: number
  onChange: (next: number) => void
  label: string
  disabled?: boolean
}) {
  const size = useSize()
  const shape = useShape()

  return (
    <Tooltip content={label} side="bottom">
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        disabled={disabled}
        value={String(value)}
        onChange={(event) => {
          const parsed = Number(event.target.value)
          if (!Number.isFinite(parsed)) return
          onChange(clampPx(Math.round(parsed), 0, 120))
        }}
        className={cn(
          "h-6 w-8 bg-muted text-center tabular-nums text-foreground outline-none",
          "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
          size.text,
          shape.input,
          disabled && "text-muted-foreground"
        )}
      />
    </Tooltip>
  )
}

function LinkToggle({
  linked,
  onToggle,
  label,
}: {
  linked: boolean
  onToggle: () => void
  label: string
}) {
  const size = useSize()
  const Icon: LucideIcon = linked ? Link2 : Unlink

  return (
    <Tooltip content={linked ? `Unlink ${label}` : `Link ${label}`} side="bottom">
      <Button
        type="button"
        variant="ghost"
        size="icon-compact"
        active={linked}
        aria-pressed={linked}
        aria-label={linked ? `Unlink ${label}` : `Link ${label}`}
        onClick={onToggle}
        className="h-6 w-6"
      >
        <Icon size={size.icon} strokeWidth={linked ? 2 : 1.5} />
      </Button>
    </Tooltip>
  )
}

const EDGE_LABEL: Record<QuadEdge, string> = {
  top: "Top",
  right: "Right",
  bottom: "Bottom",
  left: "Left",
}

export function QuadRow({
  value,
  onEdgeChange,
  onToggleLink,
  label,
}: {
  value: Quad
  onEdgeChange: (edge: QuadEdge, next: number) => void
  onToggleLink: () => void
  label: string
}) {
  return (
    <div className="flex items-center gap-0.5">
      {(["top", "right", "bottom", "left"] as const).map((edge) => (
        <MiniPx
          key={edge}
          label={`${label} ${EDGE_LABEL[edge]}`}
          value={value[edge]}
          onChange={(next) => onEdgeChange(edge, next)}
        />
      ))}
      <LinkToggle linked={value.linked} onToggle={onToggleLink} label={label} />
    </div>
  )
}

const CORNER_LABEL: Record<CornerEdge, string> = {
  topLeft: "Top left",
  topRight: "Top right",
  bottomRight: "Bottom right",
  bottomLeft: "Bottom left",
}

export function CornerGrid({
  value,
  onCornerChange,
  onToggleLink,
}: {
  value: Corners
  onCornerChange: (edge: CornerEdge, next: number) => void
  onToggleLink: () => void
}) {
  return (
    <div className="flex items-center gap-1">
      <div className="grid grid-cols-2 gap-0.5">
        {(
          [
            "topLeft",
            "topRight",
            "bottomLeft",
            "bottomRight",
          ] as const
        ).map((edge) => (
          <MiniPx
            key={edge}
            label={CORNER_LABEL[edge]}
            value={value[edge]}
            onChange={(next) => onCornerChange(edge, next)}
          />
        ))}
      </div>
      <LinkToggle
        linked={value.linked}
        onToggle={onToggleLink}
        label="corners"
      />
    </div>
  )
}
