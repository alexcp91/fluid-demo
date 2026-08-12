import { useEffect, useState, type ReactNode } from "react"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Droplet,
  Eye,
  EyeOff,
  LayoutTemplate,
  Link2,
  Maximize2,
  Square,
  Type,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabItem, TabPanel } from "@/components/ui/tabs"
import { SizeProvider } from "@/lib/size-context"
import { useEmailStore, useSelectedBlock } from "@/email/store"
import {
  BoolChip,
  CompactField,
  IconToggleGroup,
  InspectorFields,
  InspectorSection,
  PropRow,
  SegmentGroup,
} from "./inspector-controls"
import {
  BLOCK_LABELS,
  type Align,
  type BlockBg,
  type BlockChrome,
  type ButtonStyle,
  type EmailBlock,
  type EmailDocument,
  type ImageFit,
  type Spacing,
} from "./types"

function plainText(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ")
}

function charHint(value: string, softMax: number) {
  return `${value.length}/${softMax}`
}

const ALIGN_OPTIONS = [
  { value: "left" as const, icon: AlignLeft, title: "Align left" },
  { value: "center" as const, icon: AlignCenter, title: "Align center" },
  { value: "right" as const, icon: AlignRight, title: "Align right" },
]

const PADDING_OPTIONS = [
  { value: "none" as const, label: "0" },
  { value: "sm" as const, label: "S" },
  { value: "md" as const, label: "M" },
  { value: "lg" as const, label: "L" },
]

const BG_OPTIONS = [
  { value: "none" as const, label: "None" },
  { value: "muted" as const, label: "Muted" },
  { value: "accent" as const, label: "Accent" },
]

function VisibilityRow({
  visible,
  onChange,
}: {
  visible: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <PropRow label="Visibility">
      <IconToggleGroup
        value={visible ? "show" : "hide"}
        onChange={(v) => onChange(v === "show")}
        options={[
          { value: "show", icon: Eye, title: "Visible" },
          { value: "hide", icon: EyeOff, title: "Hidden" },
        ]}
      />
    </PropRow>
  )
}

function LayoutRows({
  chrome,
  onPatch,
  extra,
}: {
  chrome: BlockChrome
  onPatch: (patch: Partial<BlockChrome>) => void
  extra?: ReactNode
}) {
  return (
    <>
      <PropRow label="Align">
        <IconToggleGroup
          value={chrome.align}
          onChange={(align) => onPatch({ align: align as Align })}
          options={ALIGN_OPTIONS}
        />
      </PropRow>
      <PropRow label="Padding">
        <SegmentGroup
          value={chrome.padding}
          onChange={(padding) => onPatch({ padding: padding as Spacing })}
          options={PADDING_OPTIONS}
        />
      </PropRow>
      {extra}
    </>
  )
}

function AppearanceRows({
  chrome,
  onPatch,
  extra,
}: {
  chrome: BlockChrome
  onPatch: (patch: Partial<BlockChrome>) => void
  extra?: ReactNode
}) {
  return (
    <>
      <PropRow label="Fill">
        <SegmentGroup
          value={chrome.background}
          onChange={(background) =>
            onPatch({ background: background as BlockBg })
          }
          options={BG_OPTIONS}
        />
      </PropRow>
      {extra}
    </>
  )
}

