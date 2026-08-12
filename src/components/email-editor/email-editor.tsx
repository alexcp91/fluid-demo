import { useEffect, useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import {
  Monitor,
  Smartphone,
  Save,
  Download,
  Eye,
  Braces,
  Copy,
  Check,
  Code2,
  Redo2,
  Undo2,
  LayoutTemplate,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabItem, TabPanel } from "@/components/ui/tabs"
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
import { SizeProvider } from "@/lib/size-context"
import { exportToHtml } from "@/email/export-html"
import { EmailDocumentSchema } from "@/email/schema"
import {
  useCanRedo,
  useCanUndo,
  useEmailStore,
  useSelectedBlock,
} from "@/email/store"
import type { DeviceMode } from "@/email/schema"
import { EmailCanvas } from "./canvas"
import { EmailSidePanel } from "./side-panel"
import { LayersPanel } from "./layers-panel"

function downloadHtml(filename: string, html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function safeFilename(subject: string, id: string, ext: string) {
  const safe = subject
    .replace(/[^\w\-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)
  return `${safe || id}.${ext}`
}

export function EmailEditor({
  emailId,
  templateId,
}: {
  emailId?: string
  templateId?: string
}) {
  const doc = useEmailStore((s) => s.doc)
  const templateName = useEmailStore((s) => s.templateName)
  const resourceKind = useEmailStore((s) => s.resourceKind)
  const device = useEmailStore((s) => s.device)
  const dirty = useEmailStore((s) => s.dirty)
  const saveStatus = useEmailStore((s) => s.saveStatus)
  const loadError = useEmailStore((s) => s.loadError)
  const setDevice = useEmailStore((s) => s.setDevice)
  const load = useEmailStore((s) => s.load)
  const save = useEmailStore((s) => s.save)
  const saveAsTemplate = useEmailStore((s) => s.saveAsTemplate)
  const undo = useEmailStore((s) => s.undo)
  const redo = useEmailStore((s) => s.redo)
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const selectedBlock = useSelectedBlock()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewTab, setPreviewTab] = useState("preview")
  const [jsonOpen, setJsonOpen] = useState(false)
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [templateNameDraft, setTemplateNameDraft] = useState("")
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<"json" | "html" | null>(null)

  const editingTemplate = Boolean(templateId) || resourceKind === "template"

  useEffect(() => {
    if (templateId) {
      void load(templateId, "template").catch(() => {
        /* loadError is set on the store */
      })
      return
    }
    void load(emailId ?? "welcome", "email").catch(() => {
      /* loadError is set on the store */
    })
  }, [load, emailId, templateId])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      const editing =
        Boolean(target?.isContentEditable) ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT"
      if (editing) return
      const key = e.key.toLowerCase()
      if (key === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [undo, redo])

  const previewHtml = useMemo(
    () => (previewOpen ? exportToHtml(doc) : ""),
    [previewOpen, doc]
  )

  const jsonText = useMemo(
    () => (jsonOpen ? JSON.stringify(doc, null, 2) : ""),
    [jsonOpen, doc]
  )

  const jsonValid = useMemo(() => {
    if (!jsonOpen) return true
    return EmailDocumentSchema.safeParse(doc).success
  }, [jsonOpen, doc])

  async function copyText(text: string, kind: "json" | "html") {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 1600)
    } catch {
      /* clipboard may be unavailable */
    }
  }

  async function handleSave() {
    setBusy(true)
    try {
      await save()
    } catch {
      /* saveStatus error on store */
    } finally {
      setBusy(false)
    }
  }

  function openSaveAsTemplate() {
    setTemplateNameDraft(doc.meta.subject || "Untitled template")
    setSavedTemplateId(null)
    setSaveTemplateOpen(true)
  }

  async function handleSaveAsTemplate() {
    setBusy(true)
    try {
      const saved = await saveAsTemplate(templateNameDraft)
      setSavedTemplateId(saved.id)
    } catch {
      /* leave dialog open on failure */
    } finally {
      setBusy(false)
    }
  }

  function handleExport() {
    const html = exportToHtml(doc)
    downloadHtml(safeFilename(doc.meta.subject, doc.id, "html"), html)
  }

  const title =
    editingTemplate && templateName ? templateName : doc.meta.subject

  const saveLabel =
    saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "saved" && !dirty
        ? "Saved"
        : saveStatus === "error"
          ? "Retry save"
          : editingTemplate
            ? "Save template"
            : "Save"

  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            {editingTemplate ? (
              <Tooltip content="Back to templates">
                <Button
                  asChild
                  variant="ghost"
                  size="icon-compact"
                  aria-label="Back to templates"
                >
                  <Link to="/email-templates">
                    <ArrowLeft size={15} strokeWidth={1.75} />
                  </Link>
                </Button>
              </Tooltip>
            ) : null}
            <h1 className="truncate text-subtitle font-medium tracking-tight">
              {title}
            </h1>
            <Badge
              variant="dot"
              color={editingTemplate ? "blue" : dirty ? "yellow" : "green"}
            >
              {editingTemplate
                ? dirty
                  ? "Template · Unsaved"
                  : "Template"
                : dirty
                  ? "Unsaved"
                  : "Draft"}
            </Badge>
          </div>
          <p className="truncate text-caption text-muted-foreground">
            {loadError
              ? `Load error · ${loadError}`
              : selectedBlock
                ? `Selected · ${selectedBlock.type}`
                : editingTemplate
                  ? "Editing saved template — save updates future uses"
                  : "Select a layer or add a block"}
          </p>
        </div>

        <SizeProvider size="compact">
          <div className="flex items-center gap-1.5">
            <Tooltip content="Undo (⌘Z)">
              <Button
                type="button"
                variant="ghost"
                size="icon-compact"
                aria-label="Undo"
                disabled={!canUndo}
                onClick={() => undo()}
              >
                <Undo2 size={15} strokeWidth={1.75} />
              </Button>
            </Tooltip>
            <Tooltip content="Redo (⇧⌘Z)">
              <Button
                type="button"
                variant="ghost"
                size="icon-compact"
                aria-label="Redo"
                disabled={!canRedo}
                onClick={() => redo()}
              >
                <Redo2 size={15} strokeWidth={1.75} />
              </Button>
            </Tooltip>
            <Tabs
              value={device}
              onValueChange={(v) => setDevice(v as DeviceMode)}
            >
              <TabsList>
                <TabItem value="desktop" label="Desktop" icon={Monitor} />
                <TabItem value="mobile" label="Mobile" icon={Smartphone} />
              </TabsList>
            </Tabs>
          </div>
        </SizeProvider>

        <div className="flex shrink-0 items-center gap-2">
          {!editingTemplate ? (
            <Tooltip content="Save current design as a reusable template">
              <Button
                variant="secondary"
                leadingIcon={LayoutTemplate}
                disabled={busy}
                onClick={openSaveAsTemplate}
              >
                Save as template
              </Button>
            </Tooltip>
          ) : null}
          <Tooltip
            content={
              editingTemplate
                ? "Update this template for future emails"
                : "Save document JSON"
            }
          >
            <Button
              variant="secondary"
              leadingIcon={Save}
              disabled={!dirty || busy || saveStatus === "saving"}
              onClick={() => void handleSave()}
            >
              {saveLabel}
            </Button>
          </Tooltip>
          <Tooltip content="Inspect EmailDocument JSON">
            <Button
              variant="secondary"
              leadingIcon={Braces}
              onClick={() => setJsonOpen(true)}
            >
              JSON
            </Button>
          </Tooltip>
          <Tooltip content="Download email HTML">
            <Button
              variant="secondary"
              leadingIcon={Download}
              onClick={handleExport}
            >
              Export HTML
            </Button>
          </Tooltip>
          <Button leadingIcon={Eye} onClick={() => setPreviewOpen(true)}>
            Preview
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <LayersPanel />
        <EmailCanvas />
        <EmailSidePanel />
      </div>

      <Dialog
        open={saveTemplateOpen}
        onOpenChange={(open) => {
          setSaveTemplateOpen(open)
          if (!open) setSavedTemplateId(null)
        }}
      >
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              {savedTemplateId ? "Template saved" : "Save as template"}
            </DialogTitle>
            <DialogDescription>
              {savedTemplateId
                ? "It’s in your Email templates library. You can edit the design anytime from there."
                : "Adds this design to My Templates so you can reuse and update it later."}
            </DialogDescription>
          </DialogHeader>
          {savedTemplateId ? null : (
            <div className="px-1 pb-2">
              <InputGroup className="w-full">
                <InputField
                  index={0}
                  label="Template name"
                  value={templateNameDraft}
                  onChange={setTemplateNameDraft}
                  placeholder="Welcome series"
                />
              </InputGroup>
            </div>
          )}
          <DialogFooter>
            {savedTemplateId ? (
              <>
                <DialogClose asChild>
                  <Button variant="ghost" type="button">
                    Keep editing
                  </Button>
                </DialogClose>
                <Button asChild>
                  <Link to="/email-templates">View templates</Link>
                </Button>
              </>
            ) : (
              <>
                <DialogClose asChild>
                  <Button variant="ghost" type="button" disabled={busy}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  disabled={busy || !templateNameDraft.trim()}
                  onClick={() => void handleSaveAsTemplate()}
                >
                  {busy ? "Saving…" : "Save template"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open)
          if (!open) setPreviewTab("preview")
        }}
      >
        <DialogContent size="lg" className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Email preview</DialogTitle>
            <DialogDescription>
              Compiled HTML from the current document — same output as Export.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={previewTab} onValueChange={setPreviewTab}>
            <TabsList>
              <TabItem value="preview" label="Preview" icon={Eye} />
              <TabItem value="html" label="HTML" icon={Code2} />
            </TabsList>

            <TabPanel value="preview" className="pt-3">
              <div className="overflow-hidden rounded-lg border border-border bg-muted/40">
                <iframe
                  title="Email HTML preview"
                  srcDoc={previewHtml}
                  className="h-[60vh] w-full bg-white"
                  sandbox=""
                />
              </div>
            </TabPanel>

            <TabPanel value="html" className="pt-3">
              <pre className="h-[60vh] overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-[12px] leading-relaxed text-foreground">
                {previewHtml}
              </pre>
            </TabPanel>
          </Tabs>

          <DialogFooter>
            <Button
              variant="secondary"
              leadingIcon={copied === "html" ? Check : Copy}
              onClick={() => void copyText(previewHtml, "html")}
              disabled={!previewHtml}
            >
              {copied === "html" ? "Copied" : "Copy HTML"}
            </Button>
            <Button
              variant="secondary"
              leadingIcon={Download}
              onClick={() =>
                downloadHtml(
                  safeFilename(doc.meta.subject, doc.id, "html"),
                  previewHtml
                )
              }
              disabled={!previewHtml}
            >
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={jsonOpen} onOpenChange={setJsonOpen}>
        <DialogContent size="lg" className="max-w-3xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>Document JSON</DialogTitle>
              <Badge variant="dot" color={jsonValid ? "green" : "red"}>
                {jsonValid ? "Schema valid" : "Invalid"}
              </Badge>
            </div>
            <DialogDescription>
              Read-only EmailDocument from the editor store.
            </DialogDescription>
          </DialogHeader>

          <pre className="h-[60vh] overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-[12px] leading-relaxed text-foreground">
            {jsonText}
          </pre>

          <DialogFooter>
            <Button
              variant="secondary"
              leadingIcon={copied === "json" ? Check : Copy}
              onClick={() => void copyText(jsonText, "json")}
              disabled={!jsonText}
            >
              {copied === "json" ? "Copied" : "Copy JSON"}
            </Button>
            <Button
              variant="secondary"
              leadingIcon={Download}
              onClick={() =>
                downloadText(
                  safeFilename(doc.meta.subject, doc.id, "json"),
                  jsonText,
                  "application/json;charset=utf-8"
                )
              }
              disabled={!jsonText}
            >
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
