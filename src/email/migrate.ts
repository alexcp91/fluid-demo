import {
  containerIdFromString,
  keyBetween,
  nextNodeId,
  nodeIdFromString,
  type ContainerId,
  type NodeId,
  type OrderKey,
} from "./ids.ts"
import { applyEdit } from "./edit.ts"
import {
  EmailDocumentSchema,
  type BlockChrome,
  type EmailDocument,
  type EmailNode,
} from "./schema.ts"
import {
  EmailDocumentSchema as EmailDocumentV1Schema,
  type EmailBlock as EmailBlockV1,
  type EmailDocument as EmailDocumentV1,
  type FrameBlock,
} from "./schema-v1.ts"

function chrome(
  align: BlockChrome["align"] = "left",
  padding: BlockChrome["padding"] = "md"
): BlockChrome {
  return { padding, background: "none", visible: true, align }
}

function firstOrder(): OrderKey {
  return keyBetween(null, null)
}

function nextOrder(previous: OrderKey | null): OrderKey {
  return keyBetween(previous, null)
}

function emptyDoc(id: string): EmailDocument {
  const root = nextNodeId("body")
  const body: EmailNode = {
    id: root,
    type: "body",
    parent: null,
    order: firstOrder(),
    flex: 1,
    chrome: chrome("left", "none"),
  }
  return EmailDocumentSchema.parse({
    version: 2,
    id,
    meta: {
      subject: "Untitled email",
      previewText: "",
      width: "600",
      showPreheader: true,
      fromName: "",
    },
    root: containerIdFromString(root),
    nodes: { [root]: body },
    updatedAt: new Date().toISOString(),
  })
}

function leafFromV1(
  block: Exclude<EmailBlockV1, FrameBlock>,
  parent: ContainerId,
  order: OrderKey
): EmailNode {
  const id = nodeIdFromString(block.id)
  const base = {
    id,
    parent,
    order,
    flex: 1,
    chrome: block.chrome,
  }
  switch (block.type) {
    case "header":
      return {
        ...base,
        type: "header",
        brand: block.brand,
        tagline: block.tagline,
        showLogo: block.showLogo,
      }
    case "heading":
      return {
        ...base,
        type: "heading",
        text: block.text,
        size: block.size,
      }
    case "paragraph":
      return {
        ...base,
        type: "paragraph",
        text: block.text,
        muted: block.muted,
      }
    case "button":
      return {
        ...base,
        type: "button",
        label: block.label,
        url: block.url,
        style: block.style,
        fullWidth: block.fullWidth,
      }
    case "image":
      return {
        ...base,
        type: "image",
        alt: block.alt,
        caption: block.caption,
        href: block.href ?? "",
        fit: block.fit,
        rounded: block.rounded,
      }
    case "footer":
      return {
        ...base,
        type: "footer",
        company: block.company,
        address: block.address,
        showUnsubscribe: block.showUnsubscribe,
        showSocial: block.showSocial,
      }
  }
}

function importBlocks(
  nodes: Record<string, EmailNode>,
  blocks: EmailBlockV1[],
  parent: ContainerId,
  startOrder: OrderKey | null
): OrderKey | null {
  let previous = startOrder
  for (const block of blocks) {
    const order = nextOrder(previous)
    previous = order
    if (block.type === "frame") {
      if (block.direction === "row") {
        const rowId = nodeIdFromString(block.id)
        nodes[rowId] = {
          id: rowId,
          type: "row",
          parent,
          order,
          flex: 1,
          chrome: { ...block.chrome, padding: "none" },
          gap: block.gap,
          stackOnMobile: true,
        }
        const rowParent = containerIdFromString(rowId)
        let colPrev: OrderKey | null = null
        const kids = block.children
        if (kids.length === 0) {
          for (let i = 0; i < 2; i += 1) {
            const colId = nextNodeId("column")
            const colOrder = nextOrder(colPrev)
            colPrev = colOrder
            nodes[colId] = {
              id: colId,
              type: "column",
              parent: rowParent,
              order: colOrder,
              flex: 1,
              chrome: chrome("left", "sm"),
              vAlign: "top",
            }
          }
        } else {
          for (const child of kids) {
            const colId =
              child.type === "frame" && child.direction === "column"
                ? nodeIdFromString(child.id)
                : nextNodeId("column")
            const colOrder = nextOrder(colPrev)
            colPrev = colOrder
            nodes[colId] = {
              id: colId,
              type: "column",
              parent: rowParent,
              order: colOrder,
              flex: 1,
              chrome: chrome("left", "sm"),
              vAlign: "top",
            }
            const colParent = containerIdFromString(colId)
            if (child.type === "frame" && child.direction === "column") {
              importBlocks(nodes, child.children, colParent, null)
            } else if (child.type !== "frame") {
              const leafOrder = firstOrder()
              const leaf = leafFromV1(child, colParent, leafOrder)
              nodes[leaf.id] = leaf
            }
          }
        }
      } else {
        const colId = nodeIdFromString(block.id)
        const rowId = nextNodeId("row")
        nodes[rowId] = {
          id: rowId,
          type: "row",
          parent,
          order,
          flex: 1,
          chrome: chrome("left", "none"),
          gap: "md",
          stackOnMobile: true,
        }
        const rowParent = containerIdFromString(rowId)
        nodes[colId] = {
          id: colId,
          type: "column",
          parent: rowParent,
          order: firstOrder(),
          flex: 1,
          chrome: block.chrome,
          vAlign: "top",
        }
        importBlocks(
          nodes,
          block.children,
          containerIdFromString(colId),
          null
        )
      }
      continue
    }
    const leaf = leafFromV1(block, parent, order)
    nodes[leaf.id] = leaf
  }
  return previous
}

