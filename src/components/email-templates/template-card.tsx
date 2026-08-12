import { useEffect, useRef, useState, type ReactNode } from "react"
import { Link } from "@tanstack/react-router"
import {
  Copy,
  MoreHorizontal,
  Pencil,
  Trash2,
  Type,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InputField, InputGroup } from "@/components/ui/input-group"
import { useShape } from "@/lib/shape-context"
import { cn } from "@/lib/utils"
import type { EmailTemplateListItem } from "@/email/schema"

function formatUpdatedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

export function TemplateCard({
  template,
  onRename,
  onDuplicate,
  onDelete,
}: {
  template: EmailTemplateListItem
  onRename: (id: string, name: string) => Promise<void>
  onDuplicate: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const shape = useShape()
  const [menuOpen, setMenuOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [name, setName] = useState(template.name)
  const [busy, setBusy] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onPointerDown(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false)
    }
    window.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [menuOpen])

  async function submitRename() {
    const next = name.trim()
    if (!next || next === template.name) {
      setRenameOpen(false)
      return
    }
    setBusy(true)
    try {
      await onRename(template.id, next)
      setRenameOpen(false)
    } finally {
      setBusy(false)
    }
  }

  async function submitDelete() {
    setBusy(true)
    try {
      await onDelete(template.id)
      setDeleteOpen(false)
    } finally {
      setBusy(false)
    }
  }

  async function submitDuplicate() {
    setMenuOpen(false)
    setBusy(true)
    try {
      await onDuplicate(template.id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden bg-card shadow-surface-3 transition-colors duration-80 hover:bg-muted/30",
        shape.container
      )}
    >
      <Link
        to="/email-editor"
        search={{ templateId: template.id }}
        className="relative block aspect-[4/5] overflow-hidden bg-muted/50 outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
        aria-label={`Edit design · ${template.name}`}
      >
        <iframe
          title={`${template.name} preview`}
          src={`/api/templates/${encodeURIComponent(template.id)}/html`}
          className="pointer-events-none absolute left-0 top-0 h-[250%] w-[250%] origin-top-left scale-[0.4] border-0 bg-white"
          sandbox=""
          loading="lazy"
          tabIndex={-1}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent opacity-0 transition-opacity duration-80 group-hover:opacity-100" />
      </Link>

      <div className="flex items-start gap-2 px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-body font-medium tracking-tight text-foreground">
            {template.name}
          </h2>
          <p className="truncate text-caption text-muted-foreground">
            Updated {formatUpdatedAt(template.updatedAt)}
          </p>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <Button
            type="button"
            variant="ghost"
            size="icon-compact"
            aria-label={`Actions for ${template.name}`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            disabled={busy}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreHorizontal size={15} strokeWidth={1.75} />
          </Button>
          {menuOpen ? (
            <div
              role="menu"
              className={cn(
                "absolute right-0 z-20 mt-1 w-44 overflow-hidden bg-card p-1 shadow-surface-5",
                shape.container
              )}
            >
              <MenuItem
                icon={<Pencil size={14} strokeWidth={1.75} />}
                label="Edit design"
                onClick={() => setMenuOpen(false)}
                asLink={{
                  to: "/email-editor",
                  search: { templateId: template.id },
                }}
              />
              <MenuItem
                icon={<Type size={14} strokeWidth={1.75} />}
                label="Rename"
                onClick={() => {
                  setMenuOpen(false)
                  setName(template.name)
                  setRenameOpen(true)
                }}
              />
              <MenuItem
                icon={<Copy size={14} strokeWidth={1.75} />}
                label="Duplicate"
                onClick={() => void submitDuplicate()}
              />
              <MenuItem
                icon={<Trash2 size={14} strokeWidth={1.75} />}
                label="Delete"
                danger
                onClick={() => {
                  setMenuOpen(false)
                  setDeleteOpen(true)
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Rename template</DialogTitle>
            <DialogDescription>
              Updates the name in your library. Existing emails made from this
              template are unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="px-1 pb-2">
            <InputGroup className="w-full">
              <InputField
                index={0}
                label="Name"
                value={name}
                onChange={setName}
                placeholder="Welcome series"
              />
            </InputGroup>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" type="button" disabled={busy}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={busy || !name.trim()}
              onClick={() => void submitRename()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Delete template?</DialogTitle>
            <DialogDescription>
              “{template.name}” will be removed from your library. Emails already
              created from it are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" type="button" disabled={busy}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void submitDelete()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
  asLink,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  danger?: boolean
  asLink?: { to: "/email-editor"; search: { templateId: string } }
}) {
  const className = cn(
    "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] outline-none transition-colors duration-80",
    "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
    danger
      ? "text-red-600 hover:bg-red-500/10"
      : "text-foreground hover:bg-muted/70"
  )

  if (asLink) {
    return (
      <Link
        role="menuitem"
        to={asLink.to}
        search={asLink.search}
        className={className}
        onClick={onClick}
      >
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </Link>
    )
  }

  return (
    <button type="button" role="menuitem" className={className} onClick={onClick}>
      <span className={danger ? undefined : "text-muted-foreground"}>{icon}</span>
      {label}
    </button>
  )
}
