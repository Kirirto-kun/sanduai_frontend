"use client";

import { useState } from "react";
import { PresentationEditorProvider } from "@/contexts/PresentationEditorContext";
import type { Slide } from "@/types/presenton";
import SlidePanel from "./SlidePanel";
import SlideCanvas from "./SlideCanvas";
import SlideToolbar from "./SlideToolbar";
import AiEditPanel from "./AiEditPanel";
import ExportDialog from "./ExportDialog";

interface Props {
  presentationId: string;
  slides: Slide[];
  t: Record<string, string>;
}

export default function EditorShell({ presentationId, slides, t }: Props) {
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <PresentationEditorProvider
      presentationId={presentationId}
      initialSlides={slides}
    >
      <div className="flex h-[calc(100vh-8rem)] flex-col rounded-2xl border border-white/60 bg-white/30 shadow-sm">
        <SlideToolbar
          onExport={() => setExportOpen(true)}
          exporting={false}
          t={t}
        />

        <div className="flex flex-1 overflow-hidden">
          <SlidePanel t={t} />

          <div className="flex flex-1 flex-col">
            <SlideCanvas t={t} />
            <AiEditPanel t={t} />
          </div>
        </div>
      </div>

      <ExportDialog
        presentationId={presentationId}
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        t={t}
      />
    </PresentationEditorProvider>
  );
}
