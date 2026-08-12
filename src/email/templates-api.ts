import {
  EmailTemplateListItemSchema,
  EmailTemplateSchema,
  type EmailTemplate,
  type EmailTemplateListItem,
} from "@/email/schema"

export async function fetchTemplates(): Promise<EmailTemplateListItem[]> {
  const res = await fetch("/api/templates")
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Failed to list templates (${res.status})`)
  }
  const data: unknown = await res.json()
  if (!Array.isArray(data)) return []
  return data
    .map((item) => EmailTemplateListItemSchema.safeParse(item))
    .filter((r) => r.success)
    .map((r) => r.data)
}

export async function renameTemplate(
  id: string,
  name: string
): Promise<EmailTemplate> {
  const res = await fetch(`/api/templates/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Rename failed (${res.status})`)
  }
  return EmailTemplateSchema.parse(await res.json())
}

export async function duplicateTemplate(id: string): Promise<EmailTemplate> {
  const res = await fetch(
    `/api/templates/${encodeURIComponent(id)}/duplicate`,
    { method: "POST" }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Duplicate failed (${res.status})`)
  }
  return EmailTemplateSchema.parse(await res.json())
}

export async function deleteTemplate(id: string): Promise<void> {
  const res = await fetch(`/api/templates/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Delete failed (${res.status})`)
  }
}
