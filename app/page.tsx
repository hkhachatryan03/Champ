import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Ledger, Tag } from "@/components/ui";
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
    <div className="overflow-hidden">
      {/* Hero */}
      <div className="relative bg-ink">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(250,246,238,0.9) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative px-6 pt-20 pb-24 max-w-5xl mx-auto">
          <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <div>
              <h1 className="font-display font-semibold text-5xl md:text-6xl text-paper leading-[1.05]">
                Salaries visible.
                <br />
                Recruiters direct.
                <br />
                <span className="text-apricot">No guesswork.</span>
              </h1>
              <p className="mt-6 text-base md:text-lg text-paper/70 max-w-md">
                A job platform built only for Armenia&apos;s tech community. Every
                listing shows a real salary range — tech and non-tech roles alike.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/signup?role=candidate"
                  className="px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink"
                >
                  I&apos;m looking for a job
                </Link>
                <Link
                  href="/signup?role=company"
                  className="px-5 py-3 rounded-lg font-medium text-sm border border-paper/25 text-paper"
                >
                  I&apos;m hiring
                </Link>
              </div>
              <p className="mt-6 text-sm text-paper/50">
                Already have an account?{" "}
                <Link href="/login" className="underline">
                  Log in
                </Link>
                {" · "}
                <Link href="/jobs" className="underline">
                  Just want to see what&apos;s posted? Browse open roles
                </Link>
              </p>
            </div>

            {/* A live, on-brand mockup of what "salary visible" actually
                looks like on the platform — makes the promise concrete
                instead of just a line of copy. */}
            <div className="hidden md:block">
              <div className="p-5 rounded-2xl bg-white shadow-xl rotate-1 hover:rotate-0 transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-semibold text-lg">Senior Backend Engineer</p>
                    <p className="text-xs text-muted mt-0.5">LusarLabs · Yerevan · Remote</p>
                  </div>
                  <Sparkles size={16} className="text-apricot-deep flex-shrink-0" />
                </div>
                <div className="mt-4">
                  <Ledger min={2200} max={2800} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Tag tone="moss">Tech</Tag>
                  <Tag>Full-time</Tag>
                  <Tag>Go</Tag>
                </div>
              </div>
              <p className="text-xs text-paper/40 text-center mt-4">
                Every single listing on Champ, real examples only.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* For companies */}
      <div className="px-6 py-20 max-w-4xl mx-auto">
        <p className="text-xs font-medium text-apricot-deep uppercase tracking-wide">Champ for hiring</p>
        <h2 className="font-display font-semibold text-2xl md:text-3xl mt-2 max-w-lg">
          Meet candidates directly, with real budgets on the table
        </h2>
        <div className="grid md:grid-cols-3 gap-5 mt-8">
          <div className="p-6 rounded-2xl border border-line bg-white hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center mb-4">
              <DollarSign size={18} />
            </div>
            <p className="font-medium mb-1.5">No guessing on budget</p>
            <p className="text-sm text-muted leading-relaxed">
              Every role requires a real salary range before it can be published —
              so conversations start with both sides already aligned.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-line bg-white hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center mb-4">
              <MessageCircle size={18} />
            </div>
            <p className="font-medium mb-1.5">Message candidates directly</p>
            <p className="text-sm text-muted leading-relaxed">
              No recruiter middleman. Chat with candidates the moment they apply,
              or reach out to anyone actively looking.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-line bg-white hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center mb-4">
              <Gift size={18} />
            </div>
            <p className="font-medium mb-1.5">Free to start, pay only on a hire</p>
            <p className="text-sm text-muted leading-relaxed">
              Post roles and message candidates at no cost. When you actually
              hire someone through Champ, that&apos;s when billing kicks in — never before.
            </p>
          </div>
        </div>
      </div>

      {/* For job seekers */}
      <div className="px-6 py-20 bg-paper-dim">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-medium text-apricot-deep uppercase tracking-wide">Champ for job search</p>
          <h2 className="font-display font-semibold text-2xl md:text-3xl mt-2 max-w-lg">
            Know the salary before you even apply
          </h2>
          <div className="grid md:grid-cols-3 gap-5 mt-8">
            <div className="p-6 rounded-2xl bg-white border border-line hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 rounded-full bg-apricot/15 flex items-center justify-center mb-4">
                <DollarSign size={18} className="text-apricot-deep" />
              </div>
              <p className="font-medium mb-1.5">Real ranges, every listing</p>
              <p className="text-sm text-muted leading-relaxed">
                No more applying blind — every role shows what it actually pays
                before you send a single message.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-line hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 rounded-full bg-apricot/15 flex items-center justify-center mb-4">
                <MessageCircle size={18} className="text-apricot-deep" />
              </div>
              <p className="font-medium mb-1.5">Direct chat, no black hole</p>
              <p className="text-sm text-muted leading-relaxed">
                Applying opens a real conversation with the hiring side —
                no automated &quot;we&apos;ll be in touch&quot; silence.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-line hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 rounded-full bg-apricot/15 flex items-center justify-center mb-4">
                <Users size={18} className="text-apricot-deep" />
              </div>
              <p className="font-medium mb-1.5">Built for Armenia&apos;s tech scene</p>
              <p className="text-sm text-muted leading-relaxed">
                Focused on local and diaspora tech talent — not a generic
                board with thousands of unrelated listings to wade through.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="px-6 py-10 max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-muted">
          <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-moss" /> Salary required on every listing</span>
          <span className="flex items-center gap-2"><MessageCircle size={16} className="text-moss" /> Real conversations, not queues</span>
          <span className="flex items-center gap-2"><Gift size={16} className="text-moss" /> Free until you actually hire</span>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 py-24 bg-ink text-center">
        <h2 className="font-display font-semibold text-3xl md:text-4xl text-paper">
          Ready to see it for yourself?
        </h2>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link
            href="/signup?role=candidate"
            className="group px-6 py-3.5 rounded-lg font-medium text-sm bg-apricot text-ink flex items-center gap-2 hover:bg-apricot-deep transition-colors"
          >
            Browse open roles
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/signup?role=company"
            className="group px-6 py-3.5 rounded-lg font-medium text-sm border border-paper/25 text-paper flex items-center gap-2 hover:bg-white/5 transition-colors"
          >
            Post a role
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        <p className="text-sm text-paper/50 mt-8">
          Questions? <Link href="/contact" className="underline">Contact us</Link>.
        </p>
      </div>
    </div>
  );
}
