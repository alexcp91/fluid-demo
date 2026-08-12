import fs from "node:fs"
import path from "node:path"
import type { IncomingMessage, ServerResponse } from "node:http"
import type { Plugin, Connect } from "vite"
import {
  EmailDocumentSchema,
  EmailTemplateSchema,
} from "./src/email/schema.ts"
import { exportToHtml } from "./src/email/export-html.ts"

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

function parseJsonBody(body: string): { ok: true; json: unknown } | { ok: false } {
  try {
    return { ok: true, json: JSON.parse(body) }
  } catch {
    return { ok: false }
  }
}

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
  return base || "template"
}

function uniqueId(dir: string, preferred: string): string {
  let candidate = preferred
  let n = 2
  while (fs.existsSync(path.join(dir, `${candidate}.json`))) {
    candidate = `${preferred}-${n}`
    n += 1
  }
  return candidate
}

export function emailApiPlugin(rootDir: string): Plugin {
  const emailsDir = path.join(rootDir, "data", "emails")
  const templatesDir = path.join(rootDir, "data", "templates")

  function ensureDir(dir: string) {
    fs.mkdirSync(dir, { recursive: true })
  }

  function listEmails() {
    ensureDir(emailsDir)
    return fs
      .readdirSync(emailsDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const raw = JSON.parse(
          fs.readFileSync(path.join(emailsDir, f), "utf8")
        )
        const parsed = EmailDocumentSchema.safeParse(raw)
        if (!parsed.success) return null
        return {
          id: parsed.data.id,
          subject: parsed.data.meta.subject,
          updatedAt: parsed.data.updatedAt,
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  function readEmail(id: string) {
    const file = path.join(emailsDir, `${id}.json`)
    if (!fs.existsSync(file)) return null
    const raw = JSON.parse(fs.readFileSync(file, "utf8"))
    return EmailDocumentSchema.parse(raw)
  }

  function writeEmail(id: string, doc: unknown) {
    ensureDir(emailsDir)
    const parsed = EmailDocumentSchema.parse({
      ...(doc as object),
      id,
      updatedAt: new Date().toISOString(),
    })
    const file = path.join(emailsDir, `${id}.json`)
    fs.writeFileSync(file, JSON.stringify(parsed, null, 2) + "\n", "utf8")
    return parsed
  }

  function listTemplates() {
    ensureDir(templatesDir)
    return fs
      .readdirSync(templatesDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const raw = JSON.parse(
          fs.readFileSync(path.join(templatesDir, f), "utf8")
        )
        const parsed = EmailTemplateSchema.safeParse(raw)
        if (!parsed.success) return null
        return {
          id: parsed.data.id,
          name: parsed.data.name,
          subject: parsed.data.meta.subject,
          updatedAt: parsed.data.updatedAt,
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  function readTemplate(id: string) {
    const file = path.join(templatesDir, `${id}.json`)
    if (!fs.existsSync(file)) return null
    const raw = JSON.parse(fs.readFileSync(file, "utf8"))
    return EmailTemplateSchema.parse(raw)
  }

  function writeTemplate(id: string, doc: unknown) {
    ensureDir(templatesDir)
    const parsed = EmailTemplateSchema.parse({
      ...(doc as object),
      id,
      updatedAt: new Date().toISOString(),
    })
    const file = path.join(templatesDir, `${id}.json`)
    fs.writeFileSync(file, JSON.stringify(parsed, null, 2) + "\n", "utf8")
    return parsed
  }

  function deleteTemplate(id: string) {
    const file = path.join(templatesDir, `${id}.json`)
    if (!fs.existsSync(file)) return false
    fs.unlinkSync(file)
    return true
  }

  async function handleEmails(
    req: IncomingMessage,
    res: ServerResponse,
    parts: string[]
  ): Promise<boolean> {
    if (req.method === "GET" && parts.length === 0) {
      sendJson(res, 200, listEmails())
      return true
    }

    if (parts.length < 1) return false

    const id = safeId(parts[0])
    if (!id) {
      sendText(res, 400, "Invalid email id", "text/plain")
      return true
    }

    if (req.method === "GET" && parts.length === 1) {
      const doc = readEmail(id)
      if (!doc) {
        sendText(res, 404, "Not found", "text/plain")
        return true
      }
      sendJson(res, 200, doc)
      return true
    }

    if (req.method === "GET" && parts[1] === "html" && parts.length === 2) {
      const doc = readEmail(id)
      if (!doc) {
        sendText(res, 404, "Not found", "text/plain")
        return true
      }
      sendText(res, 200, exportToHtml(doc), "text/html; charset=utf-8")
      return true
    }

    if (req.method === "PUT" && parts.length === 1) {
      const body = await readBody(req)
      const parsed = parseJsonBody(body)
      if (!parsed.ok) {
        sendText(res, 400, "Invalid JSON", "text/plain")
        return true
      }
      try {
        const saved = writeEmail(id, parsed.json)
        sendJson(res, 200, saved)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Validation failed"
        sendText(res, 400, message, "text/plain")
      }
      return true
    }

    return false
  }

  async function handleTemplates(
    req: IncomingMessage,
    res: ServerResponse,
    parts: string[]
  ): Promise<boolean> {
    if (req.method === "GET" && parts.length === 0) {
      sendJson(res, 200, listTemplates())
      return true
    }

    if (parts.length < 1) return false

    const id = safeId(parts[0])
    if (!id) {
      sendText(res, 400, "Invalid template id", "text/plain")
      return true
    }

    if (req.method === "GET" && parts.length === 1) {
      const doc = readTemplate(id)
      if (!doc) {
        sendText(res, 404, "Not found", "text/plain")
        return true
      }
      sendJson(res, 200, doc)
      return true
    }

    if (req.method === "GET" && parts[1] === "html" && parts.length === 2) {
      const doc = readTemplate(id)
      if (!doc) {
        sendText(res, 404, "Not found", "text/plain")
        return true
      }
      sendText(res, 200, exportToHtml(doc), "text/html; charset=utf-8")
      return true
    }

    if (req.method === "PUT" && parts.length === 1) {
      const body = await readBody(req)
      const parsed = parseJsonBody(body)
      if (!parsed.ok) {
        sendText(res, 400, "Invalid JSON", "text/plain")
        return true
      }
      try {
        const saved = writeTemplate(id, parsed.json)
        sendJson(res, 200, saved)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Validation failed"
        sendText(res, 400, message, "text/plain")
      }
      return true
    }

    if (req.method === "PATCH" && parts.length === 1) {
      const existing = readTemplate(id)
      if (!existing) {
        sendText(res, 404, "Not found", "text/plain")
        return true
      }
      const body = await readBody(req)
      const parsed = parseJsonBody(body)
      if (!parsed.ok || typeof parsed.json !== "object" || parsed.json === null) {
        sendText(res, 400, "Invalid JSON", "text/plain")
        return true
      }
      const name = (parsed.json as { name?: unknown }).name
      if (typeof name !== "string" || !name.trim()) {
        sendText(res, 400, "name is required", "text/plain")
        return true
      }
      try {
        const saved = writeTemplate(id, { ...existing, name: name.trim() })
        sendJson(res, 200, saved)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Validation failed"
        sendText(res, 400, message, "text/plain")
      }
      return true
    }

    if (req.method === "DELETE" && parts.length === 1) {
      if (!deleteTemplate(id)) {
        sendText(res, 404, "Not found", "text/plain")
        return true
      }
      sendJson(res, 200, { ok: true, id })
      return true
    }

    if (
      req.method === "POST" &&
      parts[1] === "duplicate" &&
      parts.length === 2
    ) {
      const existing = readTemplate(id)
      if (!existing) {
        sendText(res, 404, "Not found", "text/plain")
        return true
      }
      ensureDir(templatesDir)
      const copyName = `${existing.name} (copy)`
      const newId = uniqueId(templatesDir, slugify(copyName))
      const saved = writeTemplate(newId, {
        ...existing,
        id: newId,
        name: copyName,
      })
      sendJson(res, 201, saved)
      return true
    }

    return false
  }

  const middleware: Connect.NextHandleFunction = async (req, res, next) => {
    const url = req.url ?? ""
    const isEmails = url.startsWith("/api/emails")
    const isTemplates = url.startsWith("/api/templates")
    if (!isEmails && !isTemplates) return next()

    try {
      const pathname = url.split("?")[0]
      const base = isEmails ? "/api/emails" : "/api/templates"
      const parts = pathname
        .replace(new RegExp(`^${base}/?`), "")
        .split("/")
        .filter(Boolean)

      const handled = isEmails
        ? await handleEmails(req, res, parts)
        : await handleTemplates(req, res, parts)

      if (handled) return
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
