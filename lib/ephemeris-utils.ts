export interface Ephemeris {
  date: string
  year: number
  event: string
  description: string
  category: "birth" | "death" | "event" | "founding"
}

export const designEphemerides: Ephemeris[] = [
  {
    date: "01-01",
    year: 1919,
    event: "Nace el Bauhaus",
    description:
      "Walter Gropius funda la escuela Bauhaus en Weimar, revolucionando el diseño moderno al fusionar arte, artesanía e industria. Su filosofía 'la forma sigue a la función' transformó arquitectura, diseño gráfico y productos, estableciendo principios que aún definen el diseño contemporáneo.",
    category: "founding",
  },
  {
    date: "01-02",
    year: 1920,
    event: "Nace Isaac Asimov",
    description:
      "Escritor de ciencia ficción cuyas visiones futuristas sobre robots e inteligencia artificial influyeron profundamente en el diseño de interfaces, UX/UI y estética tecnológica. Sus conceptos sobre interacción humano-máquina siguen inspirando diseñadores digitales hoy.",
    category: "birth",
  },
  {
    date: "01-03",
    year: 1929,
    event: "Nace Sergio Aragonés",
    description:
      "Ilustrador y diseñador gráfico mexicano-español, maestro del humor visual en MAD Magazine. Pionero en técnicas de ilustración marginal y narrativa visual que revolucionaron el diseño editorial y la comunicación gráfica humorística en medios impresos.",
    category: "birth",
  },
  {
    date: "01-04",
    year: 1958,
    event: "Nace Matt Frewer",
    description:
      "Actor que interpretó a Max Headroom, el primer presentador virtual generado por computadora. Este personaje se convirtió en icono del diseño digital de los 80, influyendo en la estética cyberpunk, motion graphics y el desarrollo de avatares digitales.",
    category: "birth",
  },
  {
    date: "01-05",
    year: 1931,
    event: "Nace Robert Duvall",
    description:
      "Actor cuyo trabajo meticuloso en desarrollo de personajes influyó en el diseño de vestuario, caracterización y dirección de arte cinematográfica. Su enfoque detallista inspiró a diseñadores de producción a crear mundos visuales más auténticos y creíbles.",
    category: "birth",
  },
]

export function getTodayString(date: Date = new Date()): string {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function getEphemerisForDate(
  dateString: string,
  db: Ephemeris[] = designEphemerides
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
  date: Date = new Date()
): string {
  const topInnerWidth = Math.max(0, totalColumns - 2)
  const topBorder = `╭${"─".repeat(topInnerWidth)}╮`
  const bottomBorder = `╰${"─".repeat(topInnerWidth)}╯`
  const indent = "\t"

  const dateFormatted = date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const contentLines: string[] = []
  contentLines.push("")
  contentLines.push(...wrapLines(`Fecha: ${dateFormatted}`, indent, totalColumns))
  contentLines.push("")
  contentLines.push(...wrapLines(`Año: ${ephemeris.year}`, indent, totalColumns))
  contentLines.push(...wrapLines(`Evento: ${ephemeris.event}`, indent, totalColumns))
  contentLines.push("")
  contentLines.push(...wrapLines("Descripción:", indent, totalColumns))
  contentLines.push(...wrapDescriptionToFullWidth(`   ${ephemeris.description}`, indent, totalColumns))
  contentLines.push("")
  contentLines.push(...wrapLines(`Categoría: [${ephemeris.category.toUpperCase()}]`, indent, totalColumns))
  contentLines.push("")

  const titleLine = `${indent}EFEMERIDE DEL DIA`
  return [topBorder, titleLine, "", ...contentLines, "", bottomBorder].join("\n")
}

export function buildTweetText(ephemeris: Ephemeris, siteUrl: string): string {
  const hashtag =
    ephemeris.category === "founding"
      ? "#DiseñoGráfico #Historia"
      : ephemeris.category === "birth"
      ? "#DiseñoGráfico #Diseño"
      : "#DiseñoGráfico #HistoriaDelDiseño"

  // Twitter counts any URL as 23 chars; reserve those for siteUrl.
  // Keep non-URL content under 257 chars to stay safely within 280 total.
  const maxEventLength = 80
  const event =
    ephemeris.event.length > maxEventLength
      ? ephemeris.event.slice(0, maxEventLength - 1) + "…"
      : ephemeris.event

  return `📅 Efeméride del Diseño — ${ephemeris.year}\n\n✦ ${event}\n\n${siteUrl}\n\n${hashtag}`
}
