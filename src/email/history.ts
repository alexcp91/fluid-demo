import type { EmailDocument } from "@/email/schema"

/** Document + selection restored as one undo step. */
export interface HistorySnapshot {
  doc: EmailDocument
  selectedId: string | null
}

const MAX_PAST = 50

export function pushPast(
  past: HistorySnapshot[],
  snap: HistorySnapshot
): HistorySnapshot[] {
  return [...past, snap].slice(-MAX_PAST)
}

export function takeUndo(args: {
  past: HistorySnapshot[]
  future: HistorySnapshot[]
  current: HistorySnapshot
}): {
  past: HistorySnapshot[]
  future: HistorySnapshot[]
  restore: HistorySnapshot
} | null {
  if (args.past.length === 0) return null
  const restore = args.past[args.past.length - 1]!
  return {
    past: args.past.slice(0, -1),
    future: [args.current, ...args.future],
    restore,
  }
}

export function takeRedo(args: {
  past: HistorySnapshot[]
  future: HistorySnapshot[]
  current: HistorySnapshot
}): {
  past: HistorySnapshot[]
  future: HistorySnapshot[]
  restore: HistorySnapshot
} | null {
  if (args.future.length === 0) return null
  const [restore, ...rest] = args.future
  return {
    past: pushPast(args.past, args.current),
    future: rest,
    restore: restore!,
  }
}
