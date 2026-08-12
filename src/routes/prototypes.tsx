import { createFileRoute } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import { ImagePrototypeGallery } from "@/components/prototypes/image-prototype"

export const Route = createFileRoute("/prototypes")({
  component: PrototypesPage,
})

function PrototypesPage() {
  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-8 py-10">
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-display font-medium tracking-tight">
              Prototypes
            </h1>
            <Badge variant="dot" color="amber">
              Control panel
            </Badge>
          </div>
          <p className="max-w-2xl text-body text-muted-foreground">
            Inspector studies for the email editor. Fluid chrome, Tabular's
            Image control set.
          </p>
        </header>

        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-title font-medium tracking-tight">Image</h2>
            <p className="max-w-2xl text-caption text-muted-foreground">
              Source (file, URL, icon), alt, click-through link, new tab,
              dynamic content. On styles: desktop/mobile, visibility, AUTO /
              FIXED / MAX width and height, align, linked corner radius,
              four-sided padding and margin, border, and background.
            </p>
          </div>
          <ImagePrototypeGallery />
        </section>
      </div>
    </div>
  )
}
