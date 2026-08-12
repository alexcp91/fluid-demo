import { Settings } from "lucide-react"
import { SizeProvider, useSize } from "@/lib/size-context"
import { useShape } from "@/lib/shape-context"
import { cn } from "@/lib/utils"
import { NAV_GROUPS, type SettingsSectionId } from "./types"

export function SettingsSidebar({
  section,
  onSelect,
}: {
  section: SettingsSectionId
  onSelect: (id: SettingsSectionId) => void
}) {
  return (
    <SizeProvider size="compact">
      <SettingsSidebarInner section={section} onSelect={onSelect} />
    </SizeProvider>
  )
}

function SettingsSidebarInner({
  section,
  onSelect,
}: {
  section: SettingsSectionId
  onSelect: (id: SettingsSectionId) => void
}) {
  const shape = useShape()
  const size = useSize()

  return (
    // Chrome rails: bg-card + border-border hairlines for structure.
    // Elevation (shadow-surface-*) is for floating panels on the page floor.
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3.5">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center bg-muted text-foreground",
            shape.button
          )}
        >
          <Settings size={size.icon} strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-body font-medium tracking-tight text-foreground">
            Settings
          </p>
          <p className="truncate text-caption text-muted-foreground">
            Fluid Demo
          </p>
        </div>
      </div>

      <nav
        className="flex flex-1 flex-col gap-4 overflow-auto p-2"
        aria-label="Settings"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            <p className="px-2 pb-1.5 pt-1 text-caption text-muted-foreground/70">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon
              const active = item.id === section
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 text-left text-caption outline-none transition-colors duration-80",
                    shape.item,
                    "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]",
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Icon size={size.icon} strokeWidth={active ? 2 : 1.5} />
                  <span className="flex-1 truncate">{item.label}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
