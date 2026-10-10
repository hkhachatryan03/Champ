import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import LegalPage, { OperatorName, ContactWays, type LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "What personal data Champ collects, who can see it, who helps us process it, how long we keep it, and how to access, correct or delete it.",
  path: "/privacy",
});

const SECTIONS: LegalSection[] = [
  {
    id: "who",
    title: "Who is responsible for your data",
    body: (
      <>
        <p>
          The person responsible for the personal data described here (the “controller”) is <OperatorName />.
        </p>
        <p>
          We handle personal data in line with the Law of the Republic of Armenia on Protection of Personal Data and, for people in the European Union or European Economic Area, the GDPR. Companies that receive a job seeker’s information through Champ are separately responsible for how they use it.
        </p>
      </>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <>
        <ul>
          <li><strong>Account.</strong> Your email address; your password (stored only as a one-way hash, never in readable form); whether you are a job seeker or a company; how you sign in (password, Google or LinkedIn) and the unique ID that provider gives us; whether your email is verified; when you joined and when you were last active.</li>
          <li><strong>Job seeker profile</strong> — whatever you choose to add: your name, photo, job title, years of experience, skills, languages, location, date of birth, CV (PDF), LinkedIn link, “about” text, salary expectations, remote preference, the positions you want, work experience (including descriptions), education, certifications (with any links or files), and whether you are “actively looking”.</li>
          <li><strong>Applications and conversations.</strong> Your applications (cover note, CV, expected salary), invitations and their status, messages, attachments, emoji reactions, read receipts, and message edits or deletions.</li>
          <li><strong>Company and recruiter information.</strong> Company name, industry, size, website and description; the recruiter’s name, photo, phone number and address; social links; whether you recruit for your own company or as an agency (and any client name you enter); information we use to review a company, such as its web domain and notes you give us; the roles you post; and, when you record a hire, the monthly salary, start date and resulting fee.</li>
          <li><strong>Messages to us.</strong> What you send through the contact form (your email, message, topic and any attachment) and our replies.</li>
          <li><strong>Technical data.</strong> A session cookie that keeps you signed in (see “Cookies”). Our hosting provider processes technical information such as IP addresses and request logs in order to deliver and secure the site. We do not store IP addresses in our own database and we do not run analytics or advertising trackers.</li>
          <li><strong>From Google or LinkedIn,</strong> if you use them to sign in: your email address and a unique account ID. We never receive your Google or LinkedIn password.</li>
        </ul>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use it, and why",
    body: (
      <>
        <ul>
          <li><strong>To run Champ</strong> — creating your account, showing your profile and roles, letting you apply and message. <em>Basis: performing our agreement with you.</em></li>
          <li><strong>To suggest roles.</strong> The “For you” page simply compares the positions and salary range on your profile with open roles. We do not make decisions about you based solely on automated processing that have legal or similarly significant effects. <em>Basis: performing our agreement with you.</em></li>
          <li><strong>To email you about the service</strong> — your verification link, password-reset codes, replies to your contact messages, company review results, team-join requests, and a single reminder if you signed up but never finished your profile. We do not send marketing emails. <em>Basis: agreement with you and our legitimate interest in a working service.</em></li>
          <li><strong>To keep Champ safe</strong> — preventing fraud and abuse, reviewing reports, moderating content and enforcing our Terms. <em>Basis: our legitimate interests.</em></li>
          <li><strong>To bill companies</strong> — recording hires and issuing invoices. <em>Basis: agreement and legal obligations.</em></li>
          <li><strong>To understand how Champ is used,</strong> using totals and counts drawn from our own database. <em>Basis: our legitimate interests.</em></li>
          <li><strong>To meet legal duties</strong> and to establish or defend legal claims.</li>
        </ul>
        <p>
          Where Armenian law relies on your consent, creating an account and choosing to add information to it is that consent. You can withdraw it at any time by removing the information or deleting your account.
        </p>
      </>
    ),
  },
  {
    id: "who-sees",
    title: "Who can see your information",
    body: (
      <>
        <ul>
          <li><strong>Companies, if you are a job seeker.</strong> When you apply, or accept an invitation, the company sees your profile and what you sent. If you switch on “actively looking”, your profile can also appear in our Candidates directory for companies on Champ. What they can see includes your name, photo, job title, skills, languages, location, <strong>your date of birth in full</strong>, experience, education, certifications, CV, LinkedIn link and salary expectations. Your preferred positions are not shown to companies.</li>
          <li><strong>Job seekers, if you are a company.</strong> Signed-in job seekers can see your company profile and roles. Posted roles — with the company name and logo — are public and visible to anyone, including people who are not signed in.</li>
          <li><strong>The other person in a conversation</strong> sees your messages, attachments, reactions and whether you have read their messages.</li>
          <li><strong>Our team.</strong> Authorised Champ staff can open accounts, content and messages when needed for support, moderation, security or legal reasons. Their actions are recorded in an audit log.</li>
          <li><strong>Our service providers</strong> (next section), only to run the service for us.</li>
          <li><strong>Authorities and others,</strong> where the law requires it, or in a sale or merger of the business (in which case this policy’s protections continue to apply to your data).</li>
        </ul>
        <p>
          <strong>We do not sell your personal data and we do not show advertising.</strong> Once a company has received your information, it is responsible for how it uses it; our Terms require companies to use it only for recruiting.
        </p>
      </>
    ),
  },
  {
    id: "providers",
    title: "Companies that help us run Champ",
    body: (
      <>
        <p>These providers process data on our behalf, under their own data-protection terms:</p>
        <ul>
          <li><strong>Vercel</strong> — hosts the website and stores uploaded files (CVs, photos, certificates and attachments).</li>
          <li><strong>Neon</strong> — hosts our database.</li>
          <li><strong>Resend</strong> — delivers our emails.</li>
          <li><strong>Google</strong> — if you sign in with Google. Our pages also load their fonts from Google’s servers, so your browser contacts Google when you visit.</li>
          <li><strong>LinkedIn</strong> — if you sign in with LinkedIn.</li>
        </ul>
        <p>
          These providers may store and process data outside Armenia, including in the European Union and the United States. Where the law requires safeguards for such transfers, we rely on the contractual protections these providers offer, such as standard contractual clauses.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies",
    body: (
      <>
        <p>
          Champ sets one cookie, <strong>champ_session</strong>. It keeps you signed in, lasts up to 30 days, is not readable by scripts on the page, and is sent only over a secure connection. It is strictly necessary for the service, so we do not show a cookie banner.
        </p>
        <p>
          We use no analytics, advertising or tracking cookies. If you use Google or LinkedIn to sign in, those companies may set their own cookies while you do.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <>
        <ul>
          <li><strong>While your account exists,</strong> we keep your account, profile, applications and conversations. We do not currently delete inactive accounts automatically.</li>
          <li><strong>When you delete your account</strong> (in Settings), your profile, applications and conversations are removed right away — including from the other person’s side of a conversation — and so are the files you uploaded and any messages you sent us through the contact form. A company that deletes its account also removes its roles and their applicants’ conversations. Deletion is permanent. Copies held in backups by our database provider are overwritten on its routine schedule.</li>
          <li><strong>Archived roles</strong> are permanently deleted 90 days after they are archived. <strong>Drafts</strong> are kept until you delete them or your account.</li>
          <li><strong>Sign-in links and codes</strong> expire shortly after they are issued.</li>
          <li><strong>Invoices and accounting records</strong> that the law requires us to keep are held in our accounting records, separately from profile data, for as long as the law requires.</li>
        </ul>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>You have the right to:</p>
        <ul>
          <li>know whether we process your data and get a copy of it;</li>
          <li>have inaccurate data corrected;</li>
          <li>have your data deleted;</li>
          <li>restrict or object to certain processing;</li>
          <li>receive the data you gave us in a common, portable format;</li>
          <li>withdraw any consent you have given.</li>
        </ul>
        <p>
          Much of this you can do yourself: edit your profile at any time, and delete your account in <strong>Settings</strong>. For anything else — such as a copy of your data — use the <Link href="/contact">contact form</Link> and choose “Privacy request”. We will answer as quickly as we can and no later than 30 days. We may need to confirm it is really you first, and we may keep what the law requires us to keep.
        </p>
        <p>
          If you believe we have mishandled your data, you can complain to the Personal Data Protection Agency of the Ministry of Justice of the Republic of Armenia. If you live in the EU or EEA, you can also complain to your local data protection authority. We would appreciate the chance to put things right first.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Keeping your data safe",
    body: (
      <>
        <p>
          We use encrypted connections, store passwords only as hashes, keep sign-in sessions in a protected cookie, and limit who on our side can reach personal data. No system is perfectly secure. If a breach affects your data in a way that puts you at risk, we will tell you and the authorities as the law requires.
        </p>
        <p>
          <strong>Please note how uploaded files work.</strong> CVs, photos, certificates and attachments are stored with long, random web addresses. Anyone who has the exact address can open the file, even without an account. Please do not upload anything you would not be comfortable with a recruiter you applied to being able to share.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        Champ is for adults aged 18 and over. We do not knowingly collect data from anyone younger. If we learn that we have, we will delete it.
      </p>
    ),
  },
  {
    id: "links",
    title: "Other websites",
    body: (
      <p>
        Profiles and roles can link to other websites. We are not responsible for their privacy practices, so please read their policies.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        When we make a material change we will tell you by email or inside Champ before it takes effect, and update the date and version at the top of this page.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about this policy or about your data? <ContactWays /> Choose “Privacy request” in the form so it reaches the right place.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This explains what personal data Champ collects, who can see it, who helps us process it, how long we keep it, and what you can do about it — in plain language."
      summary={[
        "We collect what you give us — your account, profile, CV, applications and messages — plus the basic technical data any website needs.",
        "If you are a job seeker, companies on Champ can see your profile when you apply, or if you turn on “actively looking” — including your date of birth if you added it.",
        "We do not sell your data, show ads or use tracking cookies. The only cookie we set keeps you signed in.",
        "A few providers help us run Champ (hosting, database, email, sign-in). Some are outside Armenia.",
        "You can edit your information, delete your account (and your files) in Settings, or ask us for a copy through the contact form.",
        "Uploaded files are reachable by anyone who has their exact web address. Do not upload anything you would not want a recruiter to share.",
      ]}
      sections={SECTIONS}
      other={{ href: "/terms", label: "Terms of Service" }}
    />
  );
}
