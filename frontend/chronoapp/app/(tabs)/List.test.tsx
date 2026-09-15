import {
  render,
  screen,
  fireEvent,
  cleanup,
} from "@testing-library/react-native";
import DetailScreen from "./list";

import { getSeance } from "@/services/api";
import { deleteManySeance } from "@/services/api";

import { HttpError, NetworkError } from "@/lib/errors";
import { useFocusEffect } from "expo-router";

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  Stack: {
    Screen: () => null,
  },
  useFocusEffect: jest.fn((callback) => callback()),
}));

jest.mock("@/services/api", () => ({
  getSeance: jest.fn(),
  deleteManySeance: jest.fn(),
}));

describe("List - affichage des erreurs", () => {
  afterEach(async () => {
    await cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // test 1
  it("affiche le message d'erreur HTTP renvoyé par l'API GET SEANCE non autorisé", async () => {
    (getSeance as jest.Mock).mockRejectedValueOnce(
      new HttpError(401, {
        message: "Non autorisé",
      }),
    );

    await render(<DetailScreen />);
    expect(await screen.findByText("Non autorisé")).toBeTruthy();
  });

  // test 2
  it("affiche un message quand le réseau est indisponible", async () => {
    (getSeance as jest.Mock).mockRejectedValueOnce(
      new NetworkError("Pas de connexion internet"),
    );

    await render(<DetailScreen />);
    expect(await screen.findByText("Pas de connexion internet")).toBeTruthy();
  });
  // test 3

  it("Effacement de la <View> à la fermeture de la fenêtre Error", async () => {
    (getSeance as jest.Mock).mockRejectedValueOnce(
      new HttpError(401, { message: "Non autorisé" }),
    );

    await render(<DetailScreen />);
    expect(await screen.findByText("Oups une erreur !"));

    await fireEvent.press(screen.getByText("Réessayer"));
    expect(screen.queryByText("Oups une erreur !")).toBeNull();
  });

  // test 4

  it("Appel de la function deleteManySeance quand onPress sur icon trash", async () => {
    await render(<DetailScreen />);
    await fireEvent.press(await screen.findByTestId("delete-seance"));
    expect(deleteManySeance).toHaveBeenCalled();
  });
});
