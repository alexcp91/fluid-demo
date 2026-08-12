import {
  keyBetween,
  nextNodeId,
  orderKeyFromString,
  type ContainerId,
  type NodeId,
  type OrderKey,
} from "./ids.ts"
import {
  EmailMetaSchema,
  EmailNodeSchema,
  MAX_ROW_NESTING,
  type BlockChrome,
  type BlockType,
  type EmailDocument,
  type EmailMeta,
  type EmailNode,
  type NodeKind,
} from "./schema.ts"
import { ancestorsOf, asContainer, childrenOf, isContainer } from "./tree.ts"

export type PatchFor<K extends NodeKind> = Partial<
  Omit<
    Extract<EmailNode, { type: K }>,
    "id" | "type" | "parent" | "order"
  >
>

interface EditNode<K extends NodeKind> {
  kind: "editNode"
  nodeType: K
  node: NodeId
  patch: PatchFor<K>
}

type AnyEditNode = { [K in NodeKind]: EditNode<K> }[NodeKind]

export type EmailEdit =
  | {
      kind: "insertLeaf"
      type: BlockType
      into: ContainerId
      before: NodeId | null
    }
  | {
      kind: "insertRow"
      columns: 1 | 2 | 3
      into: ContainerId
      before: NodeId | null
    }
  | {
      kind: "move"
      node: NodeId
      into: ContainerId
      before: NodeId | null
    }
  | { kind: "duplicate"; node: NodeId }
  | { kind: "remove"; node: NodeId }
  | AnyEditNode
  | { kind: "setText"; node: NodeId; html: string }
  | { kind: "setMeta"; patch: Partial<EmailMeta> }

export type EditRejection =
  | "unknown-node"
  | "not-a-container"
  | "type-mismatch"
  | "would-cycle"
  | "row-nesting-limit"
  | "cannot-remove-body"

export type EditOutcome =
  | {
      ok: true
      doc: EmailDocument
      changed: boolean
      focus: NodeId | null
    }
  | { ok: false; reason: EditRejection }

const ORDER_MAX = BigInt("0xffffffffffff")

const DEFAULT_CHROME: BlockChrome = {
  padding: "sm",
  background: "none",
  visible: true,
  align: "left",
}

function updated(
  document: EmailDocument,
  nodes: EmailDocument["nodes"],
  focus: NodeId | null
): EditOutcome {
  return {
    ok: true,
    doc: { ...document, nodes, updatedAt: new Date().toISOString() },
    changed: true,
    focus,
  }
}

function unchanged(
  document: EmailDocument,
  focus: NodeId | null
): EditOutcome {
  return { ok: true, doc: document, changed: false, focus }
}

function uniqueNodeId(
  document: EmailDocument,
  kind: NodeKind,
  reserved: Set<NodeId> = new Set()
): NodeId {
  let id = nextNodeId(kind)
  while (document.nodes[id] || reserved.has(id)) id = nextNodeId(kind)
  reserved.add(id)
  return id
}

function createLeaf(
  document: EmailDocument,
  type: BlockType,
  parent: ContainerId,
  order: OrderKey
): EmailNode {
  const common = {
    id: uniqueNodeId(document, type),
    parent,
    order,
    flex: 1,
    chrome: { ...DEFAULT_CHROME },
  }

  switch (type) {
    case "header":
      return {
        ...common,
        type,
        brand: "Brand",
        tagline: "A short brand message",
        showLogo: true,
      }
    case "heading":
      return { ...common, type, text: "New heading", size: "md" }
    case "paragraph":
      return {
        ...common,
        type,
        text: "Write your message here.",
        muted: false,
      }
    case "button":
      return {
        ...common,
        type,
        label: "Learn more",
        url: "https://example.com",
        style: "filled",
        fullWidth: false,
      }
    case "image":
      return {
        ...common,
        type,
        alt: "Image",
        caption: "",
        href: "",
        fit: "cover",
        rounded: true,
      }
    case "footer":
      return {
        ...common,
        type,
        company: "Company",
        address: "",
        showUnsubscribe: true,
        showSocial: false,
      }
  }
}

function targetAllows(parent: EmailNode, child: EmailNode): boolean {
  if (!isContainer(parent)) return false
  if (parent.type === "row") return child.type === "column"
  return child.type !== "body" && child.type !== "column"
}

