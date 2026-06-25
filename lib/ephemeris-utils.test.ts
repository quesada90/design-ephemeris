import { describe, it, expect } from "vitest"
import {
  detectOS,
  getExitShortcut,
  getTodayString,
  getEphemerisForDate,
  visibleWidth,
  wrapLines,
  wrapDescriptionToFullWidth,
  createDynamicFrame,
  buildTweetText,
  designEphemerides,
  ephemeridesEn,
  ephemeridesEs,
  TAB_WIDTH,
} from "./ephemeris-utils"
import { detectLocale, strings } from "./i18n"

const uiEn = strings.en
const uiEs = strings.es

// ─── OS detection ────────────────────────────────────────────────────────────

describe("detectOS", () => {
  it("returns mac for MacIntel", () => expect(detectOS("MacIntel")).toBe("mac"))
  it("returns mac for MacARM", () => expect(detectOS("MacARM")).toBe("mac"))
  it("returns windows for Win32", () => expect(detectOS("Win32")).toBe("windows"))
  it("returns linux for Linux x86_64", () => expect(detectOS("Linux x86_64")).toBe("linux"))
  it("returns linux for X11", () => expect(detectOS("X11")).toBe("linux"))
  it("returns unknown for empty string", () => expect(detectOS("")).toBe("unknown"))
  it("returns unknown for unrecognised platform", () => expect(detectOS("FreeBSD")).toBe("unknown"))
})

describe("getExitShortcut", () => {
  it("returns CMD+C on mac", () => expect(getExitShortcut("MacIntel")).toBe("CMD+C"))
  it("returns CTRL+C on windows", () => expect(getExitShortcut("Win32")).toBe("CTRL+C"))
  it("returns CTRL+C on linux", () => expect(getExitShortcut("Linux x86_64")).toBe("CTRL+C"))
  it("returns CTRL+C for unknown platform", () => expect(getExitShortcut("")).toBe("CTRL+C"))
})

// ─── i18n ─────────────────────────────────────────────────────────────────────

describe("detectLocale", () => {
  it("returns en for en-US", () => expect(detectLocale("en-US")).toBe("en"))
  it("returns en for fr-FR (unsupported language defaults to en)", () => expect(detectLocale("fr-FR")).toBe("en"))
  it("returns es for es-ES", () => expect(detectLocale("es-ES")).toBe("es"))
  it("returns es for es-MX", () => expect(detectLocale("es-MX")).toBe("es"))
  it("returns en when no lang provided (SSR default)", () => expect(detectLocale()).toBe("en"))
})

describe("strings dictionary", () => {
  const requiredKeys: (keyof typeof strings.en)[] = [
    "connecting", "frameTitle", "labelDate", "labelYear", "labelEvent",
    "labelDescription", "labelCategory", "shortcutExit", "shortcutTheme",
    "shortcutTweet", "copyright", "tweetHeader", "tweetHashtags",
  ]

  it("en has all required keys", () => {
    for (const key of requiredKeys) expect(strings.en).toHaveProperty(key)
  })

  it("es has all required keys", () => {
    for (const key of requiredKeys) expect(strings.es).toHaveProperty(key)
  })

  it("en tweetHashtags returns English hashtags for founding", () =>
    expect(strings.en.tweetHashtags("founding")).toContain("#History"))

  it("es tweetHashtags returns Spanish hashtags for founding", () =>
    expect(strings.es.tweetHashtags("founding")).toContain("#Historia"))
})

// ─── Ephemeris datasets ───────────────────────────────────────────────────────

