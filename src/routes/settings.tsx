import { createFileRoute } from "@tanstack/react-router"
import {
  AccountSection,
  SecuritySection,
} from "@/components/settings/account-section"
import { ApiKeysSection } from "@/components/settings/api-keys-section"
import { AppearanceSection } from "@/components/settings/appearance-section"
import { MembersSection } from "@/components/settings/members-section"
import { NotificationsSection } from "@/components/settings/notifications-section"
import { PlanSection } from "@/components/settings/plan-section"
import { SettingsSidebar } from "@/components/settings/settings-sidebar"
import {
  findSettingsItem,
  isSettingsSection,
  type SettingsSectionId,
} from "@/components/settings/types"
import { WorkspaceSection } from "@/components/settings/workspace-section"

interface SettingsSearch {
  section?: SettingsSectionId
}

export const Route = createFileRoute("/settings")({
  validateSearch: (search: Record<string, unknown>): SettingsSearch => {
    if (isSettingsSection(search.section)) {
      return { section: search.section }
    }
    return { section: "account" }
  },
  component: SettingsPage,
})

function SettingsPage() {
  const { section = "account" } = Route.useSearch()
  const navigate = Route.useNavigate()
  const activeMeta = findSettingsItem(section)

  function setSection(next: SettingsSectionId) {
    void navigate({
      search: (prev) => ({ ...prev, section: next }),
      replace: true,
    })
  }

  return (
    <div className="flex h-full min-h-0">
      <SettingsSidebar section={section} onSelect={setSection} />

      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-8 py-10">
          <header className="flex flex-col gap-1.5">
            <h1 className="text-display font-medium tracking-tight">
              {activeMeta.title}
            </h1>
            <p className="max-w-xl text-body text-muted-foreground">
              {activeMeta.description}
            </p>
          </header>

          {section === "appearance" && <AppearanceSection />}
          {section === "notifications" && <NotificationsSection />}
          {section === "workspace" && <WorkspaceSection />}
          {section === "members" && <MembersSection />}
          {section === "api-keys" && <ApiKeysSection />}
          {section === "plan" && <PlanSection />}
          {section === "account" && <AccountSection />}
          {section === "security" && <SecuritySection />}
        </div>
      </div>
    </div>
  )
}
