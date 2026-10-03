import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react-native";
import HomeScreen from "@/app/(tabs)";

// ==== MOCK ====

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    logout: jest.fn().mockResolvedValue(undefined),
  }),
}));

// ==== GROUPE DE TEST ====

describe("Index.tsx - affichage des erreurs", () => {
  afterEach(async () => {
    await cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==== Valeur fictive de test ====

  // ==== TEST 1 ====
  //
  it("action sur button DEMARRER doit rediriger", async () => {
    await render(<HomeScreen />);
    await fireEvent.press(screen.getByText("Démarrer"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({ pathname: "/formSeance/page" });
    });
  });

  // ==== TEST 2 ====
  //
  it("action sur Icône LOGOUT doit rediriger", async () => {
    await render(<HomeScreen />);
    await fireEvent.press(await screen.findByTestId("logout"));

    await waitFor(() => {
      expect(screen.findByText("Démarrer")).toBeFalsy;
    });
  });
});
