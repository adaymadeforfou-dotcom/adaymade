# A Day Made for You — étapes 1 à 3 (sections 0 à 5)

Site statique : ouvrir `index.html` (ou `npx serve .`). Aucun build.

## Modifier le contenu
Tout est dans `js/content.js` : textes, phrases du NON, phrases de la séquence, diaporama de la télé, contenu de la lettre, photos, chemins des audios.

## À déposer
- `assets/img/tele_rose.png` et `assets/img/enveloppe.png` : déjà en place (télé et enveloppe détourées). Les positions de la vitre et des boutons de la télé sont dans `tv` (`content.js`).
- Voix : voir la section « Voix (vocaux WhatsApp) » ci-dessous. Sans fichier, la séquence tourne avec un carillon.
- Musique : `assets/audio/musique.mp3` (ton fichier, compressé). Remplace-le pour changer d'ambiance ; réglages dans `music` de `content.js`.
- `assets/img/photo-1.jpg`, `photo-2.jpg` : photos au format timbre de la lettre.
- Sons : des effets synthétisés sont joués par défaut. Pour les remplacer, ajoute des chemins dans `sfx` de `content.js` (click, knob, pop, power, off, static, seal, open, chime).
- Pour une vidéo d'annonce dans la télé : `{ video: "assets/video/annonce.mp4" }` dans `hero.slides`.

## Déployer
Netlify : glisser le dossier sur app.netlify.com/drop. GitHub Pages : pousser le dossier, Settings > Pages > branche main, racine.

## Étape 2 (sections 3 et 4)
- Section 3 (télé dans la pièce sombre) : chaînes dans `room.slides` ; photos et vidéos dans `assets/img` et `assets/video`.
- Section 4 (album) : défilement lent en boucle de pochettes « ? ». Chaque entrée de `album.items` a la photo du disque (`assets/img/disque-N.jpg`, rognée en rond), un petit mot sous la pochette, un titre, une date et l'anecdote affichée à côté du disque.
- Chaque section a son bouton « Passer à la suite ». La dernière section est la carte « The Day » (étape 3 ci-dessous) ; la finale viendra après.

## Voix (vocaux WhatsApp)
Les vocaux WhatsApp sont des fichiers `.opus` : le site les lit tels quels, il suffit de les renommer et de les déposer dans `assets/audio/` :

| Où | Nom du fichier |
|---|---|
| 1ʳᵉ phrase d'entrée | `mot-1.opus` |
| 2ᵉ phrase d'entrée | `mot-2.opus` |
| 3ᵉ phrase d'entrée | `mot-3.opus` |
| Carte « Some days deserve… » (facultatif) | `intro.opus` |
| La lettre (bouton « écoute-moi plutôt ») | `lettre.mp3` (déjà en place, volume normalisé) |

- Le site accepte aussi `.mp3`, `.m4a`, `.ogg`, `.webm`, `.aac`, `.wav` ; on n'écrit jamais l'extension dans `content.js`.
- La voix démarre avec le mot ; le mot suivant n'arrive qu'à la fin de la voix. Pour la lettre, la voix ne démarre qu'au clic sur « écoute-moi plutôt » (un lecteur apparaît) ; à la fin, la lettre se referme après 2,5 s (`letter.autoCloseAfterVoice: false` pour désactiver).
- Sur iPhone/Safari, `.opus` peut ne pas se lire : convertis en mp3 avec `./outils/convertir-voix.sh vocal.opus mot-1` (nécessite ffmpeg).
- Phrases : à modifier dans `words.list` de `content.js`. Ajouter une phrase = ajouter une ligne `{ text, audio }`.

## Vidéos, images et textes dans les télés
Les deux télés (hero et section 3) utilisent la même liste de « chaînes » dans `content.js` (`hero.slides` et `room.slides`). Elles se jouent dans l'ordre :
```js
{ text: "Samedi." },                                   // texte seul
{ video: "assets/video/a.mp4" },                       // vidéo seule
{ video: "assets/video/b.mp4", text: "Mot dessus" },   // vidéo + texte par-dessus
{ image: "assets/img/c.jpg", caption: "Légende" },     // photo + légende
```
Alterner « vidéo, texte, vidéo, texte » = écrire les lignes dans cet ordre. Pour changer l'ordre, déplace les lignes ; pour retirer un type, supprime les lignes. Dans le hero, une vidéo se joue en entier avant la chaîne suivante ; un texte ou une photo dure `tv.slideDuration` (ou `duration: 6000` sur la ligne). Vidéos : mp4 (H.264), format 4:3 ou 16:9, idéalement moins de 15 Mo.

## Disques de l'album
La photo de chaque disque (`assets/img/disque-N.jpg`) est rognée en rond au centre : choisis des photos carrées, sujet au milieu. `focus: "50% 30%"` dans `album.items` recadre si besoin.

## Entrée du site et son
- Après le OUI, les phrases (`words.list`, deux lignes : `text` en blanc + `em` en italique) puis la carte « Some days deserve… » (`intro`) avec le bouton « Entrer dans le souvenir ».
- Musique : elle passe à un volume très bas (`music.duck`, 0 à 1) pendant les voix d'entrée et les vidéos de télé. Pendant l'audio de la lettre, elle reste en fond (`music.duckLetter`, ~15 dB sous la voix) et les vidéos des télés sont coupées ; elle remonte à la pause ou à la fin.
- Cliquer en dehors de la lettre ou d'un disque (ou touche Échap) les ferme.
- Indications près des boutons de la télé du hero : `hero.hints` (textes, `delay`, `duration` en ms).

## Ouvrir le site en local
- Double-clic sur `index.html` : tout fonctionne, y compris la musique et les voix.
- Si une voix ne joue pas : vérifie le nom du fichier (`lettre.mp3`, `mot-1.mp3`…) dans `assets/audio/`. L'extension peut être `.mp3`, `.m4a`, `.opus`, `.ogg`, `.webm`, `.aac` ou `.wav`.

## Étape 3 : « The Day », la carte du programme
Tout est dans `day` de `js/content.js`.
- Chaque entrée de `day.stops` est un point (checkpoint) de la carte : `time`, `short` (petit texte de l'étiquette), `title`, `place`, `text` (la description affichée au clic), `maps` (recherche Google Maps du bouton « Voir sur Maps », supprime la ligne pour le retirer).
- **Modifier une heure ou un texte** : change `time` / `text`. Les horaires sont annoncés comme provisoires (`day.note` et `day.provisional`).
- **La surprise de 14h** : `secret: true` affiche un « ? », cache le lieu et le lien Maps, et montre `hint` (l'indice). Le jour J, mets `secret: false` et remplis `place` et `maps` pour la révéler.
- **Ajouter un point** : ajoute une entrée à `stops` et un tableau de détours (même vide, `[]`) à `via`. Il y a toujours un tableau `via` de moins que de points.
- **Placer un point** : `x` (0 à 1000) et `y` (0 à 640) sont des positions sur la carte à plat, origine en haut à gauche, avant la mise en perspective. `via` donne les détours du chemin entre deux points. `side: "left"` met l'étiquette à gauche de l'épingle.
- Sur ordinateur la fiche s'ouvre près du point en évitant de cacher les autres points ; sur mobile elle s'affiche sous la carte. Échap, la croix ou un clic à côté la ferme ; « précédent » / « suivant » font voyager le petit cœur le long du chemin.
- La carte est illustrée, pas à l'échelle : elle ne reproduit pas les vraies distances entre les lieux. Les palmes, le lac et la rivière sont décoratifs (forme de la carte et décor dans `main.js`, bloc « programme : carte interactive »).
