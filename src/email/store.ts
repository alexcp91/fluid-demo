import { create } from "zustand"
import {
  cloneBlock,
  createBlock as makeBlock,
  findBlock,
  insertBlock as insertBlockHelper,
  insertBlockAtIndex as insertBlockAtIndexHelper,
  insertIntoFrame as insertIntoFrameHelper,
  insertProductRow as insertProductRowHelper,
  removeBlock as removeBlockHelper,
  reorderBlocks as reorderBlocksHelper,
  updateBlock as updateBlockHelper,
  createInitialDocument,
} from "@/components/email-editor/types"
import {
  pushPast,
  takeRedo,
  takeUndo,
  type HistorySnapshot,
} from "@/email/history"
import {
  EmailDocumentSchema,
  type BlockType,
  type DeviceMode,
  type EmailDocument,
} from "@/email/schema"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

interface EmailEditorState {
  doc: EmailDocument
  selectedId: string | null
  device: DeviceMode
  dirty: boolean
  saveStatus: SaveStatus
  loadError: string | null
  /** Ephemeral: block type being dragged from the Add block palette. */
  paletteDragType: BlockType | null
  past: HistorySnapshot[]
  future: HistorySnapshot[]
  /** When set, consecutive commits with the same key share one undo step. */
  coalesceKey: string | null

  setDoc: (doc: EmailDocument) => void
  setMeta: (meta: Partial<EmailDocument["meta"]>) => void
  updateBlock: (id: string, patch: Record<string, unknown>) => void
  insertBlock: (type: BlockType, afterId?: string | null) => string
  insertBlockAt: (type: BlockType, index: number) => string
  insertIntoFrame: (frameId: string, type: BlockType, index?: number) => string
  insertProductRow: (options?: {
    columns?: number
    afterId?: string | null
  }) => string
  duplicateBlock: (id: string) => string | null
  removeBlock: (id: string) => void
  reorderBlocks: (orderedIds: string[]) => void
  select: (id: string | null) => void
  setDevice: (device: DeviceMode) => void
  setPaletteDragType: (type: BlockType | null) => void
  undo: () => boolean
  redo: () => boolean
  markClean: () => void
  load: (id: string) => Promise<void>
  save: () => Promise<void>
}

function touch(doc: EmailDocument): EmailDocument {
  return { ...doc, updatedAt: new Date().toISOString() }
}

function snapshot(state: {
  doc: EmailDocument
  selectedId: string | null
}): HistorySnapshot {
  return { doc: state.doc, selectedId: state.selectedId }
}

type Mutator = (state: EmailEditorState) => Partial<EmailEditorState>

function commit(
  get: () => EmailEditorState,
  set: (
    partial:
      | Partial<EmailEditorState>
      | ((s: EmailEditorState) => Partial<EmailEditorState>)
  ) => void,
  mutate: Mutator,
  coalesceKey: string | null = null
) {
  const state = get()
  const snap = snapshot(state)
  const sameCoalesce =
    coalesceKey !== null && coalesceKey === state.coalesceKey
  const past = sameCoalesce ? state.past : pushPast(state.past, snap)
  const next = mutate(state)
  set({
    ...next,
    past,
    future: [],
    coalesceKey,
    dirty: true,
    saveStatus: "idle",
  })
}

