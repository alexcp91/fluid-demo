import type { ContainerId } from "./ids.ts"
import type {
  Align,
  BlockChrome,
  EmailDocument,
  EmailNode,
  LeafNode,
  Spacing,
  VAlign,
} from "./schema.ts"
import { childrenOf, isContainer } from "./tree.ts"

export interface LayoutLeaf {
  kind: "leaf"
  node: LeafNode
}

export interface LayoutColumn {
  kind: "column"
  id: string
  flex: number
  vAlign: VAlign
  chrome: BlockChrome
  children: LayoutChild[]
}

export interface LayoutRow {
  kind: "row"
  id: string
  gap: Spacing
  stackOnMobile: boolean
  chrome: BlockChrome
  columns: LayoutColumn[]
}

export type LayoutChild = LayoutLeaf | LayoutRow

export interface LayoutTree {
  width: number
  align: Align
  children: LayoutChild[]
}

function compileNode(document: EmailDocument, node: EmailNode): LayoutChild | null {
  if (!node.chrome.visible) return null
  if (node.type === "row") {
    const columns = childrenOf(document, node.id as ContainerId)
      .filter(
        (child): child is Extract<EmailNode, { type: "column" }> =>
          child.type === "column" && child.chrome.visible
      )
      .map((column) => {
        const kids = childrenOf(document, column.id as ContainerId)
          .map((child) => compileNode(document, child))
          .filter((child): child is LayoutChild => child !== null)
        return {
          kind: "column" as const,
          id: column.id,
          flex: column.flex,
          vAlign: column.vAlign,
          chrome: column.chrome,
          children: kids,
        }
      })
    return {
      kind: "row",
      id: node.id,
      gap: node.gap,
      stackOnMobile: node.stackOnMobile,
      chrome: node.chrome,
      columns,
    }
  }
  if (node.type === "column" || node.type === "body") return null
  return { kind: "leaf", node }
}

/** Flatten parent+order graph into a layout IR for canvas/export. */
export function compileLayout(document: EmailDocument): LayoutTree {
  const body = document.nodes[document.root]
  const children =
    body && isContainer(body)
      ? childrenOf(document, body.id as ContainerId)
          .map((node) => compileNode(document, node))
          .filter((child): child is LayoutChild => child !== null)
      : []

  return {
    width: Number(document.meta.width) || 600,
    align: body?.chrome.align ?? "left",
    children,
  }
}
