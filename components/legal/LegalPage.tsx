import type { ReactNode } from "react";
import Link from "next/link";
import GuestPage from "@/components/GuestPage";
import { LEGAL } from "@/lib/legal";

export type LegalSection = { id: string; title: string; body: ReactNode };

// Who "we" are — only the details that have actually been filled in, and no
// sentence punctuation, so it can sit inside any sentence.
export function OperatorName() {
  return (
    <>
      <strong>{LEGAL.operatorName}</strong>
      {LEGAL.address ? `, ${LEGAL.address}` : ""}
      {LEGAL.registrationNumber ? ` (registration no. ${LEGAL.registrationNumber})` : ""}
    </>
  );
}

// How to reach us — a complete sentence.
export function ContactWays() {
  return (
    <>
      You can reach us through <Link href="/contact">the contact form</Link>
      {LEGAL.privacyEmail ? (
        <>
          {" "}
          or at <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>
        </>
      ) : null}
      .
    </>
  );
}

/**
 * Shared layout for the Terms of Service and the Privacy Policy: a plain-language
 * summary first, then a contents list and numbered sections. Sections are plain
 * data, so the contents list and the numbers can never drift out of step.
 */
export default function LegalPage({
  title,
  intro,
  summary,
  sections,
  other,
}: {
  title: string;
  intro: string;
  summary: string[];
  sections: LegalSection[];
  other: { href: string; label: string };
}) {
  return (
    <GuestPage>
      <div className="px-6 pt-[calc(var(--nav-h)+2.25rem)] pb-24 max-w-[1040px] mx-auto">
        <p className="aur-kicker aur-hero-in">Legal</p>
        <h1 className="aur-hero-in font-display font-semibold text-[clamp(34px,5vw,48px)] leading-[1.1] text-paper mt-3.5" style={{ animationDelay: ".05s" }}>
          {title}
        </h1>
        <p className="aur-hero-in text-[13px] text-paper/50 mt-3" style={{ animationDelay: ".1s" }}>
          Last updated {LEGAL.effectiveDate} · Version {LEGAL.version}
        </p>
        <p className="aur-hero-in text-[16px] leading-[1.75] text-paper/70 mt-6 max-w-[720px]" style={{ animationDelay: ".14s" }}>
          {intro}
        </p>

        <div className="aur-hero-in aur-bezel mt-8 max-w-[760px]" style={{ animationDelay: ".18s" }}>
          <div className="aur-bezel-inner px-[26px] py-6">
            <p className="text-xs font-medium tracking-[.14em] uppercase text-apricot">The short version</p>
            <ul className="mt-3.5 flex flex-col gap-2.5 list-disc pl-5 marker:text-apricot/60 text-[14.5px] leading-[1.7] text-paper/80">
              {summary.map((line) => (
                <li key={line} className="pl-1">{line}</li>
              ))}
            </ul>
            <p className="text-[12.5px] text-paper/45 mt-4">
              This summary is a convenience. The full text below is what applies.
            </p>
          </div>
        </div>

        <div className="mt-12 grid md:grid-cols-[230px_minmax(0,1fr)] gap-x-12 gap-y-8 items-start">
          <nav aria-label="Contents" className="md:sticky md:top-[calc(var(--nav-h)+1rem)]">
            <p className="text-xs font-medium tracking-[.14em] uppercase text-paper/45 mb-3">Contents</p>
            <ol className="flex flex-col gap-1.5 text-[13.5px] leading-[1.45]">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex gap-2.5 text-paper/60 hover:text-apricot transition-colors">
                    <span className="font-mono-num text-paper/35 w-5 flex-shrink-0 text-right">{i + 1}</span>
                    <span>{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="min-w-0">
            {sections.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                className="scroll-mt-[calc(var(--nav-h)+1rem)] pb-9 mb-9 border-b border-paper/10 last:border-b-0 last:mb-0 last:pb-0"
              >
                <h2 className="font-display font-semibold text-[24px] leading-[1.2] text-paper mb-4 flex gap-3.5 items-baseline">
                  <span className="font-mono-num text-[14px] text-apricot/70 flex-shrink-0">{i + 1}.</span>
                  <span>{s.title}</span>
                </h2>
                <div
                  className="flex flex-col gap-3.5 text-[15px] leading-[1.8] text-paper/72
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:marker:text-apricot/60 [&_li]:pl-1
                    [&_strong]:font-medium [&_strong]:text-paper
                    [&_a]:underline [&_a]:underline-offset-[3px] [&_a]:text-apricot [&_a:hover]:text-paper [&_a]:transition-colors"
                >
                  {s.body}
                </div>
              </section>
            ))}

            <p className="mt-12 text-[14px] text-paper/55">
              See also our{" "}
              <Link href={other.href} className="underline underline-offset-[3px] text-apricot hover:text-paper transition-colors">
                {other.label}
              </Link>
              .
            </p>
          </article>
        </div>
      </div>
    </GuestPage>
  );
}
