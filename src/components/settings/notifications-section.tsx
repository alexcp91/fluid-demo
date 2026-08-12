import { useMemo, useState } from "react"
import { CheckboxGroup, CheckboxItem } from "@/components/ui/checkbox-group"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { SizeProvider } from "@/lib/size-context"
import { SettingsCard } from "./settings-card"

const CHANNEL_OPTIONS = [
  { id: "email", label: "Email digests" },
  { id: "push", label: "Push alerts" },
  { id: "slack", label: "Slack" },
  { id: "in-app", label: "In-app toasts" },
] as const

export function NotificationsSection() {
  const [productUpdates, setProductUpdates] = useState(true)
  const [mentions, setMentions] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(false)
  const [quietHours, setQuietHours] = useState(true)
  const [channels, setChannels] = useState(() => new Set([0, 3]))
  const [digestHour, setDigestHour] = useState(9)
  const checkedChannelIndices = useMemo(() => channels, [channels])

  function toggleChannel(index: number) {
    setChannels((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <SettingsCard
        title="Activity"
        description="Product updates and collaboration alerts."
      >
        <SizeProvider size="compact">
          <div className="flex flex-col gap-2">
            <Switch
              label="Product updates"
              checked={productUpdates}
              onToggle={() => setProductUpdates((v) => !v)}
            />
            <Switch
              label="Mentions & comments"
              checked={mentions}
              onToggle={() => setMentions((v) => !v)}
            />
            <Switch
              label="Weekly digest"
              checked={weeklyDigest}
              onToggle={() => setWeeklyDigest((v) => !v)}
            />
            <Switch
              label="Quiet hours (22:00–08:00)"
              checked={quietHours}
              onToggle={() => setQuietHours((v) => !v)}
            />
          </div>
        </SizeProvider>
      </SettingsCard>

      <SettingsCard
        title="Channels"
        description="Where those alerts can land."
      >
        <SizeProvider size="compact">
          <CheckboxGroup checkedIndices={checkedChannelIndices}>
            {CHANNEL_OPTIONS.map((opt, index) => (
              <CheckboxItem
                key={opt.id}
                index={index}
                label={opt.label}
                checked={channels.has(index)}
                onToggle={() => toggleChannel(index)}
              />
            ))}
          </CheckboxGroup>
        </SizeProvider>
      </SettingsCard>

      <SettingsCard
        title="Digest delivery"
        description={
          weeklyDigest
            ? "Preferred hour for the weekly summary."
            : "Turn on weekly digest above to schedule delivery."
        }
      >
        <Slider
          label="Hour"
          value={digestHour}
          onChange={(v) => setDigestHour(typeof v === "number" ? v : v[0])}
          min={6}
          max={18}
          step={1}
          disabled={!weeklyDigest}
          showValue
          valuePosition="right"
          formatValue={(v) => `${String(v).padStart(2, "0")}:00`}
        />
      </SettingsCard>
    </div>
  )
}
