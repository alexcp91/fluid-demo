export type {
  Align,
  BlockBg,
  BlockChrome,
  BlockType,
  ButtonBlock,
  ButtonStyle,
  DeviceMode,
  EmailBlock,
  EmailDocument,
  EmailMeta,
  FooterBlock,
  FrameBlock,
  FrameDirection,
  HeaderBlock,
  HeadingBlock,
  ImageBlock,
  ImageFit,
  LeafBlock,
  ParagraphBlock,
  Spacing,
} from "@/email/schema"

import type {
  Align,
  BlockBg,
  BlockChrome,
  BlockType,
  EmailBlock,
  EmailDocument,
  FrameBlock,
  FrameDirection,
  Spacing,
} from "@/email/schema"

export const BLOCK_TYPES: BlockType[] = [
  "header",
  "image",
  "heading",
  "paragraph",
  "button",
  "frame",
  "footer",
]

export const BLOCK_LABELS: Record<BlockType, string> = {
  header: "Header",
  heading: "Heading",
  paragraph: "Paragraph",
  button: "Button",
  image: "Image",
  frame: "Frame",
  footer: "Footer",
}

/** Blocks that get the floating inline format toolbar (text selection only). */
export const RICH_BLOCK_TYPES: BlockType[] = ["heading", "paragraph"]

function chrome(
  align: Align = "left",
  padding: Spacing = "md"
): BlockChrome {
  return { padding, background: "none", visible: true, align }
}

let blockSeq = 0
export function nextBlockId(type: BlockType): string {
  blockSeq += 1
  return `${type}-${blockSeq}`
}

export function createBlock(type: BlockType): EmailBlock {
  const id = nextBlockId(type)
  switch (type) {
    case "header":
      return {
        id,
        type,
        chrome: chrome("left", "md"),
        brand: "Brand",
        tagline: "Tagline",
        showLogo: true,
      }
    case "heading":
      return {
        id,
        type,
        chrome: chrome("left", "sm"),
        text: "New heading",
        size: "lg",
      }
    case "paragraph":
      return {
        id,
        type,
        chrome: chrome("left", "sm"),
        text: "Start writing…",
        muted: false,
      }
    case "button":
      return {
        id,
        type,
        chrome: chrome("left", "md"),
        label: "Click me",
        url: "https://example.com",
        style: "filled",
        fullWidth: false,
      }
    case "image":
      return {
        id,
        type,
        chrome: chrome("center", "sm"),
        alt: "Image",
        caption: "",
        href: "",
        fit: "cover",
        rounded: true,
      }
    case "frame":
      return {
        id,
        type,
        chrome: chrome("left", "none"),
        direction: "row",
        gap: "md",
        widths: [],
        children: [],
      }
    case "footer":
      return {
        id,
        type,
        chrome: chrome("center", "md"),
        company: "Company",
        address: "Address",
        showUnsubscribe: true,
        showSocial: false,
      }
  }
}

export function isFrame(block: EmailBlock): block is FrameBlock {
  return block.type === "frame"
}

export function findBlock(
  doc: EmailDocument,
  id: string | null
): EmailBlock | undefined {
  if (!id) return undefined
  return findInList(doc.blocks, id)
}

function findInList(
  blocks: EmailBlock[],
  id: string
): EmailBlock | undefined {
  for (const block of blocks) {
    if (block.id === id) return block
    if (isFrame(block)) {
      const nested = findInList(block.children, id)
      if (nested) return nested
    }
  }
  return undefined
}

/** Parent frame id, or null when the block sits on the document root. */
export function findParentId(
  doc: EmailDocument,
  id: string
): string | null {
  for (const block of doc.blocks) {
    if (block.id === id) return null
    if (isFrame(block)) {
      const found = findParentInFrame(block, id)
      if (found !== undefined) return found
    }
  }
  return null
}

function findParentInFrame(
  frame: FrameBlock,
  id: string
): string | null | undefined {
  for (const child of frame.children) {
    if (child.id === id) return frame.id
    if (isFrame(child)) {
      const nested = findParentInFrame(child, id)
      if (nested !== undefined) return nested
    }
  }
  return undefined
}

/** Deep-clone a block with a fresh id (same type sequence as `createBlock`). */
export function cloneBlock(block: EmailBlock): EmailBlock {
  if (isFrame(block)) {
    return {
      ...structuredClone(block),
      id: nextBlockId("frame"),
      children: block.children.map(cloneBlock),
    }
  }
  return { ...structuredClone(block), id: nextBlockId(block.type) }
}

