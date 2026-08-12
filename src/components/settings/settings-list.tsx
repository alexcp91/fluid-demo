import type { ReactNode } from "react"
import { useShape } from "@/lib/shape-context"
import { cn } from "@/lib/utils"

/** Divided list inside a SettingsCard — hairlines only, no nested frames. */
export function SettingsList({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col">{children}</ul>
}

export function SettingsListRow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 py-3.5",
        "border-t border-border/60 first:border-t-0 first:pt-0 last:pb-0",
        className
      )}
    >
      {children}
    </li>
  )
}

export function SettingsAvatar({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const shape = useShape()
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <span
      aria-hidden
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center bg-muted text-caption font-medium text-foreground",
        shape.button,
        className
      )}
    >
      {initials || "?"}
    </span>
  )
}
