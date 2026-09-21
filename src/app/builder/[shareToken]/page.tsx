import PublicBuilderProject from "@/features/builder/PublicBuilderProject";

export default async function PublicBuilderPage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params;
  return <PublicBuilderProject shareToken={shareToken} />;
}
