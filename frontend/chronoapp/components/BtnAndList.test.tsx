import { render, cleanup, waitFor } from "@testing-library/react-native";

import BtnAndList from "./BtnAndList";

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("@/services/api", () => ({
  postTimerRunner: jest.fn(),
  patchSeance: jest.fn(),
}));

const seance = {
  totalRunner: 10,
  colorRunner: "blue",
  id: "test123",
  createdAt: new Date(),
  startedAt: null,
  state: "NoStart",
  userId: "test345",
  timerRunners: [],
  timerpauses: [],
};

const reset = false;

describe("BtnAndList - affichage des erreurs", () => {
  afterEach(async () => {
    await cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // test 1
  it("génère les boutons correspondant au totalRunner", async () => {
    const { getAllByRole } = await render(
      <BtnAndList seance={seance} reset={reset} />,
    );

    await waitFor(() => {
      expect(getAllByRole("button")).toHaveLength(10);
    });
  });
});
