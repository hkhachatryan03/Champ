import { Logo } from "@/components/ui";

const HIGHLIGHTS = [
  "Every listing shows a real salary range",
  "Built only for Armenia's tech community",
  "No recruiter spam — every company is reviewed",
];

export default function AuthShell({
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
    <div className="min-h-[calc(100vh-56px)] grid md:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden md:flex flex-col justify-between bg-ink text-paper px-12 py-12 overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-apricot/25 blur-3xl animate-float-slow"
        />
        <div
          aria-hidden
          className="absolute bottom-[-6rem] right-[-4rem] w-80 h-80 rounded-full bg-moss/25 blur-3xl animate-float-slow"
          style={{ animationDelay: "2.5s" }}
        />

        <div className="relative">
          <Logo />
        </div>

        <div className="relative max-w-sm">
          <p className="font-display text-3xl leading-snug">
            Tech jobs in Armenia, salaries visible.
          </p>
          <ul className="mt-8 flex flex-col gap-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-paper/80">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-apricot flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-paper/50">© {new Date().getFullYear()} Champ</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12 bg-paper">
        <div className="w-full max-w-sm animate-fade-in-up">
          <p className="text-xs font-medium tracking-wide uppercase text-apricot-deep mb-2">
            {eyebrow}
          </p>
          <h1 className="font-display font-semibold text-3xl leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-2">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
