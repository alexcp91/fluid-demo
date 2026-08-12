import { z } from "zod"

export const AlignSchema = z.enum(["left", "center", "right"])
export const ButtonStyleSchema = z.enum(["filled", "outline", "text"])
export const ImageFitSchema = z.enum(["cover", "contain"])
export const SpacingSchema = z.enum(["none", "sm", "md", "lg"])
export const BlockBgSchema = z.enum(["none", "muted", "accent"])
export const FrameDirectionSchema = z.enum(["row", "column"])
export const BlockTypeSchema = z.enum([
  "header",
  "heading",
  "paragraph",
  "button",
  "image",
  "footer",
  "frame",
])
export const DeviceModeSchema = z.enum(["desktop", "mobile"])

export const EmailMetaSchema = z.object({
  subject: z.string(),
  previewText: z.string(),
  width: z.enum(["600", "640", "720"]),
  showPreheader: z.boolean(),
  /** Optional sender display name for checklist / export context. */
  fromName: z.string().default(""),
})

export const BlockChromeSchema = z.object({
  padding: SpacingSchema,
  background: BlockBgSchema,
  visible: z.boolean(),
  align: AlignSchema,
})

const blockBase = {
  id: z.string().min(1),
  chrome: BlockChromeSchema,
}

export const HeaderBlockSchema = z.object({
  ...blockBase,
  type: z.literal("header"),
  brand: z.string(),
  tagline: z.string(),
  showLogo: z.boolean(),
})

export const HeadingBlockSchema = z.object({
  ...blockBase,
  type: z.literal("heading"),
  text: z.string(),
  size: z.enum(["sm", "md", "lg"]),
})

export const ParagraphBlockSchema = z.object({
  ...blockBase,
  type: z.literal("paragraph"),
  text: z.string(),
  muted: z.boolean(),
})

export const ButtonBlockSchema = z.object({
  ...blockBase,
  type: z.literal("button"),
  label: z.string(),
  url: z.string(),
  style: ButtonStyleSchema,
  fullWidth: z.boolean(),
})

export const ImageBlockSchema = z.object({
  ...blockBase,
  type: z.literal("image"),
  alt: z.string(),
  caption: z.string(),
  /** Optional click-through URL (Tabular-style image link). */
  href: z.string().default(""),
  fit: ImageFitSchema,
  rounded: z.boolean(),
})

export const FooterBlockSchema = z.object({
  ...blockBase,
  type: z.literal("footer"),
  company: z.string(),
  address: z.string(),
  showUnsubscribe: z.boolean(),
  showSocial: z.boolean(),
})

export const LeafBlockSchema = z.discriminatedUnion("type", [
  HeaderBlockSchema,
  HeadingBlockSchema,
  ParagraphBlockSchema,
  ButtonBlockSchema,
  ImageBlockSchema,
  FooterBlockSchema,
])

export type Align = z.infer<typeof AlignSchema>
export type ButtonStyle = z.infer<typeof ButtonStyleSchema>
export type ImageFit = z.infer<typeof ImageFitSchema>
export type Spacing = z.infer<typeof SpacingSchema>
export type BlockBg = z.infer<typeof BlockBgSchema>
export type FrameDirection = z.infer<typeof FrameDirectionSchema>
export type BlockType = z.infer<typeof BlockTypeSchema>
export type DeviceMode = z.infer<typeof DeviceModeSchema>
export type EmailMeta = z.infer<typeof EmailMetaSchema>
export type BlockChrome = z.infer<typeof BlockChromeSchema>
export type HeaderBlock = z.infer<typeof HeaderBlockSchema>
export type HeadingBlock = z.infer<typeof HeadingBlockSchema>
export type ParagraphBlock = z.infer<typeof ParagraphBlockSchema>
export type ButtonBlock = z.infer<typeof ButtonBlockSchema>
export type ImageBlock = z.infer<typeof ImageBlockSchema>
export type FooterBlock = z.infer<typeof FooterBlockSchema>
export type LeafBlock = z.infer<typeof LeafBlockSchema>

export interface FrameBlock {
  id: string
  type: "frame"
  chrome: BlockChrome
  direction: FrameDirection
  gap: Spacing
  /** Percent widths for row children; empty means equal split. */
  widths: number[]
  children: EmailBlock[]
}

export type EmailBlock = LeafBlock | FrameBlock

export const FrameBlockSchema: z.ZodType<FrameBlock> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: z.literal("frame"),
    chrome: BlockChromeSchema,
    direction: FrameDirectionSchema,
    gap: SpacingSchema,
    widths: z.array(z.number()).default([]),
    children: z.array(EmailBlockSchema),
  })
)

export const EmailBlockSchema: z.ZodType<EmailBlock> = z.lazy(() =>
  z.union([LeafBlockSchema, FrameBlockSchema])
)

export const EmailDocumentSchema = z.object({
  id: z.string().min(1),
  meta: EmailMetaSchema,
  blocks: z.array(EmailBlockSchema),
  updatedAt: z.string(),
})

export const EmailListItemSchema = z.object({
  id: z.string(),
  subject: z.string(),
  updatedAt: z.string(),
})

/** Saved reusable design — EmailDocument plus a display name. */
export const EmailTemplateSchema = EmailDocumentSchema.extend({
  name: z.string().min(1),
})

export const EmailTemplateListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  subject: z.string(),
  updatedAt: z.string(),
})

export type EmailDocument = z.infer<typeof EmailDocumentSchema>
export type EmailListItem = z.infer<typeof EmailListItemSchema>
export type EmailTemplate = z.infer<typeof EmailTemplateSchema>
export type EmailTemplateListItem = z.infer<typeof EmailTemplateListItemSchema>