export const useEmailStore = create<EmailEditorState>((set, get) => ({
  doc: createInitialDocument("welcome"),
  selectedId: null,
  device: "desktop",
  dirty: false,
  saveStatus: "idle",
  loadError: null,
  paletteDragType: null,
  past: [],
  future: [],
  coalesceKey: null,

  setDoc: (doc) => {
    commit(get, set, () => ({ doc: touch(doc) }))
  },

  setMeta: (meta) => {
    commit(
      get,
      set,
      (s) => ({
        doc: touch({ ...s.doc, meta: { ...s.doc.meta, ...meta } }),
      }),
      "meta"
    )
  },

  updateBlock: (id, patch) => {
    commit(
      get,
      set,
      (s) => ({
        doc: touch(updateBlockHelper(s.doc, id, patch)),
      }),
      `update:${id}`
    )
  },

  insertBlock: (type, afterId = null) => {
    const block = makeBlock(type)
    commit(get, set, (s) => {
      const after = afterId === undefined ? s.selectedId : afterId
      return {
        doc: touch(insertBlockHelper(s.doc, block, after)),
        selectedId: block.id,
      }
    })
    return block.id
  },

  insertBlockAt: (type, index) => {
    const block = makeBlock(type)
    commit(get, set, (s) => ({
      doc: touch(insertBlockAtIndexHelper(s.doc, block, index)),
      selectedId: block.id,
    }))
    return block.id
  },

  insertIntoFrame: (frameId, type, index) => {
    const block = makeBlock(type)
    commit(get, set, (s) => ({
      doc: touch(insertIntoFrameHelper(s.doc, frameId, block, index)),
      selectedId: block.id,
    }))
    return block.id
  },

  insertProductRow: (options = {}) => {
    let rowId = ""
    commit(get, set, (s) => {
      const result = insertProductRowHelper(s.doc, {
        columns: options.columns,
        afterId:
          options.afterId === undefined ? s.selectedId : options.afterId,
      })
      rowId = result.rowId
      return {
        doc: touch(result.doc),
        selectedId: result.rowId,
      }
    })
    return rowId
  },

  duplicateBlock: (id) => {
    const source = findBlock(get().doc, id)
    if (!source) return null
    const block = cloneBlock(source)
    commit(get, set, (s) => ({
      doc: touch(insertBlockHelper(s.doc, block, id)),
      selectedId: block.id,
    }))
    return block.id
  },

  removeBlock: (id) => {
    commit(get, set, (s) => ({
      doc: touch(removeBlockHelper(s.doc, id)),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }))
  },

  reorderBlocks: (orderedIds) => {
    commit(get, set, (s) => ({
      doc: touch(reorderBlocksHelper(s.doc, orderedIds)),
    }))
  },

  select: (id) => set({ selectedId: id, coalesceKey: null }),

  setDevice: (device) => set({ device }),

  setPaletteDragType: (type) => set({ paletteDragType: type }),

  undo: () => {
    const state = get()
    const step = takeUndo({
      past: state.past,
      future: state.future,
      current: snapshot(state),
    })
    if (!step) return false
    set({
      doc: step.restore.doc,
      selectedId: step.restore.selectedId,
      past: step.past,
      future: step.future,
      coalesceKey: null,
      dirty: true,
      saveStatus: "idle",
    })
    return true
  },

  redo: () => {
    const state = get()
    const step = takeRedo({
      past: state.past,
      future: state.future,
      current: snapshot(state),
    })
    if (!step) return false
    set({
      doc: step.restore.doc,
      selectedId: step.restore.selectedId,
      past: step.past,
      future: step.future,
      coalesceKey: null,
      dirty: true,
      saveStatus: "idle",
    })
    return true
  },

  markClean: () => set({ dirty: false, saveStatus: "saved" }),

  load: async (id) => {
    set({ loadError: null, saveStatus: "idle" })
    try {
      const res = await fetch(`/api/emails/${encodeURIComponent(id)}`)
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to load (${res.status})`)
      }
      const json = await res.json()
      const doc = EmailDocumentSchema.parse(json)
      set({
        doc,
        selectedId: null,
        dirty: false,
        saveStatus: "idle",
        loadError: null,
        past: [],
        future: [],
        coalesceKey: null,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load"
      set({ loadError: message })
      throw err
    }
  },

  save: async () => {
    const { doc } = get()
    set({ saveStatus: "saving" })
    try {
      const payload = EmailDocumentSchema.parse({
        ...doc,
        updatedAt: new Date().toISOString(),
      })
      const res = await fetch(`/api/emails/${encodeURIComponent(payload.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Save failed (${res.status})`)
      }
      const saved = EmailDocumentSchema.parse(await res.json())
      set({ doc: saved, dirty: false, saveStatus: "saved" })
    } catch (err) {
      set({ saveStatus: "error" })
      throw err
    }
  },
}))

export function useSelectedBlock() {
  return useEmailStore((s) => findBlock(s.doc, s.selectedId))
}

export function useCanUndo() {
  return useEmailStore((s) => s.past.length > 0)
}

export function useCanRedo() {
  return useEmailStore((s) => s.future.length > 0)
}
