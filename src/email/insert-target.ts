import type { ContainerId } from "./ids.ts"
import type { EmailDocument } from "./schema.ts"
import { childrenOf, nodeAt } from "./tree.ts"

/**
 * Containers that accept leaves and nested rows: body + columns.
 * Rows only accept columns (created via insertRow), never palette leaves.
 */
export function resolveContentInsertTarget(
  document: EmailDocument,
  selectedId: string | null
): ContainerId {
  const selected = nodeAt(document, selectedId)
  if (!selected) return document.root

  if (selected.type === "column") return selected.id as ContainerId
  if (selected.type === "body") return document.root

  if (selected.type === "row") {
    const columns = childrenOf(document, selected.id as ContainerId).filter(
      (child) => child.type === "column"
    )
    if (columns[0]) return columns[0]!.id as ContainerId
    return selected.parent ?? document.root
  }

  // Leaf (or unexpected): insert into its parent when that parent accepts content.
  if (selected.parent) {
    const parent = nodeAt(document, selected.parent)
    if (parent?.type === "column" || parent?.type === "body")
      return selected.parent as ContainerId
  }

  return document.root
}
