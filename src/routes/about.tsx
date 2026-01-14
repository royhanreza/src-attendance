import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="w-full p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">About</h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Tentang Proyek</h2>
          <p className="text-gray-700 mb-4">
            Proyek ini dibangun dengan teknologi modern untuk demonstrasi
            penggunaan berbagai library dan framework.
          </p>
          <h3 className="text-xl font-semibold mb-3 mt-6">Tech Stack</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>React 19.2 - Library UI modern</li>
            <li>TypeScript - Type safety</li>
            <li>Vite 7 - Build tool yang cepat</li>
            <li>TanStack Router - Type-safe routing</li>
            <li>shadcn/ui - Komponen UI yang dapat dikustomisasi</li>
            <li>Tailwind CSS - Utility-first CSS framework</li>
            <li>Leaflet - Library peta interaktif</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
