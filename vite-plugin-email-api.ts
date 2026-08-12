import fs from "node:fs"
import path from "node:path"
import type { IncomingMessage, ServerResponse } from "node:http"
import type { Plugin, Connect } from "vite"
import { EmailDocumentSchema } from "./src/email/schema.ts"
import { exportToHtml } from "./src/email/export-html.ts"
import { parseDocument } from "./src/email/migrate.ts"

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on("data", (chunk: Buffer) => chunks.push(chunk))
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    req.on("error", reject)
  })
}

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.end(JSON.stringify(data, null, 2))
}

function sendText(
  res: ServerResponse,
  status: number,
  body: string,
  contentType: string
) {
  res.statusCode = status
  res.setHeader("Content-Type", contentType)
  res.end(body)
}

function safeId(id: string): string | null {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null
  return id
}

export function emailApiPlugin(rootDir: string): Plugin {
  const emailsDir = path.join(rootDir, "data", "emails")

  function ensureDir() {
    fs.mkdirSync(emailsDir, { recursive: true })
  }

  function listEmails() {
    ensureDir()
    return fs
      .readdirSync(emailsDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const raw = JSON.parse(
          fs.readFileSync(path.join(emailsDir, f), "utf8")
        )
        try {
          const parsed = parseDocument(raw)
          return {
            id: parsed.id,
            subject: parsed.meta.subject,
            updatedAt: parsed.updatedAt,
          }
        } catch {
          return null
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  function readEmail(id: string) {
    const file = path.join(emailsDir, `${id}.json`)
    if (!fs.existsSync(file)) return null
    const raw = JSON.parse(fs.readFileSync(file, "utf8"))
    return parseDocument(raw)
  }

  function writeEmail(id: string, doc: unknown) {
    ensureDir()
    const parsed = EmailDocumentSchema.parse({
      ...parseDocument(doc),
      id,
      updatedAt: new Date().toISOString(),
    })
    const file = path.join(emailsDir, `${id}.json`)
    fs.writeFileSync(file, JSON.stringify(parsed, null, 2) + "\n", "utf8")
    return parsed
  }

  const middleware: Connect.NextHandleFunction = async (req, res, next) => {
    const url = req.url ?? ""
    if (!url.startsWith("/api/emails")) return next()

    try {
      const pathname = url.split("?")[0]
      const parts = pathname.replace(/^\/api\/emails\/?/, "").split("/").filter(Boolean)

      if (req.method === "GET" && parts.length === 0) {
        return sendJson(res, 200, listEmails())
      }

      if (parts.length >= 1) {
        const id = safeId(parts[0])
        if (!id) return sendText(res, 400, "Invalid email id", "text/plain")

        if (req.method === "GET" && parts.length === 1) {
          const doc = readEmail(id)
          if (!doc) return sendText(res, 404, "Not found", "text/plain")
          return sendJson(res, 200, doc)
        }

        if (req.method === "GET" && parts[1] === "html" && parts.length === 2) {
          const doc = readEmail(id)
          if (!doc) return sendText(res, 404, "Not found", "text/plain")
          return sendText(res, 200, exportToHtml(doc), "text/html; charset=utf-8")
        }

        if (req.method === "PUT" && parts.length === 1) {
          const body = await readBody(req)
          let json: unknown
          try {
            json = JSON.parse(body)
          } catch {
            return sendText(res, 400, "Invalid JSON", "text/plain")
          }
          try {
            const saved = writeEmail(id, json)
            return sendJson(res, 200, saved)
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Validation failed"
            return sendText(res, 400, message, "text/plain")
          }
        }
      }

      return sendText(res, 405, "Method not allowed", "text/plain")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Server error"
      return sendText(res, 500, message, "text/plain")
    }
  }

  return {
    name: "email-api",
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