function resolveTarget(
  document: EmailDocument,
  into: ContainerId
): EmailNode | EditRejection {
  const node = document.nodes[into]
  if (!node) return "unknown-node"
  if (!asContainer(document, into)) return "not-a-container"
  return node
}

function validateBefore(
  document: EmailDocument,
  parent: ContainerId,
  before: NodeId | null
): EditRejection | null {
  if (before === null) return null
  const node = document.nodes[before]
  if (!node) return "unknown-node"
  return node.parent === parent ? null : "type-mismatch"
}

function orderForPosition(
  nodes: EmailDocument["nodes"],
  parent: ContainerId,
  before: NodeId | null,
  exclude: NodeId | null
): { nodes: EmailDocument["nodes"]; order: OrderKey } {
  let siblings = Object.values(nodes)
    .filter((node) => node.parent === parent && node.id !== exclude)
    .sort(
      (left, right) =>
        left.order.localeCompare(right.order) ||
        left.id.localeCompare(right.id)
    )
  const beforeIndex =
    before === null
      ? siblings.length
      : siblings.findIndex((node) => node.id === before)
  const index = beforeIndex < 0 ? siblings.length : beforeIndex
  const after = siblings[index - 1]?.order ?? null
  const next = siblings[index]?.order ?? null

  try {
    return { nodes, order: keyBetween(after, next) }
  } catch {
    const gap = ORDER_MAX / BigInt(siblings.length + 2)
    const renumbered = { ...nodes }
    siblings = siblings.map((node, siblingIndex) => {
      const order = orderKeyFromString(
        (gap * BigInt(siblingIndex + 1)).toString(16).padStart(12, "0")
      )
      const nextNode = { ...node, order } as EmailNode
      renumbered[node.id] = nextNode
      return nextNode
    })
    const previousOrder = siblings[index - 1]?.order ?? null
    const nextOrder = siblings[index]?.order ?? null
    return {
      nodes: renumbered,
      order: keyBetween(previousOrder, nextOrder),
    }
  }
}

function rowDepthAbove(document: EmailDocument, parent: ContainerId): number {
  const parentNode = document.nodes[parent]
  if (!parentNode) return 0
  const parentRows = parentNode.type === "row" ? 1 : 0
  return (
    parentRows +
    ancestorsOf(document, parentNode.id).filter((node) => node.type === "row")
      .length
  )
}

function maxRowsInSubtree(
  document: EmailDocument,
  id: NodeId,
  currentDepth = 0
): number {
  const node = document.nodes[id]
  if (!node) return currentDepth
  const nextDepth = currentDepth + (node.type === "row" ? 1 : 0)
  if (!isContainer(node)) return nextDepth
  return Math.max(
    nextDepth,
    ...childrenOf(document, node.id as ContainerId).map((child) =>
      maxRowsInSubtree(document, child.id, nextDepth)
    )
  )
}

function wouldExceedRowLimit(
  document: EmailDocument,
  node: NodeId,
  into: ContainerId
): boolean {
  return (
    rowDepthAbove(document, into) + maxRowsInSubtree(document, node) >
    MAX_ROW_NESTING
  )
}

function insertLeaf(
  document: EmailDocument,
  edit: Extract<EmailEdit, { kind: "insertLeaf" }>
): EditOutcome {
  const target = resolveTarget(document, edit.into)
  if (typeof target === "string") return { ok: false, reason: target }
  if (target.type === "row") return { ok: false, reason: "type-mismatch" }
  const invalidBefore = validateBefore(document, edit.into, edit.before)
  if (invalidBefore) return { ok: false, reason: invalidBefore }
  const placement = orderForPosition(
    document.nodes,
    edit.into,
    edit.before,
    null
  )
  const leaf = createLeaf(document, edit.type, edit.into, placement.order)
  return updated(
    document,
    { ...placement.nodes, [leaf.id]: leaf },
    leaf.id
  )
}

