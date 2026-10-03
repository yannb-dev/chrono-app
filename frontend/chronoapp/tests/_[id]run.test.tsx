import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react-native";
import RunPage from "@/app/run/[id]";
import {
  getSeanceId,
  patchSeance,
  postTimerPause,
  deleteTimerPause,
  deleteAllTimerRunner,
} from "@/services/api";
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
  useLocalSearchParams: jest.fn(() => ({ id: "cmuqygi0d000rpkgx1pc6z1" })),
}));

jest.mock("@/services/api", () => ({
  getSeanceId: jest.fn(),
  patchSeance: jest.fn(),
  postTimerPause: jest.fn(),
  deleteTimerPause: jest.fn(),
  deleteAllTimerRunner: jest.fn(),
}));

// ==== GROUPE TEST ====
//

describe("[id] Run - affichage des erreurs", () => {
  afterEach(async () => {
    await cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==== VALEUR FACTICES ====
  //

  const seanceNoStart = {
    colorRunner: "rgb(15, 184, 68)",
    createdAt: "2026-10-03T13:37:58.190Z",
    id: "cmusfsyb20001pkf1uxdltyrn",
    startedAt: null,
    state: "NoStart",
    timerRunners: [],
    timerpauses: [],
    totalRunner: 20,
    userId: "cmuqygi0d000rpkgx1pc6z1",
  };

  const seanceInProgress = {
    colorRunner: "rgb(15, 184, 68)",
    createdAt: "2026-10-03T13:37:58.190Z",
    id: "cmusfsyb20001pkf1uxdltyrn",
    startedAt: "2026-10-03T13:37:59.190Z",
    state: "InProgress",
    timerRunners: [],
    timerpauses: [],
    totalRunner: 20,
    userId: "cmuqygi0d000rpkgx1pc6z1",
  };

  const seanceInProgressWithDate = {
    colorRunner: "rgb(15, 184, 68)",
    createdAt: new Date(),
    id: "cmusfsyb20001pkf1uxdltyrn",
    startedAt: new Date(),
    state: "InProgress",
    timerRunners: [],
    timerpauses: [],
    totalRunner: 20,
    userId: "cmuqygi0d000rpkgx1pc6z1",
  };

  const timerPause = {
    id: "cmskjdfkj7877hh",
    pausedAt: "2026-10-03T13:38:00.190Z",
    endedAt: "2026-10-03T13:38:01.190Z",
    pauseDurationMs: 60000,
    seanceId: "cmusfsyb20001pkf1uxdltyrn",
    userId: "cmuqygi0d000rpkgx1pc6z1",
  };

  // ==== TEST 1 ====
  it("Non autorisé => redirection /login ", async () => {
    (getSeanceId as jest.Mock).mockRejectedValueOnce(
      new HttpError(401, {
        message: "Non autorisé",
      }),
    );

    await render(<RunPage />);
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

    await render(<RunPage />);
    expect(await screen.findByText("Pas de connexion internet")).toBeTruthy();
  });

  // ==== TEST 3 ====
  //

  it("Effacement de la <View> à la fermeture de la fenêtre Error", async () => {
    (getSeanceId as jest.Mock).mockRejectedValueOnce(
      new HttpError(404, { message: "Aucune séance" }),
    );

    await render(<RunPage />);
    expect(await screen.findByText("Aucune séance"));

    await fireEvent.press(screen.getByText("Réessayer"));
    expect(screen.queryByText("Aucune séance")).toBeNull();
  });

  // ==== TEST 4 ====
  //
  it("OnPress sur PLAY + PAUSE => changeColor + disabled + chrono défile", async () => {
    (getSeanceId as jest.Mock).mockResolvedValueOnce(seanceNoStart);
    (patchSeance as jest.Mock).mockResolvedValueOnce(seanceInProgress);
    (postTimerPause as jest.Mock).mockResolvedValueOnce(timerPause);
    (deleteTimerPause as jest.Mock).mockResolvedValueOnce({ ok: 204 });
    (deleteAllTimerRunner as jest.Mock).mockResolvedValueOnce({ ok: 204 });

    await render(<RunPage />);
    await fireEvent.press(screen.getByTestId("play"));
    expect(await screen.findByTestId("play")).toBeDisabled();
    expect(await screen.findByTestId("play")).toHaveStyle({
      backgroundColor: "rgb(176, 171, 171)",
    });
    expect(await screen.findByTestId("pause")).toHaveStyle({
      backgroundColor: "rgb(139,241,77)",
    });
    expect(await screen.findByTestId("reset")).toHaveStyle({
      backgroundColor: "rgb(139,241,77)",
    });

    await fireEvent.press(screen.getByTestId("pause"));
    expect(await screen.findByTestId("play")).not.toBeDisabled();
    expect(await screen.findByTestId("play")).toHaveStyle({
      backgroundColor: "rgb(139,241,77)",
    });
    expect(await screen.findByTestId("pause")).toHaveStyle({
      backgroundColor: "rgb(176, 171, 171)",
    });
    expect(await screen.findByTestId("reset")).toHaveStyle({
      backgroundColor: "rgb(176, 171, 171)",
    });
  });

  // ==== TEST 5 ====
  //

  it("OnPress sur RESET => changeColor + disabled + chrono défile", async () => {
    (getSeanceId as jest.Mock).mockResolvedValueOnce(seanceNoStart);
    (patchSeance as jest.Mock).mockResolvedValueOnce(seanceInProgress);
    (postTimerPause as jest.Mock).mockResolvedValueOnce(timerPause);
    (deleteTimerPause as jest.Mock).mockResolvedValueOnce({ ok: 204 });
    (deleteAllTimerRunner as jest.Mock).mockResolvedValueOnce({ ok: 204 });

    await render(<RunPage />);
    await fireEvent.press(screen.getByTestId("reset"));

    expect(await screen.findByTestId("play")).not.toBeDisabled();
    expect(await screen.findByTestId("play")).toHaveStyle({
      backgroundColor: "rgb(139,241,77)",
    });
    expect(await screen.findByTestId("pause")).toHaveStyle({
      backgroundColor: "rgb(176, 171, 171)",
    });
    expect(await screen.findByTestId("reset")).toHaveStyle({
      backgroundColor: "rgb(176, 171, 171)",
    });
  });
});