function mapTree(
  blocks: EmailBlock[],
  fn: (block: EmailBlock) => EmailBlock
): EmailBlock[] {
  return blocks.map((block) => {
    const next = fn(block)
    if (isFrame(next)) {
      return { ...next, children: mapTree(next.children, fn) }
    }
    return next
  })
}

export function updateBlock(
  doc: EmailDocument,
  id: string,
  patch: Record<string, unknown>
): EmailDocument {
  return {
    ...doc,
    blocks: mapTree(doc.blocks, (block) =>
      block.id === id ? ({ ...block, ...patch } as EmailBlock) : block
    ),
  }
}

export function insertBlock(
  doc: EmailDocument,
  block: EmailBlock,
  afterId: string | null
): EmailDocument {
  if (!afterId) {
    return { ...doc, blocks: [...doc.blocks, block] }
  }
  const parentId = findParentId(doc, afterId)
  if (parentId === null) {
    const index = doc.blocks.findIndex((b) => b.id === afterId)
    if (index === -1) return { ...doc, blocks: [...doc.blocks, block] }
    const blocks = [...doc.blocks]
    blocks.splice(index + 1, 0, block)
    return { ...doc, blocks }
  }
  return {
    ...doc,
    blocks: mapTree(doc.blocks, (b) => {
      if (!isFrame(b) || b.id !== parentId) return b
      const index = b.children.findIndex((c) => c.id === afterId)
      if (index === -1) return b
      const children = [...b.children]
      children.splice(index + 1, 0, block)
      return { ...b, children }
    }),
  }
}

/** Insert at a clamped index in a parent frame, or root when parentId is null. */
export function insertBlockAtIndex(
  doc: EmailDocument,
  block: EmailBlock,
  index: number,
  parentId: string | null = null
): EmailDocument {
  if (parentId === null) {
    const i = Math.max(0, Math.min(index, doc.blocks.length))
    const blocks = [...doc.blocks]
    blocks.splice(i, 0, block)
    return { ...doc, blocks }
  }
  return {
    ...doc,
    blocks: mapTree(doc.blocks, (b) => {
      if (!isFrame(b) || b.id !== parentId) return b
      const i = Math.max(0, Math.min(index, b.children.length))
      const children = [...b.children]
      children.splice(i, 0, block)
      return { ...b, children }
    }),
  }
}

export function insertIntoFrame(
  doc: EmailDocument,
  frameId: string,
  block: EmailBlock,
  index?: number
): EmailDocument {
  return {
    ...doc,
    blocks: mapTree(doc.blocks, (b) => {
      if (!isFrame(b) || b.id !== frameId) return b
      const i =
        index === undefined
          ? b.children.length
          : Math.max(0, Math.min(index, b.children.length))
      const children = [...b.children]
      children.splice(i, 0, block)
      return { ...b, children }
    }),
  }
}

export function removeBlock(doc: EmailDocument, id: string): EmailDocument {
  return {
    ...doc,
    blocks: removeFromList(doc.blocks, id),
  }
}

function removeFromList(blocks: EmailBlock[], id: string): EmailBlock[] {
  const next: EmailBlock[] = []
  for (const block of blocks) {
    if (block.id === id) continue
    if (isFrame(block)) {
      next.push({ ...block, children: removeFromList(block.children, id) })
    } else {
      next.push(block)
    }
  }
  return next
}

export function reorderBlocks(
  doc: EmailDocument,
  orderedIds: string[],
  parentId: string | null = null
): EmailDocument {
  if (parentId === null) {
    const map = new Map(doc.blocks.map((b) => [b.id, b]))
    const blocks = orderedIds
      .map((id) => map.get(id))
      .filter((b): b is EmailBlock => Boolean(b))
    for (const b of doc.blocks) {
      if (!orderedIds.includes(b.id)) blocks.push(b)
    }
    return { ...doc, blocks }
  }
  return {
    ...doc,
    blocks: mapTree(doc.blocks, (b) => {
      if (!isFrame(b) || b.id !== parentId) return b
      const map = new Map(b.children.map((c) => [c.id, c]))
      const children = orderedIds
        .map((id) => map.get(id))
        .filter((c): c is EmailBlock => Boolean(c))
      for (const c of b.children) {
        if (!orderedIds.includes(c.id)) children.push(c)
      }
      return { ...b, children }
    }),
  }
}

