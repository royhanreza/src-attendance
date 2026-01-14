# Magenta Activity

Proyek ini menggunakan:

- ⚛️ **React** 19.2
- 📘 **TypeScript**
- ⚡ **Vite** 7
- 🛣️ **TanStack Router** - Type-safe routing
- 🎨 **shadcn/ui** (Tailwind CSS)
- 🗺️ **Leaflet** & **React Leaflet**

## Instalasi

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

## Preview

```bash
pnpm preview
```

## Struktur Proyek

```
src/
├── components/     # Komponen React
├── lib/           # Utility functions (termasuk utils untuk shadcn/ui)
├── routes/        # File-based routing dengan TanStack Router
│   ├── __root.tsx # Root route dengan layout
│   ├── index.tsx  # Home page
│   └── about.tsx  # About page
└── main.tsx       # Entry point dengan router setup
```

## Menambahkan Komponen shadcn/ui

Untuk menambahkan komponen shadcn/ui, gunakan:

```bash
pnpm dlx shadcn@latest add [component-name]
```

Contoh:

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
```

## Path Aliases

Proyek ini menggunakan path aliases:

- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/hooks` → `src/hooks`

## Routing dengan TanStack Router

Proyek ini menggunakan TanStack Router untuk file-based routing. File route otomatis di-generate di `src/routeTree.gen.ts`.

### Menambahkan Route Baru

Buat file baru di `src/routes/` dengan format:

- `src/routes/about.tsx` → `/about`
- `src/routes/posts/$postId.tsx` → `/posts/:postId`

Contoh route:

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return <div>About Page</div>;
}
```

### Navigasi

Gunakan komponen `Link` untuk navigasi:

```tsx
import { Link } from "@tanstack/react-router";

<Link to="/about">About</Link>;
```

Atau gunakan hook `useNavigate`:

```tsx
import { useNavigate } from "@tanstack/react-router";

const navigate = useNavigate();
navigate({ to: "/about" });
```
