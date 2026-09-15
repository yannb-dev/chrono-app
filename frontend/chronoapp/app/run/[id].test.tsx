import {
  render,
  screen,
  fireEvent,
  cleanup,
} from "@testing-library/react-native";
import Result from "./[id]";

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
  patchSeance: jest.fn(),
}));

describe("Run - affichage des erreurs", () => {
  afterEach(async () => {
    await cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("[id] Run - affichage des erreurs", () => {
    afterEach(async () => {
      await cleanup();
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    // test 1
    it("affiche le message d'erreur HTTP renvoyé par l'API GET SEANCE non autorisé", async () => {
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
    it("affiche le chronomètre si onPress sur Play ", async () => {
      (getSeanceId as jest.Mock).mockRejectedValueOnce(
        new NetworkError("Pas de connexion internet"),
      );

      await render(<Result />);
      expect(await screen.findByText("Pas de connexion internet")).toBeTruthy();
      fireEvent.press(await screen.findByText("Réessayer"));
      expect(screen.queryByText("Oups, une erreur !")).toBeNull();
    });
  });
});
