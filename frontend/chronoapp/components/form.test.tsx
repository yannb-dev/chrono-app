import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react-native";

import Form from "./form";

import { postSeance } from "@/services/api";

import { HttpError, NetworkError } from "@/lib/errors";

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("@/services/api", () => ({
  postSeance: jest.fn(),
}));

describe("form - affichage des erreurs", () => {
  afterEach(async () => {
    await cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // test 1
  it("affiche le message d'erreur HTTP renvoyé par l'API GET SEANCEID non autorisé", async () => {
    (postSeance as jest.Mock).mockRejectedValueOnce(
      new HttpError(401, {
        message: "Non autorisé",
      }),
    );

    await render(<Form />);

    await fireEvent.press(screen.getByTestId("btncolor-rgb(39, 91, 245)"));
    fireEvent.press(screen.getByTestId("validForm"));

    await waitFor(() => {
      expect(postSeance).toHaveBeenCalledWith({
        totalRunner: 20,
        colorRunner: "rgb(39, 91, 245)",
      });
    });

    expect(await screen.findByText("Non autorisé")).toBeTruthy();
  });

  // test 2
  it("affiche un message quand le réseau est indisponible", async () => {
    (postSeance as jest.Mock).mockRejectedValueOnce(
      new NetworkError("Pas de connexion internet"),
    );

    await render(<Form />);

    await fireEvent.press(screen.getByTestId("btncolor-rgb(39, 91, 245)"));
    fireEvent.press(screen.getByTestId("validForm"));

    await waitFor(() => {
      expect(postSeance).toHaveBeenCalledWith({
        totalRunner: 20,
        colorRunner: "rgb(39, 91, 245)",
      });
    });
    expect(await screen.findByText("Pas de connexion internet")).toBeTruthy();
  });

  // test 3

  it("Effacement de la <View> à la fermeture de la fenêtre Error", async () => {
    (postSeance as jest.Mock).mockRejectedValueOnce(
      new HttpError(401, { message: "Non autorisé" }),
    );

    await render(<Form />);

    await fireEvent.press(screen.getByTestId("btncolor-rgb(39, 91, 245)"));
    fireEvent.press(screen.getByTestId("validForm"));

    await waitFor(() => {
      expect(postSeance).toHaveBeenCalledWith({
        totalRunner: 20,
        colorRunner: "rgb(39, 91, 245)",
      });
    });
    expect(await screen.findByText("Oups une erreur !"));

    await fireEvent.press(screen.getByText("Réessayer"));
    expect(screen.queryByText("Oups une erreur !")).toBeNull();
  });
});
