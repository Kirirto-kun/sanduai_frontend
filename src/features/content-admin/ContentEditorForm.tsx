"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  createAdminLibrarySubject,
  createAdminLibraryContent,
  updateAdminLibraryContent,
} from "@/features/content-library/api";
import {
  ASSET_ROLE_LABELS,
  CONTENT_LANGUAGE_LABELS,
  MATERIAL_TYPE_CONFIG,
  SEGMENT_LABELS,
  localize,
} from "@/features/content-library/config";
import {
  ASSET_ROLES,
  CONTENT_SEGMENTS,
  MATERIAL_TYPES,
  type ContentAssetRole,
  type ContentCategory,
  type ContentItem,
  type ContentLanguage,
  type ContentMutationInput,
  type ContentSegment,
  type ContentSubject,
  type MaterialType,
} from "@/features/content-library/types";
import {
  SearchableMultiSelect,
  SearchableSelect,
} from "@/features/content-library/components/TaxonomySelect";
import { createCategory } from "@/lib/api";
import { teacherFacingErrorMessage } from "@/lib/teacher-facing-error";
import { SCHOOL_GRADES } from "@/lib/school-grades";
import {
  InlineTaxonomyCreate,
  type TaxonomyCreateInput,
} from "./InlineTaxonomyCreate";

export type ContentEditorSaveMode = "close" | "add-another";

type ContentEditorFormProps = {
  item?: ContentItem | null;
  categories: ContentCategory[];
  categoriesLoading?: boolean;
  subjects: ContentSubject[];
  subjectsLoading?: boolean;
  onSaved: (item: ContentItem, mode: ContentEditorSaveMode) => void | Promise<void>;
  onCancel: () => void;
};

type FilesByRole = Record<ContentAssetRole, File[]>;
type ClearedNewFile = { name: string; role: ContentAssetRole; key: string };

const emptyFiles = (): FilesByRole => ({
  visual: [],
  presentation: [],
  plan: [],
  preview: [],
  attachment: [],
});