function insertRow(
  document: EmailDocument,
  edit: Extract<EmailEdit, { kind: "insertRow" }>
): EditOutcome {
  const target = resolveTarget(document, edit.into)
  if (typeof target === "string") return { ok: false, reason: target }
  if (target.type === "row") return { ok: false, reason: "type-mismatch" }
  if (rowDepthAbove(document, edit.into) + 1 > MAX_ROW_NESTING)
    return { ok: false, reason: "row-nesting-limit" }
  const invalidBefore = validateBefore(document, edit.into, edit.before)
  if (invalidBefore) return { ok: false, reason: invalidBefore }

  const placement = orderForPosition(
    document.nodes,
    edit.into,
    edit.before,
    null
  )
  const reserved = new Set<NodeId>()
  const rowId = uniqueNodeId(document, "row", reserved)
  const row: EmailNode = {
    id: rowId,
    type: "row",
    parent: edit.into,
    order: placement.order,
    flex: 1,
    chrome: { ...DEFAULT_CHROME, padding: "none" },
    gap: "md",
    stackOnMobile: true,
  }
  const nodes = { ...placement.nodes, [row.id]: row }
  let previousOrder: OrderKey | null = null

  for (let index = 0; index < edit.columns; index += 1) {
    const columnId = uniqueNodeId(document, "column", reserved)
    const order = keyBetween(previousOrder, null)
    nodes[columnId] = {
      id: columnId,
      type: "column",
      parent: rowId as ContainerId,
      order,
      flex: 1,
      chrome: { ...DEFAULT_CHROME, padding: "none" },
      vAlign: "top",
    }
    previousOrder = order
  }

  return updated(document, nodes, rowId)
}

function moveNode(
  document: EmailDocument,
  edit: Extract<EmailEdit, { kind: "move" }>
): EditOutcome {
  const node = document.nodes[edit.node]
  if (!node) return { ok: false, reason: "unknown-node" }
  if (node.type === "body") return { ok: false, reason: "type-mismatch" }
  const target = resolveTarget(document, edit.into)
  if (typeof target === "string") return { ok: false, reason: target }
  if (!targetAllows(target, node))
    return { ok: false, reason: "type-mismatch" }
  const invalidBefore = validateBefore(document, edit.into, edit.before)
  if (invalidBefore) return { ok: false, reason: invalidBefore }
  if (
    node.id === edit.into ||
    (isContainer(node) &&
      ancestorsOf(document, edit.into).some(
        (ancestor) => ancestor.id === node.id
      ))
  )
    return { ok: false, reason: "would-cycle" }
  if (wouldExceedRowLimit(document, node.id, edit.into))
    return { ok: false, reason: "row-nesting-limit" }

  const currentSiblings = childrenOf(
    document,
    node.parent as ContainerId
  )
  const currentIndex = currentSiblings.findIndex(
    (sibling) => sibling.id === node.id
  )
  const currentBefore = currentSiblings[currentIndex + 1]?.id ?? null
  if (
    node.parent === edit.into &&
    (edit.before === node.id || edit.before === currentBefore)
  )
    return unchanged(document, node.id)

  const placement = orderForPosition(
    document.nodes,
    edit.into,
    edit.before,
    node.id
  )
  const moved = {
    ...node,
    parent: edit.into,
    order: placement.order,
  } as EmailNode
  return updated(
    document,
    { ...placement.nodes, [node.id]: moved },
    node.id
  )
}

function duplicateNode(
  document: EmailDocument,
  edit: Extract<EmailEdit, { kind: "duplicate" }>
): EditOutcome {
  const source = document.nodes[edit.node]
  if (!source) return { ok: false, reason: "unknown-node" }
  if (source.type === "body" || source.parent === null)
    return { ok: false, reason: "type-mismatch" }

  const siblings = childrenOf(document, source.parent)
  const sourceIndex = siblings.findIndex((node) => node.id === source.id)
  const before = siblings[sourceIndex + 1]?.id ?? null
  const placement = orderForPosition(
    document.nodes,
    source.parent,
    before,
    null
  )
  const reserved = new Set<NodeId>()
  const idMap = new Map<NodeId, NodeId>()

  function cloneSubtree(id: NodeId, parent: ContainerId): EmailNode[] {
    const node = document.nodes[id]
    if (!node) return []
    const cloneId = uniqueNodeId(document, node.type, reserved)
    idMap.set(node.id, cloneId)
    const clone = {
      ...node,
      id: cloneId,
      parent,
      order: node.id === source.id ? placement.order : node.order,
      chrome: { ...node.chrome },
    } as EmailNode
    if (!isContainer(node)) return [clone]
    return [
      clone,
      ...childrenOf(document, node.id as ContainerId).flatMap((child) =>
        cloneSubtree(child.id, cloneId as ContainerId)
      ),
    ]
  }

  const clones = cloneSubtree(source.id, source.parent)
  const nodes = { ...placement.nodes }
  for (const clone of clones) nodes[clone.id] = clone
  const focus = idMap.get(source.id) ?? null
  return updated(document, nodes, focus)
}

