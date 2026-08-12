export type {
  Align,
  BlockBg,
  BlockChrome,
  BlockType,
  ButtonStyle,
  DeviceMode,
  EmailDocument,
  EmailMeta,
  EmailNode,
  ImageFit,
  LeafNode,
  Spacing,
  VAlign,
} from "@/email/schema"

import type { BlockBg, BlockType, Spacing } from "@/email/schema"

export const BLOCK_TYPES: BlockType[] = [
  "header",
  "image",
  "heading",
  "paragraph",
  "button",
  "footer",
]

export const BLOCK_LABELS: Record<BlockType, string> = {
  header: "Header",
  heading: "Heading",
  paragraph: "Paragraph",
  button: "Button",
  image: "Image",
  footer: "Footer",
}

export const STRUCTURE_LABELS = {
  body: "Body",
  row: "Row",
  column: "Column",
} as const

/** Blocks that get the floating inline format toolbar (text selection only). */
export const RICH_BLOCK_TYPES: BlockType[] = ["heading", "paragraph"]

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

export function nodeLabel(type: string): string {
  if (type in BLOCK_LABELS) return BLOCK_LABELS[type as BlockType]
  if (type in STRUCTURE_LABELS)
    return STRUCTURE_LABELS[type as keyof typeof STRUCTURE_LABELS]
  return type
}
