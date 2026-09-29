import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Reveal from "@/components/Reveal";
import {
  DollarSign,
  MessageCircle,
  Gift,
  Sparkles,
  ShieldCheck,
  Users,
  ArrowRight,
} from "lucide-react";

export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "candidate" ? "/candidate/jobs" : "/company/dashboard");
  }

  return (
    <div className="aur-page relative overflow-hidden bg-ink">
      {/* Living aurora backdrop — spans the whole page, sits behind everything */}
      <div className="aur-mesh">
        <div className="aur-blade aur-blade1" />
        <div className="aur-blade aur-blade2" />
        <div className="aur-blade aur-blade3" />
      </div>
      <div className="aur-vignette" />
      <div className="aur-grain" />

      <div className="relative z-10">
        {/* Hero */}
        <div className="px-6 pt-40 pb-16 max-w-5xl mx-auto">
          <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <div>
              <div className="aur-eyebrow aur-hero-in" style={{ animationDelay: ".05s" }}>
                A path, not a maze
              </div>
              <h1
                className="aur-hero-in font-display font-semibold text-5xl md:text-6xl text-paper leading-[1.05] mt-5"
                style={{ animationDelay: ".15s" }}
              >
                Salaries visible.
                <br />
                Recruiters direct.
                <br />
                <span className="text-apricot">No guesswork.</span>
              </h1>
              <p
                className="aur-hero-in mt-6 text-base md:text-lg text-paper/70 max-w-md"
                style={{ animationDelay: ".28s" }}
              >
                A job platform built only for Armenia&apos;s tech community. Every
                listing shows a real salary range — tech and non-tech roles alike.
              </p>
              <div
                className="aur-hero-in mt-9 flex flex-wrap items-center gap-5"
                style={{ animationDelay: ".4s" }}
              >
                <Link
                  href="/signup?role=candidate"
                  className="aur-btn aur-btn-primary aur-btn-shine"
                >
                  I&apos;m looking for a job
                  <span className="aur-btn-icon">
                    <ArrowRight size={14} />
                  </span>
                </Link>
                <Link href="/signup?role=company" className="aur-btn aur-btn-ghost">
                  I&apos;m hiring
                  <span className="aur-ring">
                    <ArrowRight size={14} />
                  </span>
                </Link>
              </div>
              <p
                className="aur-hero-in mt-7 text-sm text-paper/50"
                style={{ animationDelay: ".5s" }}
              >
                Already have an account?{" "}
                <Link href="/login" className="underline hover:text-paper transition-colors">
                  Log in
                </Link>
                {" · "}
                <Link href="/jobs" className="underline hover:text-paper transition-colors">
                  Just want to see what&apos;s posted? Browse open roles
                </Link>
              </p>
            </div>

            {/* A live, on-brand mockup of what "salary visible" actually
                looks like on the platform — makes the promise concrete
                instead of just a line of copy. */}
            <div className="hidden md:block aur-hero-in" style={{ animationDelay: ".35s" }}>
              <div className="aur-bezel">
                <div className="aur-bezel-inner p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display font-semibold text-lg text-paper">
                        Senior Backend Engineer
                      </p>
                      <p className="text-xs text-paper/50 mt-0.5">LusarLabs · Yerevan · Remote</p>
                    </div>
                    <Sparkles size={16} className="text-apricot flex-shrink-0" />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2 font-mono-num text-[15px] text-apricot">
                    <span>$2200</span>
                    <span className="flex-1 border-b border-dotted border-paper/25" style={{ minWidth: 12 }} />
                    <span>$2800</span>
                    <span className="text-xs text-paper/45">/mo</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {["Tech", "Full-time", "Go"].map((t) => (
                      <span
                        key={t}
                        className="text-xs font-medium px-2 py-1 rounded-full border border-paper/15 text-paper/70"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-paper/35 text-center mt-4">
                Every single listing on Champ, real examples only.
              </p>
            </div>
          </div>
        </div>

        {/* For companies */}
        <div className="px-6 py-20 max-w-4xl mx-auto">
          <Reveal>
            <p className="text-xs font-medium text-apricot uppercase tracking-wide">Champ for hiring</p>
            <h2 className="font-display font-semibold text-2xl md:text-3xl mt-2 max-w-lg text-paper">
              Meet candidates directly, with real budgets on the table
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5 mt-8">
            <Reveal>
              <div className="aur-bezel h-full">
                <div className="aur-bezel-inner p-6 h-full">
                  <div className="w-10 h-10 rounded-full bg-apricot/15 border border-apricot/30 text-apricot flex items-center justify-center mb-4">
                    <DollarSign size={18} />
                  </div>
                  <p className="font-medium mb-1.5 text-paper">No guessing on budget</p>
                  <p className="text-sm text-paper/60 leading-relaxed">
                    Every role requires a real salary range before it can be published —
                    so conversations start with both sides already aligned.
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal>
              <div className="aur-bezel h-full">
                <div className="aur-bezel-inner p-6 h-full">
                  <div className="w-10 h-10 rounded-full bg-apricot/15 border border-apricot/30 text-apricot flex items-center justify-center mb-4">
                    <MessageCircle size={18} />
                  </div>
                  <p className="font-medium mb-1.5 text-paper">Message candidates directly</p>
                  <p className="text-sm text-paper/60 leading-relaxed">
                    No recruiter middleman. Chat with candidates the moment they apply,
                    or reach out to anyone actively looking.
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal>
              <div className="aur-bezel h-full">
                <div className="aur-bezel-inner p-6 h-full">
                  <div className="w-10 h-10 rounded-full bg-apricot/15 border border-apricot/30 text-apricot flex items-center justify-center mb-4">
                    <Gift size={18} />
                  </div>
                  <p className="font-medium mb-1.5 text-paper">Free to start, pay only on a hire</p>
                  <p className="text-sm text-paper/60 leading-relaxed">
                    Post roles and message candidates at no cost. When you actually
                    hire someone through Champ, that&apos;s when billing kicks in — never before.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* For job seekers */}
        <div className="px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <Reveal>
              <p className="text-xs font-medium text-apricot uppercase tracking-wide">Champ for job search</p>
              <h2 className="font-display font-semibold text-2xl md:text-3xl mt-2 max-w-lg text-paper">
                Know the salary before you even apply
              </h2>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-5 mt-8">
              <Reveal>
                <div className="aur-bezel h-full">
                  <div className="aur-bezel-inner p-6 h-full">
                    <div className="w-10 h-10 rounded-full bg-apricot/15 border border-apricot/30 flex items-center justify-center mb-4">
                      <DollarSign size={18} className="text-apricot" />
                    </div>
                    <p className="font-medium mb-1.5 text-paper">Real ranges, every listing</p>
                    <p className="text-sm text-paper/60 leading-relaxed">
                      No more applying blind — every role shows what it actually pays
                      before you send a single message.
                    </p>
                  </div>
                </div>
              </Reveal>
              <Reveal>
                <div className="aur-bezel h-full">
                  <div className="aur-bezel-inner p-6 h-full">
                    <div className="w-10 h-10 rounded-full bg-apricot/15 border border-apricot/30 flex items-center justify-center mb-4">
                      <MessageCircle size={18} className="text-apricot" />
                    </div>
                    <p className="font-medium mb-1.5 text-paper">Direct chat, no black hole</p>
                    <p className="text-sm text-paper/60 leading-relaxed">
                      Applying opens a real conversation with the hiring side —
                      no automated &quot;we&apos;ll be in touch&quot; silence.
                    </p>
                  </div>
                </div>
              </Reveal>
              <Reveal>
                <div className="aur-bezel h-full">
                  <div className="aur-bezel-inner p-6 h-full">
                    <div className="w-10 h-10 rounded-full bg-apricot/15 border border-apricot/30 flex items-center justify-center mb-4">
                      <Users size={18} className="text-apricot" />
                    </div>
                    <p className="font-medium mb-1.5 text-paper">Built for Armenia&apos;s tech scene</p>
                    <p className="text-sm text-paper/60 leading-relaxed">
                      Focused on local and diaspora tech talent — not a generic
                      board with thousands of unrelated listings to wade through.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="px-6 py-10 max-w-4xl mx-auto">
          <Reveal>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-paper/60">
              <span className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-apricot" /> Salary required on every listing
              </span>
              <span className="flex items-center gap-2">
                <MessageCircle size={16} className="text-apricot" /> Real conversations, not queues
              </span>
              <span className="flex items-center gap-2">
                <Gift size={16} className="text-apricot" /> Free until you actually hire
              </span>
            </div>
          </Reveal>
        </div>

        {/* CTA */}
        <div className="px-6 py-24 text-center">
          <Reveal>
            <h2 className="font-display font-semibold text-3xl md:text-4xl text-paper">
              Ready to see it for yourself?
            </h2>
            <div className="mt-8 flex flex-wrap gap-5 justify-center">
              <Link href="/signup?role=candidate" className="aur-btn aur-btn-primary">
                Browse open roles
                <span className="aur-btn-icon">
                  <ArrowRight size={14} />
                </span>
              </Link>
              <Link href="/signup?role=company" className="aur-btn aur-btn-ghost">
                Post a role
                <span className="aur-ring">
                  <ArrowRight size={14} />
                </span>
              </Link>
            </div>
            <p className="text-sm text-paper/50 mt-8">
              Questions?{" "}
              <Link href="/contact" className="underline hover:text-paper transition-colors">
                Contact us
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
