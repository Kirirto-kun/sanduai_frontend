"use client";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  language: "ru" | "kk";
};

type PageToken = number | "ellipsis-left" | "ellipsis-right";

function pageTokens(page: number, totalPages: number): PageToken[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "ellipsis-right", totalPages];
  if (page >= totalPages - 3) {
    return [1, "ellipsis-left", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "ellipsis-left", page - 1, page, page + 1, "ellipsis-right", totalPages];
}

export function Pagination({ page, totalPages, onPageChange, language }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label={language === "kk" ? "Беттер" : "Страницы"} className="flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {language === "kk" ? "Артқа" : "Назад"}
      </button>

      {pageTokens(page, totalPages).map((token) =>
        typeof token === "number" ? (
          <button
            key={token}
            type="button"
            aria-current={token === page ? "page" : undefined}
            aria-label={`${language === "kk" ? "Бет" : "Страница"} ${token}`}
            onClick={() => onPageChange(token)}
            className={`h-10 min-w-10 rounded-xl px-2 text-sm font-semibold transition ${
              token === page
                ? "bg-[color:var(--primary)] text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:text-orange-700"
            }`}
          >
            {token}
          </button>
        ) : (
          <span key={token} aria-hidden="true" className="px-1 text-slate-400">
            …
          </span>
        ),
      )}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {language === "kk" ? "Келесі" : "Далее"}
      </button>
    </nav>
  );
}