function EmailSettings() {
  const meta = useEmailStore((s) => s.doc.meta)
  const setMeta = useEmailStore((s) => s.setMeta)
  const blockCount = useEmailStore((s) => s.doc.blocks.length)

  return (
    <div className="flex flex-col">
      <InspectorSection
        title="Message"
        icon={Type}
        hint={charHint(meta.subject, 90)}
      >
        <InspectorFields>
          <CompactField
            index={0}
            label="Subject"
            value={meta.subject}
            onChange={(subject) => setMeta({ subject })}
            placeholder="Subject line"
          />
          <CompactField
            index={1}
            label="Preview"
            value={meta.previewText}
            onChange={(previewText) => setMeta({ previewText })}
            placeholder="Preview text"
            hint="Shows under the subject in most inboxes."
          />
          <CompactField
            index={2}
            label="From"
            value={meta.fromName ?? ""}
            onChange={(fromName) => setMeta({ fromName })}
            placeholder="From name"
          />
        </InspectorFields>
      </InspectorSection>

      <InspectorSection
        title="Canvas"
        icon={LayoutTemplate}
        hint={`${blockCount} blocks`}
      >
        <PropRow label="Width">
          <SegmentGroup
            value={meta.width}
            onChange={(width) =>
              setMeta({ width: width as EmailDocument["meta"]["width"] })
            }
            options={[
              { value: "600", label: "600" },
              { value: "640", label: "640" },
              { value: "720", label: "720" },
            ]}
          />
        </PropRow>
      </InspectorSection>

      <InspectorSection title="Inbox" icon={Eye}>
        <PropRow label="Preheader">
          <BoolChip
            label={meta.showPreheader ? "On" : "Off"}
            checked={meta.showPreheader}
            onChange={(showPreheader) => setMeta({ showPreheader })}
            icon={meta.showPreheader ? Eye : EyeOff}
          />
        </PropRow>
      </InspectorSection>
    </div>
  )
}

function HeaderCustomize({
  block,
}: {
  block: Extract<EmailBlock, { type: "header" }>
}) {
  const updateBlock = useEmailStore((s) => s.updateBlock)
  return (
    <div className="flex flex-col">
      <InspectorSection title="Content" icon={Type}>
        <InspectorFields>
          <CompactField
            index={0}
            label="Brand"
            value={block.brand}
            onChange={(brand) => updateBlock(block.id, { brand })}
          />
          <CompactField
            index={1}
            label="Tagline"
            value={block.tagline}
            onChange={(tagline) => updateBlock(block.id, { tagline })}
          />
        </InspectorFields>
      </InspectorSection>
      <InspectorSection title="Logo" icon={Square}>
        <PropRow label="Mark">
          <BoolChip
            label={block.showLogo ? "Shown" : "Hidden"}
            checked={block.showLogo}
            onChange={(showLogo) => updateBlock(block.id, { showLogo })}
            icon={block.showLogo ? Eye : EyeOff}
          />
        </PropRow>
      </InspectorSection>
      <InspectorSection title="Layer" icon={Eye}>
        <VisibilityRow
          visible={block.chrome.visible}
          onChange={(visible) =>
            updateBlock(block.id, {
              chrome: { ...block.chrome, visible },
            })
          }
        />
      </InspectorSection>
    </div>
  )
}

function HeadingCustomize({
  block,
}: {
  block: Extract<EmailBlock, { type: "heading" }>
}) {
  const updateBlock = useEmailStore((s) => s.updateBlock)
  return (
    <div className="flex flex-col">
      <InspectorSection title="Content" icon={Type}>
        <InspectorFields>
          <CompactField
            index={0}
            label="Heading"
            value={plainText(block.text)}
            onChange={(text) => updateBlock(block.id, { text })}
            hint="Rich formatting stays on the canvas toolbar."
          />
        </InspectorFields>
      </InspectorSection>
      <InspectorSection title="Layer" icon={Eye}>
        <VisibilityRow
          visible={block.chrome.visible}
          onChange={(visible) =>
            updateBlock(block.id, {
              chrome: { ...block.chrome, visible },
            })
          }
        />
      </InspectorSection>
    </div>
  )
}

function ParagraphCustomize({
  block,
}: {
  block: Extract<EmailBlock, { type: "paragraph" }>
}) {
  const updateBlock = useEmailStore((s) => s.updateBlock)
  return (
    <div className="flex flex-col">
      <InspectorSection title="Content" icon={Type}>
        <InspectorFields>
          <CompactField
            index={0}
            label="Body"
            value={plainText(block.text)}
            onChange={(text) => updateBlock(block.id, { text })}
          />
        </InspectorFields>
      </InspectorSection>
      <InspectorSection title="Layer" icon={Eye}>
        <VisibilityRow
          visible={block.chrome.visible}
          onChange={(visible) =>
            updateBlock(block.id, {
              chrome: { ...block.chrome, visible },
            })
          }
        />
      </InspectorSection>
    </div>
  )
}

