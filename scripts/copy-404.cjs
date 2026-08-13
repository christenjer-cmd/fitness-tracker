// GitHub Pages ne sait pas réécrire les URL vers index.html.
// En servant une copie de l'app sous 404.html, un accès direct à /historique
// charge quand même l'application, qui lit ensuite l'URL demandée.
// Netlify et Vercel utilisent leurs propres règles et ignorent ce fichier.
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const source = path.join(dist, 'index.html');
const target = path.join(dist, '404.html');

if (!fs.existsSync(source)) {
  console.error('copy-404 : dist/index.html est introuvable, build incomplet.');
  process.exit(1);
}

fs.copyFileSync(source, target);
console.log('copy-404 : dist/404.html généré.');
