import { useState } from "react"
import { Mail, UserPlus } from "lucide-react"
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
import { RadioGroup, RadioItem } from "@/components/ui/radio-group"
import { SizeProvider } from "@/lib/size-context"
import { SettingsCard } from "./settings-card"
import {
  SettingsAvatar,
  SettingsList,
  SettingsListRow,
} from "./settings-list"

interface Member {
  id: string
  name: string
  email: string
  role: "Owner" | "Admin" | "Editor" | "Viewer"
  status: "Active" | "Invited"
}

const INITIAL_MEMBERS: Member[] = [
  {
    id: "1",
    name: "Alex Persson",
    email: "alex@example.com",
    role: "Owner",
    status: "Active",
  },
  {
    id: "2",
    name: "Jordan Lee",
    email: "jordan@example.com",
    role: "Admin",
    status: "Active",
  },
  {
    id: "3",
    name: "Sam Rivera",
    email: "sam@example.com",
    role: "Editor",
    status: "Active",
  },
  {
    id: "4",
    name: "Riley Chen",
    email: "riley@example.com",
    role: "Viewer",
    status: "Invited",
  },
]

const ROLE_BADGE: Record<Member["role"], "blue" | "violet" | "teal" | "gray"> =
  {
    Owner: "blue",
    Admin: "violet",
    Editor: "teal",
    Viewer: "gray",
  }

export function MembersSection() {
  const [members, setMembers] = useState(INITIAL_MEMBERS)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<Member["role"]>("Editor")

  function inviteMember() {
    if (!inviteEmail.trim()) return
    const local = inviteEmail.split("@")[0] || "Invitee"
    setMembers((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: local.charAt(0).toUpperCase() + local.slice(1),
        email: inviteEmail.trim(),
        role: inviteRole,
        status: "Invited",
      },
    ])
    setInviteEmail("")
    setInviteRole("Editor")
    setInviteOpen(false)
  }

  function removeMember(id: string) {
    setMembers((prev) =>
      prev.filter((member) => member.id !== id || member.role === "Owner")
    )
  }

  const activeCount = members.filter((m) => m.status === "Active").length
  const invitedCount = members.filter((m) => m.status === "Invited").length

  return (
    <div className="flex flex-col gap-4">
      <SettingsCard
        title="People"
        description={`${activeCount} active${invitedCount ? ` · ${invitedCount} invited` : ""}`}
        action={
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="compact" leadingIcon={UserPlus}>
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent size="sm">
              <DialogHeader>
                <DialogTitle>Invite member</DialogTitle>
                <DialogDescription>
                  They’ll get access to this workspace once they accept.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 px-1 pb-2">
                <InputGroup className="w-full">
                  <InputField
                    index={0}
                    label="Email"
                    type="email"
                    value={inviteEmail}
                    onChange={setInviteEmail}
                    icon={Mail}
                    placeholder="name@company.com"
                  />
                </InputGroup>
                <div className="flex flex-col gap-2">
                  <p className="text-caption text-muted-foreground">Role</p>
                  <SizeProvider size="compact">
                    <RadioGroup
                      value={inviteRole}
                      onValueChange={(v) =>
                        setInviteRole(v as Member["role"])
                      }
                    >
                      <RadioItem index={0} value="Admin" label="Admin" />
                      <RadioItem index={1} value="Editor" label="Editor" />
                      <RadioItem index={2} value="Viewer" label="Viewer" />
                    </RadioGroup>
                  </SizeProvider>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" type="button">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  onClick={inviteMember}
                  disabled={!inviteEmail.trim()}
                >
                  Send invite
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      >
        <SettingsList>
          {members.map((member) => (
            <SettingsListRow key={member.id}>
              <SettingsAvatar name={member.name} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-body font-medium text-foreground">
                    {member.name}
                  </p>
                  {member.status === "Invited" ? (
                    <Badge color="amber" variant="dot" size="compact">
                      Invited
                    </Badge>
                  ) : null}
                </div>
                <p className="truncate text-caption text-muted-foreground">
                  {member.email}
                </p>
              </div>
              <Badge color={ROLE_BADGE[member.role]} variant="dot" size="compact">
                {member.role}
              </Badge>
              {member.role !== "Owner" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="compact"
                  onClick={() => removeMember(member.id)}
                >
                  {member.status === "Invited" ? "Revoke" : "Remove"}
                </Button>
              ) : (
                <span className="w-[4.5rem]" aria-hidden />
              )}
            </SettingsListRow>
          ))}
        </SettingsList>
      </SettingsCard>
    </div>
  )
}
