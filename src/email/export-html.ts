/**
 * Compile EmailDocument → email-safe HTML via layout IR.
 *
 * One sync string function for client preview and Node API.
 */
import { compileLayout, type LayoutChild, type LayoutColumn } from "./layout.ts"
import type {
  Align,
  BlockBg,
  ButtonStyle,
  EmailDocument,
  LeafNode,
  Spacing,
} from "./schema.ts"

const PADDING_PX: Record<Spacing, number> = {
  none: 0,
  sm: 8,
  md: 16,
  lg: 28,
}

const BG_HEX: Record<BlockBg, string> = {
  none: "transparent",
  muted: "#f4f4f5",
  accent: "#eef2ff",
}

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

const BRAND = "#18181b"
const MUTED = "#71717a"
const BODY = "#3f3f46"
const BORDER = "#d4d4d8"
const PAGE_BG = "#f4f4f5"
const CARD_BG = "#ffffff"

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function escapeAttr(value: string): string {
  return escapeHtml(value)
}

function stripOuterP(html: string): string {
  return html.replace(/^<p[^>]*>/i, "").replace(/<\/p>$/i, "")
}

function cellStyle(chrome: LeafNode["chrome"] | LayoutColumn["chrome"]): string {
  const pad = PADDING_PX[chrome.padding]
  const bg = BG_HEX[chrome.background]
  return [
    `padding:${pad}px`,
    `background-color:${bg}`,
    `text-align:${chrome.align}`,
    `font-family:${FONT}`,
    `color:${BRAND}`,
    "mso-line-height-rule:exactly",
  ].join(";")
}

function alignWrap(align: Align, inner: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
  <tr>
    <td align="${align}" style="font-family:${FONT};">
${inner}
    </td>
  </tr>
</table>`
}

function buttonColors(style: ButtonStyle): {
  bg: string
  color: string
  border: string
  padding: string
  radius: string
  textDecoration: string
} {
  if (style === "filled") {
    return {
      bg: BRAND,
      color: "#ffffff",
      border: BRAND,
      padding: "12px 22px",
      radius: "8px",
      textDecoration: "none",
    }
  }
  if (style === "outline") {
    return {
      bg: CARD_BG,
      color: BRAND,
      border: BORDER,
      padding: "11px 21px",
      radius: "8px",
      textDecoration: "none",
    }
  }
  return {
    bg: "transparent",
    color: BRAND,
    border: "transparent",
    padding: "8px 4px",
    radius: "0",
    textDecoration: "underline",
  }
}

function renderButton(block: Extract<LeafNode, { type: "button" }>): string {
  const label = stripOuterP(block.label)
  const href = escapeAttr(block.url || "#")
  const c = buttonColors(block.style)
  const widthAttr = block.fullWidth ? ' width="100%"' : ""
  const widthStyle = block.fullWidth ? "width:100%;" : ""
  const aDisplay = block.fullWidth ? "block" : "inline-block"

  if (block.style === "text") {
    return alignWrap(
      block.chrome.align,
      `<a href="${href}" style="display:${aDisplay};padding:${c.padding};color:${c.color};text-decoration:${c.textDecoration};font-size:14px;font-weight:600;font-family:${FONT};line-height:1.25;">${label}</a>`
    )
  }

  const vmlFill =
    block.style === "filled"
      ? `fillcolor="${c.bg}" stroke="f"`
      : `fillcolor="${c.bg}" strokecolor="${c.border}" strokeweight="1px"`
  const vml = `<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:44px;v-text-anchor:middle;${widthStyle}" arcsize="10800" ${vmlFill}>
  <w:anchorlock/>
  <center style="color:${c.color};font-family:${FONT};font-size:14px;font-weight:600;">${label}</center>
</v:roundrect>
<![endif]-->`

  const anchor = `<a href="${href}" style="display:${aDisplay};padding:${c.padding};background-color:${c.bg};color:${c.color};text-decoration:${c.textDecoration};border:1px solid ${c.border};border-radius:${c.radius};font-size:14px;font-weight:600;font-family:${FONT};line-height:1.25;${widthStyle}box-sizing:border-box;mso-hide:all;">${label}</a>`

  const inner = `<table role="presentation" cellpadding="0" cellspacing="0" border="0"${widthAttr} style="border-collapse:collapse;${widthStyle}">
  <tr>
    <td align="center" bgcolor="${block.style === "filled" ? c.bg : CARD_BG}" style="border-radius:${c.radius};background-color:${c.bg};">
      ${vml}
      <!--[if !mso]><!-- -->${anchor}<!--<![endif]-->
    </td>
  </tr>
</table>`

  return alignWrap(block.chrome.align, inner)
}

function renderImage(block: Extract<LeafNode, { type: "image" }>): string {
  const radius = block.rounded ? "8px" : "0"
  const alt = escapeAttr(block.alt || "Image")
  const height = 180
  const cell = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
  <tr>
    <td height="${height}" bgcolor="#e4e4e7" role="img" aria-label="${alt}" style="height:${height}px;background-color:#e4e4e7;border-radius:${radius};font-size:0;line-height:0;mso-line-height-rule:exactly;">
      &nbsp;
    </td>
  </tr>
</table>`

  let inner = block.href
    ? `<a href="${escapeAttr(block.href)}" style="text-decoration:none;color:inherit;">${cell}</a>`
    : cell

  if (block.caption) {
    inner += `<div style="font-size:12px;color:${MUTED};margin-top:8px;line-height:1.4;font-family:${FONT};">${escapeHtml(block.caption)}</div>`
  }

  return alignWrap(block.chrome.align, inner)
}

