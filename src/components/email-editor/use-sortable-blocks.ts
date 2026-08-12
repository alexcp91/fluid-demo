import { useEffect, useRef, type RefObject } from "react"
import { Sortable } from "@shopify/draggable"

interface UseSortableBlocksOptions {
  order: string[]
  onReorder: (next: string[]) => void
  draggable?: string
  handle?: string
}

/**
 * Shopify Draggable Sortable — reorders `[data-block-id]` children and
 * reports the new order on drop. Handle-only so inline editing still works.
 */
export function useSortableBlocks(
  containerRef: RefObject<HTMLElement | null>,
  {
    order,
    onReorder,
    draggable = "[data-sortable-item]",
    handle = "[data-drag-handle]",
  }: UseSortableBlocksOptions
) {
  const onReorderRef = useRef(onReorder)
  const orderRef = useRef(order)
  onReorderRef.current = onReorder
  orderRef.current = order
  const orderKey = order.join(",")

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const sortable = new Sortable(container, {
      draggable,
      handle,
      mirror: {
        constrainDimensions: true,
        xAxis: false,
      },
      distance: 4,
    })

    sortable.on("sortable:stop", () => {
      // Direct children only — nested frame descendants also carry
      // data-block-id and must not pollute the parent order.
      const next = [
        ...container.querySelectorAll<HTMLElement>(
          `:scope > ${draggable}`
        ),
      ]
        .filter(
          (el) =>
            !el.classList.contains("draggable-mirror") &&
            !el.classList.contains("draggable--original")
        )
        .map((el) => el.dataset.blockId)
        .filter((id): id is string => Boolean(id))

      const unique: string[] = []
      for (const id of next) {
        if (!unique.includes(id)) unique.push(id)
      }

      const prev = orderRef.current
      if (
        unique.length === prev.length &&
        unique.some((id, i) => id !== prev[i])
      ) {
        onReorderRef.current(unique)
      }
    })

    return () => {
      sortable.destroy()
    }
  }, [containerRef, orderKey, draggable, handle])
}
