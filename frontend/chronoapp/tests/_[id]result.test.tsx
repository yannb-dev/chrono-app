import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react-native";
import Result from "@/app/result/[id]";
import { getSeanceId } from "@/services/api";
import { HttpError, NetworkError } from "@/lib/errors";
import { useLocalSearchParams } from "expo-router";

// ==== MOCK ====
//
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
  Stack: {
    Screen: () => null,
  },
  useLocalSearchParams: jest.fn(() => ({ id: "test-id-123" })),
}));

jest.mock("@/services/api", () => ({
  getSeanceId: jest.fn(),
}));

// ==== GROUPE TEST ====
//

describe("[id] Result - affichage des erreurs", () => {
  afterEach(async () => {
    await cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==== VALEUR FACTICES ====
  //

  // ==== TEST 1 ====
  it("Non autorisé => redirection /login ", async () => {
    (getSeanceId as jest.Mock).mockRejectedValueOnce(
      new HttpError(401, {
        message: "Non autorisé",
      }),
    );

    await render(<Result />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
    });
  });

  // ==== TEST 2 ====
  //
  it("affiche un message quand le réseau est indisponible", async () => {
    (getSeanceId as jest.Mock).mockRejectedValueOnce(
      new NetworkError("Pas de connexion internet"),
    );

    await render(<Result />);
    expect(await screen.findByText("Pas de connexion internet")).toBeTruthy();
  });

  // ==== TEST 3 ====
  //

  it("Effacement de la <View> à la fermeture de la fenêtre Error", async () => {
    (getSeanceId as jest.Mock).mockRejectedValueOnce(
      new HttpError(404, { message: "Aucune séance" }),
    );

    await render(<Result />);
    expect(await screen.findByText("Aucune séance"));

    await fireEvent.press(screen.getByText("Réessayer"));
    expect(screen.queryByText("Aucune séance")).toBeNull();
  });
});
