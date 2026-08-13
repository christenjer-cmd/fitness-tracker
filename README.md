# Fitness Tracker

Suivi de séances de musculation et de courses à pied. PWA React + Vite + Zustand,
sans serveur : toutes les données vivent dans le `localStorage` du téléphone.

## Lancer en local

```bash
npm install
npm run dev
```

Le serveur écoute aussi sur le réseau local (`host: true`), donc l'app est joignable
depuis le téléphone via `http://<ip-du-pc>:5173`. Attention, iOS n'autorise
l'installation en PWA et le service worker qu'en HTTPS : pour une vraie installation
sur l'écran d'accueil, il faut passer par un hébergement.

## Déployer

Trois options sont configurées, aucune n'est obligatoire, elles font toutes du HTTPS
(indispensable pour installer la PWA sur iOS).

### GitHub Pages

Un workflow (`.github/workflows/deploy.yml`) construit et publie à chaque push sur
`master` ou `main`. Il faut l'activer une fois dans le dépôt, sous
`Settings > Pages`, en choisissant la source `GitHub Actions`.

Le site est alors servi depuis `https://<utilisateur>.github.io/<depot>/` et non
depuis la racine du domaine, ce qui demande deux précautions déjà en place :
le workflow passe `BASE_PATH` à Vite pour préfixer les chemins des ressources,
et le build copie `index.html` en `404.html`, seule façon pour GitHub Pages de
servir l'application sur une URL profonde comme `/historique`.

### Netlify ou Vercel

`netlify.toml` et `vercel.json` contiennent la règle de réécriture équivalente.
Il suffit de connecter le dépôt, la commande de build et le dossier de sortie
sont détectés automatiquement. Ces deux plateformes servent depuis la racine
d'un sous-domaine, donc `BASE_PATH` reste inutile.

## Scripts

- `npm run dev` : serveur de développement
- `npm run build` : vérification TypeScript puis build de production dans `dist/`
- `npm run lint` : vérification TypeScript seule
- `npm run preview` : sert le build de production

## Import Garmin

L'onglet Course accepte trois formats exportés par Garmin Connect :

- `.tcx` et `.gpx` pour une activité isolée (bouton d'export sur la page de l'activité)
- `.csv` pour un export en masse depuis la liste des activités

Les courses déjà importées sont détectées par leur identifiant d'origine
(`externalId`) et ne sont pas ajoutées deux fois. Le format `.FIT` natif de Garmin
n'est pas géré : il est binaire et demanderait une dépendance supplémentaire.

## Sauvegarde

Les données ne quittent jamais l'appareil. L'onglet Historique propose un export
et un import JSON, seul moyen de transférer l'historique d'un téléphone à un autre.
