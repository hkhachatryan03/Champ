import { verifyAdminLogin } from "@/lib/adminQueries";
import { createAdminSession } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

async function adminLoginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const admin = await verifyAdminLogin(email, password);
  if (!admin) {
    redirect("/admin/login?error=1");
  }

  await createAdminSession({ adminId: admin.id, email: admin.email, name: admin.name });
  redirect("/admin");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-xs font-medium text-apricot uppercase tracking-wide text-center">
          Champ
        </p>
        <h1 className="font-display font-semibold text-2xl text-paper text-center mt-2">
          BackOffice
        </h1>

        {error === "1" && (
          <div className="mt-5 text-sm text-apricot-deep bg-apricot/10 rounded-lg px-3 py-2 text-center">
            Wrong email or password.
          </div>
        )}

        <form action={adminLoginAction} className="flex flex-col gap-4 mt-6 bg-paper rounded-2xl p-6 border border-line">
          <div>
            <label className="text-xs font-medium text-muted">Email</label>
            <input
              name="email"
              type="email"
              required
              autoFocus
              className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full mt-1 px-3 py-2 rounded-lg border border-line text-sm outline-none"
            />
          </div>
          <button
            type="submit"
            className="mt-2 px-5 py-3 rounded-lg font-medium text-sm bg-apricot text-ink"
          >
            Log in
          </button>
        </form>
        <p className="text-xs text-paper/50 text-center mt-4">
          Internal use only — this is not the candidate/company login.
        </p>
      </div>
    </div>
  );
}
