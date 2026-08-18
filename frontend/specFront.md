# Rappel

- lancement : npx expo start

# Parcours utilisateur

1. Je télécharge l'application
2. J'arrive sur une page de connexion je m'inscris avec un email et un mot de passe
3. Je me retrouve sur la page d'accueil. Je peux cliquer sur "Chronométrer une épreuve"
4. J'arrive sur un formulaire qui me demande le nombre de coureur et la couleur des dossards. Une fois saisie je valide.
5. Je me retrouve sur une page de saisie, je peux lancer, mettre sur pause et remettre à zero le chronomètre. Je lance le chronomètre.
6. Quand un coureur passe la ligne d'arrivée je clique sur son numéro. Le bouton passe en grisé. Et le chronomètre s'affiche en dessous sous forme de liste du premier au dernier.
7. A la fin de l'épreuve je peux arrêter le chrono et revenir sur la page d'accueil.

# Détail des actions côté client

1. A la validation du formulaire signUp => fetch() POST API/AUTH/REGISTER
   // Valeurs d'entrées
   {
   "email": "yann181blondeau@gmail.com",
   "password": "Byscor181+"
   }
   //
2. A la validation du formulaire login => fetch() POST API/AUTH/LOGIN
   // Valeurs d'entrées
   {
   "email": "yann181blondeau@gmail.com",
   "password": "Byscor181+"
   }
   //
3. A la validation du formulaire createSEANCE => fetch() POST API/SEANCE
   // Valeurs d'entrées
   {
   "totalRunner": 20,
   "colorRunner": "blue",
   "userId": "cmsiygav30000pkzzwv8ls5lt"
   }
   //
4. Je clique sur "play" fetch() PATCH API/SEANCE => update avec {startAt: new Date()}
   // Valeurs d'entrées
   {
   "startedAt": "2026-08-11T12:59:29.149Z",
   }
   //
5. Je clique sur "2" fetch() POST API/TIMERRUNNER => création du temps final, calcul de la différence et enregistrement en miliseconde
   // Valeurs d'entrées
   {
   "endedAt": "2026-08-11T13:02:30.149Z"
   "numberRunner": 2
   "seanceId" : "cdnsm34Hnsnlkjlfkk5YGH }
   //
6. LongPress sur un numéro grisé (déjà saisie) fetch() DELETE API/TIMERRUNNER/[id]

## Si coupure internet, latence, pause de l'utilisateur

1. Je clique sur pause fetch() POST API/TIMERPAUSE => create du timerpause avec un new Date()
2. Je relance le chorno, si le chronomètre n'est pas à 00:00:00 fetch() UPDATE API/TIMERPAUSE => envoi du new Date() de la reprise puis calcul de la différence. {endedAt: new Date()}
