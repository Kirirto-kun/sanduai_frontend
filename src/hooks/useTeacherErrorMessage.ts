"use client";

import { useCallback } from "react";

import { useLanguage } from "@/i18n/LanguageContext";
import {
  teacherFacingErrorMessage,
  type TeacherFacingErrorOptions,
} from "@/lib/teacher-facing-error";

export function useTeacherErrorMessage() {
  const { language } = useLanguage();

  return useCallback(
    (error: unknown, fallback?: string, options: Omit<TeacherFacingErrorOptions, "fallback"> = {}) =>
      teacherFacingErrorMessage(error, language, { ...options, fallback }),
    [language],
  );
}
