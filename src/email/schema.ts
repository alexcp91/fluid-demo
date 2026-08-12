import { z } from "zod"
import {
  containerIdFromString,
  nodeIdFromString,
  orderKeyFromString,
  type NodeId,
  type OrderKey,
} from "./ids.ts"
import {
  AlignSchema,
  BlockBgSchema,
  BlockChromeSchema,
  ButtonStyleSchema,
  DeviceModeSchema,
  EmailMetaSchema,
  ImageFitSchema,
  SpacingSchema,
} from "./schema-v1.ts"

export {
  AlignSchema,
  BlockBgSchema,
  BlockChromeSchema,
  ButtonStyleSchema,
  DeviceModeSchema,
  EmailMetaSchema,
  ImageFitSchema,
  SpacingSchema,
}
export type {
  Align,
  BlockBg,
  BlockChrome,
  ButtonStyle,
  DeviceMode,
  EmailMeta,
  ImageFit,
  Spacing,
} from "./schema-v1.ts"
export type { ContainerId, NodeId, OrderKey } from "./ids.ts"

export const MAX_ROW_NESTING = 2

export const NodeKindSchema = z.enum([
  "body",
  "row",
  "column",
  "header",
  "heading",
  "paragraph",
  "button",
  "image",
  "footer",
])
export const BlockTypeSchema = z.enum([
  "header",
  "heading",
  "paragraph",
  "button",
  "image",
  "footer",
])
export const VAlignSchema = z.enum(["top", "middle", "bottom"])

const nodeBase = {
  id: z.string().min(1).transform(nodeIdFromString),
  parent: z
    .string()
    .min(1)
    .nullable()
    .transform((value) =>
      value === null ? null : containerIdFromString(value)
    ),
  order: z.string().regex(/^[0-9a-f]{12}$/).transform(orderKeyFromString),
  flex: z.number().positive().default(1),
  chrome: BlockChromeSchema,
}

export const BodyNodeSchema = z.object({
  ...nodeBase,
  type: z.literal("body"),
})

export const RowNodeSchema = z.object({
  ...nodeBase,
  type: z.literal("row"),
  gap: SpacingSchema,
  stackOnMobile: z.boolean().default(true),
})

export const ColumnNodeSchema = z.object({
  ...nodeBase,
  type: z.literal("column"),
  vAlign: VAlignSchema.default("top"),
})

export const HeaderNodeSchema = z.object({
  ...nodeBase,
  type: z.literal("header"),
  brand: z.string(),
  tagline: z.string(),
  showLogo: z.boolean(),
})

export const HeadingNodeSchema = z.object({
  ...nodeBase,
  type: z.literal("heading"),
  text: z.string(),
  size: z.enum(["sm", "md", "lg"]),
})

export const ParagraphNodeSchema = z.object({
  ...nodeBase,
  type: z.literal("paragraph"),
  text: z.string(),
  muted: z.boolean(),
})

export const ButtonNodeSchema = z.object({
  ...nodeBase,
  type: z.literal("button"),
  label: z.string(),
  url: z.string(),
  style: ButtonStyleSchema,
  fullWidth: z.boolean(),
})

export const ImageNodeSchema = z.object({
  ...nodeBase,
  type: z.literal("image"),
  alt: z.string(),
  caption: z.string(),
  href: z.string().default(""),
  fit: ImageFitSchema,
  rounded: z.boolean(),
})

export const FooterNodeSchema = z.object({
  ...nodeBase,
  type: z.literal("footer"),
  company: z.string(),
  address: z.string(),
  showUnsubscribe: z.boolean(),
  showSocial: z.boolean(),
})

export const LeafNodeSchema = z.discriminatedUnion("type", [
  HeaderNodeSchema,
  HeadingNodeSchema,
  ParagraphNodeSchema,
  ButtonNodeSchema,
  ImageNodeSchema,
  FooterNodeSchema,
])

export const ContainerNodeSchema = z.discriminatedUnion("type", [
  BodyNodeSchema,
  RowNodeSchema,
  ColumnNodeSchema,
])

export const EmailNodeSchema = z.discriminatedUnion("type", [
  BodyNodeSchema,
  RowNodeSchema,
  ColumnNodeSchema,
  HeaderNodeSchema,
  HeadingNodeSchema,
  ParagraphNodeSchema,
  ButtonNodeSchema,
  ImageNodeSchema,
  FooterNodeSchema,
])

