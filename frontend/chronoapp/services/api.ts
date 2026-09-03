// services/api.ts
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/config/api";

import { FormSchema } from "@/lib/schema/formSchema";
import { TimerRunnerSchema } from "@/lib/schema/timerRunnerSchema";
import { PatchChronoSchema } from "@/lib/schema/patchChronoSchema";
import { PausedChronoSchema } from "@/lib/schema/pausedSchema";
import { EndedPausedSchema } from "@/lib/schema/endedSchema";

import { TimerRunner } from "@/types/api";
import { TimerPause } from "@/types/api";
import { SeanceResponse } from "@/types/api";

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const token = await SecureStore.getItemAsync("accessToken");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Seance

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
  return apiFetch<SeanceResponse[]>("/api/seance", {
    method: "DELETE",
  });
}

// TimerRunner

export function postTimerRunner(data: TimerRunnerSchema) {
  return apiFetch<TimerRunner>("/api/timerrunner", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// TimerPause

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
