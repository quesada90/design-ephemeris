export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { ephemeridesEn, ephemeridesEs, type Ephemeris } from "@/lib/ephemeris-utils"

function rowToEphemeris(row: Record<string, unknown>, locale: string): Ephemeris {
  return {
    date: row.date as string,
    year: row.year as number,
    category: row.category as Ephemeris["category"],
    event: locale === "es" ? (row.event_es as string) : (row.event_en as string),
    description: locale === "es" ? (row.description_es as string) : (row.description_en as string),
  }
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? ""
  const locale = req.nextUrl.searchParams.get("locale") ?? "en"

  if (!/^\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 })
  }

  // Create client inside the handler so it only runs at request time, not build time
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_KEY

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data, error } = await supabase
        .from("ephemeris")
        .select("*")
        .eq("date", date)
        .single()

      if (!error && data) {
        return NextResponse.json({
          ephemeris: rowToEphemeris(data, locale),
          source: "db",
        })
      }
    } catch {
      // fall through to local fallback
    }
  }

  // Local hardcoded fallback
  const localDb = locale === "es" ? ephemeridesEs : ephemeridesEn
  const found = localDb.find((e) => e.date === date) ?? localDb[0]
  return NextResponse.json({ ephemeris: found, source: "local" })
}
