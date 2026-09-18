// services/api.ts
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/config/api";

import { router } from "expo-router";

import { FormSchema } from "@/lib/schema/formSchema";
import { TimerRunnerSchema } from "@/lib/schema/timerRunnerSchema";
import { PatchChronoSchema } from "@/lib/schema/patchChronoSchema";
import { PausedChronoSchema } from "@/lib/schema/pausedSchema";
import { EndedPausedSchema } from "@/lib/schema/endedSchema";
import { RegisterSchema } from "@/lib/schema/formRegister";
import { LoginSchema } from "@/lib/schema/formLogin";

import { TimerRunner } from "@/types/api";
import { TimerPause } from "@/types/api";
import { SeanceResponse } from "@/types/api";
import { HttpError, NetworkError } from "@/lib/errors";
import { UserRegister } from "@/types/api";
import { UserLogin } from "@/types/api";

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const token = await SecureStore.getItemAsync("accessToken");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const isAuthEndpoint = endpoint.startsWith("/api/auth/");

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  } catch (err) {
    console.error(err);
    throw new NetworkError("Pas de connexion réseau");
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401 && !isAuthEndpoint) {
    await SecureStore.deleteItemAsync("accessToken");
    router.replace("/(auth)/login");
    throw new HttpError(401, { message: "Session expirée" });
  }

  if (!response.ok) throw new HttpError(response.status, await response.json());

  return response.json();
}
// Register ==================================

export function postRegister(data: RegisterSchema) {
  return apiFetch<UserRegister>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Login ======================================

export function postLogin(data: LoginSchema) {
  return apiFetch<UserLogin>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Seance ====================================

export function postSeance(data: FormSchema) {
  return apiFetch<SeanceResponse>("/api/seance", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getSeanceId(id: string) {
  return apiFetch<SeanceResponse>(`/api/seance/${id}`, {
    method: "GET",
  });
}

export function patchSeance(data: PatchChronoSchema, id: string) {
  return apiFetch<SeanceResponse>(`/api/seance/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function getSeance() {
  return apiFetch<SeanceResponse[]>("/api/seance", {
    method: "GET",
  });
}

export function deleteManySeance() {
  return apiFetch("/api/seance", {
    method: "DELETE",
  });
}

// TimerRunner ===========================================

export function postTimerRunner(data: TimerRunnerSchema) {
  return apiFetch<TimerRunner>("/api/timerrunner", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteAllTimerRunner(id: string) {
  return apiFetch<TimerRunner[]>(`/api/timerrunner/byseance/${id}`, {
    method: "DELETE",
  });
}

// TimerPause ============================================

export function postTimerPause(data: PausedChronoSchema) {
  return apiFetch<TimerPause>(`/api/timerpause`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function patchTimerPause(data: EndedPausedSchema, id: string) {
  return apiFetch<TimerPause>(`/api/timerpause/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteTimerPause(id: string) {
  return apiFetch<TimerPause>(`/api/timerpause/${id}`, {
    method: "DELETE",
  });
}
