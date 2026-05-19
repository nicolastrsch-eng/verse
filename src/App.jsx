import React, { useState, useMemo } from 'react';
import { Sun, ArrowUpRight, CloudRain, ArrowDownRight, Zap, Sparkles, RotateCcw, Undo2, Check, X, ArrowLeft } from 'lucide-react';

// ============================================================
// CHORD NAMING
// ============================================================
const NOTE_MAJOR = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const NOTE_MINOR = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function chordName(root, quality) {
  const r = ((root % 12) + 12) % 12;
  const isMinor = quality === 'min' || quality === 'm7';
  const note = isMinor ? NOTE_MINOR[r] : NOTE_MAJOR[r];
  const suffix = {
    maj: '', min: 'm', '7': '7', maj7: 'maj7', m7: 'm7',
    sus2: 'sus2', sus4: 'sus4', dim: '°', aug: '+',
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
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
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
  '0-sus2': { frets: [-1, 3, 0, 0, 1, 3], barre: 0 },
  '0-sus4': { frets: [-1, 3, 3, 0, 1, 1], barre: 0 },

  // D family
  '2-maj':  { frets: [-1, -1, 0, 2, 3, 2], barre: 0 },
  '2-min':  { frets: [-1, -1, 0, 2, 3, 1], barre: 0 },
  '2-7':    { frets: [-1, -1, 0, 2, 1, 2], barre: 0 },
  '2-maj7': { frets: [-1, -1, 0, 2, 2, 2], barre: 0 },
  '2-m7':   { frets: [-1, -1, 0, 2, 1, 1], barre: 0 },
  '2-sus2': { frets: [-1, -1, 0, 2, 3, 0], barre: 0 },
  '2-sus4': { frets: [-1, -1, 0, 2, 3, 3], barre: 0 },

  // E sus2 (voicing ouvert idiomatique)
  '4-sus2': { frets: [0, 2, 4, 4, 0, 0], barre: 0 },

  // F maj7 ouvert
  '5-maj7': { frets: [-1, -1, 3, 2, 1, 0], barre: 0 },

  // G family
  '7-maj':  { frets: [3, 2, 0, 0, 0, 3], barre: 0 },
  '7-7':    { frets: [3, 2, 0, 0, 0, 1], barre: 0 },
  '7-maj7': { frets: [3, 2, 0, 0, 0, 2], barre: 0 },
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
    sus4: [0, 2, 2, 2, 0, 0],
    // sus2 délicat sur E-shape → A-shape s'en charge
  },
  // A-shape (fondamentale sur La)
  A: {
    maj:  [-1, 0, 2, 2, 2, 0],
    min:  [-1, 0, 2, 2, 1, 0],
    '7':  [-1, 0, 2, 0, 2, 0],
    maj7: [-1, 0, 2, 1, 2, 0],
    m7:   [-1, 0, 2, 0, 1, 0],
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
  if (quality === 'maj' || quality === 'maj7' || quality === '7') return 'maj';
  if (quality === 'min' || quality === 'm7')                       return 'min';
  return null; // sus2 / sus4 sont ambigus
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

function scaleRootName(scale, scaleRoot) {
  // Côté majeur (maj, lyd, mix) → bémols ; côté mineur (toutes les autres) → dièses.
  const sharps = ['minor','dorian','phrygian','harm_min','mel_min'].includes(scale.id);
  return (sharps ? NOTE_MINOR : NOTE_MAJOR)[scaleRoot];
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
];

const ALL_QUALITIES = ['maj', 'min', '7', 'maj7', 'm7', 'sus2', 'sus4'];
const QUALITY_LABELS = {
  maj: 'majeur', min: 'mineur', '7': 'dom. 7',
  maj7: 'maj7', m7: 'm7', sus2: 'sus2', sus4: 'sus4',
};

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
  const suggestions = useMemo(
    () => currentChord ? getSuggestions(currentChord) : [],
    [currentChord && currentChord.root, currentChord && currentChord.quality]
  );

  const handleStarter = (chord) => setProgression([{ ...chord, mood: null }]);
  const handleSuggestion = (s) => setProgression(p => [...p, s]);

  // Ajoute un accord brut (depuis la vue gammes) en dérivant l'humeur
  // s'il correspond à une suggestion répertoriée pour l'accord courant.
  const handleAddChord = (chord) => {
    setProgression(p => {
      const last = p[p.length - 1];
      let mood = null;
      if (last) {
        const sugg = getSuggestions(last);
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
        // Try to derive the mood from the previous chord's suggestions.
        const prev = updated[i - 1];
        const sugg = getSuggestions(prev);
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

  const handleValidate    = () => { setEditingIndex(null); setView('final'); };
  const handleBackToEdit  = () => setView('build');

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

      {progression.length === 0 ? (
        <ChordPicker onSelect={handleStarter} />
      ) : view === 'final' ? (
        <FinalScreen
          progression={progression}
          onBack={handleBackToEdit}
          onReset={handleReset}
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
function ChordPicker({ onSelect }) {
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
  const editSuggestions = useMemo(
    () => prevChord ? getSuggestions(prevChord) : [],
    [prevChord && prevChord.root, prevChord && prevChord.quality]
  );

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
            <div className="f-mono text-xl sm:text-2xl mb-1 leading-none" style={{ color: '#ede5d8' }}>
              {chordName(s.root, s.quality)}
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
function ChordDiagrams({ chord, showGuitar, showPiano, showScales,
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
        <ScalesPanel chord={chord} onAdd={onAddChord} />
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
function FinalScreen({ progression, onBack, onReset, showGuitar, showPiano, setShowGuitar, setShowPiano }) {
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

      {/* footer actions */}
      <div className="mt-12 pt-6 flex items-center gap-5" style={{ borderTop: '1px solid rgba(58, 51, 74, 0.5)' }}>
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
// SCALES PANEL (toutes les gammes contenant l'accord en cours)
// ============================================================
function ScalesPanel({ chord, onAdd }) {
  const results = useMemo(
    () => findContainingScales(chord),
    [chord.root, chord.quality]
  );

  if (results.length === 0) {
    return (
      <div className="mt-6 text-center anim-fade">
        <p className="f-mono text-[11px] leading-relaxed" style={{ color: '#7a7488' }}>
          pas de lecture diatonique directe<br />
          (accord suspendu — ambigu modalement)
        </p>
      </div>
    );
  }

  // Regrouper par type de gamme tout en préservant l'ordre canonique
  // défini dans SCALES.
  const grouped = [];
  for (const r of results) {
    let g = grouped.find(x => x.scale.id === r.scale.id);
    if (!g) { g = { scale: r.scale, occurrences: [] }; grouped.push(g); }
    g.occurrences.push({ scaleRoot: r.scaleRoot, degree: r.degree });
  }

  return (
    <div className="mt-6 anim-fade">
      <div className="text-[10px] tracking-[0.25em] uppercase mb-4 flex items-center gap-3" style={{ color: '#7a7488' }}>
        <span>cet accord apparaît dans {results.length} gammes</span>
        <span className="flex-1 h-px" style={{ backgroundColor: '#3a334a', opacity: 0.5 }} />
      </div>
      <div className="space-y-5">
        {grouped.map(({ scale, occurrences }) => (
          <ScaleGroup
            key={scale.id}
            scale={scale}
            occurrences={occurrences}
            highlightRoot={chord.root}
            highlightQuality={chord.quality}
            onAdd={onAdd}
          />
        ))}
      </div>
    </div>
  );
}

function ScaleGroup({ scale, occurrences, highlightRoot, highlightQuality, onAdd }) {
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
            degree={occ.degree}
            highlightRoot={highlightRoot}
            highlightQuality={highlightQuality}
            onAdd={onAdd}
          />
        ))}
      </div>
    </div>
  );
}

function ScaleRow({ scale, scaleRoot, degree, highlightRoot, highlightQuality, onAdd }) {
  const chords     = scaleChords(scale, scaleRoot);
  const rootName   = scaleRootName(scale, scaleRoot);
  const targetQual = lookupQuality(highlightQuality);

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
        <span className="f-mono text-[9px] tracking-[0.18em] uppercase" style={{ color: '#c58aa0' }}>
          → {scale.romans[degree]}
        </span>
      </div>
      <div className="overflow-x-auto -mx-0.5">
        <div className="flex gap-1 px-0.5" style={{ minWidth: 'max-content' }}>
          {chords.map((c, i) => {
            const isHighlight = c.root === highlightRoot && c.quality === targetQual;
            const canAdd      = c.quality === 'maj' || c.quality === 'min';
            return (
              <button
                key={i}
                onClick={canAdd ? () => onAdd({ root: c.root, quality: c.quality }) : undefined}
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
