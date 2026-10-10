import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { LEGAL } from "@/lib/legal";
import LegalPage, { OperatorName, ContactWays, type LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "The rules for using Champ: how accounts work, what we expect from job seekers and companies, how the success fee works, and your rights.",
  path: "/terms",
});

const { fee } = LEGAL;

const SECTIONS: LegalSection[] = [
  {
    id: "about",
    title: "Who we are and what these Terms cover",
    body: (
      <>
        <p>
          These Terms of Service (the “Terms”) are an agreement between you and <OperatorName /> (“Champ”, “we”, “us”). They apply to your use of the Champ website and everything we offer through it (together, the “Service”).
        </p>
        <p>
          By creating an account or using the Service, you agree to these Terms and to our <Link href="/privacy">Privacy Policy</Link>. If you do not agree, please do not use Champ.
        </p>
        <p>
          If you use Champ on behalf of a company or an agency, you confirm that you have the authority to accept these Terms for it, and “you” then means that company as well as you personally.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Who can use Champ, and your account",
    body: (
      <>
        <ul>
          <li>You must be at least 18 years old and able to enter into a binding agreement.</li>
          <li>The information you give us must be accurate, and you must keep it up to date.</li>
          <li>One person, one account. Company accounts may only be used by people authorised to act for that company.</li>
          <li>You are responsible for keeping your password and your sign-in methods (including your Google or LinkedIn account) secure, and for everything that happens under your account. If you think someone else has used it, tell us straight away through the <Link href="/contact">contact form</Link>.</li>
        </ul>
        <p>We may ask a company to prove who it is before, or after, it can post roles.</p>
      </>
    ),
  },
  {
    id: "what-champ-is",
    title: "What Champ is, and what it isn’t",
    body: (
      <>
        <p>
          Champ is a platform where companies post roles with a visible salary range, and where job seekers and recruiters can message each other directly. We are not an employer, a recruitment agency, or a party to any job offer or employment contract. Hiring decisions, offers and contracts are entirely between the company and the candidate.
        </p>
        <ul>
          <li><strong>Company review.</strong> We review companies before they can post roles. That is a basic check, not a background check and not an endorsement.</li>
          <li><strong>No verification of candidates.</strong> We do not check the qualifications, experience or claims on a profile or CV. Companies should do their own checks.</li>
          <li><strong>Salary ranges</strong> are provided by companies. We do not guarantee them.</li>
          <li><strong>No guarantees.</strong> We cannot promise that you will find a job, a candidate, a reply, or any particular result.</li>
        </ul>
      </>
    ),
  },
  {
    id: "job-seekers",
    title: "For job seekers",
    body: (
      <>
        <ul>
          <li><strong>Champ is free for job seekers.</strong> We never charge you, and no company may charge you to apply or to be considered. If anyone asks you for money, please report it to us.</li>
          <li><strong>What companies can see.</strong> When you apply, companies see the information you send and your profile. If you switch on “actively looking”, your profile may also appear in our Candidates directory for companies on Champ. The <Link href="/privacy">Privacy Policy</Link> lists exactly what is visible.</li>
          <li><strong>Be truthful.</strong> Do not misrepresent who you are, your qualifications or your work history, and only upload a CV and documents that are yours.</li>
          <li><strong>Applying starts a conversation.</strong> A company is not obliged to reply or to offer you anything.</li>
        </ul>
      </>
    ),
  },
  {
    id: "companies",
    title: "For companies and recruiters",
    body: (
      <>
        <ul>
          <li><strong>Real roles only.</strong> Post only genuine, currently open roles. No fake roles, “talent pool” postings or roles you are not actually hiring for. Pause or archive a role once it is filled.</li>
          <li><strong>A real salary range.</strong> Every role must show a monthly salary range in AMD that honestly reflects what you are prepared to pay. We may remove or edit roles whose range is clearly misleading.</li>
          <li><strong>Agencies.</strong> If you recruit for someone else, say so by naming the client where Champ asks for it, and make sure you are authorised to hire for them. The fees in these Terms apply to the account that makes the hire.</li>
          <li><strong>Equal treatment.</strong> Do not discriminate — for example on gender, age, ethnicity, religion, disability, family situation or political views — in a role description or in how you treat candidates, and follow Armenian employment law.</li>
          <li><strong>No fees to candidates.</strong> Never ask a candidate to pay you, and do not ask for sensitive documents or details that are not needed to evaluate them.</li>
          <li><strong>Candidate information.</strong> You may use what candidates share only to evaluate and hire for roles on Champ. You must not sell it, use it for marketing, build your own database from it, or copy it in bulk. Delete it when you no longer need it. For the information you receive, you are responsible for complying with data protection law.</li>
        </ul>
      </>
    ),
  },
  {
    id: "fees",
    title: "Fees",
    body: (
      <>
        <p>
          <strong>Job seekers never pay.</strong> The rest of this section applies to companies.
        </p>
        <ul>
          <li><strong>Free start.</strong> For the first {fee.freeMonths} months after your company account is created, using Champ is free, including any hire you make in that time.</li>
          <li><strong>Pay only when you hire.</strong> After that, there is no subscription and no charge for posting roles or sending messages. When you hire someone through Champ, you pay a one-time success fee of <strong>{fee.percent}% of that person’s first monthly gross salary</strong> as agreed in AMD.</li>
          <li><strong>What “hired through Champ” means.</strong> A person you first contacted, or who first contacted you, through Champ (by application, invitation or message), and whom you then engage — as an employee or a contractor, full-time or part-time — within {fee.attributionMonths} months of that first conversation on Champ.</li>
          <li><strong>Tell us about hires.</strong> When you hire someone through Champ, record it by marking the candidate as “Hired” and giving the monthly salary and start date. If we reasonably believe a hire has happened, we may ask you to confirm it, and you agree to answer honestly. Moving a conversation off Champ to avoid the fee is a breach of these Terms.</li>
          <li><strong>Invoices.</strong> We invoice in AMD once the person starts. Invoices are due within {fee.paymentDays} days. Amounts do not include VAT or other taxes, where they apply. If an invoice is overdue we may pause your ability to post roles and message candidates until it is paid.</li>
          <li><strong>If the person never starts,</strong> no fee is due.</li>
          <li><strong>Changes.</strong> We will tell you at least 30 days before changing our fees. A change does not apply to people you were already talking to before it takes effect.</li>
        </ul>
      </>
    ),
  },
  {
    id: "conduct",
    title: "Rules of conduct",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>give false information, impersonate anyone, or pretend to represent a company you do not represent;</li>
          <li>post or send anything unlawful, hateful, harassing, threatening, sexually explicit or deliberately misleading;</li>
          <li>send spam or bulk unsolicited messages, or run scams — including asking people for money;</li>
          <li>upload viruses or malicious files, or try to probe, disrupt or break into the Service or other people’s accounts;</li>
          <li>scrape, crawl or copy the Service or its data by automated means, except where we have allowed it in writing;</li>
          <li>share other people’s personal information without their permission;</li>
          <li>create accounts to get around a suspension, a review decision or a fee;</li>
          <li>use the Service in any way that breaks the law.</li>
        </ul>
      </>
    ),
  },
  {
    id: "content",
    title: "Your content and messages",
    body: (
      <>
        <p>
          You keep ownership of what you put on Champ — your profile, CV, role descriptions, messages and attachments (“your content”). You give us a worldwide, non-exclusive, royalty-free licence to store, display and transmit your content as needed to run the Service, including showing it to the other people it is meant for. This licence ends when your content is deleted, subject to the retention periods in the <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <p>You confirm that you have the right to share your content — for example, that a certificate or CV you upload is yours to share.</p>
        <p>
          Messages are visible to the people in the conversation. We may look at messages and files when we need to — for example to deal with a report, investigate abuse, give support or comply with the law — as explained in the Privacy Policy.
        </p>
      </>
    ),
  },
  {
    id: "moderation",
    title: "Moderation, suspension and removal",
    body: (
      <>
        <p>
          We may review reports, remove content or roles, limit features, decline or withdraw a company’s approval, or suspend or close an account if we reasonably believe these Terms have been broken, that there is fraud or risk to others, or that the law requires it. Where it is reasonable and safe to do so, we will tell you why and give you a chance to respond.
        </p>
        <p>Fees for hires made before an account is closed stay payable.</p>
      </>
    ),
  },
  {
    id: "closing-account",
    title: "Closing your account",
    body: (
      <>
        <p>
          You can delete your account at any time in <strong>Settings</strong>. Deletion is permanent. As the <Link href="/privacy">Privacy Policy</Link> explains, your profile, your uploaded files, and your applications and conversations are removed — including from the other person’s side of a conversation. A company that deletes its account also deletes its roles and their applicants’ conversations. Anything that has already become payable under these Terms stays payable.
        </p>
      </>
    ),
  },
  {
    id: "ip",
    title: "Our intellectual property",
    body: (
      <>
        <p>
          The Champ name, logo, website, software and design belong to us or our licensors. We give you a limited, revocable permission to use the Service as intended. You may not copy it, reverse-engineer it, or use our brand without our written permission.
        </p>
        <p>If you send us feedback or ideas, we may use them freely and without payment.</p>
      </>
    ),
  },
  {
    id: "third-parties",
    title: "Third-party services and links",
    body: (
      <p>
        You can sign in with Google or LinkedIn, and some content may link to other websites. We do not control those services or sites and are not responsible for them; their own terms apply.
      </p>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: (
      <>
        <p>
          To the extent the law allows, the Service is provided “as is” and “as available”. We do not promise that it will be uninterrupted or error-free. We do not endorse any user or role, and we are not responsible for what users say, for hiring decisions, offers, salaries actually paid, working conditions, or disputes between users.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Limits on our liability",
    body: (
      <>
        <p>
          To the extent the law allows, we are not liable for indirect or consequential losses, lost profits, lost opportunities or loss of data arising from your use of the Service. Our total liability for any claim connected with the Service is limited to the fees you paid us in the 12 months before the event that gave rise to the claim.
        </p>
        <p>
          Nothing in these Terms limits liability that cannot be limited by law — for example for fraud, intentional wrongdoing, gross negligence, or death or personal injury — or any consumer rights you have that cannot be waived.
        </p>
        <p>
          You agree to compensate us for losses we suffer, to the extent the law allows, because you broke these Terms or the law, or because of unlawful content you provided.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to the Service and these Terms",
    body: (
      <>
        <p>
          We may improve or change the Service. We may also update these Terms. For material changes we will give you at least 14 days’ notice by email or inside Champ, unless the law or an urgent security issue requires us to act sooner. The date and version at the top of this page show when the text last changed.
        </p>
        <p>If you keep using Champ after a change takes effect, you accept the new Terms. If you do not agree, you can delete your account first.</p>
      </>
    ),
  },
  {
    id: "law",
    title: "Governing law and disputes",
    body: (
      <>
        <p>
          These Terms are governed by the laws of the Republic of Armenia. If we cannot settle a disagreement informally — please contact us first — the courts of Yerevan have jurisdiction.
        </p>
        <p>
          If you are a consumer in the European Union or European Economic Area, you keep any rights you have under mandatory consumer law in the country where you live, including the right to bring a claim in your local courts.
        </p>
      </>
    ),
  },
  {
    id: "general",
    title: "General",
    body: (
      <ul>
        <li>These Terms and the Privacy Policy are the whole agreement between you and us about the Service.</li>
        <li>If part of these Terms cannot be enforced, the rest still applies. If we do not enforce a right straight away, we have not given it up.</li>
        <li>You may not transfer your rights under these Terms without our consent. We may transfer ours, for example in a merger or sale of the business.</li>
        <li>We may give notices by email or inside Champ.</li>
        <li>These Terms are written in English. If we provide a translation, the English text prevails if they differ.</li>
      </ul>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about these Terms? <ContactWays />
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="These are the rules for using Champ. We have tried to write them in plain language, because they apply to real people with real jobs at stake."
      summary={[
        "Champ connects job seekers with tech companies in Armenia. We are a platform — not an employer or a recruiter — and we cannot promise you a job or a hire.",
        "Be honest: a truthful profile, and real roles with real salary ranges.",
        `Job seekers always use Champ for free. Companies are free for the first ${fee.freeMonths} months, then pay a one-time ${fee.percent}% success fee when they hire someone through Champ — nothing before that.`,
        "Be respectful: no discrimination, spam, scams or scraping. We can remove content and close accounts that break the rules.",
        "You can delete your account whenever you like, in Settings.",
        "Armenian law applies.",
      ]}
      sections={SECTIONS}
      other={{ href: "/privacy", label: "Privacy Policy" }}
    />
  );
}
