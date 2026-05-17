"use client";

import { nanoid } from "nanoid";

const KEY = "warehouseiq:session_id";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = `sess_${nanoid(16)}`;
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

export function resetSessionId(): string {
  if (typeof window === "undefined") return "server";
  const id = `sess_${nanoid(16)}`;
  window.localStorage.setItem(KEY, id);
  return id;
}
