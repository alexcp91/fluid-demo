import type { ReactNode } from "react"
import { useShape } from "@/lib/shape-context"
import { cn } from "@/lib/utils"

export function SettingsCard({
  title,
  description,
  children,
  action,
  footer,
  className,
}: {
  title: string
  description?: ReactNode
  children?: ReactNode
  action?: ReactNode
  footer?: ReactNode
  className?: string
}) {
  const shape = useShape()

  return (
    // Elevated panel on the page floor: bg-card + shadow-surface-3.
    // No border — Fluid uses the shadow ladder for lift.
    <section
      className={cn(
        "flex flex-col gap-5 bg-card p-5 shadow-surface-3 sm:p-6",
        shape.container,
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-subtitle font-medium tracking-tight text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="max-w-prose text-caption leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
      </div>
      {children}
      {footer ? (
        <div className="flex justify-end border-t border-border/60 pt-4">
          {footer}
        </div>
      ) : null}
    </section>
  )
}
