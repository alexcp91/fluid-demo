import { createFileRoute } from "@tanstack/react-router"
import { EmailEditor } from "@/components/email-editor/email-editor"

interface EmailEditorSearch {
  id?: string
  templateId?: string
}

export const Route = createFileRoute("/email-editor")({
  validateSearch: (search: Record<string, unknown>): EmailEditorSearch => ({
    id: typeof search.id === "string" ? search.id : undefined,
    templateId:
      typeof search.templateId === "string" ? search.templateId : undefined,
  }),
  component: EmailEditorPage,
})

function EmailEditorPage() {
  const { id, templateId } = Route.useSearch()
  return (
    <div className="h-full min-h-0">
      <EmailEditor emailId={id} templateId={templateId} />
    </div>
  )
}