function ButtonCustomize({
  block,
}: {
  block: Extract<EmailBlock, { type: "button" }>
}) {
  const updateBlock = useEmailStore((s) => s.updateBlock)
  return (
    <div className="flex flex-col">
      <InspectorSection title="Content" icon={Type}>
        <InspectorFields>
          <CompactField
            index={0}
            label="Label"
            value={plainText(block.label)}
            onChange={(label) => updateBlock(block.id, { label })}
          />
        </InspectorFields>
      </InspectorSection>
      <InspectorSection title="Link" icon={Link2}>
        <InspectorFields>
          <CompactField
            index={0}
            label="URL"
            icon={Link2}
            value={block.url}
            onChange={(url) => updateBlock(block.id, { url })}
            placeholder="https://"
          />
        </InspectorFields>
      </InspectorSection>
      <InspectorSection title="Layer" icon={Eye}>
        <VisibilityRow
          visible={block.chrome.visible}
          onChange={(visible) =>
            updateBlock(block.id, {
              chrome: { ...block.chrome, visible },
            })
          }
        />
      </InspectorSection>
    </div>
  )
}

function ImageCustomize({
  block,
}: {
  block: Extract<EmailBlock, { type: "image" }>
}) {
  const updateBlock = useEmailStore((s) => s.updateBlock)
  return (
    <div className="flex flex-col">
      <InspectorSection title="Content" icon={Type}>
        <InspectorFields>
          <CompactField
            index={0}
            label="Alt"
            value={block.alt}
            onChange={(alt) => updateBlock(block.id, { alt })}
            placeholder="Alt text"
          />
          <CompactField
            index={1}
            label="Caption"
            value={block.caption}
            onChange={(caption) => updateBlock(block.id, { caption })}
          />
        </InspectorFields>
      </InspectorSection>
      <InspectorSection title="Link" icon={Link2}>
        <InspectorFields>
          <CompactField
            index={0}
            label="URL"
            icon={Link2}
            value={block.href}
            onChange={(href) => updateBlock(block.id, { href })}
            placeholder="Click-through URL"
            hint="Empty = non-linked image."
          />
        </InspectorFields>
      </InspectorSection>
      <InspectorSection title="Layer" icon={Eye}>
        <VisibilityRow
          visible={block.chrome.visible}
          onChange={(visible) =>
            updateBlock(block.id, {
              chrome: { ...block.chrome, visible },
            })
          }
        />
      </InspectorSection>
    </div>
  )
}

function FooterCustomize({
  block,
}: {
  block: Extract<EmailBlock, { type: "footer" }>
}) {
  const updateBlock = useEmailStore((s) => s.updateBlock)
  return (
    <div className="flex flex-col">
      <InspectorSection title="Content" icon={Type}>
        <InspectorFields>
          <CompactField
            index={0}
            label="Company"
            value={block.company}
            onChange={(company) => updateBlock(block.id, { company })}
          />
          <CompactField
            index={1}
            label="Address"
            value={block.address}
            onChange={(address) => updateBlock(block.id, { address })}
          />
        </InspectorFields>
      </InspectorSection>
      <InspectorSection title="Links" icon={Link2}>
        <PropRow label="Unsub">
          <BoolChip
            label={block.showUnsubscribe ? "On" : "Off"}
            checked={block.showUnsubscribe}
            onChange={(showUnsubscribe) =>
              updateBlock(block.id, { showUnsubscribe })
            }
          />
        </PropRow>
        <PropRow label="Social">
          <BoolChip
            label={block.showSocial ? "On" : "Off"}
            checked={block.showSocial}
            onChange={(showSocial) => updateBlock(block.id, { showSocial })}
          />
        </PropRow>
      </InspectorSection>
      <InspectorSection title="Layer" icon={Eye}>
        <VisibilityRow
          visible={block.chrome.visible}
          onChange={(visible) =>
            updateBlock(block.id, {
              chrome: { ...block.chrome, visible },
            })
          }
        />
      </InspectorSection>
    </div>
  )
}

