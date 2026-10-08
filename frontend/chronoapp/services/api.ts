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
import { ResetPasswordSchema } from "@/lib/schema/registerPasswordReset";
import { DeleteControlUserSchema } from "@/lib/schema/deleteSchema";

import { TimerRunner } from "@/types/api";
import { TimerPause } from "@/types/api";
import { SeanceResponse } from "@/types/api";
import { HttpError, NetworkError } from "@/lib/errors";
import { UserRegister } from "@/types/api";
import { UserLogin } from "@/types/api";

import { parseBody } from "./parseBody";

import { useAuth } from "@/context/AuthContext";

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const { logout } = useAuth();

  const tokenSecureStore = await SecureStore.getItemAsync("accessToken");
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
        ...(tokenSecureStore
          ? { Authorization: `Bearer ${tokenSecureStore}` }
          : {}),
        ...options?.headers,
      },
    });
  } catch (err) {
    clearTimeout(timeoutId);
    console.error(err);
    throw new NetworkError("Pas de connexion réseau");
  }

  let parsed;
  try {
    parsed = await parseBody(response);
  } catch {
    throw new NetworkError("Lecture de la réponse interrompue");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    if (response.status === 401 && !isAuthEndpoint) {
      logout();
      router.replace("/(auth)/login");
      throw new HttpError(401, { message: "Session expirée" });
    }

    const body =
      parsed.kind === "json"
        ? parsed.data
        : parsed.kind === "text"
          ? { message: parsed.text.slice(0, 200) }
          : { message: "aucun détail" };

    throw new HttpError(response.status, body);
  }

  if (parsed.kind === "empty") return null as T;
  if (parsed.kind === "json") return parsed.data as T;

  throw new Error("Réponse inattendue : texte au lieu de JSON");
}

// User ======================================

export function deleteUser(data: DeleteControlUserSchema) {
  return apiFetch("/api/user", {
    method: "DELETE",
    body: JSON.stringify(data),
  });
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

// ResetPassword===============================

export function postResetPassword(data: ResetPasswordSchema) {
  return apiFetch("/api/auth/passwordresettoken", {
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
