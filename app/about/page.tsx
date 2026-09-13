import Link from "next/link";
import { getSession } from "@/lib/auth";
import { DollarSign, MessageCircle, Gift, Code2, Building2, ArrowRight } from "lucide-react";

export default async function AboutPage() {
  const session = await getSession();

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
        <div className="relative px-6 pt-20 pb-24 max-w-3xl mx-auto text-center">
          <p className="text-xs font-medium text-apricot uppercase tracking-[0.2em]">What is Champ?</p>
          <h1 className="font-display font-semibold text-5xl md:text-6xl text-paper leading-[1.05] mt-5">
            A path, <span className="text-apricot">not a maze.</span>
          </h1>
          <p className="mt-7 text-base md:text-lg text-paper/70 max-w-lg mx-auto leading-relaxed">
            Champ comes from <em>ճամփա</em> — the Armenian word for &quot;path.&quot;
            That&apos;s the whole idea: getting from &quot;looking for work&quot; or
            &quot;looking for someone great&quot; to an actual conversation, without
            the maze most job platforms turn that into.
          </p>
        </div>
      </div>

      {/* Why */}
      <div className="px-6 py-20 max-w-3xl mx-auto">
        <div className="grid md:grid-cols-[1fr_1.4fr] gap-10 items-start">
          <div>
            <p className="text-xs font-medium text-apricot-deep uppercase tracking-wide">Why we built this</p>
            <h2 className="font-display font-semibold text-3xl mt-2 leading-tight">
              Two things, done properly.
            </h2>
          </div>
          <p className="text-base leading-relaxed text-muted">
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

      {/* Who it's for */}
      <div className="px-6 py-20 bg-paper-dim">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-medium text-apricot-deep uppercase tracking-wide text-center">Who it&apos;s for</p>
          <h2 className="font-display font-semibold text-3xl mt-2 text-center mb-10">Two sides, one honest deal.</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="p-7 rounded-2xl bg-white border border-line hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="w-11 h-11 rounded-full bg-apricot/15 flex items-center justify-center mb-4">
                <Code2 size={20} className="text-apricot-deep" />
              </div>
              <p className="font-display font-semibold text-lg mb-1.5">Job seekers</p>
              <p className="text-sm text-muted leading-relaxed">
                Armenian and diaspora tech talent — and the non-tech roles
                that keep tech companies running (ops, finance, HR,
                support, and more). If you&apos;re tired of applying blind,
                this is built for you.
              </p>
            </div>
            <div className="p-7 rounded-2xl bg-white border border-line hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="w-11 h-11 rounded-full bg-moss/15 flex items-center justify-center mb-4">
                <Building2 size={20} className="text-moss" />
              </div>
              <p className="font-display font-semibold text-lg mb-1.5">Companies</p>
              <p className="text-sm text-muted leading-relaxed">
                Teams hiring in or for Armenia who&apos;d rather message
                candidates directly than manage a black-box applicant
                queue, and who are comfortable being upfront about what a
                role actually pays.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="px-6 py-20 max-w-3xl mx-auto">
        <p className="text-xs font-medium text-apricot-deep uppercase tracking-wide text-center">How it works</p>
        <h2 className="font-display font-semibold text-3xl mt-2 text-center mb-12">Three rules we don&apos;t bend.</h2>
        <div className="grid md:grid-cols-3 gap-5">
          <div className="relative p-6 rounded-2xl border border-line bg-white">
            <div className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center mb-4">
              <DollarSign size={18} />
            </div>
            <p className="font-medium mb-1.5">Salary, upfront</p>
            <p className="text-sm text-muted leading-relaxed">
              Every role shows its real range. No range, no listing — a
              hard rule, not a suggestion.
            </p>
          </div>
          <div className="relative p-6 rounded-2xl border border-line bg-white">
            <div className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center mb-4">
              <MessageCircle size={18} />
            </div>
            <p className="font-medium mb-1.5">A real conversation</p>
            <p className="text-sm text-muted leading-relaxed">
              Applying opens a message with an actual person, not a form
              disappearing into a queue.
            </p>
          </div>
          <div className="relative p-6 rounded-2xl border border-line bg-white">
            <div className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center mb-4">
              <Gift size={18} />
            </div>
            <p className="font-medium mb-1.5">Free until it works</p>
            <p className="text-sm text-muted leading-relaxed">
              Companies only pay a success fee once they actually hire
              someone through Champ — never before.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 py-24 bg-ink text-center">
        <h2 className="font-display font-semibold text-3xl md:text-4xl text-paper">
          Come see for yourself.
        </h2>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          {(!session || session.role === "candidate") && (
            <Link
              href="/jobs"
              className="group px-6 py-3.5 rounded-lg font-medium text-sm border border-paper/25 text-paper flex items-center gap-2 hover:bg-white/5 transition-colors"
            >
              Browse open roles
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
          {(!session || session.role === "company") && (
            <Link
              href={session ? "/company/jobs/new" : "/signup?role=company"}
              className="group px-6 py-3.5 rounded-lg font-medium text-sm bg-apricot text-ink flex items-center gap-2 hover:bg-apricot-deep transition-colors"
            >
              Post a role
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