function CustomizePanel({ block }: { block: EmailBlock }) {
  switch (block.type) {
    case "header":
      return <HeaderCustomize block={block} />
    case "heading":
      return <HeadingCustomize block={block} />
    case "paragraph":
      return <ParagraphCustomize block={block} />
    case "button":
      return <ButtonCustomize block={block} />
    case "image":
      return <ImageCustomize block={block} />
    case "footer":
      return <FooterCustomize block={block} />
    case "frame":
      return <FrameCustomize block={block} />
  }
}

function FrameCustomize({
  block,
}: {
  block: Extract<EmailBlock, { type: "frame" }>
}) {
  const updateBlock = useEmailStore((s) => s.updateBlock)
  const insertIntoFrame = useEmailStore((s) => s.insertIntoFrame)

  return (
    <div className="flex flex-col gap-1">
      <InspectorSection title="Layout" icon={LayoutTemplate}>
        <PropRow label="Direction">
          <SegmentGroup
            value={block.direction}
            onChange={(direction) =>
              updateBlock(block.id, {
                direction: direction as "row" | "column",
              })
            }
            options={[
              { value: "row", label: "Row" },
              { value: "column", label: "Col" },
            ]}
          />
        </PropRow>
        <PropRow label="Gap">
          <SegmentGroup
            value={block.gap}
            onChange={(gap) =>
              updateBlock(block.id, { gap: gap as Spacing })
            }
            options={PADDING_OPTIONS}
          />
        </PropRow>
        <PropRow label="Children">
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {block.children.length}
          </span>
        </PropRow>
      </InspectorSection>
      <InspectorSection title="Quick add" icon={Type} defaultOpen={false}>
        <div className="flex flex-wrap gap-1 px-0.5 pb-1">
          {(["heading", "paragraph", "image", "button"] as const).map(
            (type) => (
              <button
                key={type}
                type="button"
                onClick={() => insertIntoFrame(block.id, type)}
                className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                + {BLOCK_LABELS[type]}
              </button>
            )
          )}
        </div>
      </InspectorSection>
      <InspectorSection title="Layer" icon={Eye}>
        <VisibilityRow
          visible={block.chrome.visible}
          onChange={(visible) =>
            updateBlock(block.id, {
              chrome: { ...block.chrome, visible },
            })
          }
        />
      </InspectorSection>
    </div>
  )
}

