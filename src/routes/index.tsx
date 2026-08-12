import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState, type ReactNode } from "react"
import { ArrowRight, LayoutTemplate, Mail, PanelRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { EmailListItem } from "@/email/schema"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  const [emails, setEmails] = useState<EmailListItem[]>([])

  useEffect(() => {
    void fetch("/api/emails")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setEmails(Array.isArray(data) ? data : []))
      .catch(() => setEmails([]))
  }, [])

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-8 py-10">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Badge color="blue">Fluid Functionalism</Badge>
            <Badge variant="dot" color="green">
              TanStack Router
            </Badge>
          </div>
          <h1 className="text-display font-medium tracking-tight">
            Workspace
          </h1>
          <p className="max-w-xl text-body text-muted-foreground">
            A small app shell around Fluid components — email templates, the
            editor, settings with a nested rail, and a live component gallery.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <HomeLink
            to="/email-templates"
            title="Email templates"
            description="Browse, rename, edit, duplicate, and delete saved designs."
            icon={<LayoutTemplate size={16} strokeWidth={1.75} />}
          />
          <HomeLink
            to="/email-editor"
            title="Email editor"
            description="WYSIWYG canvas, layers, and a contextual inspector."
            icon={<Mail size={16} strokeWidth={1.75} />}
          />
          <HomeLink
            to="/prototypes"
            title="Prototypes"
            description="Control panel studies. Image first, toggle groups for most choices."
            icon={<PanelRight size={16} strokeWidth={1.75} />}
          />
          <HomeLink
            to="/components"
            title="Components"
            description="Buttons, pickers, sliders, cards, and more."
            badge={
              <Badge variant="dot" color="violet">
                Gallery
              </Badge>
            }
          />
          <HomeLink
            to="/settings"
            title="Settings"
            description="Nested sidebar — members, keys, plan, appearance."
            badge={
              <Badge variant="dot" color="gray">
                Account
              </Badge>
            }
          />
        </section>

        {emails.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-subtitle font-medium tracking-tight">
              Saved emails
            </h2>
            <ul className="flex flex-col gap-2">
              {emails.map((email) => (
                <li key={email.id}>
                  <Link
                    to="/email-editor"
                    search={{ id: email.id }}
                    className="flex items-center justify-between rounded-lg bg-card px-4 py-3 shadow-surface-3 outline-none transition-colors duration-80 hover:bg-muted/40 focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-body font-medium">
                        {email.subject}
                      </span>
                      <span className="text-caption text-muted-foreground">
                        {email.id} ·{" "}
                        {new Date(email.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    <ArrowRight
                      size={14}
                      className="shrink-0 text-muted-foreground"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link to="/email-templates">Email templates</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/email-editor">Open editor</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/settings">Settings</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function HomeLink({
  to,
  title,
  description,
  icon,
  badge,
}: {
  to:
    | "/email-templates"
    | "/email-editor"
    | "/prototypes"
    | "/components"
    | "/settings"
  title: string
  description: string
  icon?: ReactNode
  badge?: ReactNode
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-3 rounded-xl bg-card p-5 shadow-surface-3 outline-none transition-colors duration-80 hover:bg-muted/40 focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
    >
      <div className="flex items-center justify-between">
        {icon ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
            {icon}
          </span>
        ) : (
          badge
        )}
        <ArrowRight
          size={16}
          className="text-muted-foreground transition-transform duration-80 group-hover:translate-x-0.5"
        />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-subtitle font-medium tracking-tight">{title}</h2>
        <p className="text-caption text-muted-foreground">{description}</p>
      </div>
    </Link>
  )
}
