import type { ContainerId, NodeId } from "./ids.ts"
import type {
  ContainerNode,
  EmailDocument,
  EmailNode,
} from "./schema.ts"

export function isContainer(node: EmailNode): node is ContainerNode {
  return (
    node.type === "body" ||
    node.type === "row" ||
    node.type === "column"
  )
}

export function nodeAt(
  document: EmailDocument,
  id: string | null
): EmailNode | undefined {
  return id === null ? undefined : document.nodes[id]
}

export function asContainer(
  document: EmailDocument,
  id: string | null
): ContainerId | null {
  const node = nodeAt(document, id)
  return node && isContainer(node) ? (node.id as ContainerId) : null
}

export function childrenOf(
  document: EmailDocument,
  parent: ContainerId
): EmailNode[] {
  return Object.values(document.nodes)
    .filter((node) => node.parent === parent)
    .sort(
      (left, right) =>
        left.order.localeCompare(right.order) ||
        left.id.localeCompare(right.id)
    )
}

export function ancestorsOf(
  document: EmailDocument,
  id: NodeId
): ContainerNode[] {
  const ancestors: ContainerNode[] = []
  const seen = new Set<NodeId>()
  let current = document.nodes[id]

  while (current?.parent !== null && current?.parent !== undefined) {
    if (seen.has(current.parent)) break
    seen.add(current.parent)
    const parent = document.nodes[current.parent]
    if (!parent || !isContainer(parent)) break
    ancestors.push(parent)
    current = parent
  }

  return ancestors
}

export function* walk(
  document: EmailDocument,
  from: ContainerId = document.root
): Iterable<{ node: EmailNode; depth: number }> {
  const root = document.nodes[from]
  if (!root || !isContainer(root)) return

  function* descend(
    parent: ContainerId,
    depth: number
  ): Iterable<{ node: EmailNode; depth: number }> {
    for (const node of childrenOf(document, parent)) {
      yield { node, depth }
      if (isContainer(node))
        yield* descend(node.id as ContainerId, depth + 1)
    }
  }

  yield* descend(from, 0)
}

export function beforeIdAtIndex(
  document: EmailDocument,
  parent: ContainerId,
  index: number,
  exclude: NodeId | null = null
): NodeId | null {
  const children = childrenOf(document, parent).filter(
    (node) => exclude === null || node.id !== exclude
  )
  const safeIndex = Math.max(0, Math.trunc(index))
  return children[safeIndex]?.id ?? null
}
