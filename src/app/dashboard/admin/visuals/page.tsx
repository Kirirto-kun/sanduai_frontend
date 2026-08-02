import { redirect } from "next/navigation";

export default function LegacyVisualsAdminPage() {
  redirect("/dashboard/admin/library");
}
