/* ============ TOUT LE CONTENU DU SITE EST ICI ============ */
window.CONTENT = {
  site: { name: "A Day Made for You", from: "Tryphene", year: "2026", recipient: "[PRÉNOM_DESTINATAIRE]" },
  nav: { next: "Passer à la suite" },
  mute: { on: "Couper le son", off: "Activer le son" },
  music: {
    src: "assets/audio/musique.mp3",   // remplace ce fichier pour changer la musique
    volume: .5,                         // volume de base (0 à 1)
    duck: .06,                          // musique très basse pendant les voix de l'entrée et les vidéos des télés
    duckLetter: .35,                    // musique en fond pendant l'audio de la lettre (la voix reste bien au-dessus, ~15 dB)
    on: "Couper la musique", off: "Lancer la musique"
  },

  gate: { pre: "Hey, est-ce que tu veux", em: "d'abord m'accompagner ?", yes: "Oui", no: "Non" },

  /* Séquence de mots. Voix : un fichier par phrase dans /assets/audio, SANS écrire l'extension :
     le site trouve tout seul mot-1.opus (WhatsApp), .mp3, .m4a, .ogg, .webm, .aac ou .wav.
     La voix démarre avec le mot ; le mot suivant n'arrive qu'à la fin de la voix. */
  words: {
    pause: 150, defaultDuration: 1700,
    list: [
      { text: "Parce que", em: "tu le mérites.", audio: "assets/audio/mot-1" },
      { text: "Je serai", em: "toujours là.", audio: "assets/audio/mot-2" },
      { text: "Sois", em: "toujours heureux.", audio: "assets/audio/mot-3" }
    ]
  },

  /* Carte finale de l'entrée (après les mots) : titre, sous-titre et bouton pour entrer sur le site.
     audio (facultatif) : voix lue à l'apparition, ex. "assets/audio/intro" */
  intro: {
    eyebrow: "A Day Made for You presents",
    title: "Some days deserve",
    em: "a little more attention.",
    sub: "This one is yours.",
    button: "Entrer dans le souvenir",
    audio: "assets/audio/intro"
  },

  /* Télé rose partagée par le hero et la section 3 (positions en % de l'image) */
  tv: {
    image: "assets/img/tele_rose.png",
    alt: "Une télévision rose rétro",
    screen: { x: 8.2, y: 35.8, w: 64.9, h: 51.2 },
    channel: { x: 87.95, y: 45.9 }, volume: { x: 87.95, y: 64.9 }, power: { x: 87.7, y: 83.2 }, r: 5.7,
    labels: { channel: "Changer de chaîne", volume: "Régler le volume", power: "Allumer ou éteindre la télé" },
    slideDuration: 4200
  },

  /* CHAÎNES DES TÉLÉS (hero et section 3) : une liste, jouée dans l'ordre.
     Chaque entrée peut combiner :  video | image  (le média)  +  text (texte affiché dessus ou seul)  +  caption (légende en bas)
       { text: "Samedi." }                                         -> texte seul
       { image: "assets/img/a.jpg", caption: "Légende" }           -> photo
       { video: "assets/video/a.mp4", text: "Mot par-dessus" }     -> vidéo (+ texte facultatif)
     Hero : une vidéo passe en entier (jusqu'à sa fin) avant la suite ; les autres chaînes durent slideDuration,
     ou duration: 6000 (en ms) pour une chaîne précise. Pour changer l'ordre : déplace les lignes. Pour retirer : supprime la ligne. */
  hero: {
    phrase: [{ t: "Une journée entière,", s: "serif" }, { t: "rien que pour toi", s: "script" }],
    next: "Passer à la suite",
    /* petites indications qui flottent près des boutons de la télé, puis disparaissent */
    hints: { channel: "Change de chaîne", power: "Allume / éteins", delay: 1500, duration: 5000 },
    slides: [
      { video: "assets/video/tryphene.mp4" },
      { text: "Samedi." },
      { text: "Rien à prévoir." },
      // { video: "assets/video/teaser.mp4", text: "Juste me suivre." },
      { text: "Juste me suivre." }
    ]
  },

  letter: {
    hint: "Ouvre moi ça tuyeur..",
    envelopeLabel: "Ouvrir l'enveloppe",
    envelopeImage: "assets/img/enveloppe.png",
    popup: {
      question: "Est-ce que tu veux vraiment m'ouvrir ?",
      hint: "Si tu réponds NON, je t'avoue un secret...",
      yes: "Oui", no: "Non",
      teases: ["Encore une chance…", "tu n'as pas envie de savoir ?", "une peu plus d'effort mon coeur", "il faut cliquer sur oui hein, il y a quel secret entre nous, ahi."]
    },
    close: "fermer",
    title: "Une lettre pour toi",
    toLabel: "À", to: "Mon bébéééé", fromLabel: "De", from: "Tryphene", dateLabel: "Le",
    photos: [
      { src: "assets/img/photo-1.jpg", alt: "Nous deux, premier souvenir" },
      { src: "assets/img/photo-2.jpg", alt: "Nous deux, deuxième souvenir" }
    ],
    greeting: "Mon amour,",
    body: [
      "Il y a des jours qu'on garde sans savoir pourquoi. Une lumière, un rire, ta main dans la mienne dans une rue quelconque.",

      "J’ai longtemps cherché comment commencer cette lettre. Pas parce que je n’ai rien à te dire, mais parce que, bizarrement, quand il s’agit de parler de ce que je ressens vraiment, les mots décident de me faire faux bond. Alors aujourd’hui, j’ai décidé de les chercher un par un, juste pour toi.",
      
      "Je veux te remercier d’être l’homme qui, derrière ses taquineries , sait être présent pour moi , se préoccupe de mes besoins, veut que je ne manque de rien et surtout, qui me donne ce sentiment précieux de ne pas avoir à tout porter toute seule. Sache que même si je ne prends pas toujours le temps de te le dire, je le vois. Je le remarque. Et je l’apprécie bien plus que tu ne l’imagines.",
      
      "Aux yeux des autres tu es le mec carré, froid , inaccessible , mystérieux et j’en passe. Mais à mes yeux tu es carrément tout le contraire . Tu es un homme extraordinaire, fort, patient, aimant, attentionné , doux mais dur quand il le faut, romantique malgré mon côté Punu 😂…  Tu es aussi un vrai emmerdeur mais bonnnnn broouuueeeffff  je t’aime comme ça ❤️! ",

      "La vie n’a pas toujours été douce avec toi , mais tu me donnes toujours le meilleur. Alors, je te souhaite de devenir l’homme que tu rêves d’être malgré les coups durs de la vie. Je te souhaite également la réussite, la santé, la paix, l’argent évidemment ( je veux déjà m’asseoir au foyer pour que tu ramènes l’argent 😂 ) et surtout la grâce de Dieu dans tout ce que tu entreprendras.",

      "Je prie pour que tes efforts ne soient jamais vains, que les portes dont tu as besoin s’ouvrent au bon moment et que tu trouves toujours la force de te relever lorsque la vie essaiera de te fatiguer. Tu connaîtras des joies si grandes qu’elles te feront oublier non seulement les périodes difficiles, mais aussi te rappelleront l’amour et la fidélité de Dieu.",
      
      "J’espère que ces mots te feront autant sourire que tu arrives à me faire sourire, même quand je suis censée bouder. 😂 Mais     surtout, j’espère qu’ils te feront comprendre que derrière mes humeurs agaçante  et mes difficultés à exprimer mes sentiments, il y a quelqu’un qui remarque tes efforts et qui, même si elle ne le dit pas toujours, mesure la chance qu’elle a de t’avoir dans sa vie❤️.",


    ],
    eyebrow: "Pour toi, aujourd'hui",
    date: "05 novembre 2026",
    postmark: "avec amour",
    ps: "P.S. Garde un peu de place pour la suite, il reste des surprises.",
    signature: "Tryphene", stamp: "made with love",
    seal: "assets/img/sceau.png",
    listen: "écoute-moi plutôt",
    voice: "assets/audio/lettre",       // audio de la lettre (sans extension), lu quand on clique sur « écoute-moi plutôt »
    autoCloseAfterVoice: true,           // la lettre se referme à la fin de l'audio (false = reste ouverte)
    autoCloseDelay: 2500,                // ms entre la fin de l'audio et la fermeture
    player: {
      title: "Lettre audio", sub: "La voix de Tryphene", cover: "assets/img/try.jpeg",
      play: "Lecture", pause: "Pause", back: "Reculer de 10 secondes", forward: "Avancer de 10 secondes",
      bar: "Position de lecture", close: "Fermer le lecteur", missing: "Audio indisponible pour l'instant"
    }
  },

  /* Section 3 : la télévision interactive. Chaînes = { text } | { image, alt, caption } | { video, caption } */
  room: {
    title: "Quelques chaînes, rien que pour toi",
    hint: "Allume la télé.",
    slides: [
      { image: "assets/img/tv-1.jpg", alt: "Souvenir 1", caption: "Légende du premier souvenir" },
      { text: "Chaîne 1", caption: "Bienvenue." },
      { image: "assets/img/tv-1.jpg", alt: "Souvenir 1", caption: "Légende du premier souvenir" },
      { image: "assets/img/tv-2.jpg", alt: "Souvenir 2", caption: "Légende du deuxième souvenir" },
      { text: "Tu me manques même quand tu es là.", caption: "Chaîne 4" }
    ]
  },

  /* Section 4 : l'album. Chaque pochette ne montre qu'un « ? » ; au clic, le disque (la photo) sort
     et l'anecdote s'affiche à côté. src = photo ronde du disque, tag = petit mot sous la pochette. */
  album: {
    title: { pre: "You remind me of", em: "everything soft" },
    hint: "Touche une pochette.",
    nav: { back: "back", page: "page", of: "of", next: "next" },
    open: "Ouvrir le disque {n}", close: "fermer", numLabel: "n°",
    items: [
      /* photo du disque : de préférence carrée, sujet principal au centre. focus: "50% 30%" pour recadrer. */
      {
        src: "assets/img/disque-1.jpg", alt: "Photo du disque 1", tag: "Ils sont normaux ?", focus: "50% 38%",
        title: "ça chauffait trop là-bas", 
        anecdote: "Anecdote : On était tranquillement en train de lover, paisibles et dans notre bulle, jusqu’à ce qu’on réalise qu’un couple était en train de passer à l’action juste à côté de nous 🤣🤣🤣🤣🤣🤣 On a cru qu'on rêvait, c’était lunaire !."
      },
      {
        src: "assets/img/disque-2.jpg", alt: "Photo du disque 2", tag: "C'est pour la bonne cause", focus: "50% 42%",
        title: "Les choses des grands", 
        anecdote: "c’était la première fois qu’on dormait ensemble (meme si on a pas vraiment dormi), du coup ce jour-là je n’arrivais pas à fermer l'œil 🤣🤣 Entre le stress, l'excitation et essayer de trouver la bonne position sans faire de bruit, c’était beaucoup too much et beaucoup trop nouveau pour moi !"
      },
      {
        src: "assets/img/disque-3.jpg", alt: "trop cute", tag: "souviens-toi",
        title: "ça coulait biennn hein", anecdote: "Ce jour-là, lors du déballage des cadeaux, tu as pleuré comme un bébé parce que je t'avais offert ce cadeau en particulier, tellement significatif pour toi. C'était un de mes moments préféré où un peu de place à plus d'émotion pure et à des larmes impossibles à retenir.'."
      },
      {
        src: "assets/img/disque-4.jpg", alt: "Photo du disque 4", tag: "juste toi",
        title: "Titre du souvenir 4", anecdote: "Un détail que personne d'autre ne connaît."
      },
      {
        src: "assets/img/disque-5.jpg", alt: "Photo du disque 5", tag: "devine",
        title: "Titre du souvenir 5", anecdote: "Celui-là me fait toujours sourire."
      },
      {
        src: "assets/img/disque-6.jpg", alt: "Photo du disque 6", tag: "le dernier",
        title: "Titre du souvenir 6", anecdote: "Et la suite reste à écrire, ensemble."
      }
    ]
  },

  /* Section 5 : « The Day », la carte interactive du programme.
     Chaque point de `stops` est un checkpoint sur la carte. x / y = position sur la carte (0 à 1000 en x, 0 à 640 en y,
     l'origine est en haut à gauche de la carte à plat). `via` = petits détours du chemin entre deux points (un tableau par trajet).
     secret: true = point « ? » (la surprise) : on voit l'heure et l'indice, pas le lieu. Pour la révéler plus tard, mets secret: false.
     maps = recherche Google Maps ouverte par « Voir sur Maps » (supprime la ligne pour ne rien afficher).
     side: "left" met l'étiquette de l'heure à gauche du point. */
  day: {
    title: { pre: "Programme de", em: "la journée" },
    sub: "Touche un point sur la carte.",
    note: "Les horaires sont provisoires.",
    provisional: "horaire provisoire",
    step: "Étape {n} sur {m}",
    start: "Commence ici",
    mapLabel: "Carte du programme de la journée",
    maps: "Voir sur Maps",
    nav: { prev: "précédent", next: "suivant", close: "fermer" },
    stops: [
      { time: "10h", short: "Blé Doré", title: "Petit déj au Blé Doré", place: "Carrefour SNI",
        text: "On commence doucement. Des viennoiseries, un café, et toi en face de moi. Pas d'objectif avant d'avoir bien mangé.",
        maps: "Blé Doré Carrefour SNI Libreville", x: 215, y: 430 },
      { time: "14h", short: "Surprise", title: "Activité surprise", place: "Lieu secret", secret: true,
        text: "Là, je ne dis rien. Tu sauras en arrivant. Fais-moi confiance et garde ton plus beau sourire pour plus tard.",
        hint: "Un seul indice : tu ne verras pas l'heure passer.",
        x: 520, y: 290 },
      { time: "19h30", short: "Eat Vite", title: "Dîner à Eat Vite", side: "left",
        text: "On finit la journée à table. Eat Vite, oui, mais nous on va prendre notre temps 😂",
        maps: "Eat Vite Libreville", x: 790, y: 185 }
    ],
    via: [
      [[300, 360], [360, 435], [450, 360]],
      [[600, 235], [655, 335], [730, 265]]
    ]
  },

  /* Effets sonores : sons synthétisés par défaut. Pour tes fichiers : click: "assets/audio/click.mp3"
     (noms : click, knob, pop, power, off, static, seal, open, chime) */
  sfx: {}
};
