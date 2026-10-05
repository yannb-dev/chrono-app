import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  userEvent,
} from "@testing-library/react-native";
import Account from "@/app/(tabs)/account";
import { deleteUser } from "@/services/api";
import { HttpError, NetworkError } from "@/lib/errors";

// ==== MOCK ====

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("@/services/api", () => ({
  deleteUser: jest.fn(),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    logout: jest.fn().mockResolvedValue(undefined),
  }),
}));

// ==== GROUPE DE TEST ====

describe("Account - affichage des erreurs", () => {
  afterEach(async () => {
    await cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==== Valeur fictive de test ====

  // ==== TEST 1 ====
  //
  it("Affiche le message de confirmation", async () => {
    const user = userEvent.setup();

    await render(<Account />);
    await user.press(screen.getByText("Supprimer"));
    expect(
      await screen.findByText(
        "Veuillez écrire votre mot de passe pour confirmer la suppression de votre compte.",
      ),
    ).toBeTruthy();
    await user.type(screen.getByPlaceholderText("Mot de passe"), "");
    await user.press(screen.getByTestId("btnConfirm"));
    expect(
      await screen.findByText("Veuillez entrer votre mot de passe"),
    ).toBeTruthy();
  });

  // ==== TEST 2 ====
  //
  it("affiche le message d'erreur HTTP renvoyé par l'API => mauvais format", async () => {
    (deleteUser as jest.Mock).mockRejectedValueOnce(
      new HttpError(400, {
        message: "Format du mot de passe non conformes",
      }),
    );

    const user = userEvent.setup();

    await render(<Account />);
    await user.press(screen.getByText("Supprimer"));
    expect(
      await screen.findByText(
        "Veuillez écrire votre mot de passe pour confirmer la suppression de votre compte.",
      ),
    ).toBeTruthy();
    await user.type(screen.getByPlaceholderText("Mot de passe"), "Azerty123");

    await user.press(screen.getByTestId("btnConfirm"));

    expect(
      await screen.findByText("Format du mot de passe non conformes"),
    ).toBeTruthy();
  });

  //   // ==== TEST 3 ====
  //   //
  it("affiche le message d'erreur HTTP renvoyé par l'API identification", async () => {
    (deleteUser as jest.Mock).mockRejectedValueOnce(
      new HttpError(401, { message: "Identifications invalides" }),
    );

    const user = userEvent.setup();

    await render(<Account />);
    await user.press(screen.getByText("Supprimer"));
    await user.type(screen.getByPlaceholderText("Mot de passe"), "Azerty123");
    await user.press(screen.getByTestId("btnConfirm"));

    expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
  });

  // ==== TEST 4 ====
  //
  it("affiche un message quand le réseau est indisponible", async () => {
    (deleteUser as jest.Mock).mockRejectedValueOnce(
      new NetworkError("Pas de connexion réseau"),
    );

    const user = userEvent.setup();
    await render(<Account />);
    await user.press(screen.getByText("Supprimer"));
    await user.type(screen.getByPlaceholderText("Mot de passe"), "Azerty123");
    await user.press(screen.getByTestId("btnConfirm"));

    expect(await screen.findByText("Pas de connexion réseau")).toBeTruthy();
  });
});
