import { useState } from "react"
import { Copy, KeyRound, Plus } from "lucide-react"
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
import { cn } from "@/lib/utils"
import { SettingsCard } from "./settings-card"
import { SettingsList, SettingsListRow } from "./settings-list"

interface ApiKey {
  id: string
  name: string
  prefix: string
  env: "live" | "test"
  created: string
  lastUsed: string
}

const INITIAL_KEYS: ApiKey[] = [
  {
    id: "1",
    name: "Production",
    prefix: "fl_live_••••8f2a",
    env: "live",
    created: "Mar 12, 2026",
    lastUsed: "2 hours ago",
  },
  {
    id: "2",
    name: "Local development",
    prefix: "fl_test_••••c91e",
    env: "test",
    created: "Jan 4, 2026",
    lastUsed: "Yesterday",
  },
]

export function ApiKeysSection() {
  const shape = useShape()
  const [keys, setKeys] = useState(INITIAL_KEYS)
  const [createOpen, setCreateOpen] = useState(false)
  const [keyName, setKeyName] = useState("")
  const [liveEnv, setLiveEnv] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<string | null>(null)

  function createKey() {
    const name = keyName.trim() || "Untitled key"
    const suffix = Math.random().toString(16).slice(2, 6)
    const env = liveEnv ? "live" : "test"
    setKeys((prev) => [
      {
        id: String(Date.now()),
        name,
        prefix: `fl_${env}_••••${suffix}`,
        env,
        created: "Just now",
        lastUsed: "Never",
      },
      ...prev,
    ])
    setKeyName("")
    setLiveEnv(false)
    setCreateOpen(false)
  }

  function revokeKey(id: string) {
    setKeys((prev) => prev.filter((key) => key.id !== id))
  }

  function copyPrefix(id: string, prefix: string) {
    void navigator.clipboard?.writeText(prefix).catch(() => undefined)
    setCopiedId(id)
    window.setTimeout(
      () => setCopiedId((cur) => (cur === id ? null : cur)),
      1200
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <SettingsCard
        title="API keys"
        description="Authenticate scripts and integrations. Treat live keys like passwords."
        action={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="compact" leadingIcon={Plus}>
                Create key
              </Button>
            </DialogTrigger>
            <DialogContent size="sm">
              <DialogHeader>
                <DialogTitle>Create API key</DialogTitle>
                <DialogDescription>
                  Give it a name you’ll recognize when you revoke it later.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 px-1 pb-2">
                <InputGroup className="w-full">
                  <InputField
                    index={0}
                    label="Name"
                    value={keyName}
                    onChange={setKeyName}
                    icon={KeyRound}
                    placeholder="CI pipeline"
                  />
                </InputGroup>
                <SizeProvider size="compact">
                  <Switch
                    label="Live environment"
                    checked={liveEnv}
                    onToggle={() => setLiveEnv((v) => !v)}
                  />
                </SizeProvider>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" type="button">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="button" onClick={createKey}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      >
        {keys.length === 0 ? (
          <p className="text-caption text-muted-foreground">
            No keys yet. Create one to call the demo API.
          </p>
        ) : (
          <SettingsList>
            {keys.map((key) => (
              <SettingsListRow key={key.id} className="items-start sm:items-center">
                <span
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-muted text-muted-foreground",
                    shape.button
                  )}
                >
                  <KeyRound size={15} strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-body font-medium text-foreground">
                      {key.name}
                    </p>
                    <Badge
                      color={key.env === "live" ? "green" : "amber"}
                      variant="dot"
                      size="compact"
                    >
                      {key.env === "live" ? "Live" : "Test"}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    className="font-mono text-caption text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]"
                    onClick={() =>
                      setRevealed((cur) => (cur === key.id ? null : key.id))
                    }
                  >
                    {revealed === key.id
                      ? key.prefix.replace("••••", "xk9m")
                      : key.prefix}
                  </button>
                  <p className="text-caption text-muted-foreground/80">
                    Created {key.created} · Last used {key.lastUsed}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Tooltip
                    content={copiedId === key.id ? "Copied" : "Copy key"}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-compact"
                      leadingIcon={Copy}
                      aria-label="Copy key"
                      onClick={() => copyPrefix(key.id, key.prefix)}
                    />
                  </Tooltip>
                  <Button
                    type="button"
                    variant="ghost"
                    size="compact"
                    onClick={() => revokeKey(key.id)}
                  >
                    Revoke
                  </Button>
                </div>
              </SettingsListRow>
            ))}
          </SettingsList>
        )}
      </SettingsCard>
    </div>
  )
}
