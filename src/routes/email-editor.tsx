import { createFileRoute } from "@tanstack/react-router"
import { EmailEditor } from "@/components/email-editor/email-editor"

export const Route = createFileRoute("/email-editor")({
  component: EmailEditorPage,
})

function EmailEditorPage() {
  return (
    <div className="h-full min-h-0">
      <EmailEditor />
    </div>
  )
}
