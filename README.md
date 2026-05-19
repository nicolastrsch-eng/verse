# verse

Un constructeur d'enchaînements d'accords pour guitares qui pleurent.

## Fonctionnalités

- Suggestions par humeur (joyeux, mélancolique, aigu, grave, tendu, rêveur)
- Diagrammes guitare (voicings ouverts + barrés) et piano
- Lecture par gammes : visualiser l'accord dans 8 modes (majeur, mineur, dorien, mixolydien, lydien, phrygien, mineure harmonique, mineure mélodique)
- Modifier un accord sans casser la suite
- Page récapitulative validée avec tous les accords

## Lancer en local

Pré-requis : Node.js 18 ou plus.

```bash
npm install
npm run dev
```

L'application se lance sur `http://localhost:5173`.

## Build de production

```bash
npm run build
```

Les fichiers à servir sont dans `dist/`.

## Stack

- React 18 + Vite 6
- Tailwind CSS v4 (plugin Vite officiel)
- lucide-react pour les icônes

## Licence

Personnel — VERSE SOCIETY.
