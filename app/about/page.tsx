import Link from "next/link";
import { getSession } from "@/lib/auth";
import { DollarSign, MessageCircle, Gift, Code2, Building2, ArrowRight } from "lucide-react";
import GuestPage from "@/components/GuestPage";
import Reveal from "@/components/Reveal";

const ICON = { size: 18, strokeWidth: 1.25 } as const;

export default async function AboutPage() {
  const session = await getSession();

  return (
    <GuestPage>
      {/* Hero */}
      <div className="relative overflow-hidden text-center px-6 pb-10 pt-[calc(var(--nav-h)+3rem)]">
        <div className="aur-watermark font-armenian" aria-hidden="true">ճամփա</div>
        <div className="relative max-w-3xl mx-auto">
          <div className="aur-eyebrow aur-hero-in" style={{ animationDelay: ".05s" }}>What is Champ?</div>
          <h1
            className="aur-hero-in font-display font-semibold text-[clamp(44px,7vw,68px)] text-paper leading-[1.05] mt-5"
            style={{ animationDelay: ".15s" }}
          >
            A path, <span className="text-apricot">not a maze.</span>
          </h1>
          <p
            className="aur-hero-in mt-6 text-[17px] text-paper/70 max-w-[540px] mx-auto leading-[1.7]"
            style={{ animationDelay: ".28s" }}
          >
            Champ comes from <em className="not-italic text-apricot font-armenian">ճամփա</em> — the Armenian word for
            &quot;path.&quot; That&apos;s the whole idea: getting from &quot;looking for work&quot; or
            &quot;looking for someone great&quot; to an actual conversation, without
            the maze most job platforms turn that into.
          </p>
        </div>
      </div>

      {/* Why */}
      <div className="px-6 py-14 max-w-5xl mx-auto">
        <Reveal>
          <div className="aur-bezel">
            <div className="aur-bezel-inner grid md:grid-cols-[1fr_1.45fr] gap-5 md:gap-12 p-7 md:p-11 items-start">
              <div>
                <p className="aur-kicker">Why we built this</p>
                <h2 className="font-display font-semibold text-[34px] leading-[1.15] mt-2.5 text-paper">
                  Two things, done properly.
                </h2>
              </div>
              <p className="text-base leading-[1.8] text-paper/65">
                Job hunting in Armenia&apos;s tech scene shouldn&apos;t mean applying into a
                black hole, or guessing at a salary that turns out to be half of
                what you hoped. And hiring shouldn&apos;t mean wading through a
                board full of listings that have nothing to do with your market.
                Champ exists to fix two things specifically: every role shows a
                real salary range before you ever apply, and applying opens an
                actual conversation with a real person — not an automated
                &quot;we&apos;ll be in touch.&quot;
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Who it's for */}
      <div className="px-6 py-14 max-w-5xl mx-auto">
        <Reveal>
          <div className="text-center mb-9">
            <p className="aur-kicker">Who it&apos;s for</p>
            <h2 className="font-display font-semibold text-[clamp(28px,4vw,36px)] mt-2 text-paper">
              Two sides, one honest deal.
            </h2>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-[1.15fr_1fr] gap-5">
          <Reveal className="h-full">
            <div className="aur-bezel h-full">
              <div className="aur-bezel-inner p-8 h-full relative overflow-hidden">
                <span className="absolute right-6 top-5 text-xs font-mono-num text-paper/30">01</span>
                <div className="absolute -right-14 -bottom-14 w-56 h-56 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(234,154,46,.16),transparent_70%)]" />
                <div className="aur-icon-chip"><Code2 {...ICON} /></div>
                <h3 className="font-display font-semibold text-[22px] mt-5 mb-2.5 text-paper">Job seekers</h3>
                <p className="text-[14.5px] leading-[1.75] text-paper/60">
                  Armenian and diaspora tech talent — and the non-tech roles
                  that keep tech companies running (ops, finance, HR,
                  support, and more). If you&apos;re tired of applying blind,
                  this is built for you.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal className="h-full">
            <div className="aur-bezel h-full">
              <div className="aur-bezel-inner p-8 h-full relative overflow-hidden">
                <span className="absolute right-6 top-5 text-xs font-mono-num text-paper/30">02</span>
                <div className="absolute -right-14 -bottom-14 w-56 h-56 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(234,154,46,.16),transparent_70%)]" />
                <div className="aur-icon-chip"><Building2 {...ICON} /></div>
                <h3 className="font-display font-semibold text-[22px] mt-5 mb-2.5 text-paper">Companies</h3>
                <p className="text-[14.5px] leading-[1.75] text-paper/60">
                  Teams hiring in or for Armenia who&apos;d rather message
                  candidates directly than manage a black-box applicant
                  queue, and who are comfortable being upfront about what a
                  role actually pays.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* How it works */}
      <div className="px-6 py-14 max-w-5xl mx-auto">
        <Reveal>
          <div className="text-center mb-9">
            <p className="aur-kicker">How it works</p>
            <h2 className="font-display font-semibold text-[clamp(28px,4vw,36px)] mt-2 text-paper">
              Three rules we don&apos;t bend.
            </h2>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: <DollarSign {...ICON} />, title: "Salary, upfront", body: "Every role shows its real range. No range, no listing — a hard rule, not a suggestion." },
            { icon: <MessageCircle {...ICON} />, title: "A real conversation", body: "Applying opens a message with an actual person, not a form disappearing into a queue." },
            { icon: <Gift {...ICON} />, title: "Free until it works", body: "Companies only pay a success fee once they actually hire someone through Champ — never before." },
          ].map((step, i, arr) => (
            <Reveal key={step.title} className="h-full">
              <div className="aur-bezel h-full">
                <div className="aur-bezel-inner p-7 h-full">
                  <div className="flex items-center gap-3.5 mb-5">
                    <div className="aur-icon-chip">{step.icon}</div>
                    {i < arr.length - 1 && <span className="hidden md:block flex-1 border-t border-dashed border-apricot/50" />}
                  </div>
                  <h3 className="font-semibold text-[18px] mb-2 text-paper">{step.title}</h3>
                  <p className="text-sm leading-[1.7] text-paper/60">{step.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pt-16 pb-28 text-center">
        <Reveal>
          <h2 className="font-display font-semibold text-[clamp(30px,5vw,42px)] text-paper">Come see for yourself.</h2>
          <div className="mt-8 flex flex-wrap gap-5 justify-center items-center">
            {(!session || session.role === "candidate") && (
              <Link href="/jobs" className="aur-btn aur-btn-ghost">
                Browse open roles
                <span className="aur-ring"><ArrowRight size={14} /></span>
              </Link>
            )}
            {(!session || session.role === "company") && (
              <Link
                href={session ? "/company/jobs/new" : "/signup?role=company"}
                className="aur-btn aur-btn-primary"
              >
                Post a role
                <span className="aur-btn-icon"><ArrowRight size={14} /></span>
              </Link>
            )}
          </div>
        </Reveal>
      </div>
    </GuestPage>
  );
}
