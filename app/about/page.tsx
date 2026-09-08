import Link from "next/link";
import { getSession } from "@/lib/auth";

export default async function AboutPage() {
  const session = await getSession();
  return (
    <div>
      <div className="bg-ink">
        <div className="px-6 pt-16 pb-20 max-w-2xl mx-auto">
          <p className="text-xs font-medium text-apricot uppercase tracking-wide">What is Champ?</p>
          <h1 className="font-display font-semibold text-4xl md:text-5xl text-paper leading-[1.1] mt-3">
            A path, not a maze.
          </h1>
          <p className="mt-6 text-base md:text-lg text-paper/70 max-w-lg leading-relaxed">
            Champ comes from <em>ճամփա</em> — the Armenian word for &quot;path.&quot;
            That&apos;s the whole idea: getting from &quot;looking for work&quot; or
            &quot;looking for someone great&quot; to an actual conversation, without
            the maze most job platforms turn that into.
          </p>
        </div>
      </div>

      <div className="px-6 py-16 max-w-2xl mx-auto">
        <h2 className="font-display font-semibold text-2xl mb-4">Why we built this</h2>
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

      <div className="px-6 py-16 max-w-2xl mx-auto bg-paper-dim">
        <h2 className="font-display font-semibold text-2xl mb-6">Who it&apos;s for</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="font-medium mb-1">Job seekers</p>
            <p className="text-sm text-muted leading-relaxed">
              Armenian and diaspora tech talent — and the non-tech roles
              that keep tech companies running (ops, finance, HR, support,
              and more). If you&apos;re tired of applying blind, this is
              built for you.
            </p>
          </div>
          <div>
            <p className="font-medium mb-1">Companies</p>
            <p className="text-sm text-muted leading-relaxed">
              Teams hiring in or for Armenia who&apos;d rather message
              candidates directly than manage a black-box applicant queue,
              and who are comfortable being upfront about what a role
              actually pays.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-16 max-w-2xl mx-auto">
        <h2 className="font-display font-semibold text-2xl mb-6">How it works</h2>
        <div className="flex flex-col gap-6">
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-apricot/20 text-apricot-deep font-display font-semibold flex items-center justify-center flex-shrink-0">1</div>
            <div>
              <p className="font-medium">Every role shows its salary, upfront</p>
              <p className="text-sm text-muted mt-0.5">No range, no listing — that&apos;s a hard rule, not a suggestion.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-apricot/20 text-apricot-deep font-display font-semibold flex items-center justify-center flex-shrink-0">2</div>
            <div>
              <p className="font-medium">Applying opens a real conversation</p>
              <p className="text-sm text-muted mt-0.5">A message, not a form disappearing into a queue.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-apricot/20 text-apricot-deep font-display font-semibold flex items-center justify-center flex-shrink-0">3</div>
            <div>
              <p className="font-medium">Free to start, for everyone</p>
              <p className="text-sm text-muted mt-0.5">
                Companies only pay a success fee once they actually hire
                someone through Champ — never before.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-16 max-w-2xl mx-auto text-center">
        <h2 className="font-display font-semibold text-2xl">Come see for yourself</h2>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {(!session || session.role === "candidate") && (
            <Link href="/jobs" className="px-5 py-3 rounded-lg font-medium text-sm border border-line">
              Browse open roles
            </Link>
          )}
          {(!session || session.role === "company") && (
            <Link href={session ? "/company/jobs/new" : "/signup?role=company"} className="px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink">
              Post a role
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
