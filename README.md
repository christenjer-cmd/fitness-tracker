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

L'onglet Course accepte quatre formats :

- `.tcx` et `.gpx` pour une activité isolée, exportée depuis sa page sur Garmin Connect
- `.csv` pour un export en masse depuis la liste des activités
- `.json` produit par le script de synchronisation décrit ci-dessous

Les activités déjà importées sont reconnues par leur identifiant d'origine
(`externalId`) et ne sont jamais ajoutées deux fois. Le format `.FIT` natif de
Garmin n'est pas géré côté app : il est binaire, et le script de synchronisation
rend sa lecture inutile.

## Script de synchronisation Garmin

`scripts/garmin-sync.mjs` se connecte à Garmin Connect, récupère les dernières
activités et écrit un fichier JSON à importer dans l'app. Contrairement aux
exports manuels, il rapatrie aussi les **séances de musculation avec leurs
séries, répétitions et charges**, que les formats TCX et CSV ne contiennent pas.

Les identifiants restent sur la machine : ils sont lus dans les variables
d'environnement `GARMIN_EMAIL` et `GARMIN_PASSWORD`, ou dans un fichier
`garmin.local.json` à la racine, ignoré par git au même titre que le jeton de
session mis en cache dans `.garmin-tokens/`.

```bash
node scripts/garmin-sync.mjs --limit 30
```

Options : `--limit` nombre d'activités à examiner, `--days` pour ne garder que
les N derniers jours, `--out` pour choisir le fichier de sortie.

Les exercices sont rapprochés du catalogue par leur nom ; ceux que Garmin nomme
autrement sont créés comme exercices personnalisés à l'import.

## Sauvegarde

Les données ne quittent jamais l'appareil. L'onglet Historique propose un export
et un import JSON, seul moyen de transférer l'historique d'un téléphone à un autre.
