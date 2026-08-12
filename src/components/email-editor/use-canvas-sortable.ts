import { useEffect, useRef, type RefObject } from "react"
import { Sortable } from "@shopify/draggable"

export interface CanvasMovePayload {
  id: string
  into: string
  before: string | null
}

function isMirrorOrOriginal(el: Element): boolean {
  return (
    el.classList.contains("draggable-mirror") ||
    el.classList.contains("draggable--original")
  )
}

function sortableItems(container: HTMLElement): HTMLElement[] {
  return [
    ...container.querySelectorAll<HTMLElement>(":scope > [data-sortable-item]"),
  ].filter((el) => !isMirrorOrOriginal(el))
}

/** Put the dragged node back where React last rendered it. */
function revertSourceToOldPosition(
  source: HTMLElement,
  oldContainer: HTMLElement,
  oldIndex: number
) {
  const others = [...oldContainer.children].filter(
    (el) => el !== source && !isMirrorOrOriginal(el)
  )
  const ref = others[oldIndex] ?? null
  if (ref) oldContainer.insertBefore(source, ref)
  else oldContainer.appendChild(source)
}

/**
 * Multi-container Sortable for body + row strips + columns.
 * Reverts DOM before React commits so reconciliation stays valid.
 */
export function useCanvasSortable(
  rootRef: RefObject<HTMLElement | null>,
  {
    enabled,
    layoutKey,
    onMove,
  }: {
    enabled: boolean
    layoutKey: string
    onMove: (payload: CanvasMovePayload) => boolean
  }
) {
  const onMoveRef = useRef(onMove)
  onMoveRef.current = onMove

  useEffect(() => {
    if (!enabled) return
    const root = rootRef.current
    if (!root) return

    const containers = [
      ...root.querySelectorAll<HTMLElement>("[data-sortable-container]"),
    ]
    if (containers.length === 0) return

    const sortable = new Sortable(containers, {
      draggable: "[data-sortable-item]",
      handle: "[data-drag-handle]",
      mirror: {
        constrainDimensions: true,
        xAxis: true,
        yAxis: true,
        appendTo: "body",
      },
      distance: 3,
    })

    function clearTargets() {
      root
        .querySelectorAll(".email-drop-target")
        .forEach((el) => el.classList.remove("email-drop-target"))
    }

    sortable.on("sortable:sort", (event) => {
      const source = event.dragEvent.source as HTMLElement | null
      const over = event.dragEvent.over as HTMLElement | null
      const overContainer = event.dragEvent.overContainer as HTMLElement | null
      if (!source || !overContainer) return

      const sourceType = source.dataset.nodeType
      const kind = overContainer.dataset.containerKind
      const sourceParent = source.parentElement as HTMLElement | null

      // Columns only reorder inside a row strip (left/right).
      if (sourceType === "column") {
        if (kind !== "row") event.cancel()
        return
      }

      // Row strips only accept columns.
      if (kind === "row") {
        event.cancel()
        return
      }

      // Body-level rows must not accidentally nest into a sibling row's column.
      if (
        sourceType === "row" &&
        sourceParent?.dataset.containerKind === "body" &&
        kind === "column"
      ) {
        event.cancel()
        return
      }

      if (sourceType === "row") return

      // Leaves crossing row chrome toward another column.
      if (kind === "body") {
        if (
          over?.dataset.nodeType === "row" ||
          over?.closest?.("[data-node-type='row']")
        ) {
          event.cancel()
        }
      }
    })

    sortable.on("drag:over:container", (event) => {
      clearTargets()
      const over = event.overContainer as HTMLElement | null
      const source = event.source as HTMLElement | null
      if (!over || !source) return

      if (source.dataset.nodeType === "column") {
        if (over.dataset.containerKind === "row")
          over.classList.add("email-drop-target")
        return
      }

      if (
        source.dataset.nodeType === "row" &&
        (source.parentElement as HTMLElement | null)?.dataset.containerKind ===
          "body"
      ) {
        return
      }

      if (over.dataset.containerKind === "column")
        over.classList.add("email-drop-target")
    })

    sortable.on("drag:stop", () => {
      clearTargets()
    })

    sortable.on("sortable:stop", (event) => {
      const source = event.dragEvent.source as HTMLElement | null
      const id = source?.dataset.blockId
      const newContainer = event.newContainer as HTMLElement | null
      const oldContainer = event.oldContainer as HTMLElement | null
      const oldIndex = event.oldIndex
      const into = newContainer?.dataset.parentId

      if (
        !source ||
        !id ||
        !into ||
        !newContainer ||
        !oldContainer ||
        oldIndex == null
      )
        return

      const sameSpot =
        oldContainer === newContainer && oldIndex === event.newIndex
      if (sameSpot) {
        revertSourceToOldPosition(source, oldContainer, oldIndex)
        return
      }

      const items = sortableItems(newContainer)
      const index = items.findIndex((el) => el.dataset.blockId === id)
      const before =
        index >= 0 ? (items[index + 1]?.dataset.blockId ?? null) : null

      source.style.visibility = "hidden"
      revertSourceToOldPosition(source, oldContainer, oldIndex)

      const payload: CanvasMovePayload = { id, into, before }
      requestAnimationFrame(() => {
        onMoveRef.current(payload)
      })
    })

    return () => {
      clearTargets()
      sortable.destroy()
    }
  }, [enabled, layoutKey, rootRef])
}
