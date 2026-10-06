import {
  render,
  cleanup,
  waitFor,
  screen,
  fireEvent,
} from "@testing-library/react-native";
import BtnAndList from "@/components/BtnAndList";
import { HttpError } from "@/lib/errors";
import { patchSeance, postTimerRunner } from "@/services/api";

// ==== MOCK ====
//

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("@/services/api", () => ({
  postTimerRunner: jest.fn(),
  patchSeance: jest.fn(),
}));

// ==== VALEURS FACTICES ====
//
const seance = {
  totalRunner: 10,
  colorRunner: "blue",
  id: "test123",
  createdAt: new Date("2026-10-03T13:37:58.190Z"),
  startedAt: null,
  state: "NoStart",
  userId: "test345",
  timerRunners: [],
  timerpauses: [],
};

const seanceWithResultTimerRunner = {
  totalRunner: 10,
  colorRunner: "blue",
  id: "test123",
  createdAt: new Date("2026-10-03T13:37:58.190Z"),
  startedAt: null,
  state: "NoStart",
  userId: "test345",
  timerRunners: [
    {
      id: "345TYU",
      numberRunner: 5,
      endedAt: "2026-10-03T13:37:59.190Z",
      duration: 60000,
      seanceId: "test123",
    },
  ],
  timerpauses: [],
};

const reset = false;

const timerRunner = {
  numberRunner: 1,
  endedAt: new Date("2026-10-03T13:37:59.190Z"),
  seanceId: "test123",
};

// ==== GROUPE DE TEST ====

describe("BtnAndList - affichage des erreurs", () => {
  afterEach(async () => {
    await cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==== TEST 1 ====
  //
  it("génère les boutons correspondant au totalRunner", async () => {
    const { getAllByRole } = await render(
      <BtnAndList seance={seance} reset={reset} />,
    );

    await waitFor(() => {
      expect(getAllByRole("button")).toHaveLength(10);
    });
  });

  // ==== TEST 2 ====
  //
  it("Button runner disabled si chrono en PAUSE", async () => {
    (postTimerRunner as jest.Mock).mockRejectedValueOnce(
      new HttpError(404, {
        message: "Le chronomètre n'est pas actif",
      }),
    );

    await render(<BtnAndList seance={seance} reset={reset} />);

    await fireEvent.press(screen.getByTestId("btn-endRunner-1"));

    expect(
      await screen.findByText("Le chronomètre n'est pas actif"),
    ).toBeTruthy();
  });

  // ==== TEST 3 ====
  //
  it("BtnRunner grisé si valeur en BDD", async () => {
    await render(
      <BtnAndList seance={seanceWithResultTimerRunner} reset={reset} />,
    );

    expect(await screen.findByText("N°5"));
    expect(await screen.findByTestId("btn-endRunner-5")).toHaveStyle({
      backgroundColor: "rgb(212,212,212)",
    });
  });

  // ==== TEST 4 ====
  //
  it("Affichage du message de confirmation d'enregistrement", async () => {
    (patchSeance as jest.Mock).mockResolvedValueOnce({ ok: 200 });

    await render(
      <BtnAndList seance={seanceWithResultTimerRunner} reset={reset} />,
    );

    await fireEvent.press(screen.getByTestId("btn-ended"));

    expect(await screen.findByText("Enregistrer et quitter ?")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("confirm"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  // ==== TEST 5 ====
  //
  it("Button runner disabled si chrono en PAUSE", async () => {
    (postTimerRunner as jest.Mock).mockRejectedValueOnce(
      new HttpError(409, {
        message: "Le coureurs est déjà enregistré",
      }),
    );

    await render(<BtnAndList seance={seance} reset={reset} />);

    await fireEvent.press(screen.getByTestId("btn-endRunner-1"));

    expect(
      await screen.findByText("Le coureurs est déjà enregistré"),
    ).toBeTruthy();
  });
});
