import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { ArrowUpDown, LayoutTemplate, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InputField, InputGroup } from "@/components/ui/input-group"
import { SizeProvider } from "@/lib/size-context"
import { useShape } from "@/lib/shape-context"
import { cn } from "@/lib/utils"
import type { EmailTemplateListItem } from "@/email/schema"
import {
  deleteTemplate,
  duplicateTemplate,
  fetchTemplates,
  renameTemplate,
} from "@/email/templates-api"
import { TemplateCard } from "./template-card"

type SortMode = "newest" | "name"

export function EmailTemplatesPage() {
  const shape = useShape()
  const [templates, setTemplates] = useState<EmailTemplateListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortMode>("newest")
  const deferredQuery = useDeferredValue(query)

  async function refresh() {
    setError(null)
    try {
      const list = await fetchTemplates()
      setTemplates(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    const filtered = q
      ? templates.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.subject.toLowerCase().includes(q)
        )
      : templates
    const sorted = [...filtered]
    if (sort === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name))
    } else {
      sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    }
    return sorted
  }, [templates, deferredQuery, sort])

  async function handleRename(id: string, name: string) {
    const saved = await renameTemplate(id, name)
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              id: saved.id,
              name: saved.name,
              subject: saved.meta.subject,
              updatedAt: saved.updatedAt,
            }
          : t
      )
    )
  }

  async function handleDuplicate(id: string) {
    const saved = await duplicateTemplate(id)
    setTemplates((prev) => [
      {
        id: saved.id,
        name: saved.name,
        subject: saved.meta.subject,
        updatedAt: saved.updatedAt,
      },
      ...prev,
    ])
  }

  async function handleDelete(id: string) {
    await deleteTemplate(id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  const isEmpty = !loading && templates.length === 0
  const noMatches = !loading && templates.length > 0 && visible.length === 0

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-10">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Badge color="blue">Brand & Assets</Badge>
            <Badge variant="dot" color="green">
              My Templates
            </Badge>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="text-display font-medium tracking-tight">
                Email templates
              </h1>
              <p className="max-w-xl text-body text-muted-foreground">
                Browse, rename, edit, duplicate, and delete the designs you’ve
                saved from the email editor.
              </p>
            </div>
          </div>
        </header>

        {!isEmpty ? (
          <div className="flex flex-wrap items-center gap-3">
            <SizeProvider size="compact">
              <InputGroup className="w-full max-w-xs">
                <InputField
                  index={0}
                  label="Search"
                  value={query}
                  onChange={setQuery}
                  icon={Search}
                  placeholder="Search by name"
                />
              </InputGroup>
            </SizeProvider>
            <Button
              type="button"
              variant="secondary"
              size="compact"
              leadingIcon={ArrowUpDown}
              onClick={() =>
                setSort((s) => (s === "newest" ? "name" : "newest"))
              }
            >
              {sort === "newest" ? "Newest" : "Name"}
            </Button>
          </div>
        ) : null}

        {error ? (
          <div
            className={cn(
              "bg-card px-4 py-3 text-caption text-muted-foreground shadow-surface-3",
              shape.container
            )}
          >
            {error}{" "}
            <button
              type="button"
              className="underline outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]"
              onClick={() => {
                setLoading(true)
                void refresh()
              }}
            >
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <p className="text-caption text-muted-foreground">Loading templates…</p>
        ) : isEmpty ? (
          <EmptyState />
        ) : noMatches ? (
          <p className="text-caption text-muted-foreground">
            No templates match “{query.trim()}”.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onRename={handleRename}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  const shape = useShape()
  return (
    <section
      className={cn(
        "flex flex-col items-start gap-4 bg-card p-8 shadow-surface-3",
        shape.container
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
        <LayoutTemplate size={18} strokeWidth={1.75} />
      </span>
      <div className="flex max-w-md flex-col gap-2">
        <h2 className="text-subtitle font-medium tracking-tight">
          No templates yet
        </h2>
        <p className="text-body text-muted-foreground">
          Save a design from the email editor with{" "}
          <span className="font-medium text-foreground">Save as template</span>.
          Templates you save show up here so you can update them later without
          rebuilding from scratch.
        </p>
      </div>
      <Button asChild>
        <Link to="/email-editor">Open email editor</Link>
      </Button>
    </section>
  )
}
