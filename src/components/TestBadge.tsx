export function TestBadge() {
  const appMode = import.meta.env.VITE_APP_MODE || import.meta.env.APP_MODE;

  if (appMode !== "dev") {
    return null;
  }

  return (
    <aside
      aria-label="Development Test Mode Banner"
      className="fixed top-0 right-0 z-[99999] pointer-events-none w-28 h-28 overflow-hidden select-none"
    >
      <div
        className="absolute top-[18px] -right-[32px] w-[130px] text-center text-white bg-red-600 shadow-[0_2px_4px_rgba(0,0,0,0.3)] py-1 text-[11px] font-black tracking-widest uppercase border-y border-red-700/50"
        style={{ transform: "rotate(45deg)" }}
      >
        TEST
      </div>
    </aside>
  );
}
