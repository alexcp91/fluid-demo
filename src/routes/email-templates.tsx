import { createFileRoute } from "@tanstack/react-router"
import { EmailTemplatesPage } from "@/components/email-templates/email-templates-page"

export const Route = createFileRoute("/email-templates")({
  component: EmailTemplatesRoute,
})

function EmailTemplatesRoute() {
  return <EmailTemplatesPage />
}
