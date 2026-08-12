import { useState } from "react"
import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabItem } from "@/components/ui/tabs"
import { SizeProvider } from "@/lib/size-context"
import { useShape } from "@/lib/shape-context"
import { cn } from "@/lib/utils"
import { SettingsCard } from "./settings-card"

const PLANS = [
  {
    id: "starter",
    title: "Starter",
    price: { monthly: 0, yearly: 0 },
    description: "Solo workspace with core editor features.",
    features: ["1 seat", "Email editor", "Local saves"],
  },
  {
    id: "pro",
    title: "Pro",
    price: { monthly: 24, yearly: 20 },
    description: "For teams shipping drafts together.",
    features: ["Up to 20 seats", "API keys", "Priority support"],
    popular: true,
  },
  {
    id: "scale",
    title: "Scale",
    price: { monthly: 72, yearly: 60 },
    description: "Security and limits for larger orgs.",
    features: ["SSO", "Audit log", "Custom limits"],
  },
] as const

type PlanId = (typeof PLANS)[number]["id"]
type Cycle = "monthly" | "yearly"

export function PlanSection() {
  const shape = useShape()
  const [cycle, setCycle] = useState<Cycle>("monthly")
  const [plan, setPlan] = useState<PlanId>("pro")
  const [seats, setSeats] = useState(5)
  const [spendAlerts, setSpendAlerts] = useState(true)
  const [autoRenew, setAutoRenew] = useState(true)

  const active = PLANS.find((p) => p.id === plan) ?? PLANS[1]
  const unit = active.price[cycle]
  const seatCount = plan === "starter" ? 1 : seats
  const estimate = unit * seatCount

  return (
    <div className="flex flex-col gap-4">
      <SettingsCard
        title="Subscription"
        description="Demo pricing — nothing is charged."
        action={
          <Tabs value={cycle} onValueChange={(v) => setCycle(v as Cycle)}>
            <TabsList>
              <TabItem value="monthly" label="Monthly" />
              <TabItem value="yearly" label="Yearly" />
            </TabsList>
          </Tabs>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {PLANS.map((item) => {
            const selected = plan === item.id
            const price = item.price[cycle]
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPlan(item.id)}
                className={cn(
                  "relative flex flex-col gap-3 p-4 text-left outline-none transition-colors duration-80",
                  shape.container,
                  selected
                    ? "bg-accent text-foreground"
                    : "bg-muted/50 text-foreground hover:bg-muted",
                  "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring)]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-body font-medium tracking-tight">
                      {item.title}
                    </span>
                    {"popular" in item && item.popular ? (
                      <Badge color="blue" variant="dot" size="compact">
                        Popular
                      </Badge>
                    ) : null}
                  </div>
                  {selected ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
                      <Check size={12} strokeWidth={2.5} />
                    </span>
                  ) : (
                    <span className="h-5 w-5 rounded-full border border-border" />
                  )}
                </div>
                <p className="text-caption leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
                <p className="mt-auto pt-1">
                  <span className="text-subtitle font-medium tracking-tight">
                    {price === 0 ? "Free" : `$${price}`}
                  </span>
                  {price > 0 ? (
                    <span className="text-caption text-muted-foreground">
                      {" "}
                      / seat / mo
                    </span>
                  ) : null}
                </p>
              </button>
            )
          })}
        </div>
      </SettingsCard>

      <SettingsCard
        title="Seats & billing"
        description={
          plan === "starter"
            ? "Starter includes a single seat."
            : `Estimated ${cycle} total · $${estimate}`
        }
        footer={
          <Button type="button" size="compact">
            Update plan
          </Button>
        }
      >
        <div className="flex flex-col gap-6">
          <Slider
            label="Seats"
            value={seatCount}
            onChange={(v) => setSeats(typeof v === "number" ? v : v[0])}
            min={1}
            max={40}
            step={1}
            disabled={plan === "starter"}
            showValue
            valuePosition="right"
            formatValue={(v) => `${v}`}
          />
          <SizeProvider size="compact">
            <div className="flex flex-col gap-2">
              <Switch
                label="Auto-renew subscription"
                checked={autoRenew}
                onToggle={() => setAutoRenew((v) => !v)}
              />
              <Switch
                label="Email spend alerts"
                checked={spendAlerts}
                onToggle={() => setSpendAlerts((v) => !v)}
              />
            </div>
          </SizeProvider>
        </div>
      </SettingsCard>
    </div>
  )
}