function renderLeafInner(block: LeafNode): string {
  switch (block.type) {
    case "header": {
      const logo = block.showLogo
        ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;vertical-align:middle;border-collapse:collapse;"><tr><td width="36" height="36" bgcolor="${BRAND}" style="width:36px;height:36px;background-color:${BRAND};border-radius:8px;font-size:0;line-height:0;">&nbsp;</td></tr></table><span style="display:inline-block;width:10px;"></span>`
        : ""
      return `${logo}<span style="font-size:18px;font-weight:600;vertical-align:middle;line-height:1.3;font-family:${FONT};">${escapeHtml(block.brand)}</span>
<div style="font-size:13px;color:${MUTED};margin-top:4px;line-height:1.4;font-family:${FONT};">${escapeHtml(block.tagline)}</div>`
    }
    case "heading": {
      const size = block.size === "lg" ? 28 : block.size === "md" ? 22 : 18
      return `<div style="font-size:${size}px;font-weight:600;line-height:1.25;font-family:${FONT};color:${BRAND};">${stripOuterP(block.text)}</div>`
    }
    case "paragraph": {
      const color = block.muted ? MUTED : BODY
      return `<div style="font-size:15px;line-height:1.55;color:${color};font-family:${FONT};">${stripOuterP(block.text)}</div>`
    }
    case "button":
      return renderButton(block)
    case "image":
      return renderImage(block)
    case "footer": {
      const parts: string[] = [
        `<div style="font-size:12px;font-weight:600;line-height:1.4;font-family:${FONT};">${escapeHtml(block.company)}</div>`,
        `<div style="font-size:12px;color:${MUTED};margin-top:4px;line-height:1.4;font-family:${FONT};">${escapeHtml(block.address)}</div>`,
      ]
      if (block.showSocial) {
        parts.push(
          `<div style="font-size:12px;color:${MUTED};margin-top:8px;line-height:1.4;font-family:${FONT};">Twitter · LinkedIn · GitHub</div>`
        )
      }
      if (block.showUnsubscribe) {
        parts.push(
          `<div style="font-size:12px;margin-top:8px;line-height:1.4;font-family:${FONT};"><a href="#" style="color:${MUTED};text-decoration:underline;">Unsubscribe</a></div>`
        )
      }
      return parts.join("")
    }
  }
}

function renderChild(child: LayoutChild): string {
  if (child.kind === "leaf") {
    if (!child.node.chrome.visible) return ""
    return `<tr>
  <td align="${child.node.chrome.align}" style="${cellStyle(child.node.chrome)}">
${renderLeafInner(child.node)}
  </td>
</tr>`
  }

  const gap = PADDING_PX[child.gap]
  const flexSum = child.columns.reduce((sum, col) => sum + col.flex, 0) || 1
  const cells = child.columns
    .map((column, index) => {
      const widthPct = (column.flex / flexSum) * 100
      const padRight = index < child.columns.length - 1 ? gap : 0
      const inner = column.children
        .map((nested) => {
          if (nested.kind === "leaf") {
            return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
  <tr>
    <td align="${nested.node.chrome.align}" style="${cellStyle(nested.node.chrome)}">
${renderLeafInner(nested.node)}
    </td>
  </tr>
</table>`
          }
          return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">${renderChild(nested)}</table>`
        })
        .join("\n")
      const valign =
        column.vAlign === "middle"
          ? "middle"
          : column.vAlign === "bottom"
            ? "bottom"
            : "top"
      return `<td width="${widthPct.toFixed(2)}%" valign="${valign}" style="width:${widthPct.toFixed(2)}%;padding:0 ${padRight}px 0 0;vertical-align:${valign};font-family:${FONT};">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
  <tr>
    <td style="${cellStyle(column.chrome)}">
${inner || `&nbsp;`}
    </td>
  </tr>
</table>
</td>`
    })
    .join("\n")

  const rowClass = child.stackOnMobile ? "email-row" : "email-row-fixed"
  return `<tr>
  <td align="${child.chrome.align}" style="${cellStyle(child.chrome)}">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="${rowClass}" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
  <tr>
${cells}
  </tr>
</table>
  </td>
</tr>`
}

function renderPreheader(doc: EmailDocument): string {
  if (!doc.meta.showPreheader || !doc.meta.previewText) return ""
  const text = escapeHtml(doc.meta.previewText)
  const pad = "&nbsp;".repeat(100)
  return `<div style="display:none;font-size:1px;color:${PAGE_BG};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${text}${pad}</div>`
}

/** Compile an EmailDocument to email-safe HTML (tables + inline CSS + Outlook VML). */
export function exportToHtml(doc: EmailDocument): string {
  const layout = compileLayout(doc)
  const width = layout.width
  const rows = layout.children.map(renderChild).filter(Boolean).join("\n")
  const preheader = renderPreheader(doc)
  const title = escapeAttr(doc.meta.subject || "Email")

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<title>${title}</title>
<!--[if mso]>
<noscript>
<xml>
  <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
</xml>
</noscript>
<style type="text/css">
  table { border-collapse: collapse; }
  td, th { font-family: ${FONT}; }
</style>
<![endif]-->
<style type="text/css">
  body, table, td { font-family: ${FONT}; }
  img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  a { text-decoration: none; }
  @media only screen and (max-width: ${width}px) {
    .email-card { width: 100% !important; max-width: 100% !important; }
    .email-row td { display: block !important; width: 100% !important; padding-right: 0 !important; padding-bottom: 12px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${PAGE_BG};font-family:${FONT};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;background-color:${PAGE_BG};">
  <tr>
    <td align="center" style="padding:24px 12px;background-color:${PAGE_BG};">
      <table role="presentation" class="email-card" width="${width}" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:${width}px;max-width:100%;background-color:${CARD_BG};border-radius:12px;overflow:hidden;">
${rows}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}