function upgradeV1(raw: unknown): EmailDocument {
  const v1 = EmailDocumentV1Schema.parse(raw) as EmailDocumentV1
  const root = nextNodeId("body")
  const nodes: Record<string, EmailNode> = {
    [root]: {
      id: root,
      type: "body",
      parent: null,
      order: firstOrder(),
      flex: 1,
      chrome: chrome("left", "none"),
    },
  }
  importBlocks(nodes, v1.blocks, containerIdFromString(root), null)
  return EmailDocumentSchema.parse({
    version: 2,
    id: v1.id,
    meta: v1.meta,
    root: containerIdFromString(root),
    nodes,
    updatedAt: v1.updatedAt,
  })
}

/** Boundary: accept v1 or v2, always return validated v2. */
export function parseDocument(input: unknown): EmailDocument {
  const asV2 = EmailDocumentSchema.safeParse(input)
  if (asV2.success) return asV2.data
  return upgradeV1(input)
}

export function createInitialDocument(id = "welcome"): EmailDocument {
  let doc = emptyDoc(id)
  doc = {
    ...doc,
    meta: {
      subject: "You’re invited to Fluid Launch Week",
      previewText:
        "A week of springy presses, proximity hover, and new blocks.",
      width: "600",
      showPreheader: true,
      fromName: "Fluid",
    },
  }

  function dispatch(edit: Parameters<typeof applyEdit>[1]): NodeId {
    const out = applyEdit(doc, edit)
    if (!out.ok) throw new Error(out.reason)
    if (!out.focus) throw new Error("edit produced no focus")
    doc = out.doc
    return out.focus
  }

  const root = doc.root
  function patch(
    nodeType: EmailNode["type"],
    node: NodeId,
    fields: Record<string, unknown>
  ) {
    const out = applyEdit(doc, {
      kind: "editNode",
      nodeType,
      node,
      patch: fields,
    } as Parameters<typeof applyEdit>[1])
    if (!out.ok) throw new Error(out.reason)
    doc = out.doc
  }

  const headerId = dispatch({
    kind: "insertLeaf",
    type: "header",
    into: root,
    before: null,
  })
  patch("header", headerId, {
    brand: "Fluid",
    tagline: "Functionalism",
    showLogo: true,
  })

  const headingId = dispatch({
    kind: "insertLeaf",
    type: "heading",
    into: root,
    before: null,
  })
  patch("heading", headingId, {
    text: "Design systems that feel alive",
    size: "lg",
  })

  const paragraphId = dispatch({
    kind: "insertLeaf",
    type: "paragraph",
    into: root,
    before: null,
  })
  patch("paragraph", paragraphId, {
    text: "Ship controls with spring physics, proximity hover, and a size ladder that stays consistent from toolbar to settings rail.",
  })

  const rowId = dispatch({
    kind: "insertRow",
    columns: 2,
    into: root,
    before: null,
  })
  const columns = Object.values(doc.nodes)
    .filter((n) => n.type === "column" && n.parent === rowId)
    .sort((a, b) => a.order.localeCompare(b.order))
  const [colA, colB] = columns
  if (!colA || !colB) throw new Error("insertRow did not create columns")

  const imageA = dispatch({
    kind: "insertLeaf",
    type: "image",
    into: colA.id as ContainerId,
    before: null,
  })
  patch("image", imageA, {
    alt: "Product A",
    caption: "Spring press",
    rounded: true,
  })
  const hA = dispatch({
    kind: "insertLeaf",
    type: "heading",
    into: colA.id as ContainerId,
    before: null,
  })
  patch("heading", hA, { text: "Controls", size: "md" })

  const imageB = dispatch({
    kind: "insertLeaf",
    type: "image",
    into: colB.id as ContainerId,
    before: null,
  })
  patch("image", imageB, {
    alt: "Product B",
    caption: "Proximity hover",
    rounded: true,
  })
  const hB = dispatch({
    kind: "insertLeaf",
    type: "heading",
    into: colB.id as ContainerId,
    before: null,
  })
  patch("heading", hB, { text: "Motion", size: "md" })

  const buttonId = dispatch({
    kind: "insertLeaf",
    type: "button",
    into: root,
    before: null,
  })
  patch("button", buttonId, {
    label: "Get started",
    url: "https://example.com",
    style: "filled",
  })

  const footerId = dispatch({
    kind: "insertLeaf",
    type: "footer",
    into: root,
    before: null,
  })
  patch("footer", footerId, {
    company: "Fluid Functionalism",
    address: "San Francisco, CA",
    showUnsubscribe: true,
  })

  return EmailDocumentSchema.parse(doc)
}
