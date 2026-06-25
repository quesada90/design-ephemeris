import type { UIStrings } from "./i18n"

export interface Ephemeris {
  date: string
  year: number
  event: string
  description: string
  category: "birth" | "death" | "event" | "founding"
}

// Re-export English dataset as the default for backward compat with tests
export { ephemeridesEn as designEphemerides } from "./ephemeris-data/en"
export { ephemeridesEn } from "./ephemeris-data/en"
export { ephemeridesEs } from "./ephemeris-data/es"

export function getTodayString(date: Date = new Date()): string {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function getEphemerisForDate(
  dateString: string,
  db: Ephemeris[]
): Ephemeris {
  return db.find((e) => e.date === dateString) ?? db[0]
}

export function detectOS(platform: string): "mac" | "windows" | "linux" | "unknown" {
  const p = platform.toLowerCase()
  if (p.includes("mac")) return "mac"
  if (p.includes("win")) return "windows"
  if (p.includes("linux") || p.includes("x11")) return "linux"
  return "unknown"
}

export function getExitShortcut(platform: string): string {
  return detectOS(platform) === "mac" ? "CMD+C" : "CTRL+C"
}

export const TAB_WIDTH = 8

export function visibleWidth(text: string): number {
  return text.replace(/\t/g, " ".repeat(TAB_WIDTH)).length
}

export function wrapLines(content: string, prefix: string, totalColumns: number): string[] {
  const maxWidth = Math.max(1, totalColumns - visibleWidth(prefix))
  if (content.length <= maxWidth) return [prefix + content]
  const words = content.split(" ")
  const lines: string[] = []
  let currentLine = ""
  for (const word of words) {
    const proposed = currentLine.length + (currentLine ? 1 : 0) + word.length
    if (proposed <= maxWidth) {
      currentLine += (currentLine ? " " : "") + word
    } else {
      if (currentLine) lines.push(prefix + currentLine)
      if (word.length > maxWidth) {
        let start = 0
        while (start < word.length) {
          lines.push(prefix + word.slice(start, start + maxWidth))
          start += maxWidth
        }
        currentLine = ""
      } else {
        currentLine = word
      }
    }
  }
  if (currentLine) lines.push(prefix + currentLine)
  return lines
}

export function wrapDescriptionToFullWidth(
  content: string,
  prefix: string,
  totalColumns: number
): string[] {
  const lines = wrapLines(content, prefix, totalColumns)
  return lines.map((line) => {
    const vis = visibleWidth(line)
    const pad = totalColumns - vis
    if (pad <= 0) return line
    return line + " ".repeat(pad)
  })
}

export function createDynamicFrame(
  totalColumns: number,
  ephemeris: Ephemeris,
  date: Date = new Date(),
  ui: UIStrings,
  dateLocale: string = "en-US"
): string {
  const topInnerWidth = Math.max(0, totalColumns - 2)
  const topBorder = `╭${"─".repeat(topInnerWidth)}╮`
  const bottomBorder = `╰${"─".repeat(topInnerWidth)}╯`
  const indent = "\t"

  const dateFormatted = date.toLocaleDateString(dateLocale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const contentLines: string[] = []
  contentLines.push("")
  contentLines.push(...wrapLines(`${ui.labelDate} ${dateFormatted}`, indent, totalColumns))
  contentLines.push("")
  contentLines.push(...wrapLines(`${ui.labelYear} ${ephemeris.year}`, indent, totalColumns))
  contentLines.push(...wrapLines(`${ui.labelEvent} ${ephemeris.event}`, indent, totalColumns))
  contentLines.push("")
  contentLines.push(...wrapLines(ui.labelDescription, indent, totalColumns))
  contentLines.push(...wrapDescriptionToFullWidth(`   ${ephemeris.description}`, indent, totalColumns))
  contentLines.push("")
  contentLines.push(...wrapLines(`${ui.labelCategory} [${ephemeris.category.toUpperCase()}]`, indent, totalColumns))
  contentLines.push("")

  const titleLine = `${indent}${ui.frameTitle}`
  return [topBorder, titleLine, "", ...contentLines, "", bottomBorder].join("\n")
}

export function buildTweetText(
  ephemeris: Ephemeris,
  siteUrl: string,
  ui: UIStrings
): string {
  const hashtag = ui.tweetHashtags(ephemeris.category)

  // Twitter counts any URL as ~23 chars regardless of length, and most emoji
  // as 2 weighted chars. We budget conservatively:
  //   Header line:  ~30 chars  (tweetHeader + year + "\n\n")
  //   Event line:   ~82 chars  ("✦ " + max 80 chars + "\n\n")
  //   Description: ~120 chars  (truncated + "\n\n")
  //   URL:          ~25 chars  (Twitter counts as 23 + "\n\n")
  //   Hashtags:     ~28 chars
  //   Total:        ~285 weighted → safe within Twitter's 280-weighted limit
  const maxEventLength = 80
  const maxDescriptionLength = 120

  const event =
    ephemeris.event.length > maxEventLength
      ? ephemeris.event.slice(0, maxEventLength - 1) + "…"
      : ephemeris.event

  const description =
    ephemeris.description.length > maxDescriptionLength
      ? ephemeris.description.slice(0, maxDescriptionLength - 1) + "…"
      : ephemeris.description

  return `${ui.tweetHeader} ${ephemeris.year}\n\n✦ ${event}\n\n${description}\n\n${siteUrl}\n\n${hashtag}`
}
