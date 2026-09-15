import {
  render,
  screen,
  fireEvent,
  cleanup,
} from "@testing-library/react-native";
import Register from "./register";
import { postRegister } from "@/services/api";
import { HttpError, NetworkError } from "@/lib/errors";

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("@/services/api", () => ({
  postRegister: jest.fn(),
}));

describe("Register - affichage des erreurs", () => {
  afterEach(async () => {
    await cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  // test 1
  it("affiche le message d'erreur HTTP renvoyé par l'API", async () => {
    (postRegister as jest.Mock).mockRejectedValueOnce(
      new HttpError(400, { message: "Email déjà utilisé" }),
    );

    await render(<Register />);
    await remplirFormulaire();
    await fireEvent.press(screen.getByText("S'inscrire"));

    expect(await screen.findByText("Oups, une erreur !")).toBeTruthy();
    expect(screen.getByText("Email déjà utilisé")).toBeTruthy();
  });

  // test 2
  it("affiche un message quand le réseau est indisponible", async () => {
    (postRegister as jest.Mock).mockRejectedValueOnce(
      new NetworkError("Pas de connexion internet"),
    );

    await render(<Register />);
    await remplirFormulaire();
    await fireEvent.press(screen.getByText("S'inscrire"));

    expect(await screen.findByText("Pas de connexion internet")).toBeTruthy();
  });
});
