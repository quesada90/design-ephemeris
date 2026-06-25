"use client"

import { useState, useEffect, useRef } from "react"
import {
  designEphemerides,
  getTodayString,
  getEphemerisForDate,
  detectOS as detectOSUtil,
  getExitShortcut as getExitShortcutUtil,
  createDynamicFrame,
  buildTweetText,
} from "@/lib/ephemeris-utils"

// Detectar sistema operativo
const detectOS = (): "mac" | "windows" | "linux" | "unknown" => {
  if (typeof window === "undefined") return "unknown"
  return detectOSUtil(window.navigator.platform)
}

// Obtener la combinación de teclas correcta según el OS
const getExitShortcut = (): string => {
  if (typeof window === "undefined") return "CTRL+C"
  return getExitShortcutUtil(window.navigator.platform)
}

// Obtener la combinación de teclas para cambiar tema según el OS
const getThemeShortcut = (): string => {
  return "SHIFT+T"
}

// Función para cerrar la pestaña
const closeTab = (): void => {
  if (typeof window !== "undefined") {
    window.close()
    // Fallback si window.close() no funciona (p.ej. pestañas no abiertas por JS)
    if (!window.closed) {
      window.location.href = "about:blank"
    }
  }
}

export function DesignEphemeris() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [displayText, setDisplayText] = useState("")
  const [isTyping, setIsTyping] = useState(true)
  const [showCursor, setShowCursor] = useState(true)
  const [columns, setColumns] = useState<number | null>(null)
  const [exitShortcut, setExitShortcut] = useState<string>("CTRL+C")
  type Theme = "default" | "white" | "blue"
  const [currentTheme, setCurrentTheme] = useState<Theme>("default")
  const [themeShortcut, setThemeShortcut] = useState<string>("SHIFT+T")
  const [tweetShortcut, setTweetShortcut] = useState<string>("CTRL+X")

  const preRef = useRef<HTMLPreElement | null>(null)
  const measureRef = useRef<HTMLSpanElement | null>(null)
  const shiftDownRef = useRef(false)
  const ctrlDownRef = useRef(false)
  const metaDownRef = useRef(false)

  // Get today's ephemeris
  const today = new Date()
  const todayString = getTodayString(today)
  const todayEphemeris = getEphemerisForDate(todayString)

  const fullText = `┌─[design@terminal]─[~/ephemeris]
└─$ design_ephemeris --date=${todayString}

● Conectando a la base de datos de historia del diseño...
[████████████████████████████████] 100%

${createDynamicFrame(columns ?? 80, todayEphemeris, today)}

┌─[design@terminal]─[~/ephemeris]
└─$ _`

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Medir número de columnas visibles según el ancho del contenedor y el ancho de un carácter
  useEffect(() => {
    const compute = () => {
      const preEl = preRef.current
      const mEl = measureRef.current
      if (!preEl || !mEl) return
      const width = preEl.getBoundingClientRect().width
      // probar con un bloque de caracteres para mayor precisión
      const original = mEl.textContent
      mEl.textContent = "─".repeat(50)
      let blockWidth = mEl.getBoundingClientRect().width
      let charWidth = blockWidth / 50
      mEl.textContent = original || "─"
      if (charWidth > 0 && isFinite(charWidth)) {
        const cols = Math.max(4, Math.floor(width / charWidth))
        setColumns(cols)
      }
    }

    compute()
    const onResize = () => compute()
    window.addEventListener("resize", onResize)
    // esperar a fuentes
    if ((document as any).fonts?.ready) {
      ;(document as any).fonts.ready.then(() => compute()).catch(() => {})
    }
    return () => window.removeEventListener("resize", onResize)
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

  // Detectar OS y configurar atajo de teclado
  useEffect(() => {
    setExitShortcut(getExitShortcut())
    setThemeShortcut(getThemeShortcut())
    setTweetShortcut(detectOS() === "mac" ? "CMD+X" : "CTRL+X")
  }, [])

  // Función para cambiar tema — ciclo: green → white → blue → green
  const toggleTheme = (): void => {
    setCurrentTheme((prev) =>
      prev === "default" ? "white" : prev === "white" ? "blue" : "default"
    )
  }

  // Abrir X/Twitter con la efeméride del día pre-compuesta
  const tweetEphemeris = (): void => {
    const siteUrl = typeof window !== "undefined" ? window.location.origin : ""
    const text = buildTweetText(todayEphemeris, siteUrl)
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    )
  }

  // Aplicar tema cuando cambie el estado
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove("white-theme", "blue-theme")
    if (currentTheme === "white") html.classList.add("white-theme")
    if (currentTheme === "blue") html.classList.add("blue-theme")
  }, [currentTheme])

  // Manejar atajo de teclado para cerrar pestaña
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = detectOS() === "mac"
      const isCtrlPressed = isMac ? event.metaKey : event.ctrlKey
      // actualizar refs de modificadores
      if (event.key === "Shift") shiftDownRef.current = true
      if (event.key === "Control") ctrlDownRef.current = true
      if (event.key === "Meta") metaDownRef.current = true

      console.log(
        "Key pressed:", event.key,
        "Ctrl:", isCtrlPressed,
        "Meta:", event.metaKey,
        "Shift:", event.shiftKey,
        "code:", (event as any).code
      )
      
      if (isCtrlPressed && event.key.toLowerCase() === "c") {
        event.preventDefault()
        event.stopPropagation()
        closeTab()
      } else if ((event as any).code === "KeyT" && (event.shiftKey || shiftDownRef.current)) {
        event.preventDefault()
        event.stopPropagation()
        toggleTheme()
      } else if (isCtrlPressed && event.key.toLowerCase() === "x") {
        event.preventDefault()
        event.stopPropagation()
        tweetEphemeris()
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") shiftDownRef.current = false
      if (event.key === "Control") ctrlDownRef.current = false
      if (event.key === "Meta") metaDownRef.current = false
    }

    // Usar capture phase para interceptar antes que el navegador
    document.addEventListener("keydown", handleKeyDown, true)
    document.addEventListener("keyup", handleKeyUp, true)
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true)
      document.removeEventListener("keyup", handleKeyUp, true)
    }
  }, [])

  return (
    <div className="min-h-screen p-6 flex flex-col relative overflow-hidden font-mono bg-[#0E0E0E]">
      {/* Terminal header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--theme-accent-muted)]/30 relative z-10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 mr-4">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
          </div>
          <div className="text-[var(--theme-accent)] text-sm">design@terminal:~/ephemeris</div>
        </div>
        <div className="text-[var(--theme-accent)]/80 text-sm" suppressHydrationWarning>
          {currentTime ? currentTime.toLocaleTimeString("es-ES") : ""}
        </div>
      </div>

      {/* Terminal content */}
      <div className="flex-1 relative z-10">
        <div className="bg-[#0E0E0E] p-6 w-full md:w-[80vw] mx-auto">
          <pre
            className="whitespace-pre text-sm leading-relaxed tracking-normal text-[var(--theme-accent)] drop-shadow-lg"
            style={{ filter: "blur(0.3px)" }}
            ref={preRef}
          >
            {displayText}
            <span ref={measureRef} className="invisible absolute">─</span>
            {(isTyping || showCursor) && (
              <span className="bg-[var(--theme-accent)] text-black animate-pulse shadow-lg shadow-[var(--theme-accent)]/50">█</span>
            )}
          </pre>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-[var(--theme-accent-muted)]/30 relative z-10">
        <div className="flex justify-between items-center text-xs text-[var(--theme-accent)]/70">
          <div className="flex space-x-4">
            <span>
              <span className="bg-[var(--theme-accent)] text-black px-1">{exitShortcut}</span> Salir
            </span>
            <button
              onClick={toggleTheme}
              className="hover:text-[var(--theme-accent)] transition-colors cursor-pointer bg-transparent border-0 p-0 font-mono text-xs text-[var(--theme-accent)]/70"
            >
              <span className="bg-[var(--theme-accent)] text-black px-1">{themeShortcut}</span> Temas
            </button>
            <button
              onClick={tweetEphemeris}
              className="hover:text-[var(--theme-accent)] transition-colors cursor-pointer bg-transparent border-0 p-0 font-mono text-xs text-[var(--theme-accent)]/70"
            >
              <span className="bg-[var(--theme-accent)] text-black px-1">{tweetShortcut}</span> Tweet
            </button>
          </div>
          <span>Historia del Diseño © 2024</span>
        </div>
      </div>
    </div>
  )
}
