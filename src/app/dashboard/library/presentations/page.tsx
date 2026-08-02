import { redirect } from "next/navigation";

export default function LegacyPresentationsPage() {
  redirect("/dashboard/library/catalog?type=interactive_presentation");
}
