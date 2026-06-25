# Design Ephemeris

A terminal-aesthetic web app that surfaces a daily design history fact — birthdays of designers, founding of movements, landmark events — rendered as a retro CLI interface with animated typewriter output and keyboard shortcuts.

## What it does

Each day the app looks up today's date in a curated database of design history milestones (Bauhaus founding, notable designers' births, pivotal events) and presents the entry inside a full-viewport terminal frame. The frame reflows dynamically to match the browser window width, wraps long descriptions, and renders Unicode box-drawing borders.

Key behaviors:
- **Daily ephemeris** — matched by month-day against a static dataset of design history events
- **Typewriter animation** — content is revealed character by character on load
- **Theme toggle** — switch between green-on-black and blue-on-black palettes via `SHIFT+T`
- **OS-aware shortcuts** — exit shortcut shown as `CMD+C` on macOS, `CTRL+C` on Windows/Linux
- **Responsive terminal frame** — border and text reflow as the viewport resizes

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI primitives | shadcn/ui (Radix UI) |
| Runtime | React 19 |

## Getting started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
# Build for production
pnpm build
pnpm start
```

## Project structure

```
├── app/
│   ├── layout.tsx          # Root layout with Geist font and theme provider
│   └── page.tsx            # Entry point — loads DesignEphemeris client-side
├── components/
│   ├── design-ephemeris.tsx  # Core component: data, terminal renderer, keyboard handling
│   ├── theme-provider.tsx
│   └── ui/                 # shadcn/ui component library
├── styles/
│   └── globals.css
└── lib/
    └── utils.ts
```

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `SHIFT+T` | Toggle color theme |
| `CMD+C` / `CTRL+C` | Close the tab |

## Adding ephemeris entries

Open [`components/design-ephemeris.tsx`](components/design-ephemeris.tsx) and add entries to the `designEphemerides` array:

```ts
{
  date: "MM-DD",      // month-day, zero-padded
  year: 1984,
  event: "Event name",
  description: "Full description shown in the terminal frame.",
  category: "birth" | "death" | "event" | "founding",
}
```

One entry per calendar day is matched and displayed. If no entry exists for today, the first entry in the array is shown as a fallback.

## License

MIT
