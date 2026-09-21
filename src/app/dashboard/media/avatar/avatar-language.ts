import {
  CONTENT_LANGUAGE_OPTIONS,
} from "../../../../lib/content-languages";
import type { YbyraiLanguage } from "../../../../lib/api";

export type AvatarLanguageOption = {
  value: YbyraiLanguage;
  label: string;
};

export function avatarLanguageOptions(
  interfaceLanguage: "ru" | "kk",
): readonly AvatarLanguageOption[] {
  return [
    { value: "auto", label: interfaceLanguage === "kk" ? "Автоматты" : "Авто" },
    ...CONTENT_LANGUAGE_OPTIONS.map(({ value, label }) => ({
      value,
      label,
    })),
  ];
}
