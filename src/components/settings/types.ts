import type { LucideIcon } from "lucide-react"
import {
  Bell,
  CreditCard,
  KeyRound,
  Layout,
  Palette,
  Shield,
  User,
  Users,
} from "lucide-react"

export const SECTIONS = [
  "appearance",
  "notifications",
  "workspace",
  "members",
  "api-keys",
  "plan",
  "account",
  "security",
] as const

export type SettingsSectionId = (typeof SECTIONS)[number]

export interface SettingsNavItem {
  id: SettingsSectionId
  label: string
  icon: LucideIcon
  title: string
  description: string
}

export interface SettingsNavGroup {
  label: string
  items: SettingsNavItem[]
}

export const NAV_GROUPS: SettingsNavGroup[] = [
  {
    label: "Preferences",
    items: [
      {
        id: "appearance",
        label: "Appearance",
        icon: Palette,
        title: "Appearance",
        description: "Theme, accent color, density, and motion.",
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
        title: "Notifications",
        description: "Choose what you hear about and where it lands.",
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        id: "workspace",
        label: "Workspace",
        icon: Layout,
        title: "Workspace",
        description: "Name, default layout, and editor surfaces.",
      },
      {
        id: "members",
        label: "Members",
        icon: Users,
        title: "Members",
        description: "Invite people and manage their roles.",
      },
      {
        id: "api-keys",
        label: "API keys",
        icon: KeyRound,
        title: "API keys",
        description: "Keys for scripts and third-party integrations.",
      },
    ],
  },
  {
    label: "Billing",
    items: [
      {
        id: "plan",
        label: "Plan",
        icon: CreditCard,
        title: "Plan",
        description: "Pick a plan, seat count, and renewal options.",
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        id: "account",
        label: "Account",
        icon: User,
        title: "Account",
        description: "Your profile and signed-in devices.",
      },
      {
        id: "security",
        label: "Security",
        icon: Shield,
        title: "Security",
        description: "Passkeys, two-factor auth, and local reset.",
      },
    ],
  },
]

export function findSettingsItem(
  section: SettingsSectionId
): SettingsNavItem {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((entry) => entry.id === section)
    if (item) return item
  }
  return NAV_GROUPS[3].items[0]
}

export function isSettingsSection(
  value: unknown
): value is SettingsSectionId {
  return (
    typeof value === "string" &&
    (SECTIONS as readonly string[]).includes(value)
  )
}