function fileExtension(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

export function ContentEditorForm({
  item,
  categories,
  categoriesLoading = false,
  subjects,
  subjectsLoading = false,
  onSaved,
  onCancel,
}: ContentEditorFormProps) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [materialType, setMaterialType] = useState<MaterialType>(item?.material_type ?? "visual_aid");
  const [contentLanguage, setContentLanguage] = useState<ContentLanguage>(item?.language ?? "kk");
  const [subjectId, setSubjectId] = useState<string | null>(item?.subject_option?.id ?? null);
  const [segments, setSegments] = useState<ContentSegment[]>(item?.segments ?? ["school"]);
  const [grades, setGrades] = useState<number[]>(item?.grades ?? []);
  const [categoryIds, setCategoryIds] = useState<string[]>(item?.categories.map((category) => category.id) ?? []);
  const [isPublished, setIsPublished] = useState(item?.is_published ?? item?.is_active ?? true);
  const [filesByRole, setFilesByRole] = useState<FilesByRole>(emptyFiles);
  const [removedAssetIds, setRemovedAssetIds] = useState<string[]>([]);
  const [autoRemovedAssetIds, setAutoRemovedAssetIds] = useState<string[]>([]);
  const [clearedIncompatibleFiles, setClearedIncompatibleFiles] = useState<ClearedNewFile[]>([]);
  const [assetOrder, setAssetOrder] = useState<string[]>(
    () =>
      [...(item?.assets ?? [])]
        .filter((asset) => asset.role === "visual")
        .sort((left, right) => left.sort_order - right.sort_order)
        .map((asset) => asset.id),
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fileInputBatch, setFileInputBatch] = useState(0);
  const [recentSavedTitle, setRecentSavedTitle] = useState<string | null>(null);
  const [subjectCreatePending, setSubjectCreatePending] = useState(false);
  const [categoryCreatePending, setCategoryCreatePending] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const subjectCreatePendingRef = useRef(false);
  const categoryCreatePendingRef = useRef(false);
  const taxonomyCreationPending = subjectCreatePending || categoryCreatePending;

  const handleSubjectCreatePending = (pending: boolean) => {
    subjectCreatePendingRef.current = pending;
    setSubjectCreatePending(pending);
  };

  const handleCategoryCreatePending = (pending: boolean) => {
    categoryCreatePendingRef.current = pending;
    setCategoryCreatePending(pending);
  };

  const inferredSubjectId = (() => {
    if (subjectId !== null) return subjectId;
    if (!item?.subject || subjects.length === 0) return "";
    const currentSubject = item.subject.trim().toLocaleLowerCase();
    const matching = subjects.find((subject) =>
      [subject.name, subject.name_kk ?? "", subject.slug]
        .some((value) => value.trim().toLocaleLowerCase() === currentSubject),
    );
    return matching?.id ?? "";
  })();

  const config = MATERIAL_TYPE_CONFIG[materialType];
  const visibleRoles = new Set(config.assets.map((rule) => rule.role));
  const selectedFiles = useMemo(
    () => {
      const roles = new Set(MATERIAL_TYPE_CONFIG[materialType].assets.map((rule) => rule.role));
      return ASSET_ROLES
        .filter((role) => roles.has(role))
        .flatMap((role) => filesByRole[role].map((file) => ({ file, role })));
    },
    [filesByRole, materialType],
  );

  const mutation = useMutation({
    mutationFn: ({ input }: { input: ContentMutationInput; mode: ContentEditorSaveMode }) =>
      item ? updateAdminLibraryContent(item.id, input) : createAdminLibraryContent(input),
    onSuccess: async (savedItem, variables) => {
      if (variables.mode === "add-another") {
        setTitle("");
        setDescription("");
        setFilesByRole(emptyFiles());
        setRemovedAssetIds([]);
        setAutoRemovedAssetIds([]);
        setClearedIncompatibleFiles([]);
        setAssetOrder([]);
        setValidationErrors([]);
        setFileInputBatch((current) => current + 1);
        setRecentSavedTitle(savedItem.title);
        window.setTimeout(() => titleInputRef.current?.focus(), 0);
      }
      await onSaved(savedItem, variables.mode);
    },
  });

  const createSubjectOption = async (input: TaxonomyCreateInput): Promise<ContentSubject> => {
    const created = await createAdminLibrarySubject(input);
    queryClient.setQueryData<ContentSubject[]>(["library-content-subjects"], (current = []) => {
      if (current.some((option) => option.id === created.id)) return current;
      return [...current, created];
    });
    void queryClient.invalidateQueries({ queryKey: ["library-content-subjects"] });
    return created;
  };

  const createCategoryOption = async (input: TaxonomyCreateInput): Promise<ContentCategory> => {
    const created = await createCategory(input);
    queryClient.setQueryData<ContentCategory[]>(["library-content-categories"], (current = []) => {
      if (current.some((option) => option.id === created.id)) return current;
      return [...current, created];
    });
    void queryClient.invalidateQueries({ queryKey: ["library-content-categories"] });
    return created;
  };

  const toggleSegment = (segment: ContentSegment) => {
    setSegments((current) => {
      const next = current.includes(segment)
        ? current.filter((value) => value !== segment)
        : [...current, segment];
      if (!next.includes("school")) setGrades([]);
      return next;
    });
  };

  const toggleGrade = (grade: number) => {
    setGrades((current) =>
      current.includes(grade) ? current.filter((value) => value !== grade) : [...current, grade].sort((a, b) => a - b),
    );
  };

  const changeMaterialType = (nextType: MaterialType) => {
    if (nextType === materialType) return;
    const compatibleRoles = new Set(MATERIAL_TYPE_CONFIG[nextType].assets.map((rule) => rule.role));
    const newlyIncompatibleIds = (item?.assets ?? [])
      .filter((asset) => !compatibleRoles.has(asset.role) && !removedAssetIds.includes(asset.id))
      .map((asset) => asset.id);

    if (newlyIncompatibleIds.length > 0) {
      setRemovedAssetIds((current) => Array.from(new Set([...current, ...newlyIncompatibleIds])));
      setAutoRemovedAssetIds((current) => Array.from(new Set([...current, ...newlyIncompatibleIds])));
    }
    const incompatibleNewFiles = ASSET_ROLES.flatMap((role) =>
      compatibleRoles.has(role)
        ? []
        : filesByRole[role].map((file) => ({
            name: file.name,
            role,
            key: `${role}-${file.name}-${file.lastModified}`,
          })),
    );
    setClearedIncompatibleFiles(incompatibleNewFiles);
    setFilesByRole((current) => {
      const next = emptyFiles();
      ASSET_ROLES.forEach((role) => {
        next[role] = compatibleRoles.has(role) ? current[role] : [];
      });
      return next;
    });
    setValidationErrors([]);
    setMaterialType(nextType);
  };

  const toggleExistingAsset = (assetId: string) => {
    const restoring = removedAssetIds.includes(assetId);
    setRemovedAssetIds((current) =>
      current.includes(assetId)
        ? current.filter((value) => value !== assetId)
        : [...current, assetId],
    );
    if (restoring) {
      setAutoRemovedAssetIds((current) => current.filter((value) => value !== assetId));
    }
  };

  const moveExistingAsset = (assetId: string, direction: -1 | 1) => {
    setAssetOrder((current) => {
      const index = current.indexOf(assetId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const validate = (): string[] => {
    const errors: string[] = [];
    if (!title.trim()) errors.push(language === "kk" ? "Тақырыпты енгізіңіз." : "Укажите тему.");
    if (title.trim().length > 255) errors.push(language === "kk" ? "Тақырып 255 таңбадан аспауы керек." : "Тема не должна превышать 255 символов.");
    if (segments.length === 0) errors.push(language === "kk" ? "Кемінде бір бөлімді таңдаңыз." : "Выберите хотя бы один раздел.");
    if (isPublished && materialType !== "event" && segments.includes("library")) {
      errors.push(
        language === "kk"
          ? "Кітапхана бөлімі тек іс-шараларға қолжетімді."
          : "Раздел «Библиотека» доступен только для мероприятий.",
      );
    }
    if (isPublished && !segments.includes("school") && grades.length > 0) {
      errors.push(
        language === "kk"
          ? "Мектеп бөлімінде көрсетілмейтін материалда сыныптар болмауы керек."
          : "У материала вне раздела «Школа» не должно быть классов.",
      );
    }
    if (isPublished && segments.includes("school") && grades.length === 0) {
      errors.push(
        language === "kk"
          ? "Мектеп материалы үшін кемінде бір сыныпты таңдаңыз."
          : "Для школьного материала выберите хотя бы один класс.",
      );
    }
    if (isPublished && segments.includes("school") && !inferredSubjectId) {
      errors.push(
        language === "kk"
          ? "Мектеп материалы үшін пәнді таңдаңыз."
          : "Для школьного материала выберите предмет.",
      );
    }

    config.assets.forEach((rule) => {
      const listedAssets = item?.assets ?? [];
      const listedCount = listedAssets.filter(
        (asset) => asset.role === rule.role && !removedAssetIds.includes(asset.id),
      ).length;
      const existingCount = listedAssets.length > 0
        ? listedCount
        : Math.max(0, (item?.asset_counts?.[rule.role] ?? 0) - removedAssetIds.length);
      const newFiles = filesByRole[rule.role];
      if (isPublished && rule.required && existingCount + newFiles.length === 0) {
        errors.push(`${localize(rule.label, language)}: ${language === "kk" ? "міндетті файл" : "обязательный файл"}.`);
      }
      newFiles.forEach((file) => {
        if (!rule.extensions.includes(fileExtension(file))) {
          errors.push(`${file.name}: ${language === "kk" ? "файл түрі қолдау көрсетілмейді" : "неподдерживаемый тип файла"}.`);
        }
        if (file.size > rule.maxBytes) {
          errors.push(`${file.name}: ${language === "kk" ? "файл тым үлкен" : "файл слишком большой"}.`);
        }
      });
    });

    const totalBytes = selectedFiles.reduce((sum, entry) => sum + entry.file.size, 0);
    if (selectedFiles.length > 20) {
      errors.push(language === "kk" ? "Бір ретте 20 файлдан артық жүктеуге болмайды." : "За один раз можно загрузить не более 20 файлов.");
    }
    if (totalBytes > 250 * 1024 * 1024) {
      errors.push(language === "kk" ? "Файлдардың жалпы көлемі 250 МБ-тан аспауы керек." : "Общий размер новых файлов не должен превышать 250 МБ.");
    }
    return errors;
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending || subjectCreatePendingRef.current || categoryCreatePendingRef.current) return;
    const errors = validate();
    setValidationErrors(errors);
    if (errors.length > 0) return;

    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const mode: ContentEditorSaveMode = !item && submitter instanceof HTMLButtonElement && submitter.value === "add-another"
      ? "add-another"
      : "close";
    mutation.mutate({
      mode,
      input: {
        title,
        materialType,
        language: contentLanguage,
        description,
        subjectId: inferredSubjectId || null,
        segments,
        grades,
        categoryIds,
        files: selectedFiles.filter(({ role }) => visibleRoles.has(role)),
        removeAssetIds: item ? removedAssetIds : undefined,
        assetOrder: item
          ? assetOrder.filter((assetId) => !removedAssetIds.includes(assetId))
          : undefined,
        isPublished,
        needsTaxonomy: item?.needs_taxonomy && isPublished ? false : undefined,
      },
    });
  };

  const automaticallyRemovedAssets = (item?.assets ?? [])
    .filter((asset) => autoRemovedAssetIds.includes(asset.id));

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          {item
            ? language === "kk" ? "Материалды өңдеу" : "Редактирование материала"
            : language === "kk" ? "Жаңа материал" : "Новый материал"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {language === "kk"
            ? "Материал түрін таңдаңыз — міндетті файлдар автоматты түрде көрсетіледі."
            : "Выберите тип — форма сама покажет обязательные файлы."}
        </p>
      </div>

      {item?.needs_taxonomy && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">{language === "kk" ? "Материалды толықтыру керек" : "Материал нужно дополнить"}</p>
          <p className="mt-1 text-xs">
            {language === "kk"
              ? "Бөлімдерді, сыныпты және міндетті файлдарды тексеріңіз. Сақтағаннан кейін белгі алынады."
              : "Проверьте разделы, класс и обязательные файлы. После сохранения отметка будет снята."}
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">
            {language === "kk" ? "Тақырыбы" : "Тема"} <span className="text-red-600">*</span>
          </span>
          <input
            ref={titleInputRef}
            type="text"
            required
            maxLength={255}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
          <span className="mt-1 block text-right text-[11px] text-slate-400">{title.length}/255</span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">{language === "kk" ? "Материал түрі" : "Тип материала"}</span>
          <select
            value={materialType}
            disabled={taxonomyCreationPending}
            onChange={(event) => {
              if (subjectCreatePendingRef.current || categoryCreatePendingRef.current) return;
              const nextType = event.target.value as MaterialType;
              changeMaterialType(nextType);
              if (nextType !== "event") {
                setSegments((current) => {
                  const next = current.filter((segment) => segment !== "library");
                  return next.length > 0 ? next : ["school"];
                });
              }
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-400 disabled:cursor-wait disabled:bg-slate-50 disabled:text-slate-400"
          >
            {MATERIAL_TYPES.map((type) => (
              <option key={type} value={type}>{localize(MATERIAL_TYPE_CONFIG[type].label, language)}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">{language === "kk" ? "Материал тілі" : "Язык материала"}</span>
          <select
            value={contentLanguage}
            onChange={(event) => setContentLanguage(event.target.value as ContentLanguage)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-400"
          >
            {(["kk", "ru", "both"] as ContentLanguage[]).map((value) => (
              <option key={value} value={value}>{localize(CONTENT_LANGUAGE_LABELS[value], language)}</option>
            ))}
          </select>
        </label>

        <div className="space-y-2">
          <SearchableSelect
            label={`${language === "kk" ? "Пән" : "Предмет"}${segments.includes("school") ? " *" : ""}`}
            labelClassName="mb-1.5 block text-sm font-semibold text-slate-700"
            options={subjects}
            value={inferredSubjectId || undefined}
            onChange={(value) => setSubjectId(value ?? "")}
            language={language}
            loading={subjectsLoading}
            disabled={taxonomyCreationPending}
            placeholder={language === "kk" ? "Пән таңдалмаған" : "Предмет не выбран"}
            clearLabel={language === "kk" ? "Пәнсіз" : "Без предмета"}
            searchPlaceholder={language === "kk" ? "Пәнді іздеу…" : "Найти предмет…"}
          />
          {!item && (
            <InlineTaxonomyCreate
              kind="subject"
              language={language}
              onCreate={createSubjectOption}
              onCreated={(created) => setSubjectId(created.id)}
              disabled={categoryCreatePending}
              onPendingChange={handleSubjectCreatePending}
              onConflict={() => queryClient.invalidateQueries({
                queryKey: ["library-content-subjects"],
                refetchType: "active",
              })}
            />
          )}
        </div>

        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-sm font-semibold text-slate-700">{language === "kk" ? "Сипаттама" : "Описание"}</span>
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-slate-700">
          {language === "kk" ? "Қай бөлімдерде көрсету керек?" : "В каких разделах показывать?"} <span className="text-red-600">*</span>
        </legend>
        <p className="mt-1 text-xs text-slate-500">
          {language === "kk" ? "Бір материалды бірнеше бөлімде бірден көрсетуге болады." : "Один материал можно сразу показать в нескольких разделах."}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {CONTENT_SEGMENTS.map((segment) => {
            const disabled =
              segment === "library" &&
              materialType !== "event" &&
              !segments.includes(segment);
            return (
              <label key={segment} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${disabled ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400" : "cursor-pointer"} ${segments.includes(segment) ? "border-emerald-400 bg-emerald-50 text-emerald-800" : disabled ? "" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
                <input type="checkbox" disabled={disabled} checked={segments.includes(segment)} onChange={() => toggleSegment(segment)} className="h-4 w-4 accent-emerald-600" />
                {localize(SEGMENT_LABELS[segment], language)}
              </label>
            );
          })}
        </div>
        {materialType !== "event" && (
          <p className="mt-2 text-xs text-slate-500">
            {language === "kk"
              ? "Кітапхана бөлімі тек іс-шара материалдары үшін ашық."
              : "В библиотеке можно размещать только материалы мероприятий."}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-slate-700">
          {language === "kk" ? "Сыныптар" : "Классы"}
          {segments.includes("school") && <span className="text-red-600"> *</span>}
        </legend>
        <p className="mt-1 text-xs text-slate-500">
          {segments.includes("school")
            ? language === "kk" ? "Материал көрсетілетін бір немесе бірнеше сыныпты таңдаңыз." : "Выберите один или несколько классов, для которых предназначен материал."
            : language === "kk" ? "Сыныпты таңдау тек мектеп бөлімі үшін қажет." : "Класс нужно выбирать только для раздела «Школа»."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SCHOOL_GRADES.map((grade) => (
            <label key={grade} className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${!segments.includes("school") ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400" : grades.includes(grade) ? "cursor-pointer border-orange-400 bg-orange-50 text-orange-800" : "cursor-pointer border-slate-200 bg-white text-slate-600"}`}>
              <input type="checkbox" disabled={!segments.includes("school")} checked={grades.includes(grade)} onChange={() => toggleGrade(grade)} className="h-3.5 w-3.5 accent-orange-600" />
              {grade}
            </label>
          ))}
        </div>
      </fieldset>

      <section aria-label={language === "kk" ? "Материал санаттары" : "Категории материала"}>
        <SearchableMultiSelect
          label={language === "kk" ? "Санаттар" : "Категории"}
          options={categories}
          values={categoryIds}
          onChange={setCategoryIds}
          language={language}
          loading={categoriesLoading}
          disabled={taxonomyCreationPending}
          placeholder={language === "kk" ? "Санаттарды таңдау" : "Выбрать категории"}
          searchPlaceholder={language === "kk" ? "Санатты іздеу…" : "Найти категорию…"}
        />
        {!item && (
          <div className="mt-2">
            <InlineTaxonomyCreate
              kind="category"
              language={language}
              onCreate={createCategoryOption}
              onCreated={(created) => {
                setCategoryIds((current) => current.includes(created.id) ? current : [...current, created.id]);
              }}
              disabled={subjectCreatePending}
              onPendingChange={handleCategoryCreatePending}
              onConflict={() => queryClient.invalidateQueries({
                queryKey: ["library-content-categories"],
                refetchType: "active",
              })}
            />
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            {categories.length === 0 && !categoriesLoading
              ? language === "kk" ? "Санаттар әлі жасалмаған." : "Категории пока не созданы."
              : language === "kk" ? "Бір материалға бірнеше санат таңдауға болады." : "Для материала можно выбрать несколько категорий."}
          </span>
          <Link
            href="/dashboard/admin/library/taxonomy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-orange-700 underline-offset-4 hover:underline"
          >
            {language === "kk" ? "Санаттар мен пәндерді басқару" : "Управлять категориями и предметами"}
            <span className="sr-only"> {language === "kk" ? "жаңа қойындыда" : "в новой вкладке"}</span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="content-files-heading">
        <h3 id="content-files-heading" className="text-base font-semibold text-slate-900">{language === "kk" ? "Файлдар" : "Файлы"}</h3>
        <p className="mt-1 text-xs text-slate-500">
          {language === "kk" ? "Файл кеңейтімі клиентте тексеріледі, ал соңғы қауіпсіздік тексеруін сервер орындайды." : "Расширение проверяется здесь для удобства; окончательную проверку типа и безопасности выполняет сервер."}
        </p>
        {clearedIncompatibleFiles.length > 0 && (
          <div role="status" className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <div>
              <p className="font-semibold">
                {language === "kk"
                  ? "Жаңа таңдалған сәйкес емес файлдар тізімнен алынды:"
                  : "Новые несовместимые файлы удалены из выбора:"}
              </p>
              <ul className="mt-1 max-h-24 list-disc space-y-1 overflow-y-auto pl-5 text-xs">
                {clearedIncompatibleFiles.map((file) => (
                  <li key={file.key}>{file.name} · {localize(ASSET_ROLE_LABELS[file.role], language)}</li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-blue-700">
                {language === "kk"
                  ? "Оларды пайдалану үшін сәйкес материал түрін таңдап, қайта жүктеңіз."
                  : "Чтобы использовать их, выберите совместимый тип материала и загрузите файлы заново."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setClearedIncompatibleFiles([])}
              aria-label={language === "kk" ? "Хабарламаны жабу" : "Закрыть уведомление"}
              className="shrink-0 rounded p-1 text-blue-500 hover:bg-blue-100 hover:text-blue-800"
            >
              ×
            </button>
          </div>
        )}
        {automaticallyRemovedAssets.length > 0 && (
          <div role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">
              {language === "kk"
                ? "Материал түрі өзгергенде сәйкес келмейтін сақталған файлдар жоюға белгіленді:"
                : "После смены типа несовместимые сохранённые файлы отмечены для удаления:"}
            </p>
            <ul className="mt-2 max-h-28 list-disc space-y-1 overflow-y-auto pl-5 text-xs">
              {automaticallyRemovedAssets.map((asset) => (
                <li key={asset.id}>
                  {asset.original_filename} · {localize(ASSET_ROLE_LABELS[asset.role], language)}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-amber-800">
              {language === "kk"
                ? "«Қайтару» батырмасы тек осы файл рөлін қолдайтын материал түрінде қолжетімді."
                : "Кнопка «Вернуть» доступна только для типа материала, который поддерживает роль этого файла."}
            </p>
          </div>
        )}
        {item && (item.assets?.length ?? 0) > 0 && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-800">
              {language === "kk" ? "Сақталған файлдар" : "Загруженные файлы"}
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              {language === "kk"
                ? "Қажет емес файлдарды алып тастаңыз. Көрнекіліктердің ретін көрсеткілермен өзгертуге болады."
                : "Отметьте ненужные файлы для удаления. Порядок наглядных материалов можно менять стрелками."}
            </p>
            <ul className="mt-3 divide-y divide-slate-100">
              {[...(item.assets ?? [])]
                .sort((left, right) => {
                  const leftIndex = assetOrder.indexOf(left.id);
                  const rightIndex = assetOrder.indexOf(right.id);
                  if (leftIndex >= 0 && rightIndex >= 0) return leftIndex - rightIndex;
                  return left.sort_order - right.sort_order;
                })
                .map((asset) => {
                  const removed = removedAssetIds.includes(asset.id);
                  const incompatibleWithCurrentType = !visibleRoles.has(asset.role);
                  const orderIndex = assetOrder.indexOf(asset.id);
                  const reorderable = asset.role === "visual";
                  return (
                    <li key={asset.id} className={`flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between ${removed ? "opacity-55" : ""}`}>
                      <div className="min-w-0">
                        <p className={`truncate text-sm font-medium text-slate-800 ${removed ? "line-through" : ""}`} title={asset.original_filename}>
                          {asset.original_filename}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {localize(ASSET_ROLE_LABELS[asset.role], language)} · {(asset.file_size / 1024 / 1024).toFixed(asset.file_size >= 10 * 1024 * 1024 ? 0 : 1)} МБ
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {reorderable && !removed && (
                          <>
                            <button
                              type="button"
                              disabled={orderIndex <= 0}
                              aria-label={language === "kk" ? `${asset.original_filename}: жоғары жылжыту` : `${asset.original_filename}: переместить выше`}
                              onClick={() => moveExistingAsset(asset.id, -1)}
                              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={orderIndex < 0 || orderIndex >= assetOrder.length - 1}
                              aria-label={language === "kk" ? `${asset.original_filename}: төмен жылжыту` : `${asset.original_filename}: переместить ниже`}
                              onClick={() => moveExistingAsset(asset.id, 1)}
                              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              ↓
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          disabled={removed && incompatibleWithCurrentType}
                          onClick={() => toggleExistingAsset(asset.id)}
                          title={removed && incompatibleWithCurrentType
                            ? language === "kk" ? "Бұл файл рөлі ағымдағы материал түрінде қолдау көрсетілмейді" : "Роль файла не поддерживается текущим типом материала"
                            : undefined}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${removed ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-red-50 text-red-700 hover:bg-red-100"}`}
                        >
                          {removed && incompatibleWithCurrentType
                            ? language === "kk" ? "Сәйкес емес" : "Несовместим"
                            : removed
                            ? language === "kk" ? "Қайтару" : "Вернуть"
                            : language === "kk" ? "Алып тастау" : "Удалить"}
                        </button>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        )}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {config.assets.map((rule) => {
            const existingCount = item?.asset_counts?.[rule.role] ?? 0;
            return (
              <label key={rule.role} className="block rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800">
                  <span>{localize(rule.label, language)} {rule.required && <span className="text-red-600">*</span>}</span>
                  {existingCount > 0 && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] text-emerald-700">{language === "kk" ? "Сақталған" : "Загружено"}: {existingCount}</span>}
                </span>
                <span id={`file-hint-${rule.role}`} className="mt-1 block text-xs leading-relaxed text-slate-500">{localize(rule.hint, language)}</span>
                <input
                  key={`${rule.role}-${fileInputBatch}`}
                  type="file"
                  accept={rule.accept}
                  multiple={rule.multiple}
                  aria-describedby={`file-hint-${rule.role}`}
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    setFilesByRole((current) => ({ ...current, [rule.role]: files }));
                  }}
                  className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-orange-700 file:shadow-sm hover:file:bg-orange-50"
                />
                {filesByRole[rule.role].length > 0 && (
                  <ul className="mt-2 space-y-1 text-[11px] text-slate-600">
                    {filesByRole[rule.role].map((file) => <li key={`${file.name}-${file.lastModified}`} className="truncate">• {file.name}</li>)}
                  </ul>
                )}
              </label>
            );
          })}
        </div>
        {item && (
          <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">
            {language === "kk" ? "Жаңа көрнекіліктер бұрынғыларына қосылады. Жоспар, презентация немесе мұқаба жүктелсе, сол рөлдегі ескі файлды ауыстырады." : "Новые наглядные материалы добавятся к прежним. Новый план, презентация или обложка заменят старый файл той же роли."}
          </p>
        )}
      </section>

      <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${isPublished ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(event) => setIsPublished(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
        />
        <span>
          <span className="block text-sm font-semibold text-slate-800">
            {language === "kk" ? "Сақтағаннан кейін жариялау" : "Опубликовать после сохранения"}
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-slate-600">
            {isPublished
              ? language === "kk"
                ? "Материал барлық міндетті өрістер мен файлдар тексерілгеннен кейін пайдаланушыларға көрінеді."
                : "Материал станет виден пользователям только после проверки всех обязательных полей и файлов."
              : language === "kk"
                ? "Материал жоба ретінде сақталады және каталогта көрсетілмейді."
                : "Материал останется черновиком и не появится в каталоге."}
          </span>
        </span>
      </label>

      {validationErrors.length > 0 && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">{language === "kk" ? "Форманы тексеріңіз:" : "Проверьте форму:"}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">{validationErrors.map((error) => <li key={error}>{error}</li>)}</ul>
        </div>
      )}

      {mutation.isError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {teacherFacingErrorMessage(mutation.error, language, {
            fallback: language === "kk" ? "Материалды сақтау мүмкін болмады." : "Не удалось сохранить материал.",
          })}
        </div>
      )}

      {recentSavedTitle && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {language === "kk"
            ? `«${recentSavedTitle}» сақталды. Келесі материалдың тақырыбы мен файлдарын енгізіңіз.`
            : `«${recentSavedTitle}» сохранён. Введите тему и файлы следующего материала.`}
        </div>
      )}

      {taxonomyCreationPending && (
        <div role="status" aria-live="polite" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {language === "kk"
            ? `${subjectCreatePending ? "Пән" : "Санат"} жасалуда. Аяқталғанша материал формасын жабуға немесе сақтауға болмайды.`
            : `${subjectCreatePending ? "Предмет" : "Категория"} создаётся. Дождитесь завершения, прежде чем сохранять или закрывать материал.`}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={mutation.isPending || taxonomyCreationPending}
          onClick={() => {
            if (!subjectCreatePendingRef.current && !categoryCreatePendingRef.current) onCancel();
          }}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
        >
          {language === "kk" ? "Бас тарту" : "Отмена"}
        </button>
        {!item && (
          <button
            type="submit"
            name="save_action"
            value="add-another"
            disabled={mutation.isPending || taxonomyCreationPending}
            className="rounded-xl border border-orange-300 bg-orange-50 px-5 py-2.5 text-sm font-semibold text-orange-800 transition hover:bg-orange-100 disabled:cursor-wait disabled:opacity-60"
          >
            {taxonomyCreationPending
              ? language === "kk" ? "Анықтамалық жаңартылуда…" : "Обновляется справочник…"
              : mutation.isPending
              ? language === "kk" ? "Сақталуда…" : "Сохранение…"
              : language === "kk" ? "Сақтау және тағы қосу" : "Сохранить и добавить ещё"}
          </button>
        )}
        <button type="submit" name="save_action" value="close" disabled={mutation.isPending || taxonomyCreationPending} className="rounded-xl bg-[color:var(--primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60">
          {taxonomyCreationPending
            ? language === "kk" ? "Анықтамалық жаңартылуда…" : "Обновляется справочник…"
            : mutation.isPending
            ? language === "kk" ? "Сақталуда…" : "Сохранение…"
            : item
              ? language === "kk" ? "Өзгерістерді сақтау" : "Сохранить изменения"
              : language === "kk" ? "Материалды сақтау" : "Сохранить материал"}
        </button>
      </div>
    </form>
  );
}
