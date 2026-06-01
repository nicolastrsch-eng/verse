import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Sun, ArrowUpRight, CloudRain, ArrowDownRight, Zap, Sparkles, RotateCcw, Undo2, Check, X, ArrowLeft } from 'lucide-react';

// ============================================================
// CHORD NAMING
// ============================================================
const NOTE_MAJOR = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const NOTE_MINOR = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function chordName(root, quality) {
  const r = ((root % 12) + 12) % 12;
  const isMinor = ['min', 'm7', 'm6', 'm7b5', 'dim', 'dim7'].includes(quality);
  const note = isMinor ? NOTE_MINOR[r] : NOTE_MAJOR[r];
  const suffix = {
    maj: '', min: 'm', '7': '7', maj7: 'maj7', m7: 'm7',
    '6': '6', m6: 'm6', add9: 'add9', m7b5: 'm7♭5',
    sus: 'sus', sus2: 'sus2', sus4: 'sus4',
    dim: '°', dim7: '°7', aug: '+',
  }[quality] || '';
  return note + suffix;
}

// ============================================================
// CHORD INTERVALS (pour les diagrammes piano)
// ============================================================
const CHORD_INTERVALS = {
  maj:  [0, 4, 7],
  min:  [0, 3, 7],
  '7':  [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7:   [0, 3, 7, 10],
  '6':  [0, 4, 7, 9],
  m6:   [0, 3, 7, 9],
  add9: [0, 4, 7, 2],
  m7b5: [0, 3, 6, 10],
  sus:  [0, 5, 7],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  dim:  [0, 3, 6],
  dim7: [0, 3, 6, 9],
  aug:  [0, 4, 8],
};

function chordNotes(root, quality) {
  return (CHORD_INTERVALS[quality] || CHORD_INTERVALS.maj).map(
    (i) => ((root + i) % 12 + 12) % 12
  );
}

// ============================================================
// GUITAR SHAPES
// Open shapes (C/D/G/F/B7 families) + E-shape / A-shape barrés.
// Cordes : Mi grave, La, Ré, Sol, Si, Mi aigu.
// -1 = corde étouffée, 0 = corde à vide, N = frette N.
// ============================================================
const OPEN_CHORDS = {
  // C family
  '0-maj':  { frets: [-1, 3, 2, 0, 1, 0], barre: 0 },
  '0-7':    { frets: [-1, 3, 2, 3, 1, 0], barre: 0 },
  '0-maj7': { frets: [-1, 3, 2, 0, 0, 0], barre: 0 },
  '0-sus':  { frets: [-1, 3, 3, 0, 1, 1], barre: 0 },
  '0-sus2': { frets: [-1, 3, 0, 0, 1, 3], barre: 0 },
  '0-sus4': { frets: [-1, 3, 3, 0, 1, 1], barre: 0 },

  // D family
  '2-maj':  { frets: [-1, -1, 0, 2, 3, 2], barre: 0 },
  '2-min':  { frets: [-1, -1, 0, 2, 3, 1], barre: 0 },
  '2-7':    { frets: [-1, -1, 0, 2, 1, 2], barre: 0 },
  '2-maj7': { frets: [-1, -1, 0, 2, 2, 2], barre: 0 },
  '2-m7':   { frets: [-1, -1, 0, 2, 1, 1], barre: 0 },
  '2-sus':  { frets: [-1, -1, 0, 2, 3, 3], barre: 0 },
  '2-sus2': { frets: [-1, -1, 0, 2, 3, 0], barre: 0 },
  '2-sus4': { frets: [-1, -1, 0, 2, 3, 3], barre: 0 },

  // E family
  '4-sus':  { frets: [0, 2, 2, 2, 0, 0], barre: 0 },
  '4-sus2': { frets: [0, 2, 4, 4, 0, 0], barre: 0 },

  // F maj7 ouvert
  '5-maj7': { frets: [-1, -1, 3, 2, 1, 0], barre: 0 },

  // G family
  '7-maj':  { frets: [3, 2, 0, 0, 0, 3], barre: 0 },
  '7-7':    { frets: [3, 2, 0, 0, 0, 1], barre: 0 },
  '7-maj7': { frets: [3, 2, 0, 0, 0, 2], barre: 0 },
  '7-sus':  { frets: [3, 3, 0, 0, 1, 3], barre: 0 },
  '7-sus2': { frets: [3, 0, 0, 0, 3, 3], barre: 0 },
  '7-sus4': { frets: [3, 3, 0, 0, 1, 3], barre: 0 },

  // B7 (voicing ouvert classique)
  '11-7':   { frets: [-1, 2, 1, 2, 0, 2], barre: 0 },
};

// Templates barrés — la frette 0 du template = frette du barré.
const BARRE_SHAPES = {
  // E-shape (fondamentale sur Mi grave)
  E: {
    maj:  [0, 2, 2, 1, 0, 0],
    min:  [0, 2, 2, 0, 0, 0],
    '7':  [0, 2, 0, 1, 0, 0],
    maj7: [0, 2, 1, 1, 0, 0],
    m7:   [0, 2, 0, 0, 0, 0],
    '6':  [0, 2, 2, 1, 2, 0],
    m6:   [0, 2, 2, 0, 2, 0],
    add9: [0, 2, 2, 1, 0, 2],
    sus:  [0, 2, 2, 2, 0, 0],
    sus4: [0, 2, 2, 2, 0, 0],
  },
  // A-shape (fondamentale sur La)
  A: {
    maj:  [-1, 0, 2, 2, 2, 0],
    min:  [-1, 0, 2, 2, 1, 0],
    '7':  [-1, 0, 2, 0, 2, 0],
    maj7: [-1, 0, 2, 1, 2, 0],
    m7:   [-1, 0, 2, 0, 1, 0],
    '6':  [-1, 0, 2, 2, 2, 2],
    m6:   [-1, 0, 2, 2, 1, 2],
    m7b5: [-1, 0, 1, 0, 1, -1],
    sus:  [-1, 0, 2, 2, 3, 0],
    sus2: [-1, 0, 2, 2, 0, 0],
    sus4: [-1, 0, 2, 2, 3, 0],
  },
};

function getGuitarShape(root, quality) {
  // 1. Voicing ouvert prioritaire ?
  const openKey = `${root}-${quality}`;
  if (OPEN_CHORDS[openKey]) return OPEN_CHORDS[openKey];

  // 2. Sinon, calculer la position du barré.
  // Mi grave à vide = note 4, La à vide = note 9.
  const eFret = ((root - 4) % 12 + 12) % 12;
  const aFret = ((root - 9) % 12 + 12) % 12;

  const candidates = [];
  if (BARRE_SHAPES.E[quality]) candidates.push({ shape: BARRE_SHAPES.E[quality], fret: eFret, rootStr: 0 });
  if (BARRE_SHAPES.A[quality]) candidates.push({ shape: BARRE_SHAPES.A[quality], fret: aFret, rootStr: 1 });
  if (candidates.length === 0) return null;

  // Préférer le barré le plus bas sur le manche.
  candidates.sort((a, b) => a.fret - b.fret);
  const { shape, fret, rootStr } = candidates[0];

  const frets = shape.map((f) => (f === -1 ? -1 : f + fret));

  // Barré effectif uniquement si 2+ cordes pressent la même frette minimale.
  let barre = 0;
  if (fret > 0) {
    let count = 0;
    for (let i = rootStr; i < 6; i++) if (frets[i] === fret) count++;
    if (count >= 2) barre = fret;
  }

  return { frets, barre };
}

// ============================================================
// PROGRESSION RULES
// Compiled from common pop/rock/indie/shoegaze progressions.
// Each rule: offset (semitones), target quality, mood, description.
// ============================================================
const RULES = {
  maj: [
    { offset: 7,  quality: 'maj',  mood: 'brighter',    desc: 'V — lift lumineux' },
    { offset: 5,  quality: 'maj',  mood: 'joyful',      desc: 'IV — chaleur pastorale' },
    { offset: 9,  quality: 'min',  mood: 'melancholic', desc: 'vi — relative mineure' },
    { offset: 2,  quality: 'min',  mood: 'melancholic', desc: 'ii — pensif, jazzé' },
    { offset: 4,  quality: 'min',  mood: 'darker',      desc: 'iii — contemplatif' },
    { offset: 5,  quality: 'min',  mood: 'melancholic', desc: 'iv emprunté — crève-cœur' },
    { offset: 10, quality: 'maj',  mood: 'brighter',    desc: 'bVII — modal mixolydien' },
    { offset: 8,  quality: 'maj',  mood: 'darker',      desc: 'bVI — cinématique' },
    { offset: 7,  quality: '7',    mood: 'tense',       desc: 'V7 — dominante' },
    { offset: 0,  quality: 'maj7', mood: 'dreamy',      desc: 'Imaj7 — flou rêveur' },
  ],
  min: [
    { offset: 10, quality: 'maj',  mood: 'brighter',    desc: 'VII — lift modal' },
    { offset: 8,  quality: 'maj',  mood: 'melancholic', desc: 'VI — chaleur triste' },
    { offset: 3,  quality: 'maj',  mood: 'joyful',      desc: 'III — relative majeure' },
    { offset: 5,  quality: 'min',  mood: 'darker',      desc: 'iv — enfoncement' },
    { offset: 7,  quality: '7',    mood: 'tense',       desc: 'V7 — tension classique' },
    { offset: 7,  quality: 'maj',  mood: 'tense',       desc: 'V — dominante harmonique' },
    { offset: 5,  quality: 'maj',  mood: 'joyful',      desc: 'IV — éclat dorien' },
    { offset: 7,  quality: 'min',  mood: 'darker',      desc: 'v — mineur naturel' },
    { offset: 0,  quality: 'maj',  mood: 'joyful',      desc: 'I — tierce de Picardie' },
    { offset: 0,  quality: 'm7',   mood: 'dreamy',      desc: 'im7 — velours' },
  ],
  '7': [
    { offset: 5,  quality: 'maj',  mood: 'joyful',      desc: 'I — résolution majeure' },
    { offset: 5,  quality: 'min',  mood: 'darker',      desc: 'i — résolution mineure' },
    { offset: 9,  quality: 'min',  mood: 'melancholic', desc: 'vi — résolution déceptive' },
    { offset: 10, quality: 'maj',  mood: 'brighter',    desc: 'bVII — glissade blues' },
    { offset: 7,  quality: '7',    mood: 'tense',       desc: 'II7 — chaîne dominante' },
    { offset: 2,  quality: '7',    mood: 'tense',       desc: 'V7/V — dominante secondaire' },
  ],
  maj7: [
    { offset: 7,  quality: 'maj',  mood: 'brighter',    desc: 'V — lift' },
    { offset: 9,  quality: 'm7',   mood: 'melancholic', desc: 'vim7 — velours triste' },
    { offset: 2,  quality: 'm7',   mood: 'melancholic', desc: 'iim7 — jazzé' },
    { offset: 5,  quality: 'maj7', mood: 'dreamy',      desc: 'IVmaj7 — planant' },
    { offset: 4,  quality: 'm7',   mood: 'darker',      desc: 'iiim7 — voile' },
    { offset: 7,  quality: '7',    mood: 'tense',       desc: 'V7' },
    { offset: 0,  quality: 'maj',  mood: 'joyful',      desc: 'I — résolution claire' },
  ],
  m7: [
    { offset: 5,  quality: '7',    mood: 'tense',       desc: 'IV7 — jazz II-V' },
    { offset: 3,  quality: 'maj7', mood: 'dreamy',      desc: 'IIImaj7 — éclair de douceur' },
    { offset: 8,  quality: 'maj7', mood: 'melancholic', desc: 'VImaj7 — velours profond' },
    { offset: 10, quality: '7',    mood: 'brighter',    desc: 'VII7 — sortie modale' },
    { offset: 5,  quality: 'min',  mood: 'darker',      desc: 'iv' },
    { offset: 0,  quality: 'min',  mood: 'darker',      desc: 'im — retour brut' },
  ],
  sus2: [
    { offset: 0,  quality: 'maj',  mood: 'joyful',      desc: 'résolution majeure' },
    { offset: 0,  quality: 'min',  mood: 'melancholic', desc: 'résolution mineure' },
    { offset: 0,  quality: 'sus4', mood: 'dreamy',      desc: 'glissement vers sus4' },
    { offset: 7,  quality: 'maj',  mood: 'brighter',    desc: 'V — sans résoudre' },
    { offset: 5,  quality: 'maj',  mood: 'joyful',      desc: 'IV' },
    { offset: 9,  quality: 'min',  mood: 'melancholic', desc: 'vi' },
  ],
  sus: [
    { offset: 0,  quality: 'maj',  mood: 'joyful',      desc: 'résolution majeure — classique' },
    { offset: 0,  quality: 'min',  mood: 'melancholic', desc: 'résolution mineure — plus sombre' },
    { offset: 5,  quality: 'maj',  mood: 'joyful',      desc: 'IV — élan' },
    { offset: 7,  quality: 'maj',  mood: 'brighter',    desc: 'V — tension directe' },
    { offset: 7,  quality: 'sus',  mood: 'dreamy',      desc: 'Vsus — suspension enchaînée' },
    { offset: -5, quality: 'maj',  mood: 'melancholic', desc: 'I de la tonalité basse' },
  ],
  sus4: [
    { offset: 0,  quality: 'maj',  mood: 'joyful',      desc: 'résolution majeure (classique)' },
    { offset: 0,  quality: 'min',  mood: 'melancholic', desc: 'résolution mineure' },
    { offset: 0,  quality: 'sus2', mood: 'dreamy',      desc: 'glissement vers sus2' },
    { offset: 7,  quality: 'maj',  mood: 'brighter',    desc: 'V — direct' },
    { offset: 5,  quality: 'maj',  mood: 'joyful',      desc: 'IV' },
  ],
};

function getSuggestions(chord) {
  const rules = RULES[chord.quality] || RULES.maj;
  return rules.map((r, i) => ({
    id: `${chord.root}-${chord.quality}-${r.offset}-${r.quality}-${i}`,
    root: ((chord.root + r.offset) % 12 + 12) % 12,
    quality: r.quality,
    mood: r.mood,
    desc: r.desc,
  }));
}

// ============================================================
// SCALES (modes majeurs + mineurs harmonique/mélodique)
// Chaque gamme : intervalles depuis la tonique, qualité des
// accords triadiques diatoniques, et degré en chiffres romains.
// ============================================================
const SCALES = [
  { id: 'major',      name: 'majeure',                short: 'maj',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    qualities: ['maj','min','min','maj','maj','min','dim'],
    romans:    ['I','ii','iii','IV','V','vi','vii°'] },
  { id: 'minor',      name: 'mineure naturelle',      short: 'min',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    qualities: ['min','dim','maj','min','min','maj','maj'],
    romans:    ['i','ii°','III','iv','v','VI','VII'] },
  { id: 'dorian',     name: 'dorien',                 short: 'dor',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    qualities: ['min','min','maj','maj','min','dim','maj'],
    romans:    ['i','ii','III','IV','v','vi°','VII'] },
  { id: 'mixolydian', name: 'mixolydien',             short: 'mix',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    qualities: ['maj','min','dim','maj','min','min','maj'],
    romans:    ['I','ii','iii°','IV','v','vi','VII'] },
  { id: 'lydian',     name: 'lydien',                 short: 'lyd',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    qualities: ['maj','maj','min','dim','maj','min','min'],
    romans:    ['I','II','iii','iv°','V','vi','vii'] },
  { id: 'phrygian',   name: 'phrygien',               short: 'phr',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    qualities: ['min','maj','maj','min','dim','maj','min'],
    romans:    ['i','II','III','iv','v°','VI','vii'] },
  { id: 'harm_min',   name: 'mineure harmonique',     short: 'h.m',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    qualities: ['min','dim','aug','min','maj','maj','dim'],
    romans:    ['i','ii°','III+','iv','V','VI','vii°'] },
  { id: 'mel_min',    name: 'mineure mélodique',      short: 'm.m',
    intervals: [0, 2, 3, 5, 7, 9, 11],
    qualities: ['min','min','aug','maj','maj','dim','dim'],
    romans:    ['i','ii','III+','IV','V','vi°','vii°'] },
];

// Réduit la qualité de l'accord choisi à sa triade fondamentale
// pour la recherche dans les gammes (les 7/maj7/m7 contiennent
// déjà la triade).
function lookupQuality(quality) {
  if (['maj', 'maj7', '7', '6', 'add9'].includes(quality)) return 'maj';
  if (['min', 'm7', 'm6'].includes(quality))               return 'min';
  if (['dim', 'dim7', 'm7b5'].includes(quality))           return 'dim';
  return null; // sus2 / sus4 / aug sont ambigus
}

function findContainingScales(chord) {
  const target = lookupQuality(chord.quality);
  if (!target) return [];
  const results = [];
  for (const scale of SCALES) {
    for (let scaleRoot = 0; scaleRoot < 12; scaleRoot++) {
      for (let deg = 0; deg < 7; deg++) {
        const r = (scaleRoot + scale.intervals[deg]) % 12;
        if (r === chord.root && scale.qualities[deg] === target) {
          results.push({ scale, scaleRoot, degree: deg });
          break; // une gamme/racine ne donne qu'une seule occurrence
        }
      }
    }
  }
  return results;
}

function scaleChords(scale, scaleRoot) {
  return scale.intervals.map((iv, deg) => ({
    root:    (scaleRoot + iv) % 12,
    quality: scale.qualities[deg],
  }));
}

// Retourne toutes les gammes (scale × root) qui contiennent TOUS les accords
// de la progression (les accords sus, ambigus, sont ignorés pour le filtre).
// Chaque résultat porte un tableau `degrees` : l'index dans la gamme de chaque
// accord de la progression (dans l'ordre, après exclusion des sus).
function findScalesForProgression(progression) {
  const matchable = progression.filter(c => lookupQuality(c.quality) !== null);
  if (matchable.length === 0) return [];
  const results = [];
  for (const scale of SCALES) {
    for (let scaleRoot = 0; scaleRoot < 12; scaleRoot++) {
      const diatonic = scaleChords(scale, scaleRoot);
      const degrees  = [];
      let   allMatch = true;
      for (const chord of matchable) {
        const tq  = lookupQuality(chord.quality);
        const deg = diatonic.findIndex(dc => dc.root === chord.root && dc.quality === tq);
        if (deg === -1) { allMatch = false; break; }
        degrees.push(deg);
      }
      if (allMatch) results.push({ scale, scaleRoot, degrees });
    }
  }
  return results;
}

function scaleRootName(scale, scaleRoot) {
  // Côté majeur (maj, lyd, mix) → bémols ; côté mineur (toutes les autres) → dièses.
  const sharps = ['minor','dorian','phrygian','harm_min','mel_min'].includes(scale.id);
  return (sharps ? NOTE_MINOR : NOTE_MAJOR)[scaleRoot];
}

// ============================================================
// SECTION SUGGESTIONS (refrain / pont)
// Détecte la tonalité (majeure / mineure) qui colle le mieux à
// l'ensemble du couplet, puis propose des accords qui s'y marient.
// ============================================================
function detectKey(progression) {
  const candidates = SCALES.filter(s => s.id === 'major' || s.id === 'minor');
  let best = null;
  for (const scale of candidates) {
    for (let root = 0; root < 12; root++) {
      const diatonic = scaleChords(scale, root);
      let score = 0;
      for (const chord of progression) {
        const q = lookupQuality(chord.quality);
        if (q === null) continue;
        if (diatonic.some(dc => dc.root === chord.root && dc.quality === q)) score++;
      }
      const last  = progression[progression.length - 1];
      const first = progression[0];
      let bonus = 0;
      if (last  && last.root  === root) bonus += 0.6; // résolution sur la tonique
      if (first && first.root === root) bonus += 0.3; // départ sur la tonique
      const total = score + bonus;
      if (!best || total > best.total) best = { scale, root, total };
    }
  }
  return best;
}

function makeSuggestion(root, quality, roman, mood, desc) {
  const r = ((root % 12) + 12) % 12;
  return { id: `${r}-${quality}-${roman}`, root: r, quality, roman, mood, desc };
}

function getSectionSuggestions(progression) {
  const key = detectKey(progression);
  if (!key) return null;
  const R = key.root;
  const isMajor = key.scale.id === 'major';

  let refrain, pont;
  if (isMajor) {
    refrain = [
      makeSuggestion(R + 5, 'maj', 'IV',  'joyful',      'élan — ouvre grand le refrain'),
      makeSuggestion(R + 7, 'maj', 'V',   'brighter',    'tension lumineuse qui pousse'),
      makeSuggestion(R + 9, 'min', 'vi',  'melancholic', 'relief — la relative mineure'),
      makeSuggestion(R,     'maj', 'I',   'joyful',      'ancrage — retour à la maison'),
      makeSuggestion(R + 2, 'min', 'ii',  'dreamy',      'respiration avant la relance'),
    ];
    pont = [
      makeSuggestion(R + 4,  'min', 'iii',  'darker',   'médiane — contemplation'),
      makeSuggestion(R + 10, 'maj', 'bVII', 'brighter', 'emprunt modal — bouffée d\'air'),
      makeSuggestion(R + 8,  'maj', 'bVI',  'darker',   'couleur sombre, cinématique'),
      makeSuggestion(R + 2,  '7',   'V/V',  'tense',    'dominante secondaire — relance'),
    ];
  } else {
    refrain = [
      makeSuggestion(R + 8,  'maj', 'VI',  'melancholic', 'chaleur — soulève le refrain'),
      makeSuggestion(R + 10, 'maj', 'VII', 'brighter',    'lift modal vers la lumière'),
      makeSuggestion(R + 5,  'min', 'iv',  'darker',      'creuse l\'émotion'),
      makeSuggestion(R + 3,  'maj', 'III', 'joyful',      'éclaircie — la relative majeure'),
      makeSuggestion(R,      'min', 'i',   'melancholic', 'ancrage sombre'),
    ];
    pont = [
      makeSuggestion(R + 7, 'maj', 'V',   'tense',  'dominante — tension classique'),
      makeSuggestion(R + 7, 'min', 'v',   'dreamy', 'suspension modale douce'),
      makeSuggestion(R + 1, 'maj', 'bII', 'tense',  'napolitaine — couleur dramatique'),
      makeSuggestion(R + 2, 'min', 'ii',  'darker', 'couleur dorienne, feutrée'),
    ];
  }
  return { key, refrain, pont };
}

// ============================================================
// CONTEXT-AWARE SUGGESTIONS
// L'accord suivant est proposé en fonction de TOUTE la progression :
// on détecte la tonalité qui colle le mieux à l'ensemble des accords
// déjà choisis, puis on propose en priorité les accords diatoniques de
// cette tonalité (garantis consonants avec l'ensemble), ordonnés selon
// les tendances fonctionnelles réelles depuis le dernier accord.
//
// Sources des poids (tendances « accord suivant ») :
//  · Analyse Markov Hooktheory sur 1300 chansons (I 18,9 % / IV 17,2 % ;
//    après I → IV 46 % / V 26 % / vi ; après V → I 32 % / vi 29 % / IV 25 %)
//  · Carte d'harmonie fonctionnelle T → PD → D → T (Berklee / pratique commune)
//  · Cadences mineures usuelles : i-VI-VII, i-iv-V, andalouse i-VII-VI-V, iiø-V-i
// ============================================================

// degré (0-6) → liste [degré_suivant, poids] triée par poids décroissant.
const MAJOR_NEXT = {
  0: [[3, 1.00], [4, 0.92], [5, 0.78], [1, 0.60], [2, 0.40]], // I  → IV V vi ii iii
  1: [[4, 0.95], [3, 0.45], [6, 0.40], [0, 0.35], [5, 0.30]], // ii → V IV vii° I vi
  2: [[5, 0.82], [3, 0.62], [1, 0.42], [0, 0.35]],            // iii→ vi IV ii I
  3: [[4, 0.90], [0, 0.80], [1, 0.50], [5, 0.42]],            // IV → V I ii vi
  4: [[0, 0.95], [5, 0.72], [3, 0.48], [1, 0.30]],            // V  → I vi IV ii
  5: [[3, 0.85], [1, 0.72], [4, 0.60], [0, 0.45], [2, 0.38]], // vi → IV ii V I iii
  6: [[0, 0.95], [2, 0.40]],                                  // vii°→ I iii
};
const MINOR_NEXT = {
  0: [[5, 0.88], [3, 0.85], [6, 0.82], [4, 0.78], [2, 0.60]], // i  → VI iv VII V III
  1: [[4, 0.92], [0, 0.45]],                                  // iiø→ V i
  2: [[5, 0.82], [6, 0.62], [3, 0.50], [0, 0.40]],            // III→ VI VII iv i
  3: [[4, 0.85], [0, 0.72], [6, 0.60], [2, 0.42]],            // iv → V i VII III
  4: [[0, 0.95], [5, 0.72]],                                  // V  → i VI
  5: [[6, 0.85], [3, 0.62], [2, 0.55], [4, 0.50], [0, 0.42]], // VI → VII iv III V i
  6: [[2, 0.80], [0, 0.72], [5, 0.55]],                       // VII→ III i VI
};

const MAJOR_DESC = {
  0: 'I — ancrage, retour à la maison',
  1: 'ii — respiration jazzée avant la relance',
  2: 'iii — médiane contemplative',
  3: 'IV — chaleur, ouvre l\'espace',
  4: 'V — tension lumineuse qui pousse',
  5: 'vi — relative mineure, doux-amer',
  6: 'vii° — instable, appelle le retour à I',
};
const MINOR_DESC = {
  0: 'i — ancrage sombre',
  1: 'iiø — pré-dominante tendue',
  2: 'III — relative majeure, éclaircie',
  3: 'iv — creuse l\'émotion',
  4: 'V — dominante, tension classique',
  5: 'VI — chaleur mélancolique',
  6: 'VII — lift modal vers la lumière',
};
const MAJOR_MOOD = { 0: 'joyful', 1: 'dreamy', 2: 'darker', 3: 'joyful', 4: 'brighter', 5: 'melancholic', 6: 'tense' };
const MINOR_MOOD = { 0: 'melancholic', 1: 'tense', 2: 'joyful', 3: 'darker', 4: 'tense', 5: 'melancholic', 6: 'brighter' };

// Accords « couleur » empruntés, idiomatiques et consonants avec l'ensemble.
function colorChords(key) {
  const R = key.root;
  if (key.scale.id === 'major') {
    return [
      makeSuggestion((R + 10) % 12, 'maj', 'bVII', 'brighter',    'bVII — emprunt mixolydien, air frais'),
      makeSuggestion((R + 5)  % 12, 'min', 'iv',   'melancholic', 'iv — sous-dominante mineure, crève-cœur'),
      makeSuggestion((R + 7)  % 12, '7',   'V7',   'tense',       'V7 — dominante appuyée'),
    ];
  }
  return [
    makeSuggestion((R + 7) % 12, '7',   'V7', 'tense',  'V7 — dominante harmonique'),
    makeSuggestion((R + 5) % 12, 'maj', 'IV', 'joyful', 'IV — éclat dorien, lumière'),
    makeSuggestion( R       % 12, 'maj', 'I',  'joyful', 'I — tierce de Picardie, lueur'),
  ];
}

// Suggestions pour l'accord suivant, calées sur l'ENSEMBLE de la progression.
function getProgressionSuggestions(progression) {
  if (!progression || progression.length === 0) return [];
  const last = progression[progression.length - 1];
  const key  = detectKey(progression);
  // Pas de tonalité claire → repli sur les règles locales du dernier accord.
  if (!key) return getSuggestions(last);

  const isMajor  = key.scale.id === 'major';
  const diatonic = scaleChords(key.scale, key.root); // [{root, quality}] par degré

  // Degré du dernier accord dans la tonalité (par triade, sinon par fondamentale).
  const lastTriad = lookupQuality(last.quality);
  let lastDeg = diatonic.findIndex(d => d.root === last.root && (lastTriad === null || d.quality === lastTriad));
  if (lastDeg === -1) lastDeg = diatonic.findIndex(d => d.root === last.root);

  const table   = isMajor ? MAJOR_NEXT : MINOR_NEXT;
  const moodMap = isMajor ? MAJOR_MOOD : MINOR_MOOD;
  const descMap = isMajor ? MAJOR_DESC : MINOR_DESC;
  // Si le dernier accord est hors tonalité, on part du tonique.
  const entries = (lastDeg >= 0 && table[lastDeg]) ? table[lastDeg] : table[0];

  const list = [];
  const seen = new Set();
  const push = (s) => {
    const k = `${s.root}-${s.quality}`;
    if (!seen.has(k)) { seen.add(k); list.push(s); }
  };

  for (const [deg] of entries) {
    const base = diatonic[deg];
    let quality = base.quality;
    let roman   = key.scale.romans[deg];
    // Enrichissements fonctionnels en tonalité mineure.
    if (!isMajor && deg === 4) { quality = 'maj';  roman = 'V';  }   // dominante majeure (mineure harmonique)
    else if (!isMajor && deg === 1) { quality = 'm7b5'; roman = 'iiø'; } // demi-diminué
    push(makeSuggestion(base.root, quality, roman, moodMap[deg], descMap[deg]));
  }
  for (const c of colorChords(key)) push(c);

  return list.slice(0, 8);
}

// ============================================================
// MOODS
// ============================================================
const MOODS = {
  joyful:      { fr: 'plus joyeux',       Icon: Sun,            color: '#dcb05a' },
  brighter:    { fr: 'plus aigu',         Icon: ArrowUpRight,   color: '#8fbac8' },
  melancholic: { fr: 'plus mélancolique', Icon: CloudRain,      color: '#c58aa0' },
  darker:      { fr: 'plus grave',        Icon: ArrowDownRight, color: '#8a85b8' },
  tense:       { fr: 'tension',           Icon: Zap,            color: '#cc7a6e' },
  dreamy:      { fr: 'rêveur',            Icon: Sparkles,       color: '#b09ec8' },
};

// ============================================================
// STARTING CHORDS
// ============================================================
const COMMON_STARTERS = [
  { root: 0,  quality: 'maj' }, // C
  { root: 7,  quality: 'maj' }, // G
  { root: 2,  quality: 'maj' }, // D
  { root: 9,  quality: 'maj' }, // A
  { root: 4,  quality: 'maj' }, // E
  { root: 9,  quality: 'min' }, // Am
  { root: 4,  quality: 'min' }, // Em
  { root: 2,  quality: 'min' }, // Dm
  { root: 11, quality: 'min' }, // Bm
  { root: 5,  quality: 'maj' }, // F
  { root: 2,  quality: 'sus'  }, // Dsus
  { root: 9,  quality: 'sus'  }, // Asus
];

const ALL_QUALITIES = ['maj', 'min', '7', 'maj7', 'm7', '6', 'm6', 'add9', 'm7b5', 'sus2', 'sus', 'sus4', 'dim'];
const QUALITY_LABELS = {
  maj: 'majeur', min: 'mineur', '7': 'dom. 7',
  maj7: 'maj7', m7: 'm7', '6': '6', m6: 'm6', add9: 'add9', m7b5: 'm7♭5',
  sus: 'sus', sus2: 'sus2', sus4: 'sus4', dim: 'dim',
};

// ============================================================
// PIANO AUDIO — grand piano synthesis (Web Audio API)
// ============================================================
// PIANO AUDIO — grand piano chord synthesis (Web Audio API)
// ============================================================
const NOTE_FREQUENCIES = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88];

