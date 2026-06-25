/**
 * One-time seed script: generate design history facts for all 365 days via
 * Gemini and store them in Supabase.
 *
 * Usage:
 *   npx tsx scripts/seed.ts                       # seed all 365 days
 *   npx tsx scripts/seed.ts --range 01-01:01-31   # seed a date range
 *
 * Safe to re-run — uses ON CONFLICT DO NOTHING, so existing entries are skipped.
 * Requires GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js"
import { GoogleGenAI } from "@google/genai"
import { readFileSync } from "fs"
import { resolve } from "path"

// Load .env.local manually (tsx doesn't auto-load it)
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local")
    const lines = readFileSync(envPath, "utf-8").split("\n")
    for (const line of lines) {
      const [key, ...rest] = line.split("=")
      if (key && rest.length) {
        process.env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "")
      }
    }
  } catch {
    // .env.local not found — rely on environment variables already set
  }
}
loadEnv()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

// Build all MM-DD strings for a non-leap year
function allDates(): string[] {
  const dates: string[] = []
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  for (let m = 0; m < 12; m++) {
    for (let d = 1; d <= daysInMonth[m]; d++) {
      dates.push(
        `${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      )
    }
  }
  return dates
}

function parseRange(arg: string): [string, string] {
  const parts = arg.split(":")
  if (parts.length !== 2) throw new Error(`Invalid --range format. Use MM-DD:MM-DD`)
  return [parts[0], parts[1]]
}

function filterByRange(dates: string[], start: string, end: string): string[] {
  return dates.filter((d) => d >= start && d <= end)
}

const SYSTEM_INSTRUCTION = `You are a historian of graphic design, typography, architecture, UX/UI, industrial design, and visual arts. Return ONLY valid JSON with no markdown fences.`

function buildPrompt(date: string): string {
  return `Generate a real, verifiable design history fact for the calendar date ${date} (MM-DD format).
The event must have genuinely occurred on or near this date in history.
Focus on: graphic design, typography, Bauhaus, Swiss design, modernism, influential designers or design schools, iconic posters, UX/product design pioneers, architecture with strong design significance.

Return exactly this JSON object and nothing else:
{
  "year": <integer — the historical year>,
  "category": <one of: "birth", "death", "event", "founding">,
  "event_en": <short English title, max 80 characters>,
  "event_es": <short Spanish title, max 80 characters>,
  "description_en": <1-2 sentences in English describing the significance, max 250 characters>,
  "description_es": <1-2 sentences in Spanish describing the significance, max 250 characters>
}`
}

interface GeneratedEntry {
  year: number
  category: "birth" | "death" | "event" | "founding"
  event_en: string
  event_es: string
  description_en: string
  description_es: string
}

async function generateEntry(date: string, attempt = 1): Promise<GeneratedEntry | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      contents: buildPrompt(date),
    })

    const text = response.text ?? ""
    const parsed = JSON.parse(text) as GeneratedEntry

    // Basic shape validation
    if (
      typeof parsed.year !== "number" ||
      !["birth", "death", "event", "founding"].includes(parsed.category) ||
      !parsed.event_en || !parsed.event_es ||
      !parsed.description_en || !parsed.description_es
    ) {
      console.warn(`  ⚠ Invalid shape for ${date}:`, parsed)
      return null
    }

    return parsed
  } catch (err: any) {
    const status = err?.status ?? 0
    // Retry on 503 (overloaded) or 429 (rate limit) up to 4 times
    if ((status === 503 || status === 429) && attempt <= 4) {
      const wait = attempt * 8000
      process.stdout.write(`  ⟳ Gemini ${status}, retry ${attempt}/4 in ${wait / 1000}s... `)
      await sleep(wait)
      return generateEntry(date, attempt + 1)
    }
    console.error(`  ✗ Gemini error for ${date}:`, err?.message ?? err)
    return null
  }
}

async function insertEntry(date: string, entry: GeneratedEntry): Promise<boolean> {
  const { error } = await supabase.from("ephemeris").upsert(
    {
      date,
      year: entry.year,
      category: entry.category,
      event_en: entry.event_en,
      event_es: entry.event_es,
      description_en: entry.description_en,
      description_es: entry.description_es,
      verified: false,
    },
    { onConflict: "date", ignoreDuplicates: true }
  )

  if (error) {
    console.error(`  ✗ Supabase error for ${date}:`, error.message)
    return false
  }
  return true
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const args = process.argv.slice(2)
  const rangeIdx = args.indexOf("--range")

  let dates = allDates()

  if (rangeIdx !== -1 && args[rangeIdx + 1]) {
    const [start, end] = parseRange(args[rangeIdx + 1])
    dates = filterByRange(dates, start, end)
    console.log(`\n🗓  Seeding ${dates.length} dates from ${start} to ${end}\n`)
  } else {
    console.log(`\n🗓  Seeding all ${dates.length} dates (this takes ~6 minutes)\n`)
  }

  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set")
  if (!process.env.SUPABASE_URL) throw new Error("SUPABASE_URL not set")
  if (!process.env.SUPABASE_SERVICE_KEY) throw new Error("SUPABASE_SERVICE_KEY not set")

  let success = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i]
    process.stdout.write(`[${String(i + 1).padStart(3)}/${dates.length}] ${date} ... `)

    const entry = await generateEntry(date)
    if (!entry) {
      process.stdout.write("✗ generation failed\n")
      failed++
    } else {
      const inserted = await insertEntry(date, entry)
      if (inserted) {
        process.stdout.write(`✓ ${entry.event_en.slice(0, 50)}\n`)
        success++
      } else {
        process.stdout.write("- skipped (already exists)\n")
        skipped++
      }
    }

    // Rate limit: ~1 req/sec to stay within Gemini free tier
    if (i < dates.length - 1) await sleep(1100)
  }

  console.log(`\n✅ Done — ${success} inserted, ${skipped} skipped, ${failed} failed\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