/** Atomic 2-column (or N) product row: row frame + column frames. */
export function insertProductRow(
  doc: EmailDocument,
  options: {
    columns?: number
    afterId?: string | null
    direction?: FrameDirection
  } = {}
): { doc: EmailDocument; rowId: string; columnIds: string[] } {
  const count = Math.max(2, Math.min(options.columns ?? 2, 4))
  const columnIds: string[] = []
  const children: FrameBlock[] = []
  for (let i = 0; i < count; i += 1) {
    const col = createBlock("frame") as FrameBlock
    col.direction = "column"
    col.gap = "sm"
    col.chrome = chrome("left", "sm")
    children.push(col)
    columnIds.push(col.id)
  }
  const row = createBlock("frame") as FrameBlock
  row.direction = options.direction ?? "row"
  row.gap = "md"
  row.widths = Array.from({ length: count }, () => 100 / count)
  row.children = children
  const next = insertBlock(doc, row, options.afterId ?? null)
  return { doc: next, rowId: row.id, columnIds }
}

export function createInitialDocument(id = "welcome"): EmailDocument {
  const image = {
    id: nextBlockId("image"),
    type: "image" as const,
    chrome: chrome("center", "sm"),
    alt: "Product A",
    caption: "Spring press",
    href: "",
    fit: "cover" as const,
    rounded: true,
  }
  const imageB = {
    id: nextBlockId("image"),
    type: "image" as const,
    chrome: chrome("center", "sm"),
    alt: "Product B",
    caption: "Proximity hover",
    href: "",
    fit: "cover" as const,
    rounded: true,
  }
  const headingA = {
    id: nextBlockId("heading"),
    type: "heading" as const,
    chrome: chrome("left", "sm"),
    text: "Controls",
    size: "md" as const,
  }
  const headingB = {
    id: nextBlockId("heading"),
    type: "heading" as const,
    chrome: chrome("left", "sm"),
    text: "Motion",
    size: "md" as const,
  }
  const colA = {
    id: nextBlockId("frame"),
    type: "frame" as const,
    chrome: chrome("left", "sm"),
    direction: "column" as const,
    gap: "sm" as const,
    widths: [] as number[],
    children: [image, headingA],
  }
  const colB = {
    id: nextBlockId("frame"),
    type: "frame" as const,
    chrome: chrome("left", "sm"),
    direction: "column" as const,
    gap: "sm" as const,
    widths: [] as number[],
    children: [imageB, headingB],
  }
  const productRow = {
    id: nextBlockId("frame"),
    type: "frame" as const,
    chrome: chrome("left", "none"),
    direction: "row" as const,
    gap: "md" as const,
    widths: [50, 50],
    children: [colA, colB],
  }

  return {
    id,
    updatedAt: new Date().toISOString(),
    meta: {
      subject: "You’re invited to Fluid Launch Week",
      previewText:
        "A week of springy presses, proximity hover, and new blocks.",
      width: "600",
      showPreheader: true,
      fromName: "Fluid",
    },
    blocks: [
      {
        id: nextBlockId("header"),
        type: "header",
        chrome: chrome("left", "md"),
        brand: "Fluid",
        tagline: "Functionalism",
        showLogo: true,
      },
      {
        id: nextBlockId("heading"),
        type: "heading",
        chrome: chrome("left", "sm"),
        text: "Design systems that feel alive",
        size: "lg",
      },
      {
        id: nextBlockId("paragraph"),
        type: "paragraph",
        chrome: chrome("left", "sm"),
        text: "Ship controls with spring physics, proximity hover, and a size ladder that stays consistent from toolbar to settings rail.",
        muted: false,
      },
      productRow,
      {
        id: nextBlockId("button"),
        type: "button",
        chrome: chrome("left", "md"),
        label: "Get started",
        url: "https://example.com",
        style: "filled",
        fullWidth: false,
      },
      {
        id: nextBlockId("footer"),
        type: "footer",
        chrome: chrome("center", "md"),
        company: "Fluid Functionalism",
        address: "San Francisco, CA",
        showUnsubscribe: true,
        showSocial: false,
      },
    ],
  }
}

export const initialDocument: EmailDocument = createInitialDocument()

export const PADDING_CLASS: Record<Spacing, string> = {
  none: "p-0",
  sm: "p-2",
  md: "p-3",
  lg: "p-5",
}

export const BG_CLASS: Record<BlockBg, string> = {
  none: "bg-transparent",
  muted: "bg-muted/60",
  accent: "bg-accent/50",
}

export const GAP_CLASS: Record<Spacing, string> = {
  none: "gap-0",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-5",
}