let _audioCtx = null;

// Returns frequencies for all chord notes, voiced above the root (octave 4).
function chordFrequencies(root, quality) {
  const intervals = CHORD_INTERVALS[quality] || CHORD_INTERVALS.maj;
  const rootFreq  = NOTE_FREQUENCIES[root];
  return intervals.map(iv => rootFreq * Math.pow(2, iv / 12));
}

async function playChord(root, quality) {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === 'suspended') await _audioCtx.resume();
    const ctx   = _audioCtx;
    const freqs = chordFrequencies(root, quality);
    const now   = ctx.currentTime;
    freqs.forEach(freq => {
      // Higher harmonics decay faster for piano-like brightness on attack
      [[1, 0.6, 3.5], [2, 0.32, 2.0], [3, 0.16, 1.2], [4, 0.07, 0.7], [5, 0.03, 0.4]].forEach(([n, amp, decay]) => {
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq * n * (1 + 3e-4 * n * n); // slight inharmonicity
        g.gain.setValueAtTime(amp / freqs.length, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + decay + 0.05);
      });
    });
  } catch (_) {}
}

// ============================================================
// SPOTIFY INTEGRATION (OAuth PKCE + Web API)
// ============================================================

const SPOTIFY_CLIENT_ID = '58d762bfddfa4593a35c7de8ed0bfc48';
function getSpotifyClientId()  { return localStorage.getItem('spotify_client_id') || SPOTIFY_CLIENT_ID; }
function getSpotifyToken() {
  const token  = localStorage.getItem('spotify_token');
  const expiry = localStorage.getItem('spotify_token_expiry');
  if (token && expiry && Date.now() < parseInt(expiry, 10)) return token;
  return null;
}
function clearSpotifyAuth() {
  ['spotify_token','spotify_token_expiry','spotify_state','spotify_verifier'].forEach(k => localStorage.removeItem(k));
}

