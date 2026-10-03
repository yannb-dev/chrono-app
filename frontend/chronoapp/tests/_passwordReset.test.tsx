import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  act,
} from "@testing-library/react-native";
import PasswordReset from "@/app/(auth)/passwordReset";
import { postResetPassword } from "@/services/api";
import { HttpError, NetworkError } from "@/lib/errors";

// ==== MOCK ====

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("@/services/api", () => ({
  postResetPassword: jest.fn(),
}));

// ==== GROUPE DE TEST ====

describe("PasswordReset - affichage des erreurs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(async () => {
    await cleanup();
    jest.useRealTimers();
  });

  // ==== Valeur fictive de test ====

  const remplirFormulaireValid = async () => {
    await fireEvent.changeText(
      screen.getByPlaceholderText("Email"),
      "test@test.com",
    );
  };

  const remplirFormulaireInValid = async () => {
    await fireEvent.changeText(screen.getByPlaceholderText("Email"), "");
  };

  // ==== TEST 1 ====
  //
  it("affiche les messages d'erreurs sous les input + ne lance pas la function", async () => {
    await render(<PasswordReset />);
    await remplirFormulaireInValid();
    await fireEvent.press(screen.getByText("Réinitialiser"));

    expect(await screen.findByText("Email requis")).toBeTruthy();
    expect(postResetPassword).not.toHaveBeenCalled();
  });

  // ==== TEST 2 ====
  //
  it("affiche le message d'erreur HTTP renvoyé par l'API => mauvais format", async () => {
    (postResetPassword as jest.Mock).mockRejectedValueOnce(
      new HttpError(400, {
        message: "Erreur du contrôle Zod sur resetpassword",
      }),
    );

    await render(<PasswordReset />);
    await remplirFormulaireValid();
    await fireEvent.press(screen.getByText("Réinitialiser"));
    expect(
      screen.findByText("Erreur du contrôle Zod sur resetpassword"),
    ).toBeTruthy();
  });

  // ==== TEST 3 ====
  //
  it("affiche un message quand le réseau est indisponible", async () => {
    (postResetPassword as jest.Mock).mockRejectedValueOnce(
      new NetworkError("Pas de connexion réseau"),
    );

    await render(<PasswordReset />);
    await remplirFormulaireValid();
    await fireEvent.press(screen.getByText("Réinitialiser"));

    expect(await screen.findByText("Pas de connexion réseau")).toBeTruthy();
  });

  // ==== TEST 4 ====
  //
  it("affiche message de confirmation si success avec redirection", async () => {
    await render(<PasswordReset />);
    await remplirFormulaireValid();

    await fireEvent.press(screen.getByText("Réinitialiser"));

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockPush).toHaveBeenCalledWith("/(auth)/login");
  });
});
