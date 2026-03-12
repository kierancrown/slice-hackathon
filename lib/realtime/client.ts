"use client";

const DEFAULT_ROOM_PREFIX = "session";

function stripProtocol(host: string) {
  return host.replace(/^https?:\/\//, "").replace(/^wss?:\/\//, "").replace(/\/$/, "");
}

export function getPartyHost() {
  return process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "";
}

export function getPartyRoomPrefix() {
  return process.env.NEXT_PUBLIC_PARTYKIT_ROOM_PREFIX ?? DEFAULT_ROOM_PREFIX;
}

export function getPartySocketUrl(sessionCode: string) {
  const host = getPartyHost();
  if (!host) {
    return null;
  }

  const normalizedHost = stripProtocol(host);
  const protocol =
    normalizedHost.startsWith("localhost") || normalizedHost.startsWith("127.0.0.1")
      ? "ws"
      : "wss";

  const roomId = `${getPartyRoomPrefix()}-${sessionCode.toUpperCase()}`;
  return `${protocol}://${normalizedHost}/party/${roomId}`;
}

export function createPartySocket(sessionCode: string) {
  const url = getPartySocketUrl(sessionCode);
  if (!url) {
    return null;
  }

  return new WebSocket(url);
}

export function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

export function buildJoinUrl(sessionCode: string) {
  const appUrl = getAppUrl();
  if (!appUrl) {
    return "";
  }

  return `${appUrl}/join/${sessionCode.toUpperCase()}`;
}

export function buildRemoteUrl(sessionCode: string, presenterSecret: string) {
  const appUrl = getAppUrl();
  if (!appUrl) {
    return "";
  }

  const params = new URLSearchParams({
    token: presenterSecret,
  });

  return `${appUrl}/remote/${sessionCode.toUpperCase()}?${params.toString()}`;
}

export function randomCode(length = 4) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export function randomSecret(length = 24) {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export function getOrCreateStoredValue(key: string, makeValue: () => string) {
  if (typeof window === "undefined") {
    return makeValue();
  }

  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const nextValue = makeValue();
  window.localStorage.setItem(key, nextValue);
  return nextValue;
}
