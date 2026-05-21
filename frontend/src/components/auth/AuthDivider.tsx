export function AuthDivider() {
  return (
    <div className="relative py-2">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-ivory-deep/80" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white/80 px-3 font-sans text-[10px] uppercase tracking-[0.22em] text-ink-soft">
          or
        </span>
      </div>
    </div>
  );
}
