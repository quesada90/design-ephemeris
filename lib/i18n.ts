export type Locale = "en" | "es"

export function detectLocale(lang?: string): Locale {
  const l =
    lang ??
    (typeof window !== "undefined"
      ? navigator.language || navigator.languages?.[0]
      : undefined) ??
    "en"
  return l.toLowerCase().startsWith("es") ? "es" : "en"
}

export interface UIStrings {
  connecting: string
  frameTitle: string
  labelDate: string
  labelYear: string
  labelEvent: string
  labelDescription: string
  labelCategory: string
  shortcutExit: string
  shortcutTheme: string
  shortcutTweet: string
  copyright: string
  tweetHeader: string
  tweetHashtags: (category: string) => string
}

export const strings: Record<Locale, UIStrings> = {
  en: {
    connecting: "● Connecting to design history database...",
    frameTitle: "DESIGN EPHEMERIS OF THE DAY",
    labelDate: "Date:",
    labelYear: "Year:",
    labelEvent: "Event:",
    labelDescription: "Description:",
    labelCategory: "Category:",
    shortcutExit: "Exit",
    shortcutTheme: "Themes",
    shortcutTweet: "Tweet",
    copyright: "Design History © 2025",
    tweetHeader: "📅 Design Ephemeris —",
    tweetHashtags: (cat) =>
      cat === "founding" ? "#GraphicDesign #History" : "#GraphicDesign #DesignHistory",
  },
  es: {
    connecting: "● Conectando a la base de datos de historia del diseño...",
    frameTitle: "EFEMERIDE DEL DIA",
    labelDate: "Fecha:",
    labelYear: "Año:",
    labelEvent: "Evento:",
    labelDescription: "Descripción:",
    labelCategory: "Categoría:",
    shortcutExit: "Salir",
    shortcutTheme: "Temas",
    shortcutTweet: "Tweet",
    copyright: "Historia del Diseño © 2025",
    tweetHeader: "📅 Efeméride del Diseño —",
    tweetHashtags: (cat) =>
      cat === "founding" ? "#Diseño #Historia" : "#Diseño #HistoriaDelDiseño",
  },
}
