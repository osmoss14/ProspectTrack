/**
 * state.js — État partagé et fonctions utilitaires
 * ──────────────────────────────────────────────────
 * Toutes les variables globales et helpers réutilisables.
 */

/* ── Cache des données ── */
let db = {
  quartiers:  [],
  batiments:  [],
  visites:    [],
  visiteurs:  [],
  suivis:     [],
};

/* ── Navigation ── */
let curPage = 'home';
let curView = 'main';   // 'main' | 'batiments' | 'portes'
let curQ    = null;     // ID du quartier ouvert
let curB    = null;     // ID du bâtiment ouvert

/* ── Filtre actif sur la page Visites ── */
let filterV = 'all';

/* ── État de la connexion ── */
let online = true;

/* ═══════════════════════════════════════
   HELPERS : couleurs et labels selon résultat
═══════════════════════════════════════ */

/** Couleur de fond d'une cellule porte */
function rColor(r) {
  return {
    interesse: '#14532d55',
    absent:    '#1c1917',
    rappeler:  '#42200644',
    refuse:    '#450a0a55',
    signe:     '#14532d',
  }[r] || 'var(--surface2)';
}

/** Emoji représentant le résultat */
function rIcon(r) {
  return { interesse:'🟢', absent:'🔴', rappeler:'🟡', refuse:'⛔', signe:'⭐' }[r] || '🚪';
}

/** Libellé lisible */
function rLabel(r) {
  return { interesse:'Intéressé', absent:'Absent', rappeler:'À rappeler', refuse:'Refus', signe:'Signé' }[r] || r;
}

/** Classe CSS chip */
function rChip(r) {
  return {
    interesse: 'chip-green',
    absent:    'chip-gray',
    rappeler:  'chip-yellow',
    refuse:    'chip-red',
    signe:     'chip-green',
  }[r] || 'chip-gray';
}

/** Couleur du point timeline */
function rDot(r) {
  return {
    interesse: '#22c55e',
    absent:    '#64748b',
    rappeler:  '#eab308',
    refuse:    '#ef4444',
    signe:     '#22c55e',
  }[r] || '#64748b';
}

/* ── Format date JJ/MM/AAAA ── */
function fDate(d) {
  if (!d) return '?';
  const [y, m, j] = d.split('-');
  return `${j}/${m}/${y}`;
}

/* ── Obtenir le dernier résultat d'une visite (visite ou suivi) ── */
function lastResult(visite) {
  const suivis = db.suivis
    .filter(s => s.visite_id === visite.id)
    .sort((a, b) => a.date.localeCompare(b.date));
  return suivis.length ? suivis[suivis.length - 1].result : visite.result;
}

/* ── Obtenir le nom affiché sur une porte (batiment+etage+porte) ── */
function getNomPorte(batimentId, etage, porte) {
  const v = db.visites.find(
    v => v.batiment_id === batimentId &&
         String(v.etage) === String(etage) &&
         String(v.porte) === String(porte) &&
         v.nom_porte
  );
  return v ? v.nom_porte : null;
}
