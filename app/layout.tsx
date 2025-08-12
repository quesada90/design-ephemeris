import type React from "react"
import type { Metadata } from "next"
import { JetBrains_Mono } from "next/font/google"
import "./globals.css"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "Efemérides del Diseño",
  description: "Historia del diseño día a día en formato terminal",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={jetbrainsMono.variable} suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${jetbrainsMono.style.fontFamily};
  --font-mono: ${jetbrainsMono.style.fontFamily};
}
        `}</style>
      </head>
      <body className="antialiased font-mono" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
