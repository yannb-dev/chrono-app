// app/exercices/page.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import FormDeleteUser from "@/app/component/formDeleteUser";
import userEvent from "@testing-library/user-event";
import { prisma } from "@/lib/prisma";
import { HttpError, NetworkError } from "@/lib/errors";

// ==== MOCK ====
//
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// ==== GROUPE DE TEST ====
//

describe("Page DELETE-USER", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ==== VALEURS FICTIVES ====
  //

  const userA = {
    id: "cmpdskfk5687",
    email: "test@gmail.com",
    password: "123Test+",
  };

  const valueValid = {
    email: "test@gmail.com",
    password: "123Test+",
  };

  const valueInValid = {
    email: "testgmail.com",
    password: "12est+",
  };

  // ==== TEST 1 ====
  //
  it("Mauvais format d'email à la validation", async () => {
    const user = userEvent.setup();
    render(<FormDeleteUser />);

    await user.type(screen.getByPlaceholderText("Email"), valueInValid.email);
    await user.type(
      screen.getByPlaceholderText("Mot de passe"),
      valueInValid.password,
    );
    await user.click(screen.getByRole("button", { name: "Supprimer" }));

    expect(
      await screen.findByText("Mauvais format d'email"),
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled(); // la validation bloque l'appel réseau
  });

  // ==== TEST 2 ====
  //
  it("Mauvais mot de passe à la validation", async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(
      new HttpError(403, {
        message: "Mot de passe incorrect",
      }),
    );
    const user = userEvent.setup();

    render(<FormDeleteUser />);

    await user.type(screen.getByPlaceholderText("Email"), valueInValid.email);
    await user.type(
      screen.getByPlaceholderText("Mot de passe"),
      valueInValid.password,
    );

    await user.click(await screen.findByText("Supprimer"));

    expect(screen.getByText("Mauvais format d'email")).toBeInTheDocument();
  });

  // // ==== TEST 3 ====
  // //
  it("Mauvais mot de passe à la suppression", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 204 } as any);

    const user = userEvent.setup();
    render(<FormDeleteUser />);

    await user.type(screen.getByPlaceholderText("Email"), valueValid.email);
    await user.type(
      screen.getByPlaceholderText("Mot de passe"),
      valueValid.password,
    );

    await user.click(await screen.findByText("Supprimer"));

    expect(
      screen.getByText("Votre compte a été supprimé."),
    ).toBeInTheDocument();

    expect(fetch).toHaveBeenCalledWith(
      "/api/user",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  // // ==== TEST 4 ====
  // //
  it("Renvoi un message d'erreur si 404", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(
      new HttpError(403, { message: "Utilisateur introuvable" }),
    );

    const user = userEvent.setup();
    render(<FormDeleteUser />);

    await user.type(screen.getByPlaceholderText("Email"), valueValid.email);
    await user.type(
      screen.getByPlaceholderText("Mot de passe"),
      valueValid.password,
    );

    await user.click(await screen.findByText("Supprimer"));

    expect(fetch).toHaveBeenCalledWith(
      "/api/user",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(screen.getByText("Utilisateur introuvable")).toBeInTheDocument();
  });

  // // ==== TEST 5 ====
  // //
  it("Renvoi un message d'erreur si NetworkError", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new NetworkError("Aucun réseau"));

    const user = userEvent.setup();
    render(<FormDeleteUser />);

    await user.type(screen.getByPlaceholderText("Email"), valueValid.email);
    await user.type(
      screen.getByPlaceholderText("Mot de passe"),
      valueValid.password,
    );

    await user.click(await screen.findByText("Supprimer"));

    expect(fetch).toHaveBeenCalledWith(
      "/api/user",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(screen.getByText("Aucun réseau")).toBeInTheDocument();
  });
});
