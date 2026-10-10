import Link from "next/link";

// The one place every visitor can always find the legal pages — Google and
// LinkedIn also look for a visible privacy-policy link when reviewing sign-in.
export default function SiteFooter() {
  return (
    <footer className="bg-ink border-t border-paper/10 text-paper/55">
      <div className="max-w-[1120px] mx-auto px-6 py-7 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 text-[13px]">
        <p>© {new Date().getFullYear()} Champ</p>
        <nav aria-label="Legal and help" className="flex items-center gap-6">
          <Link href="/terms" className="hover:text-apricot transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-apricot transition-colors">Privacy</Link>
          <Link href="/contact" className="hover:text-apricot transition-colors">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
