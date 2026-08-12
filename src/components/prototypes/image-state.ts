import type { Align, VAlign } from "@/email/schema"

export const SIZE_MODES = ["auto", "fixed", "max"] as const
export const SOURCE_MODES = ["upload", "url", "icons"] as const
export const IMAGE_SOURCES = ["landscape", "portrait", "icon"] as const
export const DEVICE_MODES = ["desktop", "mobile"] as const
export const BORDER_STYLES = ["solid", "dashed", "dotted"] as const
export const BACKGROUND_KINDS = ["none", "color", "image"] as const
export const QUAD_EDGES = ["top", "right", "bottom", "left"] as const
export const CORNER_EDGES = [
  "topLeft",
  "topRight",
  "bottomRight",
  "bottomLeft",
] as const

export type SizeMode = (typeof SIZE_MODES)[number]
export type SourceMode = (typeof SOURCE_MODES)[number]
export type ImageSource = (typeof IMAGE_SOURCES)[number]
export type DeviceMode = (typeof DEVICE_MODES)[number]
export type BorderStyle = (typeof BORDER_STYLES)[number]
export type BackgroundKind = (typeof BACKGROUND_KINDS)[number]
export type QuadEdge = (typeof QUAD_EDGES)[number]
export type CornerEdge = (typeof CORNER_EDGES)[number]

export interface Quad {
  top: number
  right: number
  bottom: number
  left: number
  linked: boolean
}

export interface Corners {
  topLeft: number
  topRight: number
  bottomRight: number
  bottomLeft: number
  linked: boolean
}

export interface ImageBorder {
  width: number
  style: BorderStyle
  color: string
}

export interface ImageChrome {
  visible: boolean
  widthMode: SizeMode
  widthPx: number
  heightMode: SizeMode
  heightPx: number
  align: Align
  vAlign: VAlign
  corners: Corners
  padding: Quad
  margin: Quad
  borderEnabled: boolean
  border: ImageBorder
  background: BackgroundKind
  backgroundColor: string
}

export interface ImagePrototypeState {
  sourceMode: SourceMode
  source: ImageSource
  imageUrl: string
  alt: string
  href: string
  openInNewTab: boolean
  dynamicContent: boolean
  device: DeviceMode
  desktop: ImageChrome
  mobile: ImageChrome
}

export const SOURCE_SRC = {
  landscape: "/prototypes/landscape.svg",
  portrait: "/prototypes/portrait.svg",
  icon: "/prototypes/icon.svg",
} as const satisfies Record<ImageSource, string>

export const SOURCE_LABEL = {
  landscape: "landscape.svg",
  portrait: "portrait.svg",
  icon: "icon.svg",
} as const satisfies Record<ImageSource, string>

export const SOURCE_BYTES = {
  landscape: "18 KB",
  portrait: "12 KB",
  icon: "4 KB",
} as const satisfies Record<ImageSource, string>

export function linkedQuad(value: number): Quad {
  return { top: value, right: value, bottom: value, left: value, linked: true }
}

export function linkedCorners(value: number): Corners {
  return {
    topLeft: value,
    topRight: value,
    bottomRight: value,
    bottomLeft: value,
    linked: true,
  }
}

export function zeroQuad(): Quad {
  return linkedQuad(0)
}

export function zeroCorners(): Corners {
  return linkedCorners(0)
}

export function defaultImageChrome(): ImageChrome {
  return {
    visible: true,
    widthMode: "max",
    widthPx: 600,
    heightMode: "auto",
    heightPx: 180,
    align: "center",
    vAlign: "middle",
    corners: zeroCorners(),
    padding: zeroQuad(),
    margin: zeroQuad(),
    borderEnabled: false,
    border: { width: 1, style: "solid", color: "#171717" },
    background: "none",
    backgroundColor: "#F4F4F5",
  }
}

export function cloneChrome(chrome: ImageChrome): ImageChrome {
  return {
    ...chrome,
    corners: { ...chrome.corners },
    padding: { ...chrome.padding },
    margin: { ...chrome.margin },
    border: { ...chrome.border },
  }
}

export function defaultImagePrototype(): ImagePrototypeState {
  const chrome = defaultImageChrome()
  return {
    sourceMode: "upload",
    source: "landscape",
    imageUrl: "",
    alt: "Wool beanie",
    href: "",
    openInNewTab: false,
    dynamicContent: false,
    device: "desktop",
    desktop: chrome,
    mobile: { ...cloneChrome(chrome), widthPx: 320 },
  }
}

export function activeChrome(state: ImagePrototypeState): ImageChrome {
  switch (state.device) {
    case "desktop":
      return state.desktop
    case "mobile":
      return state.mobile
    default: {
      const exhaustive: never = state.device
      throw new Error(`Unhandled device: ${exhaustive}`)
    }
  }
}

export function patchChrome(
  state: ImagePrototypeState,
  patch: Partial<ImageChrome>
): ImagePrototypeState {
  switch (state.device) {
    case "desktop":
      return { ...state, desktop: { ...state.desktop, ...patch } }
    case "mobile":
      return { ...state, mobile: { ...state.mobile, ...patch } }
    default: {
      const exhaustive: never = state.device
      throw new Error(`Unhandled device: ${exhaustive}`)
    }
  }
}