function removeNode(
  document: EmailDocument,
  edit: Extract<EmailEdit, { kind: "remove" }>
): EditOutcome {
  const node = document.nodes[edit.node]
  if (!node) return { ok: false, reason: "unknown-node" }
  if (node.type === "body")
    return { ok: false, reason: "cannot-remove-body" }

  const removeIds = new Set<NodeId>([node.id])
  let changed = true
  while (changed) {
    changed = false
    for (const candidate of Object.values(document.nodes)) {
      if (
        candidate.parent !== null &&
        removeIds.has(candidate.parent) &&
        !removeIds.has(candidate.id)
      ) {
        removeIds.add(candidate.id)
        changed = true
      }
    }
  }
  const nodes = { ...document.nodes }
  for (const id of removeIds) delete nodes[id]
  return updated(document, nodes, null)
}

function editNode(
  document: EmailDocument,
  edit: AnyEditNode
): EditOutcome {
  const node = document.nodes[edit.node]
  if (!node) return { ok: false, reason: "unknown-node" }
  if (node.type !== edit.nodeType)
    return { ok: false, reason: "type-mismatch" }
  const patch = edit.patch as Record<string, unknown>
  if (
    "id" in patch ||
    "type" in patch ||
    "parent" in patch ||
    "order" in patch
  )
    return { ok: false, reason: "type-mismatch" }
  const parsed = EmailNodeSchema.safeParse({ ...node, ...patch })
  if (!parsed.success) return { ok: false, reason: "type-mismatch" }
  if (JSON.stringify(parsed.data) === JSON.stringify(node))
    return unchanged(document, node.id)
  return updated(
    document,
    { ...document.nodes, [node.id]: parsed.data },
    node.id
  )
}

function setText(
  document: EmailDocument,
  edit: Extract<EmailEdit, { kind: "setText" }>
): EditOutcome {
  const node = document.nodes[edit.node]
  if (!node) return { ok: false, reason: "unknown-node" }
  if (node.type !== "heading" && node.type !== "paragraph")
    return { ok: false, reason: "type-mismatch" }
  if (node.text === edit.html) return unchanged(document, node.id)
  return updated(
    document,
    { ...document.nodes, [node.id]: { ...node, text: edit.html } },
    node.id
  )
}

function setMeta(
  document: EmailDocument,
  edit: Extract<EmailEdit, { kind: "setMeta" }>
): EditOutcome {
  const parsed = EmailMetaSchema.safeParse({
    ...document.meta,
    ...edit.patch,
  })
  if (!parsed.success) return { ok: false, reason: "type-mismatch" }
  if (JSON.stringify(parsed.data) === JSON.stringify(document.meta))
    return unchanged(document, null)
  return {
    ok: true,
    doc: {
      ...document,
      meta: parsed.data,
      updatedAt: new Date().toISOString(),
    },
    changed: true,
    focus: null,
  }
}

export function applyEdit(
  document: EmailDocument,
  edit: EmailEdit
): EditOutcome {
  try {
    switch (edit.kind) {
      case "insertLeaf":
        return insertLeaf(document, edit)
      case "insertRow":
        return insertRow(document, edit)
      case "move":
        return moveNode(document, edit)
      case "duplicate":
        return duplicateNode(document, edit)
      case "remove":
        return removeNode(document, edit)
      case "editNode":
        return editNode(document, edit)
      case "setText":
        return setText(document, edit)
      case "setMeta":
        return setMeta(document, edit)
    }
  } catch {
    return { ok: false, reason: "type-mismatch" }
  }
}

export function coalesceKey(edit: EmailEdit): string | null {
  switch (edit.kind) {
    case "setText":
      return `text:${edit.node}`
    case "setMeta":
      return "meta"
    case "editNode":
      return `node:${edit.node}`
    default:
      return null
  }
}
