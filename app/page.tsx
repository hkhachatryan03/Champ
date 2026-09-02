import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect(session.role === "candidate" ? "/candidate/jobs" : "/company/dashboard");
  }

  return (
    <div>
      <div className="bg-ink">
        <div className="px-6 pt-16 pb-20 max-w-2xl mx-auto md:mx-0 md:ml-6">
          <h1 className="font-display font-semibold text-4xl md:text-5xl text-paper leading-[1.05]">
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
      </div>

      <div className="px-6 py-16 max-w-4xl mx-auto">
        <p className="text-xs font-medium text-apricot-deep uppercase tracking-wide">Champ for hiring</p>
        <h2 className="font-display font-semibold text-2xl md:text-3xl mt-2 max-w-lg">
          Meet candidates directly, with real budgets on the table
        </h2>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div>
            <p className="font-medium">No guessing on budget</p>
            <p className="text-sm text-muted mt-1">
              Every role requires a real salary range before it can be published —
              so conversations start with both sides already aligned.
            </p>
          </div>
          <div>
            <p className="font-medium">Message candidates directly</p>
            <p className="text-sm text-muted mt-1">
              No recruiter middleman. Chat with candidates the moment they apply,
              or reach out to anyone actively looking.
            </p>
          </div>
          <div>
            <p className="font-medium">Free to start, pay only on a hire</p>
            <p className="text-sm text-muted mt-1">
              Post roles and message candidates at no cost. When you actually
              hire someone through Champ, that&apos;s when billing kicks in — never before.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-16 max-w-4xl mx-auto bg-paper-dim">
        <p className="text-xs font-medium text-apricot-deep uppercase tracking-wide">Champ for job search</p>
        <h2 className="font-display font-semibold text-2xl md:text-3xl mt-2 max-w-lg">
          Know the salary before you even apply
        </h2>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div>
            <p className="font-medium">Real ranges, every listing</p>
            <p className="text-sm text-muted mt-1">
              No more applying blind — every role shows what it actually pays
              before you send a single message.
            </p>
          </div>
          <div>
            <p className="font-medium">Direct chat, no black hole</p>
            <p className="text-sm text-muted mt-1">
              Applying opens a real conversation with the hiring side —
              no automated &quot;we&apos;ll be in touch&quot; silence.
            </p>
          </div>
          <div>
            <p className="font-medium">Built for Armenia&apos;s tech scene</p>
            <p className="text-sm text-muted mt-1">
              Focused on local and diaspora tech talent — not a generic
              board with thousands of unrelated listings to wade through.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-16 max-w-2xl mx-auto text-center">
        <h2 className="font-display font-semibold text-2xl">Ready to see it for yourself?</h2>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link
            href="/signup?role=candidate"
            className="px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink"
          >
            Browse open roles
          </Link>
          <Link
            href="/signup?role=company"
            className="px-5 py-3 rounded-lg font-medium text-sm border border-line"
          >
            Post a role
          </Link>
        </div>
        <p className="text-sm text-muted mt-8">
          Questions? <Link href="/contact" className="underline">Contact us</Link>.
        </p>
      </div>
    </div>
  );
}
