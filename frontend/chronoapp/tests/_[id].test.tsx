import {
  render,
  screen,
  fireEvent,
  cleanup,
} from "@testing-library/react-native";
import Result from "@/app/result/[id]";

import { getSeanceId } from "@/services/api";

import { HttpError, NetworkError } from "@/lib/errors";
import { useLocalSearchParams } from "expo-router";

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  Stack: {
    Screen: () => null,
  },
  useLocalSearchParams: jest.fn(() => ({ id: "test-id-123" })),
}));

jest.mock("@/services/api", () => ({
  getSeanceId: jest.fn(),
}));

describe("[id] Result - affichage des erreurs", () => {
  afterEach(async () => {
    await cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // test 1
  it("affiche le message d'erreur HTTP renvoyé par l'API GET SEANCEID non autorisé", async () => {
    (getSeanceId as jest.Mock).mockRejectedValueOnce(
      new HttpError(401, {
        message: "Non autorisé",
      }),
    );

    await render(<Result />);
    expect(await screen.findByText("Non autorisé")).toBeTruthy();
  });

  // test 2
  it("affiche un message quand le réseau est indisponible", async () => {
    (getSeanceId as jest.Mock).mockRejectedValueOnce(
      new NetworkError("Pas de connexion internet"),
    );

    await render(<Result />);
    expect(await screen.findByText("Pas de connexion internet")).toBeTruthy();
  });
  // test 3

  it("Effacement de la <View> à la fermeture de la fenêtre Error", async () => {
    (getSeanceId as jest.Mock).mockRejectedValueOnce(
      new HttpError(401, { message: "Non autorisé" }),
    );

    await render(<Result />);
    expect(await screen.findByText("Oups une erreur !"));

    await fireEvent.press(screen.getByText("Réessayer"));
    expect(screen.queryByText("Oups une erreur !")).toBeNull();
  });
});
