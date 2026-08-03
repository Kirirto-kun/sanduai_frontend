"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled root application error", {
      digest: error.digest,
      name: error.name,
    });
  }, [error]);

  return (
    <html lang="ru">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background: "radial-gradient(circle at top left, #fff7ed, #fdfbf7 45%, #f5e6d3)",
            color: "#0f172a",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <section
            role="alert"
            style={{
              width: "min(100%, 560px)",
              padding: "40px 28px",
              borderRadius: "28px",
              background: "white",
              textAlign: "center",
              boxShadow: "0 24px 70px rgba(15, 23, 42, 0.14)",
            }}
          >
            <h1 style={{ margin: 0, fontSize: "28px" }}>Сервис временно не ответил</h1>
            <p style={{ margin: "14px 0 0", color: "#475569", lineHeight: 1.6 }}>
              Сіздің аккаунтыңыз бен материалдарыңыз қауіпсіз. Попробуйте ещё раз — ваш
              аккаунт и материалы в безопасности.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "28px",
                border: 0,
                borderRadius: "12px",
                padding: "13px 22px",
                background: "#0f172a",
                color: "white",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Қайта көру · Попробовать снова
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
