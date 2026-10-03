import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react-native";
import LoginScreen from "@/app/(auth)/login";
import { postLogin } from "@/services/api";
import { HttpError, NetworkError } from "@/lib/errors";

// ==== MOCK ====

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("@/services/api", () => ({
  postLogin: jest.fn(),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    login: jest.fn().mockResolvedValue(undefined),
  }),
}));

// ==== GROUPE DE TEST ====

describe("Login - affichage des erreurs", () => {
  afterEach(async () => {
    await cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==== Valeur fictive de test ====

  const remplirFormulaireValid = async () => {
    await fireEvent.changeText(
      screen.getByPlaceholderText("Email"),
      "test@test.com",
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("Mot de passe"),
      "Password1!",
    );
  };

  const remplirFormulaireInValid = async () => {
    await fireEvent.changeText(screen.getByPlaceholderText("Email"), "");
    await fireEvent.changeText(screen.getByPlaceholderText("Mot de passe"), "");
  };

  // ==== TEST 1 ====
  //
  it("affiche les messages d'erreurs sous les input + ne lance pas la function", async () => {
    await render(<LoginScreen />);
    await remplirFormulaireInValid();
    await fireEvent.press(screen.getByText("Se connecter"));

    expect(await screen.findByText("Email requis")).toBeTruthy();
    expect(await screen.findByText("Mot de passe requis")).toBeTruthy();
    expect(postLogin).not.toHaveBeenCalled();
  });

  // ==== TEST 2 ====
  //
  it("affiche le message d'erreur HTTP renvoyé par l'API => mauvais format", async () => {
    (postLogin as jest.Mock).mockRejectedValueOnce(
      new HttpError(400, {
        message: "Format de l'email ou du mot de passe non conformes",
      }),
    );

    await render(<LoginScreen />);
    await remplirFormulaireValid();
    await fireEvent.press(screen.getByText("Se connecter"));
    expect(
      screen.getByText("Format de l'email ou du mot de passe non conformes"),
    ).toBeTruthy();
  });

  // ==== TEST 3 ====
  //
  it("affiche le message d'erreur HTTP renvoyé par l'API identification", async () => {
    (postLogin as jest.Mock).mockRejectedValueOnce(
      new HttpError(401, { message: "Identifications invalides" }),
    );

    await render(<LoginScreen />);
    await remplirFormulaireValid();
    await fireEvent.press(screen.getByText("Se connecter"));

    expect(await screen.findByText("Identifications invalides")).toBeTruthy();
  });

  // ==== TEST 4 ====
  //
  it("affiche un message quand le réseau est indisponible", async () => {
    (postLogin as jest.Mock).mockRejectedValueOnce(
      new NetworkError("Pas de connexion réseau"),
    );

    await render(<LoginScreen />);
    await remplirFormulaireValid();
    await fireEvent.press(screen.getByText("Se connecter"));

    expect(await screen.findByText("Pas de connexion réseau")).toBeTruthy();
  });

  // ==== TEST 5 ====
  //
  it("action sur button MOT DE PASSE OUBLIE doit rediriger", async () => {
    await render(<LoginScreen />);
    await fireEvent.press(screen.getByText("Mot de passe oublié"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/(auth)/passwordReset");
    });
  });

  // ===== TEST 6 ====
  //
  it("action sur button S'INSCRIRE doit rediriger", async () => {
    await render(<LoginScreen />);
    await fireEvent.press(screen.getByText("S'inscrire"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/(auth)/register");
    });
  });
});
