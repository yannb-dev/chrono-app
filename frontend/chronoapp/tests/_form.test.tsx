import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react-native";
import Form from "@/components/form";
import { postSeance } from "@/services/api";
import { HttpError, NetworkError } from "@/lib/errors";

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
  postSeance: jest.fn(),
}));

// ==== GROUPE DE TEST ===
//
describe("form - affichage des erreurs", () => {
  afterEach(async () => {
    await cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==== VALEUR FACTICES ====
  //
  const ValueValid = async () => {
    await fireEvent.press(screen.getByTestId("btncolor-rgb(39, 91, 245)"));
  };

  // ==== TEST 1 ====
  //
  it("Non autorisé => redirige vers /login", async () => {
    (postSeance as jest.Mock).mockRejectedValueOnce(
      new HttpError(401, {
        message: "Non autorisé",
      }),
    );
    await render(<Form />);
    await ValueValid();
    await fireEvent.press(screen.getByText("Créer"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
    });
  });

  // ==== TEST 2 ====
  //

  it("affiche un message quand le réseau est indisponible", async () => {
    (postSeance as jest.Mock).mockRejectedValueOnce(
      new NetworkError("Pas de connexion internet"),
    );

    await render(<Form />);
    await ValueValid();
    await fireEvent.press(screen.getByText("Créer"));

    expect(await screen.findByText("Pas de connexion internet")).toBeTruthy();
  });

  // ==== TEST 3 ====
  //

  it("Effacement de la <View> à la fermeture de la fenêtre Error", async () => {
    (postSeance as jest.Mock).mockRejectedValueOnce(
      new HttpError(400, { message: "Format non autorisé" }),
    );

    await render(<Form />);
    await ValueValid();
    await fireEvent.press(screen.getByText("Créer"));

    expect(await screen.findByText("Format non autorisé"));

    await fireEvent.press(screen.getByText("Réessayer"));
    expect(screen.queryByText("Oups une erreur !")).toBeNull();
  });

  // ==== TEST 4 ====
  //
  it("Redirection si response = 201", async () => {
    (postSeance as jest.Mock).mockResolvedValueOnce({ id: "cmsmlksmlkf5687" });

    await render(<Form />);
    await ValueValid();
    await fireEvent.press(screen.getByText("Créer"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/run/cmsmlksmlkf5687");
    });
  });
});