function spotifyRedirectUri() {
  const p = window.location.pathname;
  return window.location.origin + (p.endsWith('/') ? p : p + '/');
}

// PKCE helpers
function genRandStr(n) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return btoa(String.fromCharCode(...a)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'').slice(0, n);
}
async function pkceChallenge(verifier) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}

async function initiateSpotifyLogin(clientId) {
  const verifier  = genRandStr(128);
  const challenge = await pkceChallenge(verifier);
  const state     = genRandStr(16);
  localStorage.setItem('spotify_verifier', verifier);
  localStorage.setItem('spotify_state',    state);
  const p = new URLSearchParams({
    response_type: 'code', client_id: clientId,
    scope: 'user-read-recently-played user-top-read',
    redirect_uri: spotifyRedirectUri(), state,
    code_challenge_method: 'S256', code_challenge: challenge,
  });
  window.location.href = 'https://accounts.spotify.com/authorize?' + p;
}

async function exchangeToken(code, clientId) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code', code,
      redirect_uri: spotifyRedirectUri(), client_id: clientId,
      code_verifier: localStorage.getItem('spotify_verifier') || '',
    }),
  });
  return res.json();
}

async function spotifyGet(path, token) {
  const res = await fetch('https://api.spotify.com/v1/' + path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error('401');
  if (!res.ok) throw new Error('spotify-' + res.status);
  return res.json();
}

// Top 100 tracks over the last ~6 months (medium_term); paginated (max 50/req).
async function fetchTopTracks(token) {
  const [a, b] = await Promise.all([
    spotifyGet('me/top/tracks?limit=50&time_range=medium_term&offset=0', token),
    spotifyGet('me/top/tracks?limit=50&time_range=medium_term&offset=50', token),
  ]);
  const items = [...(a.items || []), ...(b.items || [])];
  const seen = new Set();
  return items.filter(t => {
    if (!t || seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  }).map(t => ({ id: t.id, name: t.name, artist: t.artists[0].name }));
}

async function fetchAudioFeatures(token, ids) {
  if (!ids.length) return [];
  const data = await spotifyGet('audio-features?ids=' + ids.slice(0, 100).join(','), token);
  return data.audio_features || [];
}

function moodFromValence(v) {
  if (v > 0.7) return 'joyful';
  if (v > 0.5) return 'brighter';
  if (v > 0.3) return 'melancholic';
  return 'darker';
}

function processSpotifyData(tracks, features) {
  const map = {};
  tracks.forEach((track, i) => {
    const f = features[i];
    if (!f || f.key < 0) return;
    const id = `${f.key}-${f.mode}`;
    if (!map[id]) map[id] = { key: f.key, mode: f.mode, tracks: [], vSum: 0 };
    map[id].tracks.push(track);
    map[id].vSum += (f.valence ?? 0.5);
  });

  return Object.values(map)
    .sort((a, b) => b.tracks.length - a.tracks.length)
    .slice(0, 4)
    .map(g => {
      const isMajor = g.mode === 1;
      const scale   = SCALES.find(s => s.id === (isMajor ? 'major' : 'minor'));
      const root    = g.key;
      const name    = scaleRootName(scale, root);
      const top3    = g.tracks.slice(0, 3);
      const attr    = top3.slice(0, 2).map(t => `${t.artist} – ${t.name}`).join(' · ');
      const suggestions = (isMajor ? [
        makeSuggestion(root,      'maj', 'I',   'joyful',      attr),
        makeSuggestion(root + 9,  'min', 'vi',  'melancholic', attr),
        makeSuggestion(root + 5,  'maj', 'IV',  'joyful',      attr),
        makeSuggestion(root + 7,  'maj', 'V',   'brighter',    attr),
        makeSuggestion(root + 2,  'min', 'ii',  'dreamy',      attr),
      ] : [
        makeSuggestion(root,      'min', 'i',   'melancholic', attr),
        makeSuggestion(root + 8,  'maj', 'VI',  'melancholic', attr),
        makeSuggestion(root + 10, 'maj', 'VII', 'brighter',    attr),
        makeSuggestion(root + 5,  'min', 'iv',  'darker',      attr),
        makeSuggestion(root + 3,  'maj', 'III', 'joyful',      attr),
      // prefix ids to avoid key collisions across groups
      ]).map(s => ({ ...s, id: `sp${root}${g.mode}-${s.id}` }));
      return { name, isMajor, count: g.tracks.length, mood: moodFromValence(g.vSum / g.tracks.length), suggestions, sourceTracks: top3 };
    });
}

async function fetchTopArtists(token) {
  const data = await spotifyGet('me/top/artists?limit=50&time_range=medium_term', token);
  return data.items || [];
}

// Fallback when audio-features is unavailable: infer a major/minor leaning
// from the genres of the user's top artists, then propose chords in
// representative keys for that leaning.
function processGenreData(artists) {
  const count = {};
  artists.forEach(a => (a.genres || []).forEach(g => { count[g] = (count[g] || 0) + 1; }));
  const topGenres = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 6).map(e => e[0]);

  const darkKw   = ['sad','doom','black metal','death','emo','shoegaze','gothic','darkwave','post-punk','slowcore','metal','grunge','blues','ambient','sadcore','dark'];
  const brightKw = ['pop','dance','disco','funk','tropical','reggae','afrobeat','house','synthpop','k-pop','happy'];
  let dark = 0, bright = 0;
  topGenres.forEach(g => {
    if (darkKw.some(k => g.includes(k)))   dark++;
    if (brightKw.some(k => g.includes(k))) bright++;
  });
  const leanMinor = dark >= bright;

  const picks = leanMinor
    ? [{ root: 9, major: false }, { root: 4, major: false }, { root: 2, major: false }] // Am Em Dm
    : [{ root: 0, major: true  }, { root: 7, major: true  }, { root: 9, major: true  }]; // C G A

  const attr = (topGenres.slice(0, 3).join(' · ')) || artists.slice(0, 3).map(a => a.name).join(' · ');
  const tags = (topGenres.length ? topGenres.slice(0, 3) : artists.slice(0, 3).map(a => a.name)).map(g => ({ artist: '', name: g }));

  return picks.map(p => {
    const scale = SCALES.find(s => s.id === (p.major ? 'major' : 'minor'));
    const root  = p.root;
    const suggestions = (p.major ? [
      makeSuggestion(root,      'maj', 'I',   'joyful',      attr),
      makeSuggestion(root + 9,  'min', 'vi',  'melancholic', attr),
      makeSuggestion(root + 5,  'maj', 'IV',  'joyful',      attr),
      makeSuggestion(root + 7,  'maj', 'V',   'brighter',    attr),
      makeSuggestion(root + 2,  'min', 'ii',  'dreamy',      attr),
    ] : [
      makeSuggestion(root,      'min', 'i',   'melancholic', attr),
      makeSuggestion(root + 8,  'maj', 'VI',  'melancholic', attr),
      makeSuggestion(root + 10, 'maj', 'VII', 'brighter',    attr),
      makeSuggestion(root + 5,  'min', 'iv',  'darker',      attr),
      makeSuggestion(root + 3,  'maj', 'III', 'joyful',      attr),
    ]).map(s => ({ ...s, id: `gn${root}${p.major ? 1 : 0}-${s.id}` }));
    return { name: scaleRootName(scale, root), isMajor: p.major, count: null, mood: leanMinor ? 'melancholic' : 'joyful', suggestions, sourceTracks: tags, genreBased: true };
  });
}

// ============================================================
// HOOKTHEORY (real-world chord trends, via Cloudflare proxy)
// ============================================================
function getHtProxy() { return localStorage.getItem('ht_proxy') || ''; }

const HT_MAJOR_DEG = { 0:1, 2:2, 4:3, 5:4, 7:5, 9:6, 11:7 };  // interval → scale degree
const HT_DEG_IV    = { 1:0, 2:2, 3:4, 4:5, 5:7, 6:9, 7:11 };  // degree → interval
const HT_DEG_QUAL  = { 1:'maj', 2:'min', 3:'min', 4:'maj', 5:'maj', 6:'min', 7:'dim' };

// Reference major tonic (minor keys are mapped to their relative major).
function htRefTonic(progression) {
  const key = detectKey(progression);
  if (!key) return progression[0] ? progression[0].root : 0;
  return key.scale.id === 'major' ? key.root : (key.root + 3) % 12;
}

// Hooktheory child-path built from the diatonic tail of the progression.
function htBuildCp(progression) {
  const tonic = htRefTonic(progression);
  let degs = [];
  for (const c of progression) {
    const iv = ((c.root - tonic) % 12 + 12) % 12;
    const d = HT_MAJOR_DEG[iv];
    if (d === undefined) { degs = []; continue; } // non-diatonic chord resets the path
    degs.push(d);
  }
  return { tonic, cp: degs.slice(-4).join(',') };
}

async function htFetch(kind, cp) {
  const base = getHtProxy();
  if (!base) throw new Error('no-proxy');
  const res = await fetch(`${base.replace(/\/$/, '')}/${kind}?cp=${encodeURIComponent(cp)}`);
  if (!res.ok) throw new Error('ht-' + res.status);
  return res.json();
}

function htParseNodes(nodes, tonic) {
  return (nodes || []).map(n => {
    const deg = parseInt(String(n.chord_ID ?? n.id ?? ''), 10);
    if (!Object.prototype.hasOwnProperty.call(HT_DEG_IV, deg)) return null; // skip applied/borrowed
    return {
      root: (tonic + HT_DEG_IV[deg]) % 12,
      quality: HT_DEG_QUAL[deg],
      prob: Number(n.probability) || 0,
    };
  }).filter(Boolean).sort((a, b) => b.prob - a.prob).slice(0, 6);
}

function htParseSongs(songs) {
  return (songs || []).map(s => ({
    artist: s.artist || '',
    song: s.song || s.name || '',
  })).filter(s => s.song).slice(0, 8);
}

// ============================================================
// APP
// ============================================================
export default function App() {
  const [progression, setProgression] = useState([]);
  const [showGuitar, setShowGuitar]   = useState(true);
  const [showPiano,  setShowPiano]    = useState(true);
  const [view, setView]               = useState('build');       // 'build' | 'final'
  const [editingIndex, setEditingIndex] = useState(null);        // index of the chord being edited
  const [showScales, setShowScales]   = useState(false);
  const currentChord = progression[progression.length - 1];
  // Clé de dépendance : toute la progression (les suggestions tiennent compte
  // de l'ensemble des accords, pas seulement du dernier).
  const progKey = progression.map(c => `${c.root}-${c.quality}`).join(',');
  const suggestions = useMemo(
    () => getProgressionSuggestions(progression),
    [progKey] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleStarter = (chord) => setProgression([{ ...chord, mood: null }]);
  const handleSuggestion = (s) => setProgression(p => [...p, s]);

  // Ajoute un accord brut (depuis la vue gammes / choix libre) en dérivant
  // l'humeur s'il correspond à une suggestion contextuelle de la progression.
  const handleAddChord = (chord) => {
    setProgression(p => {
      let mood = null;
      if (p.length) {
        const sugg = getProgressionSuggestions(p);
        const match = sugg.find(s => s.root === chord.root && s.quality === chord.quality);
        if (match) mood = match.mood;
      }
      return [...p, { root: chord.root, quality: chord.quality, mood }];
    });
  };

  const handleEdit       = (i) => setEditingIndex(i);
  const handleCancelEdit = ()  => setEditingIndex(null);
  const handleReplace = (newChord) => {
    setProgression(p => {
      const updated = [...p];
      const i = editingIndex;
      if (i === null || i < 0 || i >= updated.length) return p;
      if (i === 0) {
        // Replacing the starter: no previous chord, mood stays null.
        updated[0] = { root: newChord.root, quality: newChord.quality, mood: null };
      } else {
        // Dérive l'humeur des suggestions contextuelles (tous les accords amont).
        const sugg = getProgressionSuggestions(updated.slice(0, i));
        const match = sugg.find(s => s.root === newChord.root && s.quality === newChord.quality);
        updated[i] = {
          root: newChord.root,
          quality: newChord.quality,
          mood: match ? match.mood : null,
        };
      }
      return updated;
    });
    setEditingIndex(null);
  };

  const handleJump  = (i) => { setProgression(p => p.slice(0, i + 1)); setEditingIndex(null); };
  const handleUndo  = ()  => setProgression(p => p.slice(0, -1));
  const handleReset = ()  => { setProgression([]); setView('build'); setEditingIndex(null); };

  const handleValidate      = () => { setEditingIndex(null); setView('final'); };
  const handleBackToEdit    = () => setView('build');
  const handleCompose       = () => setView('section');
  const handleOpenSpotify   = () => setView('spotify');
  const handleSpotifyStart  = (chord) => {
    setProgression([{ root: chord.root, quality: chord.quality, mood: null }]);
    setView('build');
  };

  // Handle Spotify OAuth callback (page load after redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get('code');
    const state  = params.get('state');
    const err    = params.get('error');
    if (err) { window.history.replaceState({}, '', window.location.pathname); return; }
    if (code && state && state === localStorage.getItem('spotify_state')) {
      window.history.replaceState({}, '', window.location.pathname);
      const cid = getSpotifyClientId();
      exchangeToken(code, cid).then(data => {
        if (data.access_token) {
          localStorage.setItem('spotify_token',        data.access_token);
          localStorage.setItem('spotify_token_expiry', String(Date.now() + data.expires_in * 1000));
          localStorage.removeItem('spotify_state');
          localStorage.removeItem('spotify_verifier');
          setView('spotify');
        }
      }).catch(() => {});
    }
  }, []);

  // Keyboard shortcut: press A–G to play that chord with the current quality.
  const currentChordRef = useRef(null);
  useEffect(() => { currentChordRef.current = currentChord; });
  useEffect(() => {
    const KEY_ROOT = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
    const onKeyDown = (e) => {
      if (e.repeat) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const root = KEY_ROOT[e.key.toLowerCase()];
      if (root !== undefined) {
        const quality = currentChordRef.current?.quality ?? 'maj';
        playChord(root, quality);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{
        backgroundColor: '#14121c',
        color: '#ede5d8',
        fontFamily: "'Manrope', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;1,400;1,500&family=Manrope:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

        .f-display { font-family: 'Fraunces', Georgia, serif; }
        .f-mono    { font-family: 'JetBrains Mono', ui-monospace, monospace; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-fade { animation: fadeUp 0.5s cubic-bezier(0.2, 0.7, 0.3, 1) backwards; }

        .grain {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
          mix-blend-mode: overlay;
        }

        .suggestion-card {
          border: 1px solid #3a334a;
          background-color: #1d1a28;
          transition: border-color 0.2s, background-color 0.2s, transform 0.15s;
        }
        @media (hover: hover) {
          .suggestion-card:hover {
            border-color: var(--mood-border);
            background-color: var(--mood-bg);
          }
        }
        .suggestion-card:active {
          border-color: var(--mood-border);
          background-color: var(--mood-bg);
          transform: scale(0.985);
        }

        ::-webkit-scrollbar       { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #1d1a28; }
        ::-webkit-scrollbar-thumb { background: #3a334a; border-radius: 3px; }
      `}</style>

      {/* grain overlay */}
      <div className="grain fixed inset-0 pointer-events-none opacity-20 z-[1]" />

      {view === 'spotify' ? (
        <SpotifyScreen onStart={handleSpotifyStart} onBack={() => setView('build')} />
      ) : progression.length === 0 ? (
        <ChordPicker onSelect={handleStarter} onSpotify={handleOpenSpotify} />
      ) : view === 'section' ? (
        <SectionScreen
          verse={progression}
          onBack={() => setView('final')}
          onReset={handleReset}
        />
      ) : view === 'final' ? (
        <FinalScreen
          progression={progression}
          onBack={handleBackToEdit}
          onReset={handleReset}
          onCompose={handleCompose}
          showGuitar={showGuitar}
          showPiano={showPiano}
          setShowGuitar={setShowGuitar}
          setShowPiano={setShowPiano}
        />
      ) : (
        <BuildScreen
          progression={progression}
          currentChord={currentChord}
          suggestions={suggestions}
          editingIndex={editingIndex}
          onSuggestion={handleSuggestion}
          onAddChord={handleAddChord}
          onEdit={handleEdit}
          onCancelEdit={handleCancelEdit}
          onReplace={handleReplace}
          onJump={handleJump}
          onUndo={handleUndo}
          onReset={handleReset}
          onValidate={handleValidate}
          showGuitar={showGuitar}
          showPiano={showPiano}
          showScales={showScales}
          setShowGuitar={setShowGuitar}
          setShowPiano={setShowPiano}
          setShowScales={setShowScales}
        />
      )}
    </div>
  );
}

// ============================================================
// CHORD PICKER (initial screen)
// ============================================================
function ChordPicker({ onSelect, onSpotify }) {
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
      <div className="anim-fade">
        <div className="text-[10px] tracking-[0.3em] uppercase mb-3 flex items-center gap-3" style={{ color: '#7a7488' }}>
          <span>· 00 ·</span>
          <span style={{ opacity: 0.5 }}>commencer</span>
          <span className="flex-1 h-px" style={{ backgroundColor: '#3a334a' }} />
        </div>
        <h1 className="f-display italic leading-[0.85] tracking-tight" style={{ fontSize: 'clamp(72px, 18vw, 128px)', color: '#ede5d8' }}>
          verse
        </h1>
        <p className="f-mono text-[11px] mt-4 tracking-wider max-w-xs leading-relaxed" style={{ color: '#968ea0' }}>
          un constructeur d'enchaînements<br />
          d'accords pour guitares<br />
          <span className="f-display italic" style={{ color: '#c58aa0' }}>qui pleurent</span>
        </p>
      </div>

      <div className="h-px my-12 anim-fade" style={{ backgroundColor: '#3a334a', animationDelay: '100ms' }} />

      <div className="anim-fade" style={{ animationDelay: '180ms' }}>
        <p className="text-sm font-light mb-6 tracking-wide" style={{ color: '#a8a0b8' }}>
          Quel accord jouez-vous&nbsp;?
        </p>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
          {COMMON_STARTERS.map((c, i) => (
            <button
              key={i}
              onClick={() => onSelect(c)}
              className="anim-fade f-mono text-lg sm:text-xl py-4 rounded-sm transition-all duration-200"
              style={{
                color: '#ede5d8',
                backgroundColor: '#1d1a28',
                border: '1px solid #3a334a',
                animationDelay: `${200 + i * 30}ms`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6a5e80'; e.currentTarget.style.backgroundColor = '#252237'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3a334a'; e.currentTarget.style.backgroundColor = '#1d1a28'; }}
            >
              {chordName(c.root, c.quality)}
            </button>
          ))}
        </div>

        {!showAll ? (
          <button
            onClick={() => setShowAll(true)}
            className="text-[11px] tracking-[0.2em] uppercase transition-colors"
            style={{ color: '#968ea0' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ede5d8'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#968ea0'}
          >
            + tous les accords
          </button>
        ) : (
          <AllChordsGrid onSelect={onSelect} onClose={() => setShowAll(false)} />
        )}
      </div>

      <div className="mt-16 anim-fade" style={{ animationDelay: '600ms' }}>
        <p className="text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: '#5a526a' }}>légende des humeurs</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {Object.entries(MOODS).map(([key, m]) => {
            const Icon = m.Icon;
            return (
              <div key={key} className="flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase" style={{ color: m.color }}>
                <Icon className="w-3 h-3" strokeWidth={1.5} />
                <span>{m.fr}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-10 anim-fade" style={{ animationDelay: '750ms' }}>
        <div className="h-px mb-6" style={{ backgroundColor: '#3a334a', opacity: 0.4 }} />
        <button
          onClick={onSpotify}
          className="f-mono text-[11px] tracking-[0.2em] uppercase flex items-center gap-2 transition-colors"
          style={{ color: '#968ea0' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#1db954'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#968ea0'}
        >
          <span style={{ color: '#1db954' }}>●</span>
          partir de vos écoutes Spotify
        </button>
      </div>
    </div>
  );
}

function AllChordsGrid({ onSelect, onClose }) {
  const [quality, setQuality] = useState('maj');

  return (
    <div className="anim-fade mt-2">
      <div className="flex flex-wrap gap-1.5 mb-3">
        {ALL_QUALITIES.map(q => {
          const selected = quality === q;
          return (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className="f-mono text-[10px] px-2.5 py-1 rounded-sm tracking-[0.12em] uppercase transition-all"
              style={{
                backgroundColor: selected ? '#ede5d8' : '#1d1a28',
                color: selected ? '#14121c' : '#968ea0',
              }}
            >
              {QUALITY_LABELS[q]}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
        {Array.from({ length: 12 }, (_, root) => (
          <button
            key={root}
            onClick={() => onSelect({ root, quality })}
            className="f-mono text-sm sm:text-base py-3 rounded-sm transition-all"
            style={{ color: '#ede5d8', backgroundColor: '#1d1a28', border: '1px solid #3a334a' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6a5e80'; e.currentTarget.style.backgroundColor = '#252237'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3a334a'; e.currentTarget.style.backgroundColor = '#1d1a28'; }}
          >
            {chordName(root, quality)}
          </button>
        ))}
      </div>
      <button
        onClick={onClose}
        className="mt-3 text-[10px] tracking-[0.2em] uppercase transition-colors"
        style={{ color: '#7a7488' }}
      >
        − replier
      </button>
    </div>
  );
}

// ============================================================
// BUILD SCREEN
// ============================================================
function BuildScreen({ progression, currentChord, suggestions, editingIndex,
                       onSuggestion, onAddChord, onEdit, onCancelEdit, onReplace, onJump,
                       onUndo, onReset, onValidate,
                       showGuitar, showPiano, showScales,
                       setShowGuitar, setShowPiano, setShowScales }) {
  const isEditing   = editingIndex !== null;
  const focusedChord = isEditing ? progression[editingIndex] : currentChord;
  const prevChord    = isEditing && editingIndex > 0 ? progression[editingIndex - 1] : null;
  // Suggestions d'édition : fondées sur tous les accords AMONT de celui édité,
  // pour rester cohérent avec l'ensemble de la progression.
  const editContextKey = isEditing
    ? progression.slice(0, editingIndex).map(c => `${c.root}-${c.quality}`).join(',')
    : '';
  const editSuggestions = useMemo(
    () => (isEditing && editingIndex > 0) ? getProgressionSuggestions(progression.slice(0, editingIndex)) : [],
    [editContextKey, isEditing, editingIndex] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  return (
    <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
      {/* header */}
      <div className="mb-6 anim-fade">
        <div className="text-[10px] tracking-[0.3em] uppercase mb-2 flex items-center gap-3" style={{ color: '#7a7488' }}>
          <span>· {String(progression.length).padStart(2, '0')} ·</span>
          <span style={{ opacity: 0.5 }}>enchaînement</span>
          <span className="flex-1 h-px" style={{ backgroundColor: '#3a334a' }} />
        </div>
        <h1 className="f-display italic text-2xl" style={{ color: '#ede5d8' }}>verse</h1>
      </div>

      {/* progression trail */}
      <div className="mb-4">
        <div className="text-[10px] tracking-[0.25em] uppercase mb-2 flex items-center gap-2" style={{ color: '#7a7488' }}>
          <span>votre progression</span>
          <span style={{ opacity: 0.5 }}>· touchez un accord pour le modifier</span>
        </div>
        <ProgressionTrail progression={progression} onEdit={onEdit} editingIndex={editingIndex} />
      </div>

      {/* focused chord (current — or the one being edited) */}
      {isEditing && (
        <div className="text-center mt-6 mb-1 anim-fade">
          <div className="f-mono text-[10px] tracking-[0.25em] uppercase" style={{ color: '#c58aa0' }}>
            modification · accord nº {String(editingIndex + 1).padStart(2, '0')}
          </div>
        </div>
      )}
      <CurrentChordDisplay chord={focusedChord} />

      {/* diagrammes guitare / piano / gammes */}
      <ChordDiagrams
        chord={focusedChord}
        progression={progression}
        showGuitar={showGuitar}
        showPiano={showPiano}
        showScales={showScales}
        setShowGuitar={setShowGuitar}
        setShowPiano={setShowPiano}
        setShowScales={setShowScales}
        onAddChord={onAddChord}
      />

      {/* edit panel OR suggestions */}
      {isEditing ? (
        <EditPanel
          index={editingIndex}
          chord={progression[editingIndex]}
          prevChord={prevChord}
          editSuggestions={editSuggestions}
          isLast={editingIndex === progression.length - 1}
          onReplace={onReplace}
          onJump={onJump}
          onCancel={onCancelEdit}
        />
      ) : (
        <div className="mt-8">
          <div className="text-[10px] tracking-[0.25em] uppercase mb-3 flex items-center gap-3" style={{ color: '#7a7488' }}>
            <span>les accords qui suivent</span>
            <span className="flex-1 h-px" style={{ backgroundColor: '#3a334a', opacity: 0.5 }} />
          </div>
          <SuggestionsGrid suggestions={suggestions} onSelect={onSuggestion} />
          <HooktheoryPanel progression={progression} onAdd={onAddChord} />

          {/* free chord picker */}
          <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(58,51,74,0.4)' }}>
            <button
              onClick={() => setShowCustomPicker(s => !s)}
              className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase transition-colors"
              style={{ color: showCustomPicker ? '#ede5d8' : '#7a7488' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ede5d8'}
              onMouseLeave={e => e.currentTarget.style.color = showCustomPicker ? '#ede5d8' : '#7a7488'}
            >
              <span className="f-mono" style={{ fontSize: 13, lineHeight: 1 }}>{showCustomPicker ? '−' : '+'}</span>
              choisir un accord librement
            </button>
            {showCustomPicker && (
              <CustomChordPicker
                onSelect={c => { onAddChord(c); setShowCustomPicker(false); }}
              />
            )}
          </div>
        </div>
      )}

      {/* validate */}
      {progression.length >= 2 && !isEditing && (
        <button
          onClick={onValidate}
          className="mt-8 w-full f-mono text-[11px] tracking-[0.25em] uppercase py-3 rounded-sm transition-all flex items-center justify-center gap-2 anim-fade"
          style={{ color: '#ede5d8', backgroundColor: '#252237', border: '1px solid #5a526a' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2e2a40'; e.currentTarget.style.borderColor = '#7a6f92'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#252237'; e.currentTarget.style.borderColor = '#5a526a'; }}
        >
          <Check className="w-3.5 h-3.5" strokeWidth={1.5} />
          valider la progression
        </button>
      )}

      <Controls onUndo={onUndo} onReset={onReset} canUndo={progression.length > 0} />
    </div>
  );
}

function ProgressionTrail({ progression, onEdit, editingIndex }) {
  return (
    <div className="overflow-x-auto pb-1 -mx-1">
      <div className="flex items-center gap-1 px-1 whitespace-nowrap" style={{ minWidth: 'max-content' }}>
        {progression.map((c, i) => {
          const mood = c.mood ? MOODS[c.mood] : null;
          const isLast    = i === progression.length - 1;
          const isEditing = i === editingIndex;
          let bg     = 'transparent';
          let color  = '#a8a0b8';
          let border = '1px solid transparent';
          if (isEditing) {
            bg = '#332639'; color = '#ede5d8'; border = '1px solid #c58aa0';
          } else if (isLast) {
            bg = '#252237'; color = '#ede5d8'; border = '1px solid #5a526a';
          }
          return (
            <React.Fragment key={i}>
              {mood && (
                <span
                  className="px-1 flex items-center justify-center"
                  style={{ color: mood.color }}
                  title={mood.fr}
                >
                  <mood.Icon className="w-3 h-3" strokeWidth={1.5} />
                </span>
              )}
              <button
                onClick={() => onEdit(i)}
                className="f-mono text-sm px-2.5 py-1.5 rounded-sm transition-all"
                style={{ color, backgroundColor: bg, border }}
              >
                {chordName(c.root, c.quality)}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function CurrentChordDisplay({ chord }) {
  return (
    <div className="text-center my-6 sm:my-10 anim-fade" key={`${chord.root}-${chord.quality}`}>
      <div
        className="f-display italic leading-[0.9] tracking-tight"
        style={{ fontSize: 'clamp(96px, 26vw, 168px)', color: '#ede5d8' }}
      >
        {chordName(chord.root, chord.quality)}
      </div>
    </div>
  );
}

function SuggestionsGrid({ suggestions, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {suggestions.map((s, i) => {
        const mood = MOODS[s.mood];
        const Icon = mood.Icon;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="anim-fade suggestion-card text-left p-3 sm:p-4 rounded-sm"
            style={{
              animationDelay: `${i * 35}ms`,
              '--mood-border': mood.color + '88',
              '--mood-bg':     mood.color + '14',
            }}
          >
            <div
              className="flex items-center gap-1.5 mb-2 text-[9px] sm:text-[10px] tracking-[0.18em] uppercase"
              style={{ color: mood.color }}
            >
              <Icon className="w-3 h-3 shrink-0" strokeWidth={1.5} />
              <span className="truncate">{mood.fr}</span>
            </div>
            <div className="f-mono text-xl sm:text-2xl mb-1 leading-none flex items-baseline gap-1.5" style={{ color: '#ede5d8' }}>
              <span>{chordName(s.root, s.quality)}</span>
              {s.roman && <span className="text-[10px]" style={{ color: '#7a7488' }}>{s.roman}</span>}
            </div>
            <div className="f-display italic text-[11px] leading-tight mt-1.5" style={{ color: '#7a7488' }}>
              {s.desc}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// CUSTOM CHORD PICKER (ajout libre d'un accord)
// ============================================================
function CustomChordPicker({ onSelect }) {
  const [quality, setQuality] = useState('maj');

  return (
    <div className="mt-4 anim-fade">
      {/* quality selector */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {ALL_QUALITIES.map(q => {
          const sel = quality === q;
          return (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className="f-mono text-[10px] px-2.5 py-1 rounded-sm tracking-[0.12em] uppercase transition-all"
              style={{
                backgroundColor: sel ? '#3a2f4a' : '#1d1a28',
                color:           sel ? '#ede5d8' : '#968ea0',
                border:         `1px solid ${sel ? '#6a5e80' : '#3a334a'}`,
              }}
            >
              {QUALITY_LABELS[q]}
            </button>
          );
        })}
      </div>

      {/* 12 notes */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
        {Array.from({ length: 12 }, (_, root) => {
          const name = chordName(root, quality);
          return (
            <button
              key={root}
              onClick={() => { playChord(root, quality); onSelect({ root, quality }); }}
              className="f-mono text-sm py-3 rounded-sm transition-all"
              style={{ color: '#ede5d8', backgroundColor: '#1d1a28', border: '1px solid #3a334a' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#6a5e80';
                e.currentTarget.style.backgroundColor = '#252237';
                playChord(root, quality);
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#3a334a';
                e.currentTarget.style.backgroundColor = '#1d1a28';
              }}
            >
              {name}
            </button>
          );
        })}
      </div>
      <p className="f-mono text-[10px] mt-2 tracking-wide" style={{ color: '#5a526a' }}>
        passez la souris pour écouter · cliquez pour ajouter
      </p>
    </div>
  );
}

function Controls({ onUndo, onReset, canUndo }) {
  return (
    <div className="mt-10 pt-6 flex items-center gap-5" style={{ borderTop: '1px solid rgba(58, 51, 74, 0.5)' }}>
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors"
        style={{ color: '#968ea0', opacity: canUndo ? 1 : 0.3, cursor: canUndo ? 'pointer' : 'not-allowed' }}
        onMouseEnter={(e) => { if (canUndo) e.currentTarget.style.color = '#ede5d8'; }}
        onMouseLeave={(e) => e.currentTarget.style.color = '#968ea0'}
      >
        <Undo2 className="w-3 h-3" strokeWidth={1.5} />
        retour
      </button>
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors"
        style={{ color: '#968ea0' }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#ede5d8'}
        onMouseLeave={(e) => e.currentTarget.style.color = '#968ea0'}
      >
        <RotateCcw className="w-3 h-3" strokeWidth={1.5} />
        recommencer
      </button>
    </div>
  );
}

// ============================================================
// CHORD DIAGRAMS (guitare + piano)
// ============================================================
function ChordDiagrams({ chord, progression, showGuitar, showPiano, showScales,
                         setShowGuitar, setShowPiano, setShowScales, onAddChord }) {
  const both = showGuitar && showPiano;
  const any  = showGuitar || showPiano;
  const hasScales = typeof setShowScales === 'function';

  return (
    <div className="my-6" key={`${chord.root}-${chord.quality}`}>
      <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
        <DiagramPill active={showGuitar} onClick={() => setShowGuitar(!showGuitar)}>guitare</DiagramPill>
        <DiagramPill active={showPiano}  onClick={() => setShowPiano(!showPiano)}>piano</DiagramPill>
        {hasScales && (
          <DiagramPill active={showScales} onClick={() => setShowScales(!showScales)}>gammes</DiagramPill>
        )}
      </div>

      {any && (
        <div
          className={`flex ${both ? 'flex-col sm:flex-row' : 'flex-col'} items-center justify-center gap-6 sm:gap-10 anim-fade`}
        >
          {showGuitar && (
            <div className="flex flex-col items-center">
              <GuitarDiagram chord={chord} />
              <div className="f-mono text-[9px] tracking-[0.25em] uppercase mt-2" style={{ color: '#7a7488' }}>
                guitare
              </div>
            </div>
          )}
          {showPiano && (
            <div className="flex flex-col items-center">
              <PianoDiagram chord={chord} />
              <div className="f-mono text-[9px] tracking-[0.25em] uppercase mt-2" style={{ color: '#7a7488' }}>
                piano
              </div>
            </div>
          )}
        </div>
      )}

      {hasScales && showScales && (
        <ScalesPanel chord={chord} progression={progression} onAdd={onAddChord} />
      )}
    </div>
  );
}

function DiagramPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="f-mono text-[10px] tracking-[0.18em] uppercase px-3 py-1.5 rounded-sm transition-all"
      style={{
        backgroundColor: active ? '#252237' : 'transparent',
        color:           active ? '#ede5d8' : '#7a7488',
        border:          `1px solid ${active ? '#5a526a' : '#3a334a'}`,
      }}
    >
      {children}
    </button>
  );
}

// ------------------------------------------------------------
// Guitar diagram (chord box style, vertical: high-E on the right)
// ------------------------------------------------------------
function GuitarDiagram({ chord }) {
  const shape = getGuitarShape(chord.root, chord.quality);
  if (!shape) {
    return (
      <div className="f-mono text-[10px] py-6" style={{ color: '#7a7488' }}>
        — pas de schéma —
      </div>
    );
  }

  const { frets, barre } = shape;
  const fingered = frets.filter((f) => f > 0);
  const minF = fingered.length ? Math.min(...fingered) : 0;
  const maxF = fingered.length ? Math.max(...fingered) : 0;

  const FRET_COUNT = 4;
  const startFret  = maxF > FRET_COUNT ? minF : 1;

  // SVG geometry
  const stringGap = 16;
  const fretGap   = 20;
  const padT = 22, padB = 10, padL = 22, padR = 14;
  const innerW = stringGap * 5;
  const innerH = fretGap * FRET_COUNT;
  const W = padL + padR + innerW;
  const H = padT + padB + innerH;

  const xs  = (i) => padL + i * stringGap;
  const yf  = (i) => padT + i * fretGap;
  const map = (f) => f - startFret + 1; // value → display fret index (1..FRET_COUNT)

  const stroke = '#5a526a';
  const dot    = '#ede5d8';
  const text   = '#ede5d8';
  const muted  = '#7a7488';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 140, display: 'block' }}>
      {/* Frets */}
      {Array.from({ length: FRET_COUNT + 1 }, (_, i) => (
        <line
          key={`f${i}`}
          x1={xs(0)} y1={yf(i)} x2={xs(5)} y2={yf(i)}
          stroke={stroke}
          strokeWidth={i === 0 && startFret === 1 ? 0 : 1}
        />
      ))}
      {/* Nut (only when starting at fret 1) */}
      {startFret === 1 && (
        <line
          x1={xs(0) - 0.5} y1={yf(0)}
          x2={xs(5) + 0.5} y2={yf(0)}
          stroke={text} strokeWidth={2.5}
        />
      )}
      {/* Start-fret indicator (when above 1st) */}
      {startFret > 1 && (
        <text
          x={xs(0) - 7} y={yf(0) + 13}
          textAnchor="end" fill={muted}
          fontSize={9} fontFamily="'JetBrains Mono', monospace"
        >
          {startFret}fr
        </text>
      )}
      {/* Strings */}
      {Array.from({ length: 6 }, (_, i) => (
        <line
          key={`s${i}`}
          x1={xs(i)} y1={yf(0)} x2={xs(i)} y2={yf(FRET_COUNT)}
          stroke={stroke} strokeWidth={1}
        />
      ))}
      {/* Top markers : × for muted, ○ for open */}
      {frets.map((f, i) => {
        if (f === -1) {
          return (
            <text
              key={`m${i}`} x={xs(i)} y={padT - 7}
              textAnchor="middle" fill={muted}
              fontSize={11} fontFamily="'JetBrains Mono', monospace"
            >×</text>
          );
        }
        if (f === 0) {
          return (
            <circle
              key={`m${i}`} cx={xs(i)} cy={padT - 9} r={3.5}
              fill="none" stroke={text} strokeWidth={1}
            />
          );
        }
        return null;
      })}
      {/* Barre */}
      {barre > 0 && map(barre) >= 1 && map(barre) <= FRET_COUNT && (() => {
        let left = -1, right = -1;
        for (let i = 0; i < 6; i++) {
          if (frets[i] === barre) {
            if (left === -1) left = i;
            right = i;
          }
        }
        if (left === right) return null;
        return (
          <line
            x1={xs(left)}  y1={yf(map(barre) - 0.5)}
            x2={xs(right)} y2={yf(map(barre) - 0.5)}
            stroke={dot} strokeWidth={10} strokeLinecap="round" opacity={0.95}
          />
        );
      })()}
      {/* Finger dots (skip those covered by the barre) */}
      {frets.map((f, i) => {
        if (f <= 0) return null;
        if (barre > 0 && f === barre) return null;
        const d = map(f);
        if (d < 1 || d > FRET_COUNT) return null;
        return (
          <circle
            key={`d${i}`} cx={xs(i)} cy={yf(d - 0.5)} r={5}
            fill={dot}
          />
        );
      })}
    </svg>
  );
}

// ------------------------------------------------------------
// Piano diagram (one octave, C → B, chord notes highlighted)
// ------------------------------------------------------------
function PianoDiagram({ chord }) {
  const notes = new Set(chordNotes(chord.root, chord.quality));
  const isMinor = chord.quality === 'min' || chord.quality === 'm7';
  const label = (n) => (isMinor ? NOTE_MINOR : NOTE_MAJOR)[n];

  const WHITES = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
  const BLACKS = [
    { note: 1,  after: 0 }, // C#
    { note: 3,  after: 1 }, // D#
    { note: 6,  after: 3 }, // F#
    { note: 8,  after: 4 }, // G#
    { note: 10, after: 5 }, // A#
  ];

  const whiteW = 19, whiteH = 78;
  const blackW = 12, blackH = 50;
  const W = whiteW * 7;
  const labelH = 13;
  const H = whiteH + labelH + 2;

  const text         = '#ede5d8';
  const muted        = '#7a7488';
  const whiteOff     = '#1f1c2a';
  const whiteOnRoot  = '#ede5d8';
  const whiteOnOther = '#a8a0b8';
  const blackOff     = '#0a0911';
  const blackOnRoot  = '#ede5d8';
  const blackOnOther = '#a8a0b8';
  const stroke       = '#3a334a';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 175, display: 'block' }}>
      {/* White keys */}
      {WHITES.map((note, i) => {
        const inChord = notes.has(note);
        const isRoot  = note === chord.root;
        return (
          <rect
            key={`w${note}`}
            x={i * whiteW} y={0}
            width={whiteW} height={whiteH}
            fill={inChord ? (isRoot ? whiteOnRoot : whiteOnOther) : whiteOff}
            stroke={stroke} strokeWidth={1}
          />
        );
      })}
      {/* Black keys */}
      {BLACKS.map(({ note, after }) => {
        const inChord = notes.has(note);
        const isRoot  = note === chord.root;
        const cx = (after + 1) * whiteW;
        return (
          <rect
            key={`b${note}`}
            x={cx - blackW / 2} y={0}
            width={blackW} height={blackH}
            fill={inChord ? (isRoot ? blackOnRoot : blackOnOther) : blackOff}
            stroke={stroke} strokeWidth={1}
          />
        );
      })}
      {/* Note labels (only for chord notes) */}
      {WHITES.map((note, i) => {
        if (!notes.has(note)) return null;
        const isRoot = note === chord.root;
        return (
          <text
            key={`lw${note}`}
            x={i * whiteW + whiteW / 2}
            y={whiteH + 11}
            textAnchor="middle"
            fill={isRoot ? text : muted}
            fontSize={8.5}
            fontFamily="'JetBrains Mono', monospace"
          >
            {label(note)}
          </text>
        );
      })}
      {BLACKS.map(({ note, after }) => {
        if (!notes.has(note)) return null;
        const isRoot = note === chord.root;
        const cx = (after + 1) * whiteW;
        return (
          <text
            key={`lb${note}`}
            x={cx} y={whiteH + 11}
            textAnchor="middle"
            fill={isRoot ? text : muted}
            fontSize={8.5}
            fontFamily="'JetBrains Mono', monospace"
          >
            {label(note)}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================================
// EDIT PANEL (modifier un accord sans casser la suite)
// ============================================================
function EditPanel({ index, chord, prevChord, editSuggestions, isLast, onReplace, onJump, onCancel }) {
  return (
    <div
      className="mt-8 p-4 sm:p-5 rounded-sm anim-fade"
      style={{ backgroundColor: '#1a1727', border: '1px solid #4a3f5c' }}
    >
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <div className="text-[10px] tracking-[0.25em] uppercase mb-1" style={{ color: '#c58aa0' }}>
            modifier nº {String(index + 1).padStart(2, '0')}
          </div>
          <div className="f-mono text-xs" style={{ color: '#a8a0b8' }}>
            actuel : <span style={{ color: '#ede5d8' }}>{chordName(chord.root, chord.quality)}</span>
            {prevChord && (
              <span style={{ opacity: 0.7 }}> · vient de {chordName(prevChord.root, prevChord.quality)}</span>
            )}
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-1 transition-colors"
          style={{ color: '#7a7488' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ede5d8'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#7a7488'}
          title="fermer"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {prevChord && editSuggestions.length > 0 && (
        <div className="mb-5">
          <div className="text-[10px] tracking-[0.25em] uppercase mb-2" style={{ color: '#7a7488' }}>
            suggestions depuis {chordName(prevChord.root, prevChord.quality)}
          </div>
          <SuggestionsGrid suggestions={editSuggestions} onSelect={onReplace} />
        </div>
      )}

      <div>
        <div className="text-[10px] tracking-[0.25em] uppercase mb-2" style={{ color: '#7a7488' }}>
          {prevChord ? 'ou choisir un autre accord' : 'choisir un accord de départ'}
        </div>
        <ChordSelector onSelect={onReplace} currentChord={chord} />
      </div>

      {!isLast && (
        <button
          onClick={() => onJump(index)}
          className="mt-4 text-[10px] tracking-[0.2em] uppercase transition-colors"
          style={{ color: '#7a7488' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ede5d8'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#7a7488'}
        >
          ↪ ou reprendre depuis ici (supprime les suivants)
        </button>
      )}
    </div>
  );
}

// ============================================================
// CHORD SELECTOR (réutilisable : commons + tous les accords)
// ============================================================
function ChordSelector({ onSelect, currentChord }) {
  const [showAll, setShowAll] = useState(false);

  const isCurrent = (c) =>
    currentChord && c.root === currentChord.root && c.quality === currentChord.quality;

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
        {COMMON_STARTERS.map((c, i) => {
          const cur = isCurrent(c);
          return (
            <button
              key={i}
              onClick={() => onSelect(c)}
              className="f-mono text-base sm:text-lg py-3 rounded-sm transition-all"
              style={{
                color: '#ede5d8',
                backgroundColor: cur ? '#332639' : '#1d1a28',
                border: '1px solid ' + (cur ? '#c58aa0' : '#3a334a'),
              }}
              onMouseEnter={(e) => {
                if (!cur) { e.currentTarget.style.borderColor = '#6a5e80'; e.currentTarget.style.backgroundColor = '#252237'; }
              }}
              onMouseLeave={(e) => {
                if (!cur) { e.currentTarget.style.borderColor = '#3a334a'; e.currentTarget.style.backgroundColor = '#1d1a28'; }
              }}
            >
              {chordName(c.root, c.quality)}
            </button>
          );
        })}
      </div>

      {!showAll ? (
        <button
          onClick={() => setShowAll(true)}
          className="text-[10px] tracking-[0.2em] uppercase transition-colors"
          style={{ color: '#968ea0' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ede5d8'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#968ea0'}
        >
          + tous les accords
        </button>
      ) : (
        <AllChordsGrid onSelect={onSelect} onClose={() => setShowAll(false)} />
      )}
    </div>
  );
}

// ============================================================
// FINAL SCREEN (suite validée)
// ============================================================
function FinalScreen({ progression, onBack, onReset, onCompose, showGuitar, showPiano, setShowGuitar, setShowPiano }) {
  return (
    <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
      {/* header */}
      <div className="mb-8 anim-fade">
        <div className="text-[10px] tracking-[0.3em] uppercase mb-2 flex items-center gap-3" style={{ color: '#7a7488' }}>
          <span>· {String(progression.length).padStart(2, '0')} accords ·</span>
          <span style={{ opacity: 0.5 }}>votre suite</span>
          <span className="flex-1 h-px" style={{ backgroundColor: '#3a334a' }} />
        </div>
        <h1 className="f-display italic text-3xl sm:text-4xl" style={{ color: '#ede5d8' }}>verse</h1>
      </div>

      {/* big horizontal flow */}
      <div className="my-8 sm:my-12 anim-fade" style={{ animationDelay: '80ms' }}>
        <ProgressionFlow progression={progression} />
      </div>

      <div className="h-px my-8" style={{ backgroundColor: '#3a334a', opacity: 0.6 }} />

      {/* diagram toggles */}
      <div className="flex items-center justify-center gap-2 mb-6 anim-fade" style={{ animationDelay: '140ms' }}>
        <DiagramPill active={showGuitar} onClick={() => setShowGuitar(!showGuitar)}>guitare</DiagramPill>
        <DiagramPill active={showPiano}  onClick={() => setShowPiano(!showPiano)}>piano</DiagramPill>
      </div>

      {/* per-chord cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {progression.map((c, i) => (
          <ChordCard
            key={i}
            chord={c}
            index={i}
            showGuitar={showGuitar}
            showPiano={showPiano}
            delay={180 + i * 40}
          />
        ))}
      </div>

      {/* compose a refrain / bridge */}
      <button
        onClick={onCompose}
        className="mt-10 w-full f-mono text-[11px] tracking-[0.25em] uppercase py-3 rounded-sm transition-all flex items-center justify-center gap-2 anim-fade"
        style={{ color: '#ede5d8', backgroundColor: '#252237', border: '1px solid #5a526a' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2e2a40'; e.currentTarget.style.borderColor = '#7a6f92'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#252237'; e.currentTarget.style.borderColor = '#5a526a'; }}
      >
        <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
        composer un refrain / un pont
      </button>

      {/* footer actions */}
      <div className="mt-8 pt-6 flex items-center gap-5" style={{ borderTop: '1px solid rgba(58, 51, 74, 0.5)' }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors"
          style={{ color: '#968ea0' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ede5d8'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#968ea0'}
        >
          <ArrowLeft className="w-3 h-3" strokeWidth={1.5} />
          modifier
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors"
          style={{ color: '#968ea0' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ede5d8'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#968ea0'}
        >
          <RotateCcw className="w-3 h-3" strokeWidth={1.5} />
          recommencer
        </button>
      </div>
    </div>
  );
}

function ProgressionFlow({ progression }) {
  return (
    <div className="flex flex-wrap items-baseline justify-center gap-x-3 sm:gap-x-5 gap-y-4">
      {progression.map((c, i) => {
        const mood = c.mood ? MOODS[c.mood] : null;
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              mood ? (
                <span
                  className="self-center"
                  style={{ color: mood.color }}
                  title={mood.fr}
                >
                  <mood.Icon className="w-5 h-5" strokeWidth={1.5} />
                </span>
              ) : (
                <span
                  className="f-display italic self-center"
                  style={{ color: '#5a526a', fontSize: 'clamp(28px, 6vw, 40px)' }}
                >
                  ·
                </span>
              )
            )}
            <div
              className="f-display italic leading-none tracking-tight"
              style={{ fontSize: 'clamp(42px, 9vw, 72px)', color: '#ede5d8' }}
            >
              {chordName(c.root, c.quality)}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ChordCard({ chord, index, showGuitar, showPiano, delay }) {
  const anyDiagram = showGuitar || showPiano;
  return (
    <div
      className="p-4 sm:p-5 rounded-sm anim-fade"
      style={{
        backgroundColor: '#1a1727',
        border: '1px solid #3a334a',
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-baseline gap-3 mb-3">
        <div className="f-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: '#7a7488' }}>
          {String(index + 1).padStart(2, '0')}
        </div>
        <div className="f-display italic text-3xl sm:text-4xl leading-none" style={{ color: '#ede5d8' }}>
          {chordName(chord.root, chord.quality)}
        </div>
      </div>
      {anyDiagram && (
        <div className="flex flex-wrap items-start justify-center gap-5 sm:gap-7 pt-2">
          {showGuitar && (
            <div className="flex flex-col items-center">
              <GuitarDiagram chord={chord} />
              <div className="f-mono text-[9px] tracking-[0.25em] uppercase mt-1.5" style={{ color: '#7a7488' }}>
                guitare
              </div>
            </div>
          )}
          {showPiano && (
            <div className="flex flex-col items-center">
              <PianoDiagram chord={chord} />
              <div className="f-mono text-[9px] tracking-[0.25em] uppercase mt-1.5" style={{ color: '#7a7488' }}>
                piano
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SECTION SCREEN (refrain / pont — accords qui se marient au couplet)
// ============================================================
function SectionScreen({ verse, onBack, onReset }) {
  const data = useMemo(() => getSectionSuggestions(verse), [verse]);
  const [section, setSection] = useState([]);

  const handlePick = (s) => {
    playChord(s.root, s.quality);
    setSection(p => [...p, { root: s.root, quality: s.quality }]);
  };
  const focused = section[section.length - 1];

  const keyName = data ? scaleRootName(data.key.scale, data.key.root) : '';
  const keyKind = data ? (data.key.scale.id === 'major' ? 'majeure' : 'mineure') : '';

  return (
    <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
      {/* header */}
      <div className="mb-6 anim-fade">
        <div className="text-[10px] tracking-[0.3em] uppercase mb-2 flex items-center gap-3" style={{ color: '#7a7488' }}>
          <span>· suite ·</span>
          <span style={{ opacity: 0.5 }}>refrain / pont</span>
          <span className="flex-1 h-px" style={{ backgroundColor: '#3a334a' }} />
        </div>
        <h1 className="f-display italic text-2xl sm:text-3xl" style={{ color: '#ede5d8' }}>et maintenant&nbsp;?</h1>
        {data && (
          <p className="f-mono text-[11px] mt-2 tracking-wide leading-relaxed" style={{ color: '#968ea0' }}>
            des accords qui se marient avec votre couplet en{' '}
            <span style={{ color: '#ede5d8' }}>{keyName} {keyKind}</span>
          </p>
        )}
      </div>

      {/* verse recap */}
      <div className="mb-6">
        <div className="text-[10px] tracking-[0.25em] uppercase mb-2" style={{ color: '#7a7488' }}>votre couplet</div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {verse.map((c, i) => (
            <span
              key={i}
              className="f-mono text-sm px-2 py-1 rounded-sm"
              style={{ color: '#a8a0b8', backgroundColor: '#1d1a28', border: '1px solid #3a334a' }}
            >
              {chordName(c.root, c.quality)}
            </span>
          ))}
        </div>
      </div>

      {/* section being assembled */}
      {section.length > 0 && (
        <div className="mb-6 anim-fade">
          <div className="text-[10px] tracking-[0.25em] uppercase mb-2 flex items-center gap-3" style={{ color: '#c58aa0' }}>
            <span>votre nouvelle partie</span>
            <span className="flex-1 h-px" style={{ backgroundColor: '#3a334a', opacity: 0.5 }} />
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {section.map((c, i) => (
              <span
                key={i}
                className="f-mono text-base px-2.5 py-1.5 rounded-sm"
                style={{ color: '#ede5d8', backgroundColor: '#252237', border: '1px solid #5a526a' }}
              >
                {chordName(c.root, c.quality)}
              </span>
            ))}
          </div>
          {focused && (
            <div className="flex flex-wrap items-start justify-center gap-6 sm:gap-10 py-2">
              <div className="flex flex-col items-center">
                <GuitarDiagram chord={focused} />
                <div className="f-mono text-[9px] tracking-[0.25em] uppercase mt-2" style={{ color: '#7a7488' }}>guitare</div>
              </div>
              <div className="flex flex-col items-center">
                <PianoDiagram chord={focused} />
                <div className="f-mono text-[9px] tracking-[0.25em] uppercase mt-2" style={{ color: '#7a7488' }}>piano</div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 mt-1">
            <button
              onClick={() => setSection(p => p.slice(0, -1))}
              className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors"
              style={{ color: '#968ea0' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ede5d8'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#968ea0'}
            >
              <Undo2 className="w-3 h-3" strokeWidth={1.5} /> retour
            </button>
            <button
              onClick={() => setSection([])}
              className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors"
              style={{ color: '#968ea0' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ede5d8'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#968ea0'}
            >
              <RotateCcw className="w-3 h-3" strokeWidth={1.5} /> vider
            </button>
          </div>
        </div>
      )}

      {/* proposals */}
      {data ? (
        <>
          <div className="mb-6">
            <div className="text-[10px] tracking-[0.25em] uppercase mb-3 flex items-center gap-3" style={{ color: '#7a7488' }}>
              <span>pour lancer un refrain</span>
              <span className="flex-1 h-px" style={{ backgroundColor: '#3a334a', opacity: 0.5 }} />
            </div>
            <SuggestionsGrid suggestions={data.refrain} onSelect={handlePick} />
          </div>
          <div className="mb-2">
            <div className="text-[10px] tracking-[0.25em] uppercase mb-3 flex items-center gap-3" style={{ color: '#7a7488' }}>
              <span>pour un pont / du contraste</span>
              <span className="flex-1 h-px" style={{ backgroundColor: '#3a334a', opacity: 0.5 }} />
            </div>
            <SuggestionsGrid suggestions={data.pont} onSelect={handlePick} />
          </div>
          <p className="f-mono text-[10px] mt-4 tracking-wide leading-relaxed" style={{ color: '#5a526a' }}>
            touchez un accord pour l'entendre — il s'ajoute à votre nouvelle partie
          </p>
        </>
      ) : (
        <p className="f-mono text-[11px] leading-relaxed" style={{ color: '#7a7488' }}>
          tonalité trop ambiguë pour proposer des accords (couplet uniquement suspendu&nbsp;?).
        </p>
      )}

      {/* footer */}
      <div className="mt-10 pt-6 flex items-center gap-5" style={{ borderTop: '1px solid rgba(58, 51, 74, 0.5)' }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors"
          style={{ color: '#968ea0' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ede5d8'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#968ea0'}
        >
          <ArrowLeft className="w-3 h-3" strokeWidth={1.5} /> retour au couplet
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors"
          style={{ color: '#968ea0' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ede5d8'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#968ea0'}
        >
          <RotateCcw className="w-3 h-3" strokeWidth={1.5} /> recommencer
        </button>
      </div>
    </div>
  );
}

// ============================================================
// SPOTIFY SCREEN
// ============================================================
function SpotifyScreen({ onStart, onBack }) {
  const [phase,   setPhase]   = useState('idle');
  const [inputId, setInputId] = useState(getSpotifyClientId);
  const [groups,  setGroups]  = useState([]);
  const [errMsg,  setErrMsg]  = useState('');

  const loadData = async (token) => {
    setPhase('loading');
    try {
      const tracks = await fetchTopTracks(token);
      let data = [];
      try {
        const feats = await fetchAudioFeatures(token, tracks.map(t => t.id));
        data = processSpotifyData(tracks, feats);
      } catch (e) {
        if (e.message !== 'spotify-403') throw e; // audio-features restricted → fall back
      }
      if (!data.length) {
        const artists = await fetchTopArtists(token);
        data = processGenreData(artists);
      }
      setGroups(data);
      setPhase('ready');
    } catch (e) {
      if (e.message === '401') { clearSpotifyAuth(); setPhase('login'); }
      else { setErrMsg(e.message); setPhase('error'); }
    }
  };

  useEffect(() => {
    const cid   = getSpotifyClientId();
    const token = getSpotifyToken();
    if (!cid)  { setPhase('setup'); return; }
    if (token) { loadData(token);   return; }
    setPhase('login');
  }, []);

  const handleSaveId = () => {
    const id = inputId.trim();
    localStorage.setItem('spotify_client_id', id);
    const token = getSpotifyToken();
    if (token) loadData(token); else setPhase('login');
  };

  // shared layout wrappers
  const Wrap  = ({ children }) => (
    <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8 py-8 sm:py-12">{children}</div>
  );
  const Header = () => (
    <div className="mb-6 anim-fade">
      <div className="text-[10px] tracking-[0.3em] uppercase mb-2 flex items-center gap-3" style={{ color: '#7a7488' }}>
        <span style={{ color: '#1db954' }}>●</span>
        <span style={{ opacity: 0.5 }}>top · 6 mois</span>
        <span className="flex-1 h-px" style={{ backgroundColor: '#3a334a' }} />
      </div>
      <h1 className="f-display italic text-2xl sm:text-3xl" style={{ color: '#ede5d8' }}>vos tonalités</h1>
    </div>
  );
  const Footer = ({ extra }) => (
    <div className="mt-10 pt-6 flex items-center gap-5" style={{ borderTop: '1px solid rgba(58,51,74,0.5)' }}>
      <button onClick={onBack} className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors" style={{ color: '#968ea0' }}
        onMouseEnter={e => e.currentTarget.style.color='#ede5d8'}
        onMouseLeave={e => e.currentTarget.style.color='#968ea0'}>
        <ArrowLeft className="w-3 h-3" strokeWidth={1.5}/> retour
      </button>
      {extra}
    </div>
  );

  if (phase === 'setup') return (
    <Wrap>
      <Header/>
      <div className="p-5 rounded-sm anim-fade" style={{ backgroundColor: '#1a1727', border: '1px solid #4a3f5c' }}>
        <div className="text-[10px] tracking-[0.25em] uppercase mb-4" style={{ color: '#c58aa0' }}>configurer l'intégration</div>
        <ol className="f-mono text-[11px] leading-loose mb-5 space-y-1" style={{ color: '#968ea0' }}>
          <li>1. Créer une app sur <span style={{ color: '#ede5d8' }}>developer.spotify.com/dashboard</span></li>
          <li>2. Ajouter comme Redirect URI&nbsp;: <span style={{ color: '#ede5d8' }}>{spotifyRedirectUri()}</span></li>
          <li>3. Coller votre <span style={{ color: '#ede5d8' }}>Client ID</span> ci-dessous</li>
        </ol>
        <input
          className="f-mono w-full text-sm px-3 py-2 rounded-sm mb-3 outline-none"
          style={{ backgroundColor: '#14121c', border: '1px solid #5a526a', color: '#ede5d8' }}
          placeholder="Client ID (32 caractères hexadécimaux)"
          value={inputId}
          onChange={e => setInputId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && inputId.trim().length > 10 && handleSaveId()}
        />
        <button
          onClick={handleSaveId}
          disabled={inputId.trim().length < 10}
          className="f-mono text-[11px] tracking-[0.2em] uppercase px-4 py-2 rounded-sm transition-all"
          style={{ backgroundColor: '#252237', border: '1px solid #5a526a', color: '#ede5d8', opacity: inputId.trim().length < 10 ? 0.4 : 1, cursor: inputId.trim().length < 10 ? 'not-allowed' : 'pointer' }}
        >
          enregistrer
        </button>
      </div>
      <Footer/>
    </Wrap>
  );

  if (phase === 'login') return (
    <Wrap>
      <Header/>
      <p className="f-mono text-[11px] leading-relaxed mb-6" style={{ color: '#968ea0' }}>
        Connectez votre compte Spotify pour enrichir verse avec les tonalités de vos 100 titres les plus écoutés des 6 derniers mois.
      </p>
      <button
        onClick={() => initiateSpotifyLogin(getSpotifyClientId())}
        className="f-mono text-[12px] tracking-[0.18em] uppercase px-5 py-3 rounded-sm transition-opacity flex items-center gap-2"
        style={{ backgroundColor: '#1db954', color: '#000', border: 'none', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity='1'}
      >
        <span>●</span> Connecter Spotify
      </button>
      <button onClick={() => setPhase('setup')} className="block mt-3 text-[10px] tracking-[0.2em] uppercase transition-colors" style={{ color: '#5a526a' }}
        onMouseEnter={e => e.currentTarget.style.color='#968ea0'}
        onMouseLeave={e => e.currentTarget.style.color='#5a526a'}>
        modifier le Client ID
      </button>
      <Footer/>
    </Wrap>
  );

  if (phase === 'idle' || phase === 'loading') return (
    <Wrap>
      <Header/>
      <p className="f-mono text-[11px]" style={{ color: '#7a7488' }}>analyse de vos top titres…</p>
      <Footer/>
    </Wrap>
  );

  if (phase === 'error') return (
    <Wrap>
      <Header/>
      <p className="f-mono text-[11px] leading-relaxed mb-3" style={{ color: '#cc7a6e' }}>Erreur : {errMsg}</p>
      <button onClick={() => { const t = getSpotifyToken(); if (t) loadData(t); else setPhase('login'); }}
        className="text-[10px] tracking-[0.2em] uppercase transition-colors" style={{ color: '#968ea0' }}
        onMouseEnter={e => e.currentTarget.style.color='#ede5d8'}
        onMouseLeave={e => e.currentTarget.style.color='#968ea0'}>
        réessayer
      </button>
      <Footer/>
    </Wrap>
  );

  // phase === 'ready'
  return (
    <Wrap>
      <Header/>
      <p className="f-mono text-[11px] mb-8 leading-relaxed" style={{ color: '#968ea0' }}>
        Touchez un accord pour démarrer une progression — les suggestions sont dérivées de vos 100 titres les plus écoutés des 6 derniers mois.
      </p>

      {groups.length === 0 ? (
        <p className="f-mono text-[11px]" style={{ color: '#7a7488' }}>
          Pas suffisamment de données tonales dans vos écoutes récentes.
        </p>
      ) : (
        <div className="space-y-12">
          {groups.map((g, gi) => (
            <div key={gi} className="anim-fade" style={{ animationDelay: `${gi * 100}ms` }}>
              {/* key header */}
              <div className="flex items-baseline gap-3 mb-2">
                <span className="f-display italic" style={{ fontSize: 'clamp(36px, 9vw, 56px)', color: '#ede5d8' }}>
                  {g.name}
                </span>
                <span className="f-mono text-[10px] tracking-[0.15em] uppercase" style={{ color: '#7a7488' }}>
                  {g.isMajor ? 'majeure' : 'mineure'}{g.count != null ? ` · ${g.count} morceau${g.count > 1 ? 'x' : ''}` : ' · d\'après vos genres'}
                </span>
              </div>
              {/* source tracks / genres */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {g.sourceTracks.map((t, ti) => (
                  <span key={ti} className="f-display italic text-[10px] px-2 py-0.5 rounded-sm"
                    style={{ color: '#a8a0b8', backgroundColor: '#1d1a28', border: '1px solid #3a334a' }}>
                    {t.artist ? `${t.artist} – ${t.name}` : t.name}
                  </span>
                ))}
              </div>
              {/* chord suggestions */}
              <SuggestionsGrid suggestions={g.suggestions} onSelect={s => onStart({ root: s.root, quality: s.quality })} />
            </div>
          ))}
        </div>
      )}

      <Footer extra={
        <button onClick={() => { clearSpotifyAuth(); setPhase('login'); }}
          className="text-[10px] tracking-[0.2em] uppercase transition-colors" style={{ color: '#968ea0' }}
          onMouseEnter={e => e.currentTarget.style.color='#cc7a6e'}
          onMouseLeave={e => e.currentTarget.style.color='#968ea0'}>
          déconnecter
        </button>
      }/>
    </Wrap>
  );
}

// ============================================================
// HOOKTHEORY PANEL (suggestions issues de vraies chansons)
// ============================================================
const _htCache = new Map();

function HooktheoryPanel({ progression, onAdd }) {
  const [proxy,  setProxy]  = useState(getHtProxy());
  const [input,  setInput]  = useState(getHtProxy());
  const [status, setStatus] = useState('idle'); // idle|loading|ready|error|nondiatonic
  const [nodes,  setNodes]  = useState([]);
  const [songs,  setSongs]  = useState([]);

  const { tonic, cp } = useMemo(() => htBuildCp(progression), [progression]);

  useEffect(() => {
    if (!proxy) { setStatus('idle'); return; }
    if (!cp)    { setStatus('nondiatonic'); setNodes([]); setSongs([]); return; }
    if (_htCache.has(cp)) {
      const c = _htCache.get(cp);
      setNodes(htParseNodes(c.nodes, tonic));
      setSongs(htParseSongs(c.songs));
      setStatus('ready');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    const timer = setTimeout(async () => {
      try {
        const multi = cp.split(',').length >= 2;
        const [nodesRes, songsRes] = await Promise.all([
          htFetch('nodes', cp),
          multi ? htFetch('songs', cp) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        _htCache.set(cp, { nodes: nodesRes, songs: songsRes });
        setNodes(htParseNodes(nodesRes, tonic));
        setSongs(htParseSongs(songsRes));
        setStatus('ready');
      } catch (_) {
        if (!cancelled) setStatus('error');
      }
    }, 450);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [proxy, cp, tonic]);

  const Label = ({ children }) => (
    <div className="text-[10px] tracking-[0.25em] uppercase mb-3 flex items-center gap-3" style={{ color: '#7a7488' }}>
      <span style={{ color: '#1db954' }}>♬</span>
      <span>{children}</span>
      <span className="flex-1 h-px" style={{ backgroundColor: '#3a334a', opacity: 0.5 }} />
    </div>
  );

  if (!proxy) return (
    <div className="mt-8">
      <Label>dans la vraie musique · hooktheory</Label>
      <div className="p-4 rounded-sm" style={{ backgroundColor: '#1a1727', border: '1px solid #3a334a' }}>
        <p className="f-mono text-[11px] leading-relaxed mb-3" style={{ color: '#968ea0' }}>
          Collez l'URL de votre proxy Cloudflare pour activer les suggestions tirées de vraies chansons.
        </p>
        <input
          className="f-mono w-full text-xs px-3 py-2 rounded-sm mb-3 outline-none"
          style={{ backgroundColor: '#14121c', border: '1px solid #5a526a', color: '#ede5d8' }}
          placeholder="https://verse-hooktheory.xxx.workers.dev"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && input.trim() && (localStorage.setItem('ht_proxy', input.trim()), setProxy(input.trim()))}
        />
        <button
          onClick={() => { const v = input.trim(); if (!v) return; localStorage.setItem('ht_proxy', v); setProxy(v); }}
          className="f-mono text-[11px] tracking-[0.2em] uppercase px-4 py-2 rounded-sm"
          style={{ backgroundColor: '#252237', border: '1px solid #5a526a', color: '#ede5d8' }}
        >
          activer
        </button>
      </div>
    </div>
  );

  return (
    <div className="mt-8">
      <Label>dans la vraie musique · hooktheory</Label>
      {status === 'loading'     && <p className="f-mono text-[11px]" style={{ color: '#7a7488' }}>recherche dans 70 000 morceaux…</p>}
      {status === 'nondiatonic' && <p className="f-mono text-[11px]" style={{ color: '#7a7488' }}>suite trop chromatique pour une lecture Hooktheory.</p>}
      {status === 'error'       && <p className="f-mono text-[11px]" style={{ color: '#cc7a6e' }}>proxy injoignable — vérifiez l'URL et les secrets du Worker.</p>}
      {status === 'ready' && (
        <>
          {nodes.length > 0 && (
            <div className="mb-5">
              <div className="f-mono text-[10px] tracking-[0.18em] uppercase mb-2" style={{ color: '#968ea0' }}>
                accords suivants les plus fréquents
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {nodes.map((n, i) => (
                  <button
                    key={i}
                    onClick={() => onAdd({ root: n.root, quality: n.quality })}
                    className="f-mono py-2 px-1 rounded-sm flex flex-col items-center transition-all"
                    style={{ backgroundColor: '#1f1c2a', border: '1px solid #3a334a', color: '#ede5d8' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#1db954'; e.currentTarget.style.backgroundColor = '#252237'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#3a334a'; e.currentTarget.style.backgroundColor = '#1f1c2a'; }}
                  >
                    <span className="text-sm">{chordName(n.root, n.quality)}</span>
                    <span className="text-[9px] mt-0.5" style={{ color: '#7a7488' }}>{Math.round(n.prob * 100)}%</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {songs.length > 0 && (
            <div>
              <div className="f-mono text-[10px] tracking-[0.18em] uppercase mb-2" style={{ color: '#968ea0' }}>
                morceaux qui utilisent cette suite
              </div>
              <div className="flex flex-wrap gap-1.5">
                {songs.map((s, i) => (
                  <span key={i} className="f-display italic text-[10px] px-2 py-0.5 rounded-sm"
                    style={{ color: '#a8a0b8', backgroundColor: '#1d1a28', border: '1px solid #3a334a' }}>
                    {s.artist ? `${s.artist} – ${s.song}` : s.song}
                  </span>
                ))}
              </div>
            </div>
          )}
          {nodes.length === 0 && songs.length === 0 && (
            <p className="f-mono text-[11px]" style={{ color: '#7a7488' }}>aucune donnée pour cette suite.</p>
          )}
        </>
      )}
      <button
        onClick={() => { localStorage.removeItem('ht_proxy'); setProxy(''); }}
        className="mt-4 text-[10px] tracking-[0.2em] uppercase transition-colors"
        style={{ color: '#5a526a' }}
        onMouseEnter={e => e.currentTarget.style.color = '#968ea0'}
        onMouseLeave={e => e.currentTarget.style.color = '#5a526a'}
      >
        changer le proxy
      </button>
    </div>
  );
}

// ============================================================
// SCALES PANEL (gammes contenant TOUS les accords de la progression)
// ============================================================
function ScalesPanel({ chord, progression, onAdd }) {
  // N'inclut que les accords dont la qualité est identifiable (pas sus)
  const matchable = (progression || []).filter(c => lookupQuality(c.quality) !== null);
  const progKey   = matchable.map(c => `${c.root}-${c.quality}`).join(',');

  const results = useMemo(() => {
    if (matchable.length > 0) {
      return findScalesForProgression(matchable);
    }
    // Fallback : accord seul (ne devrait pas arriver en pratique)
    return findContainingScales(chord).map(r => ({ ...r, degrees: [r.degree] }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progKey, chord.root, chord.quality]);

  if (results.length === 0) {
    return (
      <div className="mt-6 text-center anim-fade">
        <p className="f-mono text-[11px] leading-relaxed" style={{ color: '#7a7488' }}>
          {matchable.length > 0
            ? 'aucune gamme diatonique ne contient tous les accords de la progression'
            : 'pas de lecture diatonique directe (accord sus — ambigu modalement)'}
        </p>
      </div>
    );
  }

  // Regrouper par type de gamme en préservant l'ordre canonique de SCALES
  const grouped = [];
  for (const r of results) {
    let g = grouped.find(x => x.scale.id === r.scale.id);
    if (!g) { g = { scale: r.scale, occurrences: [] }; grouped.push(g); }
    g.occurrences.push({ scaleRoot: r.scaleRoot, degrees: r.degrees });
  }

  const n = results.length;
  const label = matchable.length > 1
    ? `${n} gamme${n > 1 ? 's' : ''} contien${n > 1 ? 'nent' : 't'} toute la progression`
    : `cet accord apparaît dans ${n} gamme${n > 1 ? 's' : ''}`;

  return (
    <div className="mt-6 anim-fade">
      <div className="text-[10px] tracking-[0.25em] uppercase mb-4 flex items-center gap-3" style={{ color: '#7a7488' }}>
        <span>{label}</span>
        <span className="flex-1 h-px" style={{ backgroundColor: '#3a334a', opacity: 0.5 }} />
      </div>
      <div className="space-y-5">
        {grouped.map(({ scale, occurrences }) => (
          <ScaleGroup
            key={scale.id}
            scale={scale}
            occurrences={occurrences}
            matchable={matchable}
            onAdd={onAdd}
          />
        ))}
      </div>
    </div>
  );
}

function ScaleGroup({ scale, occurrences, matchable, onAdd }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: '#968ea0' }}>
          {scale.name}
        </span>
        <span className="text-[9px]" style={{ color: '#5a526a' }}>
          ({occurrences.length})
        </span>
      </div>
      <div className="space-y-1.5">
        {occurrences.map((occ) => (
          <ScaleRow
            key={`${scale.id}-${occ.scaleRoot}`}
            scale={scale}
            scaleRoot={occ.scaleRoot}
            degrees={occ.degrees}
            matchable={matchable}
            onAdd={onAdd}
          />
        ))}
      </div>
    </div>
  );
}

function ScaleRow({ scale, scaleRoot, degrees, matchable, onAdd }) {
  const chords   = scaleChords(scale, scaleRoot);
  const rootName = scaleRootName(scale, scaleRoot);

  // Construit un Set des paires "root-quality" de la progression pour la mise en surbrillance
  const highlightSet = new Set(
    (matchable || []).map(pc => `${pc.root}-${lookupQuality(pc.quality)}`)
  );

  return (
    <div className="p-2.5 rounded-sm" style={{ backgroundColor: '#1a1727', border: '1px solid #3a334a' }}>
      <div className="flex items-baseline gap-2 mb-2 px-0.5">
        <span className="f-display italic text-sm" style={{ color: '#ede5d8' }}>
          {rootName}
        </span>
        <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#7a7488' }}>
          {scale.short}
        </span>
        <span className="flex-1" />
        {/* Degrés romains de chaque accord de la progression dans cette gamme */}
        <span className="f-mono text-[9px] tracking-[0.18em] uppercase" style={{ color: '#c58aa0' }}>
          {degrees.map(d => scale.romans[d]).join(' · ')}
        </span>
      </div>
      <div className="overflow-x-auto -mx-0.5">
        <div className="flex gap-1 px-0.5" style={{ minWidth: 'max-content' }}>
          {chords.map((c, i) => {
            const isHighlight = highlightSet.has(`${c.root}-${c.quality}`);
            const canAdd      = c.quality === 'maj' || c.quality === 'min';
            return (
              <button
                key={i}
                onClick={canAdd ? () => { playChord(c.root, c.quality); onAdd({ root: c.root, quality: c.quality }); } : undefined}
                disabled={!canAdd}
                className="f-mono py-1.5 px-2 rounded-sm flex flex-col items-center transition-all"
                style={{
                  backgroundColor: isHighlight ? '#332639' : '#1f1c2a',
                  border: '1px solid ' + (isHighlight ? '#c58aa0' : '#3a334a'),
                  color: canAdd ? '#ede5d8' : '#7a7488',
                  cursor: canAdd ? 'pointer' : 'not-allowed',
                  minWidth: '48px',
                }}
                onMouseEnter={(e) => {
                  if (canAdd && !isHighlight) {
                    e.currentTarget.style.borderColor = '#6a5e80';
                    e.currentTarget.style.backgroundColor = '#252237';
                  }
                  if (canAdd) playChord(c.root, c.quality);
                }}
                onMouseLeave={(e) => {
                  if (canAdd && !isHighlight) {
                    e.currentTarget.style.borderColor = '#3a334a';
                    e.currentTarget.style.backgroundColor = '#1f1c2a';
                  }
                }}
              >
                <span
                  className="text-[8px] tracking-[0.12em] uppercase"
                  style={{ color: isHighlight ? '#c58aa0' : '#7a7488' }}
                >
                  {scale.romans[i]}
                </span>
                <span className="text-xs mt-0.5">
                  {chordName(c.root, c.quality)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
