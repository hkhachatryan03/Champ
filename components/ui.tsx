export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2 L20 8 L20 16 L12 22 L4 16 L4 8 Z" stroke="#FAF6EE" strokeWidth="1.4" />
        <path d="M12 2 L12 22 M4 8 L20 16 M20 8 L4 16" stroke="#EA9A2E" strokeWidth="1.4" />
      </svg>
      <span className="font-display font-semibold text-xl text-paper">Champ</span>
    </div>
  );
}

export function Ledger({ min, max }: { min: number; max: number }) {
  return (
    <div className="flex items-baseline gap-2 font-mono-num text-[15px] text-apricot-deep">
      <span>${min}</span>
      <span className="flex-1 border-b border-dotted border-line" style={{ minWidth: 12 }} />
      <span>${max}</span>
      <span className="text-xs text-muted">/mo</span>
    </div>
  );
}

export function Tag({
  children,
  tone = "stone",
}: {
  children: React.ReactNode;
  tone?: "stone" | "moss";
}) {
  const cls =
    tone === "moss"
      ? "bg-moss/10 text-moss"
      : "bg-stone/15 text-stone";
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${cls}`}>
      {children}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  New: "bg-stone/15 text-stone",
  Interviewing: "bg-apricot/15 text-apricot-deep",
  Offer: "bg-moss/15 text-moss",
  Hired: "bg-moss/25 text-moss",
  "Not moving forward": "bg-ink/8 text-muted",
};

export function LanguageTags({ languages }: { languages: string[] }) {
  if (languages.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {languages.map((entry) => {
        const [lang, level] = entry.split(":");
        return (
          <span key={entry} className="text-xs font-medium px-2 py-1 rounded-full bg-moss/12 text-moss">
            {lang}{level ? ` · ${level}` : ""}
          </span>
        );
      })}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
        STATUS_STYLES[status] || STATUS_STYLES.New
      }`}
    >
      {status}
    </span>
  );
}
