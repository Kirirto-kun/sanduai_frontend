"use client";

import { useState } from "react";
import { exportPresentation, downloadExport } from "@/lib/presenton-api";

interface Props {
  presentationId: string;
  open: boolean;
  onClose: () => void;
  t: Record<string, string>;
}

export default function ExportDialog({ presentationId, open, onClose, t }: Props) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleExport = async (format: "pptx" | "pdf") => {
    setExporting(true);
    setError(null);
    try {
      const result = await exportPresentation({
        presentation_id: presentationId,
        export_as: format,
      });

      // Download the file
      const exportPath = result.path;
      if (exportPath) {
        // Extract basename from path
        const basename = exportPath.split("/").pop() || `presentation.${format}`;
        const blob = await downloadExport(basename);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = basename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      onClose();
    } catch (e: any) {
      setError(e?.message || t.error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">{t.export}</h3>
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => handleExport("pptx")}
            disabled={exporting}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {exporting ? t.downloading : t.exportPptx}
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={exporting}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {exporting ? t.downloading : t.exportPdf}
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-3 w-full text-center text-sm text-slate-500 hover:text-slate-700"
        >
          {t.back}
        </button>
      </div>
    </div>
  );
}
