import { Link, useRouterState } from "@tanstack/react-router"
import {
  Boxes,
  LayoutDashboard,
  LayoutTemplate,
  Mail,
  PanelRight,
  Settings,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { SizeProvider } from "@/lib/size-context"

interface NavItem {
  to:
    | "/"
    | "/email-editor"
    | "/email-templates"
    | "/settings"
    | "/components"
    | "/prototypes"
  label: string
  icon: LucideIcon
}

const NAV: NavItem[] = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/email-templates", label: "Email templates", icon: LayoutTemplate },
  { to: "/email-editor", label: "Email editor", icon: Mail },
  { to: "/prototypes", label: "Prototypes", icon: PanelRight },
  { to: "/components", label: "Components", icon: Boxes },
  { to: "/settings", label: "Settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <SizeProvider size="compact">
      <aside className="flex h-svh w-56 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-[11px] font-medium text-background">
            F
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium tracking-tight text-foreground">
              Fluid Demo
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              Workspace
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Main">
          <p className="px-2 pb-1.5 pt-2 text-[11px] text-muted-foreground/70">
            App
          </p>
          {NAV.map((item) => {
            const Icon = item.icon
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to)

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] outline-none transition-colors duration-80",
                  "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Icon size={14} strokeWidth={active ? 2 : 1.5} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.to === "/email-templates" && (
                  <Badge variant="dot" color="blue">
                    New
                  </Badge>
                )}
                {item.to === "/email-editor" && (
                  <Badge variant="dot" color="blue">
                    Live
                  </Badge>
                )}
                {item.to === "/prototypes" && (
                  <Badge variant="dot" color="amber">
                    Lab
                  </Badge>
                )}
                {item.to === "/components" && (
                  <Badge variant="dot" color="violet">
                    UI
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2.5">
          <span className="text-[11px] text-muted-foreground">Appearance</span>
          <ThemeToggle />
        </div>
      </aside>
    </SizeProvider>
  )
}
