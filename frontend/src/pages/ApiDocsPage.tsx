import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import "./ApiDocsPage.css";

const SwaggerUI = lazy(async () => {
  const mod = await import("swagger-ui-react");
  return { default: mod.default as ComponentType<{ url: string }> };
});

type SpecItem = {
  key: string;
  label: string;
  url: string;
};

const specs: SpecItem[] = [
  {
    key: "user-service",
    label: "User Service",
    url: "/api-specs/user-service.yaml",
  },
  {
    key: "friend-service",
    label: "Friend Service",
    url: "/api-specs/friend-service.yaml",
  },
  {
    key: "message-service",
    label: "Message Service",
    url: "/api-specs/message-service.yaml",
  },
];

export default function ApiDocsPage() {
  const [activeSpec, setActiveSpec] = useState(specs[0]!);

  useEffect(() => {
    void import("swagger-ui-react/swagger-ui.css");
  }, []);

  const title = useMemo(() => `${activeSpec.label} API Docs`, [activeSpec.label]);

  return (
    <div className="api-docs-page min-h-screen bg-gray-950 text-gray-200 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" />

      <header className="px-6 py-5 border-b border-gray-800/60 bg-gray-900/70 backdrop-blur-sm sticky top-0 z-20">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          OpenAPI specs từ `docs/api-specs`
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {specs.map((spec) => (
            <button
              key={spec.key}
              onClick={() => setActiveSpec(spec)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeSpec.key === spec.key
                  ? "bg-violet-500/20 text-violet-300 shadow-lg shadow-violet-500/10"
                  : "bg-gray-800/80 text-gray-300 hover:bg-gray-700/80"
              }`}
            >
              {spec.label}
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 md:p-6 relative z-10">
        <div className="rounded-2xl overflow-hidden border border-gray-800/70 bg-white shadow-2xl shadow-black/30">
          <Suspense
            fallback={
              <div className="p-10 text-center text-gray-500">Loading API docs...</div>
            }
          >
            <SwaggerUI key={activeSpec.key} url={activeSpec.url} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
