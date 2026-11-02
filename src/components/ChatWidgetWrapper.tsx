"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { ChatWidget } from "./ChatWidget";

/**
 * Показывает ChatWidget только для авторизованных пользователей.
 * Скрыт в Sandu Bot, видеостудии и конструкторе тренингов,
 * где перекрывал элементы редактора и поля на узком экране.
 */
export function ChatWidgetWrapper() {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (
    !isAuthenticated ||
    pathname === "/dashboard/sandubot" ||
    pathname === "/dashboard/media/video" ||
    pathname === "/dashboard/ai/trainings"
  )
    return null;

  return <ChatWidget />;
}
