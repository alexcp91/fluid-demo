import { create } from "zustand"
import {
  applyEdit,
  coalesceKey as editCoalesceKey,
  type EmailEdit,
  type PatchFor,
} from "@/email/edit"
import {
  pushPast,
  takeRedo,
  takeUndo,
  type HistorySnapshot,
} from "@/email/history"
import { createInitialDocument, parseDocument } from "@/email/migrate"
import {
  EmailDocumentSchema,
  type BlockType,
  type DeviceMode,
  type EmailDocument,
  type EmailNode,
  type NodeKind,
} from "@/email/schema"
import {
  beforeIdAtIndex,
  childrenOf,
  nodeAt,
} from "@/email/tree"
import type { ContainerId, NodeId } from "@/email/ids"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

interface EmailEditorState {
  doc: EmailDocument
  selectedId: string | null
  device: DeviceMode
  dirty: boolean
  saveStatus: SaveStatus
  loadError: string | null
  paletteDragType: BlockType | null
  past: HistorySnapshot[]
  future: HistorySnapshot[]
  coalesceKey: string | null

  dispatch: (edit: EmailEdit) => boolean
  setMeta: (meta: Partial<EmailDocument["meta"]>) => void
  updateNode: <K extends NodeKind>(
    id: string,
    nodeType: K,
    patch: PatchFor<K>
  ) => boolean
  setText: (id: string, html: string) => boolean
  insertLeaf: (
    type: BlockType,
    into: string,
    before?: string | null
  ) => string | null
  insertLeafAt: (
    type: BlockType,
    into: string,
    index: number
  ) => string | null
  insertRow: (
    columns: 1 | 2 | 3,
    into: string,
    before?: string | null
  ) => string | null
  duplicateNode: (id: string) => string | null
  removeNode: (id: string) => void
  reorderChildren: (parent: string, orderedIds: string[]) => void
  select: (id: string | null) => void
  setDevice: (device: DeviceMode) => void
  setPaletteDragType: (type: BlockType | null) => void
  undo: () => boolean
  redo: () => boolean
  markClean: () => void
  load: (id: string) => Promise<void>
  save: () => Promise<void>
}

function snapshot(state: {
  doc: EmailDocument
  selectedId: string | null
}): HistorySnapshot {
  return { doc: state.doc, selectedId: state.selectedId }
}

function asContainerId(id: string): ContainerId {
  return id as ContainerId
}

function asNodeId(id: string): NodeId {
  return id as NodeId
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

  dispatch: (edit) => {
    const state = get()
    const outcome = applyEdit(state.doc, edit)
    if (!outcome.ok) return false
    if (!outcome.changed) {
      if (outcome.focus && outcome.focus !== state.selectedId)
        set({ selectedId: outcome.focus, coalesceKey: null })
      return true
    }
    const key = editCoalesceKey(edit)
    const sameCoalesce = key !== null && key === state.coalesceKey
    const past = sameCoalesce
      ? state.past
      : pushPast(state.past, snapshot(state))
    set({
      doc: outcome.doc,
      selectedId:
        outcome.focus !== undefined && outcome.focus !== null
          ? outcome.focus
          : state.selectedId,
      past,
      future: [],
      coalesceKey: key,
      dirty: true,
      saveStatus: "idle",
    })
    return true
  },

  setMeta: (meta) => {
    get().dispatch({ kind: "setMeta", patch: meta })
  },

  updateNode: (id, nodeType, patch) =>
    get().dispatch({
      kind: "editNode",
      nodeType,
      node: asNodeId(id),
      patch,
    } as EmailEdit),

  setText: (id, html) =>
    get().dispatch({ kind: "setText", node: asNodeId(id), html }),

  insertLeaf: (type, into, before = null) => {
    const ok = get().dispatch({
      kind: "insertLeaf",
      type,
      into: asContainerId(into),
      before: before === null ? null : asNodeId(before),
    })
    return ok ? get().selectedId : null
  },

  insertLeafAt: (type, into, index) => {
    const before = beforeIdAtIndex(
      get().doc,
      asContainerId(into),
      index
    )
    return get().insertLeaf(type, into, before)
  },

  insertRow: (columns, into, before = null) => {
    const ok = get().dispatch({
      kind: "insertRow",
      columns,
      into: asContainerId(into),
      before: before === null ? null : asNodeId(before),
    })
    return ok ? get().selectedId : null
  },

  duplicateNode: (id) => {
    const ok = get().dispatch({ kind: "duplicate", node: asNodeId(id) })
    return ok ? get().selectedId : null
  },

  removeNode: (id) => {
    const state = get()
    const ok = applyEdit(state.doc, {
      kind: "remove",
      node: asNodeId(id),
    })
    if (!ok.ok || !ok.changed) return
    set({
      doc: ok.doc,
      selectedId: state.selectedId === id ? null : state.selectedId,
      past: pushPast(state.past, snapshot(state)),
      future: [],
      coalesceKey: null,
      dirty: true,
      saveStatus: "idle",
    })
  },

  reorderChildren: (parent, orderedIds) => {
    const state = get()
    let doc = state.doc
    let changed = false
    for (let index = 0; index < orderedIds.length; index += 1) {
      const id = orderedIds[index]!
      const before = orderedIds[index + 1] ?? null
      const outcome = applyEdit(doc, {
        kind: "move",
        node: asNodeId(id),
        into: asContainerId(parent),
        before: before === null ? null : asNodeId(before),
      })
      if (!outcome.ok) continue
      if (outcome.changed) {
        doc = outcome.doc
        changed = true
      }
    }
    if (!changed) return
    set({
      doc,
      past: pushPast(state.past, snapshot(state)),
      future: [],
      coalesceKey: null,
      dirty: true,
      saveStatus: "idle",
    })
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
      const doc = parseDocument(json)
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
      const saved = parseDocument(await res.json())
      set({ doc: saved, dirty: false, saveStatus: "saved" })
    } catch (err) {
      set({ saveStatus: "error" })
      throw err
    }
  },
}))

export function useSelectedNode(): EmailNode | undefined {
  return useEmailStore((s) => nodeAt(s.doc, s.selectedId))
}

export function useRootChildren(): EmailNode[] {
  return useEmailStore((s) => childrenOf(s.doc, s.doc.root))
}

export function useCanUndo() {
  return useEmailStore((s) => s.past.length > 0)
}

export function useCanRedo() {
  return useEmailStore((s) => s.future.length > 0)
}