describe("ephemeris datasets", () => {
  it("designEphemerides re-exports the English dataset", () =>
    expect(designEphemerides).toBe(ephemeridesEn))

  it("both datasets have at least 5 entries", () => {
    expect(ephemeridesEn.length).toBeGreaterThanOrEqual(5)
    expect(ephemeridesEs.length).toBeGreaterThanOrEqual(5)
  })

  it("datasets have the same number of entries", () =>
    expect(ephemeridesEn.length).toBe(ephemeridesEs.length))

  it("datasets share the same dates and categories", () => {
    for (let i = 0; i < ephemeridesEn.length; i++) {
      expect(ephemeridesEn[i].date).toBe(ephemeridesEs[i].date)
      expect(ephemeridesEn[i].year).toBe(ephemeridesEs[i].year)
      expect(ephemeridesEn[i].category).toBe(ephemeridesEs[i].category)
    }
  })

  it("all English entries have required fields with correct types", () => {
    for (const e of ephemeridesEn) {
      expect(e.date).toMatch(/^\d{2}-\d{2}$/)
      expect(typeof e.year).toBe("number")
      expect(typeof e.event).toBe("string")
      expect(typeof e.description).toBe("string")
      expect(["birth", "death", "event", "founding"]).toContain(e.category)
    }
  })
})

// ─── Date helpers ─────────────────────────────────────────────────────────────

describe("getTodayString", () => {
  it("formats January 1st as 01-01", () =>
    expect(getTodayString(new Date(2024, 0, 1))).toBe("01-01"))
  it("formats December 31st as 12-31", () =>
    expect(getTodayString(new Date(2024, 11, 31))).toBe("12-31"))
  it("zero-pads single-digit month and day", () =>
    expect(getTodayString(new Date(2024, 4, 5))).toBe("05-05"))
})

describe("getEphemerisForDate", () => {
  const db = [
    { date: "01-01", year: 1919, event: "Fallback", description: "fb", category: "founding" as const },
    { date: "06-25", year: 2000, event: "Test Event", description: "desc", category: "event" as const },
  ]

  it("returns matching entry for the given date", () =>
    expect(getEphemerisForDate("06-25", db).event).toBe("Test Event"))

  it("falls back to first entry when date not found", () =>
    expect(getEphemerisForDate("12-31", db).event).toBe("Fallback"))
})

// ─── Text layout helpers ──────────────────────────────────────────────────────

describe("visibleWidth", () => {
  it("counts plain characters as-is", () => expect(visibleWidth("hello")).toBe(5))
  it(`expands a tab to ${TAB_WIDTH} spaces`, () =>
    expect(visibleWidth("\t")).toBe(TAB_WIDTH))
  it("handles multiple tabs", () =>
    expect(visibleWidth("\t\t")).toBe(TAB_WIDTH * 2))
  it("mixes tabs and chars correctly", () =>
    expect(visibleWidth("\tabc")).toBe(TAB_WIDTH + 3))
})

describe("wrapLines", () => {
  it("returns single line when content fits", () =>
    expect(wrapLines("hello world", "", 80)).toEqual(["hello world"]))

  it("wraps at word boundaries", () => {
    const result = wrapLines("one two three", "", 8)
    expect(result.length).toBeGreaterThan(1)
    for (const line of result) expect(line.length).toBeLessThanOrEqual(8)
  })

  it("prepends prefix to every line", () => {
    const result = wrapLines("a b c d e", ">> ", 6)
    for (const line of result) expect(line.startsWith(">> ")).toBe(true)
  })

  it("splits a word longer than maxWidth into chunks", () => {
    const result = wrapLines("abcdefghij", "", 4)
    for (const line of result) expect(line.length).toBeLessThanOrEqual(4)
    expect(result.join("")).toBe("abcdefghij")
  })

  it("returns empty array for empty content with zero maxWidth", () =>
    expect(wrapLines("", "", 0)).toEqual([""]))
})

describe("wrapDescriptionToFullWidth", () => {
  it("pads short lines to totalColumns", () => {
    const cols = 20
    const result = wrapDescriptionToFullWidth("hi", "", cols)
    for (const line of result) expect(visibleWidth(line)).toBe(cols)
  })

  it("does not truncate lines that are already full width", () => {
    const cols = 10
    const content = "1234567890"
    const result = wrapDescriptionToFullWidth(content, "", cols)
    expect(result[0]).toBe(content)
  })
})

// ─── Frame generation ─────────────────────────────────────────────────────────

