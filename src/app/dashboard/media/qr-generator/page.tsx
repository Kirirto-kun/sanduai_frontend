"use client";

import { useState, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslations } from "../../../../i18n/LanguageContext";

type QRErrorLevel = "L" | "M" | "Q" | "H";

export default function QRGeneratorPage() {
  const t = useTranslations();
  const qr = t.qrGenerator;
  const [text, setText] = useState("");
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [errorLevel, setErrorLevel] = useState<QRErrorLevel>("M");
  const svgRef = useRef<HTMLDivElement>(null);

  const downloadPNG = useCallback(() => {
    const svgElement = svgRef.current?.querySelector("svg");
    if (!svgElement) return;

    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = size * scale;
    canvas.height = size * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const link = document.createElement("a");
      link.download = "qrcode.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url;
  }, [size, bgColor]);

  const downloadSVG = useCallback(() => {
    const svgElement = svgRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const link = document.createElement("a");
    link.download = "qrcode.svg";
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {qr?.title || "QR Code Generator"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {qr?.subtitle || "Create QR codes for links, text, or any information"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Settings panel */}
        <div className="glass-card rounded-2xl border border-white/60 p-6 shadow-sm">
          <div className="space-y-4">
            {/* Text input */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                {qr?.textLabel || "Content"}
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={qr?.textPlaceholder || "Enter a URL, text, or any content..."}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
              />
            </div>

            {/* Size */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                {qr?.sizeLabel || "Size"}: {size}px
              </label>
              <input
                type="range"
                min={128}
                max={512}
                step={32}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-[color:var(--primary)]"
              />
            </div>

            {/* Error correction */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                {qr?.errorCorrectionLabel || "Error correction"}
              </label>
              <div className="flex gap-2">
                {(["L", "M", "Q", "H"] as QRErrorLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setErrorLevel(level)}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      errorLevel === level
                        ? "bg-[color:var(--primary)] text-white shadow"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {qr?.errorCorrectionHint || "H = highest reliability, L = more data capacity"}
              </p>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  {qr?.fgColorLabel || "QR Color"}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded-lg border border-slate-200"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  {qr?.bgColorLabel || "Background"}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded-lg border border-slate-200"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="glass-card flex flex-col items-center rounded-2xl border border-white/60 p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">
            {qr?.previewTitle || "Preview"}
          </h2>

          {text.trim() ? (
            <>
              <div
                ref={svgRef}
                className="flex items-center justify-center rounded-xl bg-white p-4 shadow-inner"
              >
                <QRCodeSVG
                  value={text}
                  size={Math.min(size, 280)}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level={errorLevel}
                />
              </div>

              {/* Download buttons */}
              <div className="mt-6 flex w-full gap-3">
                <button
                  onClick={downloadPNG}
                  className="flex-1 rounded-xl bg-[color:var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
                >
                  {qr?.downloadPNG || "Download PNG"}
                </button>
                <button
                  onClick={downloadSVG}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  {qr?.downloadSVG || "Download SVG"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-64 items-center justify-center text-center">
              <p className="text-sm text-slate-400">
                {qr?.emptyState || "Enter text or URL to generate a QR code"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
