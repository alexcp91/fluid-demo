import type { Align, BlockBg, ImageFit, Spacing, VAlign } from "@/email/schema"

export const WIDTH_MODES = ["auto", "fixed", "max"] as const
export const SIZE_PRESETS = ["hug", "half", "fill"] as const
export const CORNER_PRESETS = ["none", "soft", "round", "pill"] as const
export const IMAGE_SOURCES = ["landscape", "portrait"] as const
export const DEVICE_VISIBILITY = ["all", "desktop", "mobile"] as const

export type WidthMode = (typeof WIDTH_MODES)[number]
export type SizePreset = (typeof SIZE_PRESETS)[number]
export type CornerPreset = (typeof CORNER_PRESETS)[number]
export type ImageSource = (typeof IMAGE_SOURCES)[number]
export type DeviceVisibility = (typeof DEVICE_VISIBILITY)[number]
export type SizingModel = "width-mode" | "preset"

export interface ImagePrototypeState {
  source: ImageSource
  alt: string
  caption: string
  href: string
  linked: boolean
  decorative: boolean
  widthMode: WidthMode
  widthPx: number
  sizePreset: SizePreset
  align: Align
  vAlign: VAlign
  fit: ImageFit
  corners: CornerPreset
  padding: Spacing
  fill: BlockBg
  visible: boolean
  device: DeviceVisibility
}

export const SOURCE_SRC = {
  landscape: "/prototypes/landscape.svg",
  portrait: "/prototypes/portrait.svg",
} as const satisfies Record<ImageSource, string>

export const SOURCE_LABEL = {
  landscape: "landscape.svg",
  portrait: "portrait.svg",
} as const satisfies Record<ImageSource, string>

export const SOURCE_BYTES = {
  landscape: "18 KB",
  portrait: "12 KB",
} as const satisfies Record<ImageSource, string>

export function defaultImagePrototype(): ImagePrototypeState {
  return {
    source: "landscape",
    alt: "Wool beanie",
    caption: "",
    href: "",
    linked: false,
    decorative: false,
    widthMode: "max",
    widthPx: 320,
    sizePreset: "fill",
    align: "center",
    vAlign: "middle",
    fit: "cover",
    corners: "soft",
    padding: "none",
    fill: "none",
    visible: true,
    device: "all",
  }
}

export function intrinsicWidth(source: ImageSource): number {
  switch (source) {
    case "landscape":
      return 240
    case "portrait":
      return 160
    default: {
      const exhaustive: never = source
      throw new Error(`Unhandled image source: ${exhaustive}`)
    }
  }
}

export function cornerRadius(corners: CornerPreset): string {
  switch (corners) {
    case "none":
      return "0px"
    case "soft":
      return "6px"
    case "round":
      return "12px"
    case "pill":
      return "999px"
    default: {
      const exhaustive: never = corners
      throw new Error(`Unhandled corner preset: ${exhaustive}`)
    }
  }
}

export function paddingClass(padding: Spacing): string {
  switch (padding) {
    case "none":
      return "p-0"
    case "sm":
      return "p-2"
    case "md":
      return "p-3"
    case "lg":
      return "p-5"
    default: {
      const exhaustive: never = padding
      throw new Error(`Unhandled padding: ${exhaustive}`)
    }
  }
}

export function fillClass(fill: BlockBg): string {
  switch (fill) {
    case "none":
      return "bg-transparent"
    case "muted":
      return "bg-muted"
    case "accent":
      return "bg-accent"
    default: {
      const exhaustive: never = fill
      throw new Error(`Unhandled fill: ${exhaustive}`)
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

export function previewWidth(
  state: ImagePrototypeState,
  sizing: SizingModel
): { width: string; maxWidth: string } {
  if (sizing === "preset") {
    switch (state.sizePreset) {
      case "hug":
        return {
          width: `${intrinsicWidth(state.source)}px`,
          maxWidth: "100%",
        }
      case "half":
        return { width: "50%", maxWidth: "100%" }
      case "fill":
        return { width: "100%", maxWidth: "100%" }
      default: {
        const exhaustive: never = state.sizePreset
        throw new Error(`Unhandled size preset: ${exhaustive}`)
      }
    }
  }

  switch (state.widthMode) {
    case "auto":
      return {
        width: `${intrinsicWidth(state.source)}px`,
        maxWidth: "100%",
      }
    case "fixed":
      return { width: `${state.widthPx}px`, maxWidth: "100%" }
    case "max":
      return { width: "100%", maxWidth: `${state.widthPx}px` }
    default: {
      const exhaustive: never = state.widthMode
      throw new Error(`Unhandled width mode: ${exhaustive}`)
    }
  }
}

export function displayedWidth(state: ImagePrototypeState): number {
  return state.widthMode === "auto"
    ? intrinsicWidth(state.source)
    : state.widthPx
}

export function imageAlt(state: ImagePrototypeState): string {
  if (state.decorative) return ""
  return state.alt
}
