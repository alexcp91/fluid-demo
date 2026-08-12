import type { Corners, ImageBorder, ImageChrome, Quad, SizeMode } from "./image-state"
import { linkedCorners, linkedQuad } from "./image-state"

export const SECTION_MODES = ["simple", "adjust"] as const
export type SectionMode = (typeof SECTION_MODES)[number]

export const SECTION_IDS = [
  "image",
  "content",
  "layout",
  "spacing",
  "border",
  "fill",
] as const
export type SectionId = (typeof SECTION_IDS)[number]

export function defaultSectionModes(): Record<SectionId, SectionMode> {
  return {
    image: "simple",
    content: "simple",
    layout: "simple",
    spacing: "simple",
    border: "simple",
    fill: "simple",
  }
}

export const SHAPE_PRESETS = ["square", "rounded", "circle"] as const
export type ShapePreset = (typeof SHAPE_PRESETS)[number]

export const SHAPE_RADIUS: Record<ShapePreset, number> = {
  square: 0,
  rounded: 12,
  circle: 120,
}

export const SPACE_PRESETS = ["none", "tight", "room"] as const
export type SpacePreset = (typeof SPACE_PRESETS)[number]

export const SPACE_PX: Record<SpacePreset, number> = {
  none: 0,
  tight: 8,
  room: 16,
}

export const BORDER_PRESETS = ["none", "line", "strong"] as const
export type BorderPreset = (typeof BORDER_PRESETS)[number]

export const SIZE_PRESETS = ["auto", "fill", "fixed"] as const
export type SizePreset = (typeof SIZE_PRESETS)[number]

export type ShapeChoice = ShapePreset | "custom"
export type SpaceChoice = SpacePreset | "custom"
export type BorderChoice = BorderPreset | "custom"

export function applyShapePreset(preset: ShapePreset): Corners {
  return linkedCorners(SHAPE_RADIUS[preset])
}

export function matchShapePreset(corners: Corners): ShapeChoice {
  if (!isUniformCorners(corners)) return "custom"
  const value = corners.topLeft
  if (value === SHAPE_RADIUS.square) return "square"
  if (value === SHAPE_RADIUS.rounded) return "rounded"
  if (value === SHAPE_RADIUS.circle) return "circle"
  return "custom"
}

export function applySpacePreset(preset: SpacePreset): Quad {
  return linkedQuad(SPACE_PX[preset])
}

export function matchSpacePreset(quad: Quad): SpaceChoice {
  if (!isUniformQuad(quad)) return "custom"
  const value = quad.top
  if (value === SPACE_PX.none) return "none"
  if (value === SPACE_PX.tight) return "tight"
  if (value === SPACE_PX.room) return "room"
  return "custom"
}

export function applyBorderPreset(
  border: ImageBorder,
  preset: BorderPreset
): Pick<ImageChrome, "borderEnabled" | "border"> {
  switch (preset) {
    case "none":
      return { borderEnabled: false, border }
    case "line":
      return {
        borderEnabled: true,
        border: { ...border, width: 1, style: "solid" },
      }
    case "strong":
      return {
        borderEnabled: true,
        border: { ...border, width: 3, style: "solid" },
      }
    default: {
      const exhaustive: never = preset
      throw new Error(`Unhandled border preset: ${exhaustive}`)
    }
  }
}

export function matchBorderPreset(
  enabled: boolean,
  border: ImageBorder
): BorderChoice {
  if (!enabled) return "none"
  if (border.style !== "solid") return "custom"
  if (border.width === 1) return "line"
  if (border.width === 3) return "strong"
  return "custom"
}

export function applySizePreset(preset: SizePreset): Pick<ImageChrome, "widthMode"> {
  switch (preset) {
    case "auto":
      return { widthMode: "auto" }
    case "fill":
      return { widthMode: "max" }
    case "fixed":
      return { widthMode: "fixed" }
    default: {
      const exhaustive: never = preset
      throw new Error(`Unhandled size preset: ${exhaustive}`)
    }
  }
}

export function matchSizePreset(widthMode: SizeMode): SizePreset {
  switch (widthMode) {
    case "auto":
      return "auto"
    case "max":
      return "fill"
    case "fixed":
      return "fixed"
    default: {
      const exhaustive: never = widthMode
      throw new Error(`Unhandled width mode: ${exhaustive}`)
    }
  }
}

function isUniformCorners(corners: Corners): boolean {
  return (
    corners.linked &&
    corners.topLeft === corners.topRight &&
    corners.topLeft === corners.bottomRight &&
    corners.topLeft === corners.bottomLeft
  )
}

function isUniformQuad(quad: Quad): boolean {
  return (
    quad.linked &&
    quad.top === quad.right &&
    quad.top === quad.bottom &&
    quad.top === quad.left
  )
}
