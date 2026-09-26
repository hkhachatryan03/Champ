import { redirect } from "next/navigation";
import {
  listFeatureFlags,
  setFeatureFlag,
  listStaticContent,
  upsertStaticContent,
  listCustomTermsAdmin,
  deleteCustomTerm,
} from "@/lib/adminQueries";
import { getAdminSession } from "@/lib/adminAuth";

async function toggleFlagAction(formData: FormData) {
  "use server";
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const key = String(formData.get("key"));
  const description = String(formData.get("description") || "");
  const nextEnabled = formData.get("nextEnabled") === "1";
  await setFeatureFlag(key, nextEnabled, description, session!.email);
  redirect("/admin/configs");
}

async function createFlagAction(formData: FormData) {
  "use server";
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const key = String(formData.get("newKey") || "").trim();
  const description = String(formData.get("newDescription") || "").trim();
  if (!key) redirect("/admin/configs");
  await setFeatureFlag(key, false, description, session!.email);
  redirect("/admin/configs");
}

async function saveStaticContentAction(formData: FormData) {
  "use server";
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const key = String(formData.get("key"));
  const title = String(formData.get("title") || "");
  const body = String(formData.get("body") || "");
  await upsertStaticContent(key, title, body, session!.email);
  redirect("/admin/configs");
}

async function deleteTermAction(formData: FormData) {
  "use server";
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  await deleteCustomTerm(Number(formData.get("id")), session!.email);
  redirect("/admin/configs");
}

const STATIC_CONTENT_PAGES = [
  { key: "contact_intro", label: "Contact Us — intro text" },
  { key: "terms_of_service", label: "Terms of Service" },
  { key: "privacy_policy", label: "Privacy Policy" },
];

export default async function AdminConfigsPage() {
  const [flags, staticEntries, skillTerms, positionTerms, institutionTerms] = await Promise.all([
    listFeatureFlags(),
    listStaticContent(),
    listCustomTermsAdmin("skill"),
    listCustomTermsAdmin("position"),
    listCustomTermsAdmin("institution"),
  ]);
  const staticByKey = Object.fromEntries(staticEntries.map((s: any) => [s.key, s]));

  return (
    <div>
      <h1 className="font-display font-semibold text-2xl">Configs</h1>
      <p className="text-sm text-muted mt-1">
        Feature toggles, editable static pages, and terms people have added beyond the built-in lists.
      </p>

      <div className="mt-8">
        <h2 className="font-medium text-sm text-muted uppercase tracking-wide">Feature flags</h2>
        <div className="flex flex-col gap-2 mt-3">
          {flags.map((f: any) => (
            <div key={f.key} className="p-4 rounded-xl border border-line bg-white flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{f.key}</p>
                {f.description && <p className="text-xs text-muted mt-0.5">{f.description}</p>}
              </div>
              <form action={toggleFlagAction}>
                <input type="hidden" name="key" value={f.key} />
                <input type="hidden" name="description" value={f.description} />
                <input type="hidden" name="nextEnabled" value={f.enabled ? "0" : "1"} />
                <button
                  type="submit"
                  className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                    f.enabled ? "bg-moss text-white" : "bg-ink/8 text-muted"
                  }`}
                >
                  {f.enabled ? "On" : "Off"}
                </button>
              </form>
            </div>
          ))}
          {flags.length === 0 && <p className="text-sm text-muted">No feature flags yet — add one below.</p>}
        </div>
        <form action={createFlagAction} className="flex gap-2 mt-3">
          <input
            name="newKey"
            placeholder="flag_key (e.g. linkedin_import)"
            className="px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white w-56"
          />
          <input
            name="newDescription"
            placeholder="What this flag controls"
            className="flex-1 px-3 py-2 rounded-lg border border-line text-sm outline-none bg-white"
          />
          <button type="submit" className="px-4 py-2 rounded-lg bg-ink text-paper text-sm font-medium whitespace-nowrap">
            Add flag
          </button>
        </form>
      </div>

      <div className="mt-10">
        <h2 className="font-medium text-sm text-muted uppercase tracking-wide">Static content</h2>
        <div className="flex flex-col gap-4 mt-3">
          {STATIC_CONTENT_PAGES.map((page) => {
            const entry = staticByKey[page.key];
            return (
              <details key={page.key} className="p-4 rounded-xl border border-line bg-white">
                <summary className="text-sm font-medium cursor-pointer">{page.label}</summary>
                <form action={saveStaticContentAction} className="flex flex-col gap-2 mt-3">
                  <input type="hidden" name="key" value={page.key} />
                  <input
                    name="title"
                    defaultValue={entry?.title || ""}
                    placeholder="Heading shown on the page"
                    className="px-3 py-2 rounded-lg border border-line text-sm outline-none"
                  />
                  <textarea
                    name="body"
                    defaultValue={entry?.body || ""}
                    placeholder="Body text…"
                    rows={6}
                    className="px-3 py-2 rounded-lg border border-line text-sm outline-none"
                  />
                  {entry?.updated_at && (
                    <p className="text-xs text-muted">
                      Last edited by {entry.updated_by} on {entry.updated_at.slice(0, 10)}
                    </p>
                  )}
                  <button type="submit" className="self-start px-4 py-2 rounded-lg bg-apricot text-ink text-sm font-medium">
                    Save
                  </button>
                </form>
              </details>
            );
          })}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-medium text-sm text-muted uppercase tracking-wide">
          Shared vocabulary — added by users
        </h2>
        <p className="text-xs text-muted mt-1">
          When someone types a skill, position, or school that isn&apos;t in the built-in list, it gets added here
          and suggested to everyone. Remove anything that&apos;s a duplicate, a typo, or not appropriate.
        </p>
        {[
          { label: "Skills", terms: skillTerms },
          { label: "Preferred positions", terms: positionTerms },
          { label: "Institutions", terms: institutionTerms },
        ].map(({ label, terms }) => (
          <div key={label} className="mt-4">
            <p className="text-xs font-medium text-muted">{label} ({terms.length})</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {terms.map((t: any) => (
                <form key={t.id} action={deleteTermAction} className="flex items-center gap-1.5 bg-white border border-line rounded-full pl-3 pr-1.5 py-1">
                  <span className="text-xs">{t.value}</span>
                  <input type="hidden" name="id" value={t.id} />
                  <button type="submit" className="text-xs text-muted hover:text-apricot-deep" title="Remove">
                    ×
                  </button>
                </form>
              ))}
              {terms.length === 0 && <p className="text-xs text-muted">None added yet.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
