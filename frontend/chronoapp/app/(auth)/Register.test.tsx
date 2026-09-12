import {
  render,
  screen,
  fireEvent,
  cleanup,
} from "@testing-library/react-native";
import Register from "./register";
import { postRegister } from "@/services/api";
import { HttpError, NetworkError } from "@/lib/errors";

// Neutralise expo-router : on n'a pas besoin d'une vraie navigation
// pour tester l'affichage des erreurs, et Stack.Screen plante sans
// contexte de navigation réel (useRoute)
jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  Stack: {
    Screen: () => null, // on neutralise complètement le composant Screen
  },
}));

// Remplace postRegister par une fonction factice qu'on contrôle
// entièrement dans chaque test (mockRejectedValueOnce, etc.)
jest.mock("@/services/api", () => ({
  postRegister: jest.fn(),
}));

// regroupe les tests
describe("Register - affichage des erreurs", () => {
  // Démonte proprement le composant rendu après chaque test
  // (obligatoire en v14, plus de cleanup automatique implicite)
  afterEach(async () => {
    await cleanup();
  });

  // Réinitialise l'historique d'appels des mocks entre chaque test
  // (sinon mockRejectedValueOnce du test précédent pourrait fausser le suivant)
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // function qui permet de remplir les champs pour le test
  const remplirFormulaire = async () => {
    await fireEvent.changeText(
      screen.getByPlaceholderText("Email"),
      "test@test.com",
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("Mot de passe"),
      "Password1!",
    );
    await fireEvent.changeText(
      screen.getByPlaceholderText("Confirmer le mot de passe"),
      "Password1!",
    );
  };

  // test 1
  //
  // Configure postRegister pour qu'il ÉCHOUE avec une HttpError,
  // une seule fois (mockRejectedValueOnce), simulant une réponse 400 de l'API
  it("affiche le message d'erreur HTTP renvoyé par l'API", async () => {
    (postRegister as jest.Mock).mockRejectedValueOnce(
      new HttpError(400, { message: "Email déjà utilisé" }),
    );

    // lance la function
    await render(<Register />);
    // execute le remplissage des champs
    await remplirFormulaire();
    // simule un onPress sur le button
    await fireEvent.press(screen.getByText("S'inscrire"));

    // Vérifie que le bloc d'erreur générique s'affiche...
    expect(await screen.findByText("Oups, une erreur !")).toBeTruthy();
    // ...ET que le message précis extrait du body de l'erreur est bien affiché
    expect(screen.getByText("Email déjà utilisé")).toBeTruthy();
  });

  // test 2
  it("affiche un message quand le réseau est indisponible", async () => {
    (postRegister as jest.Mock).mockRejectedValueOnce(
      new NetworkError("Pas de connexion internet"),
    );

    await render(<Register />);
    await remplirFormulaire();
    await fireEvent.press(screen.getByText("S'inscrire"));

    expect(await screen.findByText("Pas de connexion internet")).toBeTruthy();
  });
});
