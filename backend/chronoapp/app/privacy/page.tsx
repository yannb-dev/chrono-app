"use client";

import Image from "next/image";

export default function Privacy() {
  return (
    <div className="w-full flex flex-col items-center font-mono text-sm">
      <Image
        src="/images/android-icon-foreground.png"
        alt="Logo de l'application"
        width={180}
        height={180}
      />
      <div className="w-[50%] flex flex-col">
        <div className="w-full">
          <p className="text-xs">Dernière mise à jour : 10 octobre 2026</p>
          <h1 className="text-3xl mt-6 mb-10">
            Politique de confidentialité de <strong>CHRONOAPP</strong>
          </h1>
          <p className="text-sm ml-2">
            Cette page explique quelles données l'application collecte,
            pourquoi, avec qui elles sont traitées et comment vous pouvez les
            consulter ou les supprimer.
          </p>
        </div>
        <div className="w-full mt-4 p-4 border border-green-400 rounded-sm bg-gray-100">
          <h3 className="text-sm">
            <strong>Sur cette page :</strong>
          </h3>
          <div className="w-full mt-4 ml-4 grid grid-cols-3 gap-4 text-xs">
            <a className="underline" href="#responsable">
              Qui est responsable
            </a>
            <a className="underline" href="#donnee">
              Données collectées
            </a>
            <a className="underline" href="#partage">
              Partage et prestataires
            </a>
            <a className="underline" href="#duree">
              Durée de conservation
            </a>
            <a className="underline" href="#security">
              Sécurité
            </a>
            <a className="underline" href="#droit">
              Tes droits
            </a>
            <a className="underline" href="#supprimer">
              Supprimer ton compte
            </a>
          </div>
        </div>
        <div id="responsable" className="w-full mt-8">
          <h2 className="text-lg font-bold mb-4">
            Qui est responsable des données
          </h2>
          <p className="ml-2">
            L'application est éditée par <strong>yannB-Dev</strong> . Pour toute
            question sur les données, écrire à yannblondeaudev@gmail.com.
          </p>
        </div>
        <div id="donnee" className="w-full mt-8">
          <h2 className="text-lg font-bold mb-4">
            Données collectées et raisons
          </h2>
          <p className="ml-2">
            Voici la liste complète, identique à la déclaration "Sécurité des
            données" du Google Play Store.
          </p>
          <div className="w-full mt-4 ml-2 border border-green-400 rounded-sm bg-gray-100 text-xs">
            <div className="w-full flex border-b border-green-400">
              <div className="w-[30%] p-2">
                <strong>DONNEE</strong>
              </div>
              <div className="w-[70%] p-2">
                <strong>POURQUOI</strong>
              </div>
            </div>
            <div className="w-full flex border-b border-green-400">
              <div className="w-[30%] p-2">Adresse e-mail</div>
              <div className="w-[70%] p-2">Créer un compte et se connecter</div>
            </div>
            <div className="w-full flex border-b border-green-400">
              <div className="w-[30%] p-2">Identifiant de compte</div>
              <div className="w-[70%] p-2">
                Se connecter. Relier les séances à votre compte, et vérifier que
                vous estes le seul à y accéder.
              </div>
            </div>
            <div className="w-full flex ">
              <div className="w-[30%] p-2">Activité dans l'app</div>
              <div className="w-[70%] p-2">
                Enregistrer les séances et les temps des coureurs pour une
                lecture ultérieure.
              </div>
            </div>
          </div>
          <p className="mt-4 ml-2 text-xs font-bold text-red-500">
            L'application n'affiche aucune publicité et ne vend aucune donnée.
          </p>
        </div>
        <div id="partage" className="w-full mt-8">
          <h2 className="text-lg font-bold mb-4">Partage et prestataires</h2>
          <p className="ml-2">
            Les données ne sont pas partagées à des fins commerciales. Elles
            sont traitées pour notre compte par ces prestataires techniques :
          </p>
          <ul className="p-6">
            <li>
              <strong>Vercel : </strong>hébergement de l'API.
            </li>
            <li>
              <strong>Neon :</strong> base de données.
            </li>
            <li>
              <strong>Expo & Google :</strong> déploiement de l'application.
            </li>
          </ul>
        </div>
        <div id="duree" className="w-full mt-8">
          <h2 className="text-lg font-bold mb-4">Durée de conservation</h2>
          <p className="ml-2">
            Les données sont conservées tant que ton compte existe. À la
            suppression du compte, elles sont effacées de la base de données
            immédiatement.
          </p>
        </div>
        <div id="security" className="w-full mt-8">
          <h2 className="text-lg font-bold mb-4">Sécurité</h2>
          <p className="ml-2">
            Les échanges entre l'application et nos serveurs sont chiffrés en
            HTTPS. Ton jeton de connexion est stocké dans l'espace sécurisé de
            ton téléphone, et chaque requête vérifie que les données demandées
            t'appartiennent.
          </p>
        </div>
        <div id="droit" className="w-full mt-8">
          <h2 className="text-lg font-bold mb-4">Vos droits</h2>
          <p className="ml-2">
            Vous pouvez demander l'accès à vos données, leur corrections, leur
            exports ou leur suppressions, et s'opposer à leur traitement. Écrire
            à yannblondeaudev@gmail.com. En cas de désaccord, vous pouvez saisir
            la CNIL.
          </p>
        </div>
        <div id="supprimer" className="w-full mt-8">
          <h2 className="text-lg font-bold mb-4">Supprimer votre compte</h2>
          <p></p>
        </div>
        <div className="w-full flex flex-col items-center p-6 mt-4 ml-2 mb-30 border border-green-400 rounded-sm bg-gray-100 text-xs">
          <div className="w-full">
            <h3 className="text-sm mb-4">
              <strong>Depuis l'application</strong>{" "}
            </h3>
            <ul className="list-decimal ml-10">
              <li>Ouvrez l'application</li>
              <li>
                Se rendre sur la page <strong>compte</strong> puis appuyer sur
                "supprimer"
              </li>
              <li>Entrez votre mot de passe et "valider"</li>
            </ul>
            <h3 className="text-sm mb-4 mt-4">
              <strong>Depuis la page web</strong>
            </h3>
            <ul className="list-decimal ml-10">
              <li>
                Ouvrez la page web{" "}
                <a
                  className="underline"
                  href="https://chrono-app-blond-vercel.app/detele-user"
                >
                  ChronoApp
                </a>
              </li>
              <li>Entrez votre email et votre mot de passe"</li>
              <li>Confirmez la suppression de votre compte"</li>
            </ul>
          </div>
          <div className="w-[80%] bg-amber-300 rounded-sm p-2 mt-6">
            La suppression est définitive : compte et séances seront effacés et
            ne peuvent pas être récupérés.
          </div>
        </div>
      </div>
    </div>
  );
}
