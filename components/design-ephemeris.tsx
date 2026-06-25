"use client"

import { useState, useEffect, useRef } from "react"
import {
  getTodayString,
  getEphemerisForDate,
  detectOS as detectOSUtil,
  getExitShortcut as getExitShortcutUtil,
  createDynamicFrame,
  buildTweetText,
  ephemeridesEn,
  type Ephemeris,
} from "@/lib/ephemeris-utils"
import { detectLocale, strings, type Locale } from "@/lib/i18n"

// Detect OS
const detectOS = (): "mac" | "windows" | "linux" | "unknown" => {
  if (typeof window === "undefined") return "unknown"
  return detectOSUtil(window.navigator.platform)
}

const getExitShortcut = (): string => {
  if (typeof window === "undefined") return "CTRL+C"
  return getExitShortcutUtil(window.navigator.platform)
}

const getThemeShortcut = (): string => "SHIFT+T"

const closeTab = (): void => {
  if (typeof window !== "undefined") {
    window.close()
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
  const [locale, setLocale] = useState<Locale>("en")
  const [localeReady, setLocaleReady] = useState(false)
  const [dataReady, setDataReady] = useState(false)

  const preRef = useRef<HTMLPreElement | null>(null)
  const measureRef = useRef<HTMLSpanElement | null>(null)
  const shiftDownRef = useRef(false)
  const ctrlDownRef = useRef(false)
  const metaDownRef = useRef(false)
  const dataReadyFiredRef = useRef(false)
  const fullTextRef = useRef("")
  // Always holds the latest ephemeris+ui so the keyboard handler never reads a stale closure
  const tweetDataRef = useRef<{ ephemeris: Ephemeris | null; ui: typeof strings.en }>({
    ephemeris: null,
    ui: strings.en,
  })

  const ui = strings[locale]
  const dateLocale = locale === "es" ? "es-ES" : "en-US"

  const today = new Date()
  const todayString = getTodayString(today)

  // Start with local data instantly (no flash), then replace with DB entry once locale is known
  const [todayEphemeris, setTodayEphemeris] = useState<Ephemeris>(
    () => getEphemerisForDate(todayString, ephemeridesEn)
  )

  const fullText = `┌─[design@terminal]─[~/ephemeris]
└─$ design_ephemeris --date=${todayString}

${ui.connecting}
[████████████████████████████████] 100%

${createDynamicFrame(columns ?? 80, todayEphemeris, today, ui, dateLocale)}

┌─[design@terminal]─[~/ephemeris]
└─$ _`

  // Keep refs current on every render so closures never read stale values
  tweetDataRef.current = { ephemeris: todayEphemeris, ui }
  fullTextRef.current = fullText

  // Clock
  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Detect browser language on mount, then fetch today's entry from DB in that locale
  useEffect(() => {
    const loc = detectLocale()
    setLocale(loc)
    setLocaleReady(true)
    document.documentElement.lang = loc
  }, [])

  // Flip dataReady once both locale and columns are known — gates the typewriter to play once
  useEffect(() => {
    if (!dataReadyFiredRef.current && localeReady && columns !== null) {
      dataReadyFiredRef.current = true
      setDataReady(true)
    }
  }, [localeReady, columns])

  // Re-fetch from Supabase whenever locale is resolved
  useEffect(() => {
    fetch(`/api/ephemeris?date=${todayString}&locale=${locale}`)
      .then((r) => r.json())
      .then(({ ephemeris }) => { if (ephemeris) setTodayEphemeris(ephemeris) })
      .catch(() => {})
  }, [locale])

  // Measure column width for responsive terminal frame
  useEffect(() => {
    const compute = () => {
      const preEl = preRef.current
      const mEl = measureRef.current
      if (!preEl || !mEl) return
      const width = preEl.getBoundingClientRect().width
      const original = mEl.textContent
      mEl.textContent = "─".repeat(50)
      const blockWidth = mEl.getBoundingClientRect().width
      const charWidth = blockWidth / 50
      mEl.textContent = original || "─"
      if (charWidth > 0 && isFinite(charWidth)) {
        const cols = Math.max(4, Math.floor(width / charWidth))
        setColumns(cols)
      }
    }

    compute()
    window.addEventListener("resize", compute)
    if ((document as any).fonts?.ready) {
      ;(document as any).fonts.ready.then(() => compute()).catch(() => {})
    }
    return () => window.removeEventListener("resize", compute)
  }, [])

  // Typewriter animation — fires exactly once when locale + columns are ready
  useEffect(() => {
    if (!dataReady) return

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (prefersReducedMotion) {
      setDisplayText(fullTextRef.current)
      setIsTyping(false)
      return
    }

    let index = 0
    setDisplayText("")
    setIsTyping(true)

    const typeText = () => {
      if (index < fullTextRef.current.length) {
        setDisplayText(fullTextRef.current.slice(0, index + 1))
        index++
        setTimeout(typeText, 20 + Math.random() * 40)
      } else {
        setIsTyping(false)
      }
    }
    const startDelay = setTimeout(typeText, 600)
    return () => clearTimeout(startDelay)
  }, [dataReady])

  // Cursor blink
  useEffect(() => {
    const cursorInterval = setInterval(() => setShowCursor((prev) => !prev), 500)
    return () => clearInterval(cursorInterval)
  }, [])

  // OS-aware keyboard shortcuts
  useEffect(() => {
    setExitShortcut(getExitShortcut())
    setThemeShortcut(getThemeShortcut())
    setTweetShortcut(detectOS() === "mac" ? "CMD+X" : "CTRL+X")
  }, [])

  // Theme cycle: green → white → blue → green
  const toggleTheme = (): void => {
    setCurrentTheme((prev) =>
      prev === "default" ? "white" : prev === "white" ? "blue" : "default"
    )
  }

  // Tweet today's ephemeris — reads from ref so keyboard handler always gets current data
  const tweetEphemeris = (): void => {
    const { ephemeris, ui: currentUi } = tweetDataRef.current
    if (!ephemeris) return
    const siteUrl = typeof window !== "undefined" ? window.location.origin : ""
    const text = buildTweetText(ephemeris, siteUrl, currentUi)
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    )
  }
  const tweetEphemerisRef = useRef(tweetEphemeris)
  tweetEphemerisRef.current = tweetEphemeris

  // Apply theme class to <html>
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove("white-theme", "blue-theme")
    if (currentTheme === "white") html.classList.add("white-theme")
    if (currentTheme === "blue") html.classList.add("blue-theme")
  }, [currentTheme])

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = detectOS() === "mac"
      const isCtrlPressed = isMac ? event.metaKey : event.ctrlKey
      if (event.key === "Shift") shiftDownRef.current = true
      if (event.key === "Control") ctrlDownRef.current = true
      if (event.key === "Meta") metaDownRef.current = true

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
        tweetEphemerisRef.current()
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") shiftDownRef.current = false
      if (event.key === "Control") ctrlDownRef.current = false
      if (event.key === "Meta") metaDownRef.current = false
    }

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
          {currentTime ? currentTime.toLocaleTimeString(dateLocale) : ""}
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
              <span className="bg-[var(--theme-accent)] text-black px-1">{exitShortcut}</span> {ui.shortcutExit}
            </span>
            <button
              onClick={toggleTheme}
              className="hover:text-[var(--theme-accent)] transition-colors cursor-pointer bg-transparent border-0 p-0 font-mono text-xs text-[var(--theme-accent)]/70"
            >
              <span className="bg-[var(--theme-accent)] text-black px-1">{themeShortcut}</span> {ui.shortcutTheme}
            </button>
            <button
              onClick={tweetEphemeris}
              className="hover:text-[var(--theme-accent)] transition-colors cursor-pointer bg-transparent border-0 p-0 font-mono text-xs text-[var(--theme-accent)]/70"
            >
              <span className="bg-[var(--theme-accent)] text-black px-1">{tweetShortcut}</span> {ui.shortcutTweet}
            </button>
          </div>
          <span>{ui.copyright}</span>
        </div>
      </div>
    </div>
  )
}
