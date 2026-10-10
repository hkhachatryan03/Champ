"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { deleteDraftJob } from "@/lib/queries";

// Shared by the dashboard and the draft's edit page. deleteDraftJob() itself
// refuses anything that isn't a draft owned by this company, so even a forged
// request can't delete a live role.
export async function deleteDraftAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "company") redirect("/login");
  const id = Number(formData.get("jobId"));
  if (Number.isInteger(id) && id > 0) await deleteDraftJob(id, session.userId);
  revalidatePath("/company/dashboard");
  redirect("/company/dashboard?notice=draft-deleted");
}
