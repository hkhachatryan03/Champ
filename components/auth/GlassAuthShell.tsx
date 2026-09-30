import GuestPage from "@/components/GuestPage";

const HIGHLIGHTS = [
  "Every listing shows a real salary range",
  "Built only for Armenia's tech community",
  "No recruiter spam — every company is reviewed",
];

/**
 * "Ethereal Glass" auth layout used by /login and /signup.
 * (The original AuthShell is untouched — forgot-password and
 * company/pending still use it.)
 */
export default function GlassAuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <GuestPage>
      <div className="min-h-[100dvh] grid md:grid-cols-2 items-center gap-10 max-w-[1120px] mx-auto px-6 pt-[calc(var(--nav-h)+1.75rem)] pb-14">
        {/* Brand side */}
        <aside className="hidden md:block aur-hero-in pr-5">
          <h2 className="font-display font-semibold text-[clamp(34px,4.4vw,46px)] leading-[1.1] text-paper">
            Tech jobs in Armenia, <span className="text-apricot">salaries visible.</span>
          </h2>
          <ul className="mt-8 flex flex-col gap-3 list-none p-0">
            {HIGHLIGHTS.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-[14.5px] text-paper/80 px-4 py-3 rounded-2xl bg-[var(--glass)] border border-paper/10 w-fit max-w-full"
              >
                <span className="w-[22px] h-[22px] rounded-full bg-apricot/15 border border-apricot/35 text-apricot flex items-center justify-center flex-shrink-0 text-[11px] leading-none">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="aur-bezel-sm aur-float-card mt-10 max-w-[330px]">
            <div className="aur-bezel-inner px-[18px] py-4">
              <p className="font-display font-semibold text-base text-paper">Senior Backend Engineer</p>
              <p className="text-[11.5px] text-paper/50">LusarLabs · Yerevan · Remote</p>
              <div className="mt-2.5 flex items-baseline gap-2 font-mono-num text-[13px] text-apricot">
                <span>$2200</span>
                <span className="flex-1 border-b border-dotted border-paper/30" />
                <span>$2800</span>
                <span className="text-[11px] text-paper/50">/mo</span>
              </div>
            </div>
          </div>
          <p className="mt-9 text-xs text-paper/40">© {new Date().getFullYear()} Champ</p>
        </aside>

        {/* Form side */}
        <main className="aur-hero-in w-full max-w-[430px] justify-self-center" style={{ animationDelay: ".15s" }}>
          <div className="aur-bezel">
            <div className="aur-bezel-inner px-[30px] py-7">
              <p className="aur-kicker">{eyebrow}</p>
              <h1 className="font-display font-semibold text-[32px] leading-[1.15] text-paper mt-3.5">{title}</h1>
              {subtitle && <p className="text-sm text-paper/60 mt-2">{subtitle}</p>}
              <div className="mt-6">{children}</div>
            </div>
          </div>
        </main>
      </div>
    </GuestPage>
  );
}
