import { Outlet, createRootRoute } from "@tanstack/react-router"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ShapeProvider } from "@/lib/shape-context"
import { IconProvider } from "@/lib/icon-context"
import { SizeProvider } from "@/lib/size-context"
import { ThemeProvider } from "@/lib/theme-context"
import { AppSidebar } from "@/components/app-shell"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <ThemeProvider>
      <IconProvider>
        <ShapeProvider>
          <SizeProvider>
            <TooltipProvider>
              <div className="flex h-svh overflow-hidden bg-background text-foreground">
                <AppSidebar />
                <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
                  <Outlet />
                </main>
              </div>
            </TooltipProvider>
          </SizeProvider>
        </ShapeProvider>
      </IconProvider>
    </ThemeProvider>
  )
}
