/**
 * Category Filter Component
 * Filter dropdown for visual materials categories
 */

import { useState, useRef, useEffect } from "react";
import type { VisualMaterialCategory } from "../lib/api";

interface CategoryFilterProps {
  categories: VisualMaterialCategory[];
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategoryId,
  onCategoryChange,
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span>{selectedCategory ? selectedCategory.name : "Все категории"}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-lg z-10 max-h-80 overflow-y-auto">
          {/* All categories option */}
          <button
            type="button"
            onClick={() => {
              onCategoryChange(null);
              setIsOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-slate-50 ${
              !selectedCategoryId
                ? "font-semibold text-blue-600 bg-blue-50"
                : "text-slate-700"
            }`}
          >
            Все категории
          </button>

          {/* Category options */}
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                onCategoryChange(category.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-slate-50 border-t border-slate-100 ${
                selectedCategoryId === category.id
                  ? "font-semibold text-blue-600 bg-blue-50"
                  : "text-slate-700"
              }`}
            >
              <div className="font-medium">{category.name}</div>
              {category.name_kk && (
                <div className="text-xs text-slate-500 mt-0.5">{category.name_kk}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