describe("createDynamicFrame", () => {
  const entry = ephemeridesEn[0]
  const date = new Date(2024, 0, 1)

  it("starts with top border ╭ and ends with bottom border ╰", () => {
    const frame = createDynamicFrame(80, entry, date, uiEn)
    const lines = frame.split("\n")
    expect(lines[0]).toMatch(/^╭─+╮$/)
    expect(lines[lines.length - 1]).toMatch(/^╰─+╯$/)
  })

  it("top and bottom borders match width", () => {
    const cols = 60
    const frame = createDynamicFrame(cols, entry, date, uiEn)
    const lines = frame.split("\n")
    expect(lines[0].length).toBe(cols)
    expect(lines[lines.length - 1].length).toBe(cols)
  })

  it("contains the event name", () =>
    expect(createDynamicFrame(80, entry, date, uiEn)).toContain(entry.event))

  it("contains the year", () =>
    expect(createDynamicFrame(80, entry, date, uiEn)).toContain(String(entry.year)))

  it("contains the category in uppercase", () =>
    expect(createDynamicFrame(80, entry, date, uiEn)).toContain(entry.category.toUpperCase()))

  it("contains English frame title", () =>
    expect(createDynamicFrame(80, entry, date, uiEn)).toContain("DESIGN EPHEMERIS OF THE DAY"))

  it("contains Spanish frame title when given es strings", () =>
    expect(createDynamicFrame(80, ephemeridesEs[0], date, uiEs)).toContain("EFEMERIDE DEL DIA"))

  it("works with very narrow columns (4)", () => {
    expect(() => createDynamicFrame(4, entry, date, uiEn)).not.toThrow()
  })
})

// ─── buildTweetText ───────────────────────────────────────────────────────────

describe("buildTweetText", () => {
  const founding = ephemeridesEn.find((e) => e.category === "founding")!
  const birth = ephemeridesEn.find((e) => e.category === "birth")!
  const siteUrl = "https://example.com"

  it("includes the event name", () =>
    expect(buildTweetText(founding, siteUrl, uiEn)).toContain(founding.event))

  it("includes the year", () =>
    expect(buildTweetText(founding, siteUrl, uiEn)).toContain(String(founding.year)))

  it("includes the site URL", () =>
    expect(buildTweetText(founding, siteUrl, uiEn)).toContain(siteUrl))

  it("includes a portion of the description", () =>
    expect(buildTweetText(founding, siteUrl, uiEn)).toContain(founding.description.slice(0, 30)))

  it("uses English founding hashtags", () =>
    expect(buildTweetText(founding, siteUrl, uiEn)).toContain("#History"))

  it("uses Spanish founding hashtags when given es strings", () =>
    expect(buildTweetText(ephemeridesEs[0], siteUrl, uiEs)).toContain("#Historia"))

  it("uses English birth hashtags", () =>
    expect(buildTweetText(birth, siteUrl, uiEn)).toContain("#DesignHistory"))

  it("non-URL content stays under 280 chars (safe for Twitter limit)", () => {
    const text = buildTweetText(founding, siteUrl, uiEn)
    const withoutUrl = text.replace(siteUrl, "")
    expect(withoutUrl.length).toBeLessThan(280)
  })

  it("truncates event names longer than 80 chars with ellipsis", () => {
    const longEvent = { ...founding, event: "A".repeat(90) }
    const text = buildTweetText(longEvent, siteUrl, uiEn)
    expect(text).toContain("…")
    expect(text).not.toContain("A".repeat(90))
  })

  it("truncates descriptions longer than 120 chars with ellipsis", () => {
    const longDesc = { ...founding, description: "B".repeat(130) }
    const text = buildTweetText(longDesc, siteUrl, uiEn)
    expect(text).toContain("…")
    expect(text).not.toContain("B".repeat(130))
  })

  it("does not truncate short event names", () => {
    const text = buildTweetText(birth, siteUrl, uiEn)
    expect(text).not.toContain(birth.event.slice(0, 5) + "…")
  })
})
