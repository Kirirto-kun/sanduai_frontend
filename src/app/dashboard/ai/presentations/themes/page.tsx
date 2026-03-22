"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "@/i18n/LanguageContext";
import {
  useThemes,
  useCreateTheme,
  useDeleteTheme,
  useGenerateThemeColors,
} from "@/hooks/usePresentations";

export default function ThemesPage() {
  const t = useTranslations().aiPresentations;
  const { data: themes, isLoading } = useThemes();
  const createMutation = useCreateTheme();
  const deleteMutation = useDeleteTheme();
  const generateMutation = useGenerateThemeColors();

  const [name, setName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#4f46e5");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setError(null);
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        primary_color: primaryColor,
      });
      setName("");
    } catch (e: any) {
      setError(e?.message || t.error);
    }
  };

  const handleGenerate = async () => {
    setError(null);
    try {
      const colors = await generateMutation.mutateAsync({
        primary_color: primaryColor,
      });
      // Show generated colors (could be used in a more complex UI)
      alert(JSON.stringify(colors, null, 2));
    } catch (e: any) {
      setError(e?.message || t.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-3xl border border-white/60 px-6 py-8 shadow-md sm:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{t.themes}</h2>
          </div>
          <Link
            href="/dashboard/ai/presentations"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            {t.backToList}
          </Link>
        </div>
      </div>

      {/* Create theme form */}
      <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">{t.createTheme}</h3>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600">{t.themeName}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-slate-600">{t.primaryColor}</label>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="mt-1 h-10 w-full cursor-pointer rounded-xl border border-slate-200"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending || !name.trim()}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {t.createTheme}
          </button>
          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="rounded-xl border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {t.generateColors}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      </div>

      {/* Theme list */}
      <div className="glass-card rounded-3xl border border-white/60 px-6 py-6 shadow-md sm:px-8">
        {isLoading ? (
          <p className="text-sm text-slate-500">{t.loading}</p>
        ) : !themes || themes.length === 0 ? (
          <p className="text-sm text-slate-500">No themes yet</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {themes.map((theme) => (
              <div
                key={theme.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/60 p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-full border border-slate-200"
                    style={{ backgroundColor: theme.colors?.primary || "#4f46e5" }}
                  />
                  <span className="text-sm font-medium text-slate-800">
                    {theme.name || "Untitled"}
                  </span>
                </div>
                <button
                  onClick={() => theme.id && deleteMutation.mutate(theme.id)}
                  disabled={deleteMutation.isPending}
                  className="text-xs text-rose-500 hover:text-rose-700"
                >
                  {t.delete}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
