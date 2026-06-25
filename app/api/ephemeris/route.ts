export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
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

  try {
    const { data, error } = await supabaseAdmin
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

  // Local hardcoded fallback (emergency — should not happen after seeding)
  const localDb = locale === "es" ? ephemeridesEs : ephemeridesEn
  const found = localDb.find((e) => e.date === date) ?? localDb[0]
  return NextResponse.json({ ephemeris: found, source: "local" })
}
