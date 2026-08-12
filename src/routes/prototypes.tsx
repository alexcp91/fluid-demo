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
            Inspector studies for the email editor. Core layout: one list.
            Each section starts with presets, then flips to Adjust for
            bespoke controls.
          </p>
        </header>

        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-title font-medium tracking-tight">Image</h2>
            <p className="max-w-2xl text-caption text-muted-foreground">
              Simple is named presets — square / rounded / circle, none /
              tight / room, none / line / strong. Adjust keeps the same
              values and opens per-side radius, padding, margin, border
              stroke, and the rest of the Tabular set.
            </p>
          </div>
          <ImagePrototypeGallery />
        </section>
      </div>
    </div>
  )
}