export type NodeKind = z.infer<typeof NodeKindSchema>
export type BlockType = z.infer<typeof BlockTypeSchema>
export type VAlign = z.infer<typeof VAlignSchema>
export type BodyNode = z.infer<typeof BodyNodeSchema>
export type RowNode = z.infer<typeof RowNodeSchema>
export type ColumnNode = z.infer<typeof ColumnNodeSchema>
export type HeaderNode = z.infer<typeof HeaderNodeSchema>
export type HeadingNode = z.infer<typeof HeadingNodeSchema>
export type ParagraphNode = z.infer<typeof ParagraphNodeSchema>
export type ButtonNode = z.infer<typeof ButtonNodeSchema>
export type ImageNode = z.infer<typeof ImageNodeSchema>
export type FooterNode = z.infer<typeof FooterNodeSchema>
export type LeafNode = z.infer<typeof LeafNodeSchema>
export type ContainerNode = z.infer<typeof ContainerNodeSchema>
export type EmailNode = z.infer<typeof EmailNodeSchema>

function isContainerNode(node: EmailNode | undefined): node is ContainerNode {
  return (
    node?.type === "body" ||
    node?.type === "row" ||
    node?.type === "column"
  )
}

export const EmailDocumentSchema = z
  .object({
    version: z.literal(2),
    id: z.string().min(1),
    meta: EmailMetaSchema,
    root: z.string().min(1).transform(containerIdFromString),
    nodes: z.record(z.string(), EmailNodeSchema),
    updatedAt: z.string(),
  })
  .superRefine((document, context) => {
    const root = document.nodes[document.root]
    if (!root || root.type !== "body") {
      context.addIssue({
        code: "custom",
        path: ["root"],
        message: "Root must reference a body node",
      })
    }

    const childrenByParent = new Map<NodeId, EmailNode[]>()
    const siblingOrders = new Map<NodeId, Set<OrderKey>>()

    for (const [recordId, node] of Object.entries(document.nodes)) {
      if (recordId !== node.id) {
        context.addIssue({
          code: "custom",
          path: ["nodes", recordId, "id"],
          message: "Node id must match its record key",
        })
      }

      if (node.type === "body") {
        if (node.id !== document.root || node.parent !== null) {
          context.addIssue({
            code: "custom",
            path: ["nodes", recordId, "parent"],
            message: "The root body must be the only parentless node",
          })
        }
        continue
      }

      if (node.parent === null) {
        context.addIssue({
          code: "custom",
          path: ["nodes", recordId, "parent"],
          message: "Only the root body may have a null parent",
        })
        continue
      }

      const parent = document.nodes[node.parent]
      if (!isContainerNode(parent)) {
        context.addIssue({
          code: "custom",
          path: ["nodes", recordId, "parent"],
          message: "Parent must reference a container",
        })
        continue
      }

      if (parent.type === "row" && node.type !== "column") {
        context.addIssue({
          code: "custom",
          path: ["nodes", recordId, "parent"],
          message: "Rows may contain columns only",
        })
      }
      if (node.type === "column" && parent.type !== "row") {
        context.addIssue({
          code: "custom",
          path: ["nodes", recordId, "parent"],
          message: "Columns must be children of rows",
        })
      }

      const siblings = childrenByParent.get(node.parent) ?? []
      siblings.push(node)
      childrenByParent.set(node.parent, siblings)
      const orders = siblingOrders.get(node.parent) ?? new Set<OrderKey>()
      if (orders.has(node.order)) {
        context.addIssue({
          code: "custom",
          path: ["nodes", recordId, "order"],
          message: "Sibling order keys must be unique",
        })
      }
      orders.add(node.order)
      siblingOrders.set(node.parent, orders)
    }

    const visiting = new Set<NodeId>()
    const visited = new Set<NodeId>()

    function visit(id: NodeId, rowDepth: number): void {
      if (visiting.has(id)) {
        context.addIssue({
          code: "custom",
          path: ["nodes", id, "parent"],
          message: "Parent graph must be acyclic",
        })
        return
      }
      if (visited.has(id)) return
      const node = document.nodes[id]
      if (!node) return
      const nextRowDepth = rowDepth + (node.type === "row" ? 1 : 0)
      if (nextRowDepth > MAX_ROW_NESTING) {
        context.addIssue({
          code: "custom",
          path: ["nodes", id],
          message: `Row nesting may not exceed ${MAX_ROW_NESTING}`,
        })
      }
      visiting.add(id)
      for (const child of childrenByParent.get(id) ?? [])
        visit(child.id, nextRowDepth)
      visiting.delete(id)
      visited.add(id)
    }

    if (root?.type === "body") visit(root.id, 0)
    for (const node of Object.values(document.nodes)) {
      if (!visited.has(node.id)) {
        context.addIssue({
          code: "custom",
          path: ["nodes", node.id],
          message: "Every node must be reachable from root",
        })
      }
    }
  })

export const EmailListItemSchema = z.object({
  id: z.string(),
  subject: z.string(),
  updatedAt: z.string(),
})

export type EmailDocument = z.infer<typeof EmailDocumentSchema>
export type EmailListItem = z.infer<typeof EmailListItemSchema>
