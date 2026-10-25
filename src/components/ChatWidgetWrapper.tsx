"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { ChatWidget } from "./ChatWidget";

/**
 * Показывает ChatWidget только для авторизованных пользователей.
 * Скрыт в Sandu Bot и видеостудии, где перекрывал элементы редактора.
 */
export function ChatWidgetWrapper() {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (
    !isAuthenticated ||
    pathname === "/dashboard/sandubot" ||
    pathname === "/dashboard/media/video"
  )
    return null;

  return <ChatWidget />;
}