export function setQuad(quad: Quad, edge: QuadEdge, value: number): Quad {
  if (quad.linked) {
    return {
      top: value,
      right: value,
      bottom: value,
      left: value,
      linked: true,
    }
  }
  switch (edge) {
    case "top":
      return { ...quad, top: value }
    case "right":
      return { ...quad, right: value }
    case "bottom":
      return { ...quad, bottom: value }
    case "left":
      return { ...quad, left: value }
    default: {
      const exhaustive: never = edge
      throw new Error(`Unhandled edge: ${exhaustive}`)
    }
  }
}

export function toggleQuadLink(quad: Quad): Quad {
  if (quad.linked) return { ...quad, linked: false }
  return {
    top: quad.top,
    right: quad.top,
    bottom: quad.top,
    left: quad.top,
    linked: true,
  }
}

export function setCorner(
  corners: Corners,
  edge: CornerEdge,
  value: number
): Corners {
  if (corners.linked) {
    return {
      topLeft: value,
      topRight: value,
      bottomRight: value,
      bottomLeft: value,
      linked: true,
    }
  }
  switch (edge) {
    case "topLeft":
      return { ...corners, topLeft: value }
    case "topRight":
      return { ...corners, topRight: value }
    case "bottomRight":
      return { ...corners, bottomRight: value }
    case "bottomLeft":
      return { ...corners, bottomLeft: value }
    default: {
      const exhaustive: never = edge
      throw new Error(`Unhandled corner: ${exhaustive}`)
    }
  }
}

export function toggleCornerLink(corners: Corners): Corners {
  if (corners.linked) return { ...corners, linked: false }
  return {
    topLeft: corners.topLeft,
    topRight: corners.topLeft,
    bottomRight: corners.topLeft,
    bottomLeft: corners.topLeft,
    linked: true,
  }
}

export function intrinsicWidth(source: ImageSource): number {
  switch (source) {
    case "landscape":
      return 240
    case "portrait":
      return 160
    case "icon":
      return 64
    default: {
      const exhaustive: never = source
      throw new Error(`Unhandled image source: ${exhaustive}`)
    }
  }
}

export function displayedWidth(chrome: ImageChrome, source: ImageSource): number {
  return chrome.widthMode === "auto" ? intrinsicWidth(source) : chrome.widthPx
}

export function previewBox(
  chrome: ImageChrome,
  source: ImageSource
): { width: string; maxWidth: string; height: string; maxHeight: string } {
  const width = widthBox(chrome, source)
  switch (chrome.heightMode) {
    case "auto":
      return { ...width, height: "auto", maxHeight: "none" }
    case "fixed":
      return { ...width, height: `${chrome.heightPx}px`, maxHeight: "none" }
    case "max":
      return { ...width, height: "auto", maxHeight: `${chrome.heightPx}px` }
    default: {
      const exhaustive: never = chrome.heightMode
      throw new Error(`Unhandled height mode: ${exhaustive}`)
    }
  }
}

function widthBox(
  chrome: ImageChrome,
  source: ImageSource
): { width: string; maxWidth: string } {
  switch (chrome.widthMode) {
    case "auto":
      return {
        width: `${intrinsicWidth(source)}px`,
        maxWidth: "100%",
      }
    case "fixed":
      return { width: `${chrome.widthPx}px`, maxWidth: "100%" }
    case "max":
      return { width: "100%", maxWidth: `${chrome.widthPx}px` }
    default: {
      const exhaustive: never = chrome.widthMode
      throw new Error(`Unhandled width mode: ${exhaustive}`)
    }
  }
}

export function cornerCss(corners: Corners): string {
  return `${corners.topLeft}px ${corners.topRight}px ${corners.bottomRight}px ${corners.bottomLeft}px`
}

export function quadCss(quad: Quad): string {
  return `${quad.top}px ${quad.right}px ${quad.bottom}px ${quad.left}px`
}

export function resolvedSrc(state: ImagePrototypeState): string {
  switch (state.sourceMode) {
    case "url":
      return state.imageUrl.trim() || SOURCE_SRC[state.source]
    case "upload":
      return SOURCE_SRC[state.source]
    case "icons":
      return SOURCE_SRC.icon
    default: {
      const exhaustive: never = state.sourceMode
      throw new Error(`Unhandled source mode: ${exhaustive}`)
    }
  }
}

export function alignItems(vAlign: VAlign): "flex-start" | "center" | "flex-end" {
  switch (vAlign) {
    case "top":
      return "flex-start"
    case "middle":
      return "center"
    case "bottom":
      return "flex-end"
    default: {
      const exhaustive: never = vAlign
      throw new Error(`Unhandled vertical align: ${exhaustive}`)
    }
  }
}

export function justifyContent(
  align: Align
): "flex-start" | "center" | "flex-end" {
  switch (align) {
    case "left":
      return "flex-start"
    case "center":
      return "center"
    case "right":
      return "flex-end"
    default: {
      const exhaustive: never = align
      throw new Error(`Unhandled align: ${exhaustive}`)
    }
  }
}
