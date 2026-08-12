import type { NodeKind } from "./schema.ts"

declare const nodeBrand: unique symbol
declare const containerBrand: unique symbol
declare const orderBrand: unique symbol

export type NodeId = string & { readonly [nodeBrand]: true }
export type ContainerId = NodeId & { readonly [containerBrand]: true }
export type OrderKey = string & { readonly [orderBrand]: true }

const ORDER_WIDTH = 12
const ORDER_MAX = BigInt(`0x${"f".repeat(ORDER_WIDTH)}`)
let fallbackSequence = 0

export function nodeIdFromString(value: string): NodeId {
  return value as NodeId
}

export function containerIdFromString(value: string): ContainerId {
  return value as ContainerId
}

export function orderKeyFromString(value: string): OrderKey {
  return value as OrderKey
}

function decodeOrder(key: OrderKey | null, fallback: bigint): bigint {
  if (key === null) return fallback
  if (!/^[0-9a-f]{12}$/.test(key))
    throw new RangeError(`Invalid order key: ${key}`)
  return BigInt(`0x${key}`)
}

function encodeOrder(value: bigint): OrderKey {
  return orderKeyFromString(value.toString(16).padStart(ORDER_WIDTH, "0"))
}

export function keyBetween(
  after: OrderKey | null,
  before: OrderKey | null
): OrderKey {
  const lower = decodeOrder(after, 0n)
  const upper = decodeOrder(before, ORDER_MAX)
  if (lower >= upper || upper - lower <= 1n)
    throw new RangeError("Order key space exhausted")
  return encodeOrder((lower + upper) / 2n)
}

export function nextNodeId(kind: NodeKind): NodeId {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return nodeIdFromString(`${kind}-${uuid}`)
  fallbackSequence += 1
  return nodeIdFromString(
    `${kind}-${Date.now().toString(36)}-${fallbackSequence.toString(36)}`
  )
}