function StylePanel({ block }: { block: EmailBlock }) {
  const updateBlock = useEmailStore((s) => s.updateBlock)
  const chrome = block.chrome

  function patchChrome(patch: Partial<BlockChrome>) {
    updateBlock(block.id, { chrome: { ...chrome, ...patch } })
  }

  let layoutExtra: ReactNode = null
  let appearanceExtra: ReactNode = null

  if (block.type === "button") {
    layoutExtra = (
      <PropRow label="Width">
        <SegmentGroup
          value={block.fullWidth ? "max" : "auto"}
          onChange={(v) => updateBlock(block.id, { fullWidth: v === "max" })}
          options={[
            { value: "auto", label: "AUTO" },
            { value: "max", label: "MAX", icon: Maximize2 },
          ]}
        />
      </PropRow>
    )
    appearanceExtra = (
      <PropRow label="Variant">
        <SegmentGroup
          value={block.style}
          onChange={(style) =>
            updateBlock(block.id, { style: style as ButtonStyle })
          }
          options={[
            { value: "filled", label: "Fill" },
            { value: "outline", label: "Line" },
            { value: "text", label: "Text" },
          ]}
        />
      </PropRow>
    )
  }

  if (block.type === "heading") {
    appearanceExtra = (
      <PropRow label="Size">
        <SegmentGroup
          value={block.size}
          onChange={(size) =>
            updateBlock(block.id, { size: size as "sm" | "md" | "lg" })
          }
          options={[
            { value: "sm", label: "S" },
            { value: "md", label: "M" },
            { value: "lg", label: "L" },
          ]}
        />
      </PropRow>
    )
  }

  if (block.type === "paragraph") {
    appearanceExtra = (
      <PropRow label="Color">
        <BoolChip
          label={block.muted ? "Muted" : "Default"}
          checked={block.muted}
          onChange={(muted) => updateBlock(block.id, { muted })}
          icon={Droplet}
        />
      </PropRow>
    )
  }

  if (block.type === "image") {
    appearanceExtra = (
      <>
        <PropRow label="Fit">
          <SegmentGroup
            value={block.fit}
            onChange={(fit) =>
              updateBlock(block.id, { fit: fit as ImageFit })
            }
            options={[
              { value: "cover", label: "Cover" },
              { value: "contain", label: "Contain" },
            ]}
          />
        </PropRow>
        <PropRow label="Corners">
          <BoolChip
            label={block.rounded ? "Round" : "Square"}
            checked={block.rounded}
            onChange={(rounded) => updateBlock(block.id, { rounded })}
            icon={Square}
          />
        </PropRow>
      </>
    )
  }

  if (block.type === "header") {
    appearanceExtra = (
      <PropRow label="Logo">
        <BoolChip
          label={block.showLogo ? "On" : "Off"}
          checked={block.showLogo}
          onChange={(showLogo) => updateBlock(block.id, { showLogo })}
          icon={block.showLogo ? Eye : EyeOff}
        />
      </PropRow>
    )
  }

  return (
    <div className="flex flex-col">
      <InspectorSection title="Layer" icon={Eye} defaultOpen>
        <VisibilityRow
          visible={chrome.visible}
          onChange={(visible) => patchChrome({ visible })}
        />
      </InspectorSection>
      <InspectorSection title="Layout" icon={LayoutTemplate}>
        <LayoutRows chrome={chrome} onPatch={patchChrome} extra={layoutExtra} />
      </InspectorSection>
      <InspectorSection title="Appearance" icon={Droplet}>
        <AppearanceRows
          chrome={chrome}
          onPatch={patchChrome}
          extra={appearanceExtra}
        />
      </InspectorSection>
    </div>
  )
}

export function EmailSidePanel() {
  const [tab, setTab] = useState("customize")
  const block = useSelectedBlock()
  const selectedId = useEmailStore((s) => s.selectedId)

  useEffect(() => {
    setTab("customize")
  }, [selectedId])

  const title = block ? BLOCK_LABELS[block.type] : "Document"

  return (
    <SizeProvider size="compact">
      <aside className="flex h-full w-[18.5rem] shrink-0 flex-col overflow-auto border-l border-border bg-card">
        <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <h2 className="min-w-0 flex-1 truncate text-body font-medium tracking-tight">
            {title}
          </h2>
          <Badge variant="dot" color="gray" title={block?.id}>
            {block ? block.type : "email"}
          </Badge>
        </header>

        <div className="flex flex-1 flex-col px-3 py-2.5">
          {!block ? (
            <EmailSettings />
          ) : (
            <Tabs value={tab} onValueChange={setTab} size="compact">
              <TabsList className="w-full">
                <TabItem
                  value="customize"
                  label="Customize"
                  className="min-w-0 flex-1 justify-center"
                />
                <TabItem
                  value="style"
                  label="Edit styles"
                  className="min-w-0 flex-1 justify-center"
                />
              </TabsList>
              <TabPanel value="customize" className="pt-2.5">
                <CustomizePanel block={block} />
              </TabPanel>
              <TabPanel value="style" className="pt-2.5">
                <StylePanel block={block} />
              </TabPanel>
            </Tabs>
          )}
        </div>
      </aside>
    </SizeProvider>
  )
}
