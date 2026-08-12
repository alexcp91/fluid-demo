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
  Type,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabItem, TabPanel } from "@/components/ui/tabs"
import { SizeProvider } from "@/lib/size-context"
import { useEmailStore, useSelectedNode } from "@/email/store"
import type {
  Align,
  BlockBg,
  BlockChrome,
  EmailNode,
  ImageFit,
  Spacing,
  VAlign,
} from "@/email/schema"
import {
  BoolChip,
  CompactField,
  IconToggleGroup,
  InspectorFields,
  InspectorSection,
  PropRow,
  SegmentGroup,
} from "./inspector-controls"
import { BLOCK_LABELS, BLOCK_TYPES, nodeLabel } from "./types"

const SPACING_OPTIONS = [
  { value: "none", label: "0" },
  { value: "sm", label: "S" },
  { value: "md", label: "M" },
  { value: "lg", label: "L" },
]

function VisibilityRow({
  visible,
  onChange,
}: {
  visible: boolean
  onChange: (visible: boolean) => void
}) {
  return (
    <PropRow label="Visibility">
      <BoolChip
        label={visible ? "Shown" : "Hidden"}
        checked={visible}
        onChange={onChange}
        icon={visible ? Eye : EyeOff}
      />
    </PropRow>
  )
}

function ChromeInspector({
  chrome,
  onPatch,
}: {
  chrome: BlockChrome
  onPatch: (patch: Partial<BlockChrome>) => void
}) {
  return (
    <>
      <InspectorSection title="Layout" icon={LayoutTemplate}>
        <PropRow label="Align">
          <IconToggleGroup
            value={chrome.align}
            onChange={(align) => onPatch({ align: align as Align })}
            options={[
              { value: "left", icon: AlignLeft, title: "Align left" },
              { value: "center", icon: AlignCenter, title: "Align center" },
              { value: "right", icon: AlignRight, title: "Align right" },
            ]}
          />
        </PropRow>
        <PropRow label="Padding">
          <SegmentGroup
            value={chrome.padding}
            onChange={(padding) => onPatch({ padding: padding as Spacing })}
            options={SPACING_OPTIONS}
          />
        </PropRow>
      </InspectorSection>
      <InspectorSection title="Appearance" icon={Droplet}>
        <PropRow label="Fill">
          <SegmentGroup
            value={chrome.background}
            onChange={(background) =>
              onPatch({ background: background as BlockBg })
            }
            options={[
              { value: "none", label: "None" },
              { value: "muted", label: "Muted" },
              { value: "accent", label: "Accent" },
            ]}
          />
        </PropRow>
        <VisibilityRow
          visible={chrome.visible}
          onChange={(visible) => onPatch({ visible })}
        />
      </InspectorSection>
    </>
  )
}

function EmailSettings() {
  const doc = useEmailStore((state) => state.doc)
  const setMeta = useEmailStore((state) => state.setMeta)
  const blockCount = Math.max(0, Object.keys(doc.nodes).length - 1)

  return (
    <div className="flex flex-col">
      <InspectorSection title="Message" icon={Type}>
        <InspectorFields>
          <CompactField
            index={0}
            label="Subject"
            value={doc.meta.subject}
            onChange={(subject) => setMeta({ subject })}
          />
          <CompactField
            index={1}
            label="Preview"
            value={doc.meta.previewText}
            onChange={(previewText) => setMeta({ previewText })}
          />
          <CompactField
            index={2}
            label="From"
            value={doc.meta.fromName ?? ""}
            onChange={(fromName) => setMeta({ fromName })}
          />
        </InspectorFields>
      </InspectorSection>
      <InspectorSection
        title="Canvas"
        icon={LayoutTemplate}
        hint={`${blockCount} nodes`}
      >
        <PropRow label="Width">
          <SegmentGroup
            value={doc.meta.width}
            onChange={(width) =>
              setMeta({ width: width as typeof doc.meta.width })
            }
            options={[
              { value: "600", label: "600" },
              { value: "640", label: "640" },
              { value: "720", label: "720" },
            ]}
          />
        </PropRow>
        <VisibilityRow
          visible={doc.meta.showPreheader}
          onChange={(showPreheader) => setMeta({ showPreheader })}
        />
      </InspectorSection>
    </div>
  )
}

