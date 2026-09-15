import {
  render,
  screen,
  fireEvent,
  cleanup,
} from "@testing-library/react-native";
import LoginScreen from "./login";
import { postLogin } from "@/services/api";
import { HttpError, NetworkError } from "@/lib/errors";

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
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

describe("Login - affichage des erreurs", () => {
  afterEach(async () => {
    await cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

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
    await fireEvent.changeText(
      screen.getByPlaceholderText("Email"),
      "testtest.com",
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("Mot de passe"),
      "password1!",
    );
  };

  // test 1
  it("affiche le message d'erreur HTTP renvoyé par l'API mauvais format", async () => {
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

  // test 2
  it("affiche les messages d'erreurs de soumission sans appel API", async () => {
    await render(<LoginScreen />);
    await remplirFormulaireInValid();
    await fireEvent.press(screen.getByText("Se connecter"));

    expect(await screen.findByText("Mauvais format d'email")).toBeTruthy();
    expect(await screen.findByText("Au moins une majuscule")).toBeTruthy();
    expect(postLogin).not.toHaveBeenCalled();
  });

  // test 3
  it("affiche le message d'erreur HTTP renvoyé par l'API identification", async () => {
    (postLogin as jest.Mock).mockRejectedValueOnce(
      new HttpError(401, { message: "Identifications invalides" }),
    );

    await render(<LoginScreen />);
    await remplirFormulaireValid();
    await fireEvent.press(screen.getByText("Se connecter"));

    expect(await screen.findByText("Identifications invalides")).toBeTruthy();
  });

  // test 4
  it("affiche un message quand le réseau est indisponible", async () => {
    (postLogin as jest.Mock).mockRejectedValueOnce(
      new NetworkError("Pas de connexion internet"),
    );

    await render(<LoginScreen />);
    await remplirFormulaireValid();
    await fireEvent.press(screen.getByText("Se connecter"));

    expect(await screen.findByText("Pas de connexion internet")).toBeTruthy();
  });
});
