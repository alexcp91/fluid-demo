import { BLOCK_TYPES, type BlockType } from "./types"

/** Custom MIME so canvas drop handlers ignore unrelated drags. */
export const PALETTE_BLOCK_MIME = "application/x-fluid-email-block"

export function isBlockType(value: string): value is BlockType {
  return (BLOCK_TYPES as string[]).includes(value)
}

export function readPaletteBlockType(dt: DataTransfer): BlockType | null {
  const raw =
    dt.getData(PALETTE_BLOCK_MIME) || dt.getData("text/plain")
  return raw && isBlockType(raw) ? raw : null
}
