import { useState } from "react"
import { KeyRound, Mail, Monitor, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { InputGroup, InputField } from "@/components/ui/input-group"
import { Switch } from "@/components/ui/switch"
import { Tooltip } from "@/components/ui/tooltip"
import { SizeProvider } from "@/lib/size-context"
import { useShape } from "@/lib/shape-context"
import { useThemeContext } from "@/lib/theme-context"
import { cn } from "@/lib/utils"
import { SettingsCard } from "./settings-card"
import {
  SettingsAvatar,
  SettingsList,
  SettingsListRow,
} from "./settings-list"

export function AccountSection() {
  const shape = useShape()
  const [displayName, setDisplayName] = useState("Alex Persson")
  const [email] = useState("alex@example.com")
  const [handle, setHandle] = useState("alex")
  const [saved, setSaved] = useState(false)

  function saveProfile() {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
  }

  return (
    <div className="flex flex-col gap-4">
      <SettingsCard
        title="Profile"
        description="How you show up across the workspace."
        footer={
          <Button type="button" size="compact" onClick={saveProfile}>
            {saved ? "Saved" : "Save changes"}
          </Button>
        }
      >
        <div className="flex items-center gap-4 pb-1">
          <SettingsAvatar name={displayName} className="h-11 w-11 text-body" />
          <div className="min-w-0">
            <p className="truncate text-body font-medium text-foreground">
              {displayName || "Your name"}
            </p>
            <p className="truncate text-caption text-muted-foreground">
              @{handle || "handle"} · Owner
            </p>
          </div>
          <Badge color="blue" variant="dot" size="compact" className="ml-auto">
            Owner
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InputGroup className="w-full">
            <InputField
              index={0}
              label="Display name"
              value={displayName}
              onChange={setDisplayName}
            />
          </InputGroup>
          <InputGroup className="w-full">
            <InputField
              index={0}
              label="Handle"
              value={handle}
              onChange={setHandle}
            />
          </InputGroup>
        </div>

        <InputGroup className="w-full">
          <InputField
            index={0}
            label="Email"
            type="email"
            value={email}
            onChange={() => undefined}
            disabled
            icon={Mail}
          />
        </InputGroup>
      </SettingsCard>

      <SettingsCard
        title="Devices"
        description="Sessions signed in on this browser."
      >
        <SettingsList>
          <SettingsListRow>
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center bg-muted text-muted-foreground",
                shape.button
              )}
            >
              <Monitor size={15} strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-body font-medium text-foreground">
                This browser
              </p>
              <p className="text-caption text-muted-foreground">
                macOS · Active now
              </p>
            </div>
            <Badge color="green" variant="dot" size="compact">
              Current
            </Badge>
          </SettingsListRow>
        </SettingsList>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="secondary" type="button" size="compact">
            Sign out
          </Button>
          <Tooltip content="Demo only — nothing is exported">
            <Button variant="ghost" type="button" size="compact">
              Export data
            </Button>
          </Tooltip>
        </div>
      </SettingsCard>
    </div>
  )
}

export function SecuritySection() {
  const shape = useShape()
  const { setTheme } = useThemeContext()
  const [passkeys, setPasskeys] = useState<
    { id: string; name: string; added: string }[]
  >([])
  const [twoFactor, setTwoFactor] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  function addPasskey() {
    setPasskeys((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: prev.length === 0 ? "Touch ID" : `Passkey ${prev.length + 1}`,
        added: "Just now",
      },
    ])
  }

  function removePasskey(id: string) {
    setPasskeys((prev) => prev.filter((key) => key.id !== id))
  }

  function resetDemoPrefs() {
    setTheme("system")
    setPasskeys([])
    setTwoFactor(false)
    setResetOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <SettingsCard
        title="Passkeys"
        description="Sign in with a biometric or hardware key."
        action={
          <Button
            type="button"
            variant="secondary"
            size="compact"
            leadingIcon={KeyRound}
            onClick={addPasskey}
          >
            Add passkey
          </Button>
        }
      >
        {passkeys.length === 0 ? (
          <p className="text-caption text-muted-foreground">
            No passkeys yet. Add one to skip one-time codes on this device.
          </p>
        ) : (
          <SettingsList>
            {passkeys.map((key) => (
              <SettingsListRow key={key.id}>
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center bg-muted text-muted-foreground",
                    shape.button
                  )}
                >
                  <KeyRound size={15} strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium text-foreground">
                    {key.name}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    Added {key.added}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="compact"
                  onClick={() => removePasskey(key.id)}
                >
                  Remove
                </Button>
              </SettingsListRow>
            ))}
          </SettingsList>
        )}
      </SettingsCard>

      <SettingsCard
        title="Two-factor authentication"
        description="Require a second step after password sign-in."
      >
        <SizeProvider size="compact">
          <Switch
            label="Authenticator app"
            checked={twoFactor}
            onToggle={() => setTwoFactor((v) => !v)}
          />
        </SizeProvider>
      </SettingsCard>

      <SettingsCard
        title="Reset preferences"
        description="Clears local theme and security demo state on this device."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" type="button" size="compact">
                Reset local data
              </Button>
            </DialogTrigger>
            <DialogContent size="sm">
              <DialogHeader>
                <DialogTitle>Reset local preferences?</DialogTitle>
                <DialogDescription>
                  Theme returns to system. Passkeys and 2FA toggles on this
                  page clear. Other sections keep their own local state until
                  you leave.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" type="button">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="button" onClick={resetDemoPrefs}>
                  Reset
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
            <Shield size={12} strokeWidth={1.75} />
            Stored in this browser only
          </span>
        </div>
      </SettingsCard>
    </div>
  )
}
