import {
  render,
  screen,
  fireEvent,
  cleanup,
} from "@testing-library/react-native";
import Register from "@/app/(auth)/register";
import { postRegister } from "@/services/api";
import { HttpError, NetworkError } from "@/lib/errors";

// ==== MOCK ====
//
jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("@/services/api", () => ({
  postRegister: jest.fn(),
}));

// ==== GROUPE DE TEST ====
//

describe("Register - affichage des erreurs", () => {
  afterEach(async () => {
    await cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==== Valeurs fictives ====
  //
  const remplirFormulaire = async () => {
    await fireEvent.changeText(
      screen.getByPlaceholderText("Email"),
      "test@test.com",
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("Mot de passe"),
      "Password1!",
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("Confirmer le mot de passe"),
      "Password1!",
    );
  };

  const remplirFormulaireInvalid = async () => {
    await fireEvent.changeText(screen.getByPlaceholderText("Email"), "");
    await fireEvent.changeText(screen.getByPlaceholderText("Mot de passe"), "");
    await fireEvent.changeText(
      screen.getByPlaceholderText("Confirmer le mot de passe"),
      "",
    );
  };

  // ==== TEST 1 ====
  //
  it("affiche le message d'erreur HTTP renvoyé par l'API", async () => {
    (postRegister as jest.Mock).mockRejectedValueOnce(
      new HttpError(400, { message: "Email déjà utilisé" }),
    );

    await render(<Register />);
    await remplirFormulaire();
    await fireEvent.press(screen.getByText("S'inscrire"));

    expect(screen.getByText("Email déjà utilisé")).toBeTruthy();
  });

  // ==== TEST 2 ====
  it("affiche un message quand le réseau est indisponible", async () => {
    (postRegister as jest.Mock).mockRejectedValueOnce(
      new NetworkError("Pas de connexion réseau"),
    );

    await render(<Register />);
    await remplirFormulaire();
    await fireEvent.press(screen.getByText("S'inscrire"));

    expect(await screen.findByText("Pas de connexion réseau")).toBeTruthy();
  });

  // ==== TEST 3 ====
  //
  it("affiche un message de confirmation d'inscription", async () => {
    (postRegister as jest.Mock).mockResolvedValueOnce({ ok: true });

    await render(<Register />);
    await remplirFormulaire();
    await fireEvent.press(screen.getByText("S'inscrire"));

    expect(await screen.findByText("Inscription validée !")).toBeTruthy();
  });

  // ==== TEST 4 ====
  //
  it("affiche les messages d'erreurs sous les input + ne lance pas la function", async () => {
    await render(<Register />);
    await remplirFormulaireInvalid();
    await fireEvent.press(screen.getByText("S'inscrire"));

    expect(await screen.findByText("Email requis")).toBeTruthy();
    expect(await screen.findByText("8 caractères minimum")).toBeTruthy();
    expect(postRegister).not.toHaveBeenCalled();
  });
});
