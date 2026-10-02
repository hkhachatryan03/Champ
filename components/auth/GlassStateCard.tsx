import GuestPage from "@/components/GuestPage";

/**
 * A single centred glass card with an icon, a title and a short message —
 * used by the email-verification screens. Pure presentation.
 */
export default function GlassStateCard({
  icon,
  good = false,
  title,
  children,
}: {
  icon: React.ReactNode;
  good?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <GuestPage>
      <div className="px-6 pt-[calc(var(--nav-h)+2.5rem)] pb-24 max-w-[520px] mx-auto aur-hero-in">
        <div className="aur-bezel">
          <div className="aur-bezel-inner px-[34px] py-10 text-center">
            <div className={`aur-cicon ${good ? "good" : ""}`}>{icon}</div>
            <h1 className="font-display font-semibold text-[clamp(28px,4vw,34px)] leading-[1.15] text-paper">{title}</h1>
            <div className="aur-cbody">{children}</div>
          </div>
        </div>
      </div>
    </GuestPage>
  );
}
