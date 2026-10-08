import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react-native";
import DetailScreen from "@/app/(tabs)/list";
import { getSeance } from "@/services/api";
import { deleteManySeance } from "@/services/api";
import { HttpError, NetworkError } from "@/lib/errors";
import { useFocusEffect } from "expo-router";

// ==== MOCK ====
//
const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
    push: (...args: unknown[]) => mockReplace(...args),
  },
  Stack: {
    Screen: () => null,
  },
  useFocusEffect: jest.fn((callback) => callback()),
}));

jest.mock("@/services/api", () => ({
  getSeance: jest.fn(),
  deleteManySeance: jest.fn(),
}));

// ==== GROUPE DE TEST ===
describe("List - affichage des erreurs", () => {
  afterEach(async () => {
    await cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==== VALEUR FACTICES ====

  const seance = [
    {
      totalRunner: 10,
      colorRunner: "blue",
      id: "test123",
      createdAt: new Date("2026-10-03T13:37:58.190Z"),
      startedAt: null,
      state: "NoStart",
      userId: "test345",
      timerRunners: [],
      timerpauses: [],
    },
  ];

  const seanceFinish = [
    {
      totalRunner: 10,
      colorRunner: "blue",
      id: "test123",
      createdAt: new Date("2026-10-03T13:37:58.190Z"),
      startedAt: new Date("2026-10-03T13:37:59.190Z"),
      state: "Finish",
      userId: "test345",
      timerRunners: [],
      timerpauses: [],
    },
  ];
  // ==== TEST 1 ====
  //
  it("affiche le message d'erreur HTTP renvoyé  => aucune séance à supprimer", async () => {
    (getSeance as jest.Mock).mockResolvedValueOnce(seanceFinish);
    (deleteManySeance as jest.Mock).mockRejectedValueOnce(
      new HttpError(404, {
        message: "Aucune séance",
      }),
    );

    await render(<DetailScreen />);

    await fireEvent.press(screen.getByTestId("delete-seance"));
    expect(
      await screen.findByText("Supprimer toutes les courses ?"),
    ).toBeTruthy();
    await fireEvent.press(screen.getByTestId("btnConfirm"));

    expect(await screen.findByText("Aucune séance")).toBeTruthy();
  });

  // ==== TEST 2 ====
  //
  it("affiche un message quand le réseau est indisponible", async () => {
    (getSeance as jest.Mock).mockRejectedValueOnce(
      new NetworkError("Pas de connexion internet"),
    );

    await render(<DetailScreen />);
    expect(await screen.findByText("Pas de connexion internet")).toBeTruthy();
  });

  // ==== TEST 4 ====
  //
  it("Effacement de la <View> à la fermeture de la fenêtre Error", async () => {
    (getSeance as jest.Mock).mockRejectedValueOnce(
      new HttpError(404, { message: "Aucune séance" }),
    );

    await render(<DetailScreen />);
    expect(await screen.findByText("Aucune séance")).toBeTruthy();

    await fireEvent.press(screen.getByText("Réessayer"));
    expect(screen.queryByText("Aucune séance")).toBeNull();
  });

  // ==== TEST 5 ====
  //
  it("Charge les séances puis les effaces", async () => {
    (getSeance as jest.Mock).mockResolvedValue(seanceFinish);
    await render(<DetailScreen />);
    await fireEvent.press(await screen.findByTestId("delete-seance"));
    await fireEvent.press(await screen.findByTestId("btnConfirm"));
    expect(deleteManySeance).toHaveBeenCalled();
  });

  // ==== TEST 6 ====
  //
  it("Charge les séances, press trash puis annule", async () => {
    (getSeance as jest.Mock).mockResolvedValue(seanceFinish);
    await render(<DetailScreen />);
    await fireEvent.press(screen.getByTestId("delete-seance"));
    await fireEvent.press(screen.getByTestId("btnBack"));
    expect(deleteManySeance).not.toHaveBeenCalled();
  });

  // ==== TEST 7 ====
  //
  it("OnPress séance redirection =>  /run ", async () => {
    (getSeance as jest.Mock).mockResolvedValue(seance);
    await render(<DetailScreen />);

    await fireEvent.press(await screen.findByTestId("test123"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: `/run/[id]`,
        params: { id: "test123" },
      });
    });
  });

  // ==== TEST 8 ====
  //
  it("OnPress séance redirection =>  /resultat ", async () => {
    (getSeance as jest.Mock).mockResolvedValue(seanceFinish);
    await render(<DetailScreen />);

    await fireEvent.press(await screen.findByTestId("test123"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: `/result/[id]`,
        params: { id: "test123" },
      });
    });
  });
});
