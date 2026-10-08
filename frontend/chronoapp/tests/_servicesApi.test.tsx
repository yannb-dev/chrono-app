import * as SecureStore from "expo-secure-store";
import apiFetch from "@/services/api";
import { parseBody } from "@/services/parseBody";
import { triggerUnauthorized } from "@/lib/authEvents";
import { HttpError, NetworkError } from "@/lib/errors";

jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn() }));
jest.mock("@/config/api", () => ({ API_BASE_URL: "http://test" }));
jest.mock("@/lib/authEvents", () => ({ triggerUnauthorized: jest.fn() }));
jest.mock("@/services/parseBody", () => ({ parseBody: jest.fn() }));

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

const mockedToken = SecureStore.getItemAsync as jest.Mock;
const mockedParse = parseBody as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockedToken.mockResolvedValue(null);
});

describe("apiFetch", () => {
  it("ajoute le header Authorization quand un token existe", async () => {
    mockedToken.mockResolvedValue("abc123");
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
    mockedParse.mockResolvedValue({ kind: "json", data: { id: 1 } });

    const result = await apiFetch<{ id: number }>("/api/seance");

    expect(result).toEqual({ id: 1 });
    expect(mockFetch).toHaveBeenCalledWith(
      "http://test/api/seance",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer abc123" }),
      }),
    );
  });

  it("n'envoie pas Authorization sans token", async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
    mockedParse.mockResolvedValue({ kind: "empty" });

    await apiFetch("/api/seance");

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers).not.toHaveProperty("Authorization");
  });

  it("lève NetworkError si fetch échoue (mode avion)", async () => {
    mockFetch.mockRejectedValue(new TypeError("Network request failed"));

    await expect(apiFetch("/api/seance")).rejects.toBeInstanceOf(NetworkError);
  });

  it("déclenche la déconnexion sur un 401 hors /api/auth/", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 });
    mockedParse.mockResolvedValue({ kind: "empty" });

    await expect(apiFetch("/api/seance")).rejects.toBeInstanceOf(HttpError);
    expect(triggerUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("ne déconnecte PAS sur un 401 de /api/auth/login", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 });
    mockedParse.mockResolvedValue({
      kind: "json",
      data: { message: "Identifiants invalides" },
    });

    await expect(apiFetch("/api/auth/login")).rejects.toBeInstanceOf(HttpError);
    expect(triggerUnauthorized).not.toHaveBeenCalled();
  });
});
