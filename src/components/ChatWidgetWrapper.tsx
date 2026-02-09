"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { ChatWidget } from "./ChatWidget";

/**
 * Показывает ChatWidget только для авторизованных пользователей.
 * Скрыт на странице Sandu Bot (чтобы не дублировать).
 */
export function ChatWidgetWrapper() {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated || pathname === "/dashboard/sandubot") return null;

  return <ChatWidget />;
}
