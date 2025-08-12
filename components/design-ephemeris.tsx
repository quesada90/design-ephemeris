"use client"

import { useState, useEffect } from "react"

interface Ephemeris {
  date: string
  year: number
  event: string
  description: string
  category: "birth" | "death" | "event" | "founding"
}

const designEphemerides: Ephemeris[] = [
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

export function DesignEphemeris() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [displayText, setDisplayText] = useState("")
  const [isTyping, setIsTyping] = useState(true)
  const [showCursor, setShowCursor] = useState(true)

  // Get today's ephemeris
  const today = new Date()
  const todayString = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  const todayEphemeris = designEphemerides.find((e) => e.date === todayString) || designEphemerides[0]

  const createDynamicFrame = () => {
    const frameWidth = 80 // Ancho fijo total de la línea, incluidas esquinas
    const title = " EFEMÉRIDE DEL DÍA "
    const topInnerWidth = frameWidth - 2 // sin contar esquinas
    const trailing = Math.max(0, topInnerWidth - title.length)
    const topBorder = `╭${title}${"─".repeat(trailing)}╮`
    const bottomBorder = `╰${"─".repeat(topInnerWidth)}╯`

    // Ajuste de líneas a un ancho máximo (sin bordes laterales visibles)
    const indent = "\t" // tabulador para jerarquía respecto al título
    const visibleWidth = (text: string) => text.replace(/\t/g, "        ").length // cuenta tabs como 8 espacios
    const wrapLines = (content: string, prefix = ""): string[] => {
      // Estimamos el ancho visible máximo restando la longitud del prefijo
      const maxWidth = Math.max(0, frameWidth - visibleWidth(prefix))
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

    const dateFormatted = today.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const contentLines: string[] = []
    contentLines.push("")
    contentLines.push(...wrapLines(`Fecha: ${dateFormatted}`, indent))
    contentLines.push("")
    contentLines.push(...wrapLines(`Año: ${todayEphemeris.year}`, indent))
    contentLines.push(...wrapLines(`Evento: ${todayEphemeris.event}`, indent))
    contentLines.push("")
    contentLines.push(...wrapLines("Descripción:", indent))
    contentLines.push(...wrapLines(`   ${todayEphemeris.description}`, indent))
    contentLines.push("")
    contentLines.push(
      ...wrapLines(`Categoría: [${todayEphemeris.category.toUpperCase()}]`, indent)
    )
    contentLines.push("")

    return [topBorder, ...contentLines, bottomBorder].join("\n")
  }

  const fullText = `┌─[design@terminal]─[~/ephemeris]
└─$ design_ephemeris --date=${todayString}

● Conectando a la base de datos de historia del diseño...
[████████████████████████████████] 100%

${createDynamicFrame()}

┌─[design@terminal]─[~/ephemeris]
└─$ _`

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let index = 0
    const typeText = () => {
      if (index < fullText.length) {
        setDisplayText(fullText.slice(0, index + 1))
        index++
        const speed = 20 + Math.random() * 40
        setTimeout(typeText, speed)
      } else {
        setIsTyping(false)
      }
    }

    const startDelay = setTimeout(typeText, 600)
    return () => clearTimeout(startDelay)
  }, [fullText])

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)
    return () => clearInterval(cursorInterval)
  }, [])

  return (
    <div className="min-h-screen p-6 flex flex-col relative overflow-hidden font-mono bg-[#0E0E0E]">
      {/* Terminal header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-green-500/30 relative z-10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 mr-4">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
          </div>
          <div className="text-green-400 text-sm">design@terminal:~/ephemeris</div>
        </div>
        <div className="text-green-400/80 text-sm" suppressHydrationWarning>
          {currentTime ? currentTime.toLocaleTimeString("es-ES") : ""}
        </div>
      </div>

      {/* Terminal content */}
      <div className="flex-1 relative z-10">
        <div className="bg-[#0E0E0E] p-6">
          <pre
            className="whitespace-pre-wrap text-sm leading-relaxed tracking-wide text-green-400 drop-shadow-lg"
            style={{ filter: "blur(0.3px)" }}
          >
            {displayText}
            {(isTyping || showCursor) && (
              <span className="bg-green-400 text-black animate-pulse shadow-lg shadow-green-400/50">█</span>
            )}
          </pre>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-green-500/30 relative z-10">
        <div className="flex justify-between items-center text-xs text-green-400/70">
          <div className="flex space-x-4">
            <span>
              <span className="bg-green-400 text-black px-1">CTRL+C</span> Salir
            </span>
            <span>
              <span className="bg-green-400 text-black px-1">CTRL+T</span> Temas
            </span>
            <span>
              <span className="bg-green-400 text-black px-1">CTRL+X</span> Tweet
            </span>
          </div>
          <span>Historia del Diseño © 2024</span>
        </div>
      </div>
    </div>
  )
}
