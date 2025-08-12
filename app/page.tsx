"use client"
import dynamic from "next/dynamic"

const DesignEphemerisClient = dynamic(
  () => import("@/components/design-ephemeris").then((m) => m.DesignEphemeris),
  { ssr: false }
)

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-green-400 font-mono overflow-hidden relative" suppressHydrationWarning>
      {/* Animated noise background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/5 via-transparent to-blue-900/5"></div>

      {/* Main content */}
      <div className="relative z-10">
        <DesignEphemerisClient />
      </div>
    </main>
  )
}
