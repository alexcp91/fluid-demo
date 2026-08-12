export const RADIUS_STOPS = [
  { value: 0, label: "Square" },
  { value: 12, label: "Round" },
  { value: 80, label: "Circle" },
] as const

export const PAD_STOPS = [
  { value: 0, label: "None" },
  { value: 8, label: "Tight" },
  { value: 16, label: "Room" },
] as const

export type StopChoice = "custom" | "0" | "8" | "12" | "16" | "80"

export function matchStop(
  value: number,
  stops: readonly { value: number }[]
): StopChoice {
  const hit = stops.find((stop) => stop.value === value)
  if (!hit) return "custom"
  switch (hit.value) {
    case 0:
      return "0"
    case 8:
      return "8"
    case 12:
      return "12"
    case 16:
      return "16"
    case 80:
      return "80"
    default:
      return "custom"
  }
}

export function parseStop(next: StopChoice): number | null {
  if (next === "custom") return null
  const parsed = Number(next)
  return Number.isFinite(parsed) ? parsed : null
}