function StructureInspector({ node }: { node: EmailNode }) {
  const updateNode = useEmailStore((state) => state.updateNode)
  const insertLeaf = useEmailStore((state) => state.insertLeaf)
  const insertRow = useEmailStore((state) => state.insertRow)

  if (node.type === "row") {
    return (
      <InspectorSection title="Row" icon={LayoutTemplate}>
        <PropRow label="Gap">
          <SegmentGroup
            value={node.gap}
            onChange={(gap) =>
              updateNode(node.id, node.type, { gap: gap as Spacing })
            }
            options={SPACING_OPTIONS}
          />
        </PropRow>
        <PropRow label="Mobile">
          <BoolChip
            label={node.stackOnMobile ? "Stack" : "Keep row"}
            checked={node.stackOnMobile}
            onChange={(stackOnMobile) =>
              updateNode(node.id, node.type, { stackOnMobile })
            }
            icon={LayoutTemplate}
          />
        </PropRow>
      </InspectorSection>
    )
  }

  if (node.type === "column") {
    return (
      <>
        <InspectorSection title="Column" icon={LayoutTemplate}>
          <PropRow label="Vertical">
            <SegmentGroup
              value={node.vAlign}
              onChange={(vAlign) =>
                updateNode(node.id, node.type, { vAlign: vAlign as VAlign })
              }
              options={[
                { value: "top", label: "Top" },
                { value: "middle", label: "Mid" },
                { value: "bottom", label: "Bottom" },
              ]}
            />
          </PropRow>
          <PropRow label="Flex">
            <SegmentGroup
              value={String(node.flex)}
              onChange={(flex) =>
                updateNode(node.id, node.type, { flex: Number(flex) })
              }
              options={[
                { value: "1", label: "1×" },
                { value: "2", label: "2×" },
                { value: "3", label: "3×" },
              ]}
            />
          </PropRow>
        </InspectorSection>
        <InspectorSection title="Quick add" icon={Type} defaultOpen={false}>
          <div className="grid grid-cols-2 gap-1">
            {BLOCK_TYPES.map((type) => (
              <Button
                key={type}
                type="button"
                variant="ghost"
                className="justify-start"
                onClick={() => insertLeaf(type, node.id)}
              >
                + {BLOCK_LABELS[type]}
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              className="col-span-2 justify-start"
              onClick={() => insertRow(2, node.id)}
            >
              + 2-column row
            </Button>
          </div>
        </InspectorSection>
      </>
    )
  }

  return null
}

function ContentInspector({ node }: { node: EmailNode }) {
  const updateNode = useEmailStore((state) => state.updateNode)
  const setText = useEmailStore((state) => state.setText)

  if (node.type === "body" || node.type === "row" || node.type === "column")
    return <StructureInspector node={node} />

  let fields: ReactNode = null

  if (node.type === "header") {
    fields = (
      <>
        <CompactField
          index={0}
          label="Brand"
          value={node.brand}
          onChange={(brand) => updateNode(node.id, node.type, { brand })}
        />
        <CompactField
          index={1}
          label="Tagline"
          value={node.tagline}
          onChange={(tagline) => updateNode(node.id, node.type, { tagline })}
        />
      </>
    )
  } else if (node.type === "heading" || node.type === "paragraph") {
    fields = (
      <CompactField
        index={0}
        label={node.type === "heading" ? "Heading" : "Body"}
        value={node.text.replace(/<[^>]+>/g, "")}
        onChange={(text) => setText(node.id, text)}
      />
    )
  } else if (node.type === "button") {
    fields = (
      <>
        <CompactField
          index={0}
          label="Label"
          value={node.label}
          onChange={(label) => updateNode(node.id, node.type, { label })}
        />
        <CompactField
          index={1}
          label="URL"
          icon={Link2}
          value={node.url}
          onChange={(url) => updateNode(node.id, node.type, { url })}
        />
      </>
    )
  } else if (node.type === "image") {
    fields = (
      <>
        <CompactField
          index={0}
          label="Alt"
          value={node.alt}
          onChange={(alt) => updateNode(node.id, node.type, { alt })}
        />
        <CompactField
          index={1}
          label="Caption"
          value={node.caption}
          onChange={(caption) => updateNode(node.id, node.type, { caption })}
        />
        <CompactField
          index={2}
          label="URL"
          icon={Link2}
          value={node.href}
          onChange={(href) => updateNode(node.id, node.type, { href })}
        />
      </>
    )
  } else if (node.type === "footer") {
    fields = (
      <>
        <CompactField
          index={0}
          label="Company"
          value={node.company}
          onChange={(company) => updateNode(node.id, node.type, { company })}
        />
        <CompactField
          index={1}
          label="Address"
          value={node.address}
          onChange={(address) => updateNode(node.id, node.type, { address })}
        />
      </>
    )
  }

  return (
    <InspectorSection title="Content" icon={Type}>
      <InspectorFields>{fields}</InspectorFields>
    </InspectorSection>
  )
}

function NodeStyleInspector({ node }: { node: EmailNode }) {
  const updateNode = useEmailStore((state) => state.updateNode)
  let extra: ReactNode = null

  if (node.type === "heading") {
    extra = (
      <InspectorSection title="Heading" icon={Type}>
        <PropRow label="Size">
          <SegmentGroup
            value={node.size}
            onChange={(size) =>
              updateNode(node.id, node.type, {
                size: size as "sm" | "md" | "lg",
              })
            }
            options={[
              { value: "sm", label: "S" },
              { value: "md", label: "M" },
              { value: "lg", label: "L" },
            ]}
          />
        </PropRow>
      </InspectorSection>
    )
  } else if (node.type === "paragraph") {
    extra = (
      <InspectorSection title="Text" icon={Type}>
        <PropRow label="Color">
          <BoolChip
            label={node.muted ? "Muted" : "Default"}
            checked={node.muted}
            onChange={(muted) => updateNode(node.id, node.type, { muted })}
            icon={Droplet}
          />
        </PropRow>
      </InspectorSection>
    )
  } else if (node.type === "image") {
    extra = (
      <InspectorSection title="Image" icon={Droplet}>
        <PropRow label="Fit">
          <SegmentGroup
            value={node.fit}
            onChange={(fit) =>
              updateNode(node.id, node.type, { fit: fit as ImageFit })
            }
            options={[
              { value: "cover", label: "Cover" },
              { value: "contain", label: "Contain" },
            ]}
          />
        </PropRow>
      </InspectorSection>
    )
  }

  return (
    <div className="flex flex-col">
      {extra}
      <ChromeInspector
        chrome={node.chrome}
        onPatch={(patch) =>
          updateNode(node.id, node.type, {
            chrome: { ...node.chrome, ...patch },
          })
        }
      />
    </div>
  )
}

export function EmailSidePanel() {
  const [tab, setTab] = useState("customize")
  const node = useSelectedNode()
  const selectedId = useEmailStore((state) => state.selectedId)

  useEffect(() => setTab("customize"), [selectedId])

  return (
    <SizeProvider size="compact">
      <aside className="flex h-full w-[18.5rem] shrink-0 flex-col overflow-auto border-l border-border bg-card">
        <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <h2 className="min-w-0 flex-1 truncate text-body font-medium tracking-tight">
            {node ? nodeLabel(node.type) : "Document"}
          </h2>
          <Badge variant="dot" color="gray" title={node?.id}>
            {node?.type ?? "email"}
          </Badge>
        </header>
        <div className="flex flex-1 flex-col px-3 py-2.5">
          {!node ? (
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
                <ContentInspector node={node} />
              </TabPanel>
              <TabPanel value="style" className="pt-2.5">
                <NodeStyleInspector node={node} />
              </TabPanel>
            </Tabs>
          )}
        </div>
      </aside>
    </SizeProvider>
  )
}
