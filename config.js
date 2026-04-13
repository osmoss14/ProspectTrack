/**
 * ui.js — Interface : navigation, modals, toast, boutons
 * ────────────────────────────────────────────────────────
 */

/* ══════════════════════════════════════
   NAVIGATION ENTRE PAGES
══════════════════════════════════════ */
function goPage(name, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
  curPage = name;

  if (name === 'quartiers') { showView('main'); renderQuartiers(); }
  if (name === 'visites')   renderVisites();
  if (name === 'home')      renderHome();
  if (name === 'equipe')    renderEquipe();
}

/* ══════════════════════════════════════
   NAVIGATION DANS LES SOUS-VUES
══════════════════════════════════════ */
function showView(v) {
  curView = v;
  document.getElementById('view-main').style.display      = v === 'main'      ? 'block' : 'none';
  document.getElementById('view-batiments').style.display = v === 'batiments' ? 'block' : 'none';
  document.getElementById('view-portes').style.display    = v === 'portes'    ? 'block' : 'none';

  if (v === 'batiments') renderBatiments();
  if (v === 'portes')    renderPortes();
}

/* ══════════════════════════════════════
   BOUTON + FLOTTANT
══════════════════════════════════════ */
function openFab() {
  if (curPage === 'equipe') {
    openModal('modal-visiteur');
    return;
  }
  if (curPage === 'quartiers') {
    if (curView === 'batiments') { openModal('modal-batiment'); return; }
    if (curView === 'portes')    { openVisiteModal(curQ, curB); return; }
    openModal('modal-quartier');
    return;
  }
  // Page accueil ou visites
  openVisiteModal();
}

/* ══════════════════════════════════════
   MODALS
══════════════════════════════════════ */
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

/* ══════════════════════════════════════
   TOAST (notification)
══════════════════════════════════════ */
let toastTimer;
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 2500);
}

/* ══════════════════════════════════════
   BOUTONS AVEC ÉTAT DE CHARGEMENT
══════════════════════════════════════ */
function setBtnLoading(id, loading, label = 'Enregistrer') {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled   = loading;
  btn.textContent = loading ? '⏳ En cours…' : label;
}

/* ══════════════════════════════════════
   INDICATEUR DE CONNEXION
══════════════════════════════════════ */
function updateStatus() {
  document.getElementById('status-dot').innerHTML = online
    ? '<span class="dot dot-green"></span>'
    : '<span class="dot dot-red"></span>';

  const title = document.getElementById('conn-title');
  const sub   = document.getElementById('conn-sub');
  if (title) {
    title.textContent = online ? '🟢 Connecté à Supabase' : '🔴 Hors ligne';
    sub.textContent   = online ? 'Données partagées en temps réel' : 'Données locales uniquement';
  }
}

/* ══════════════════════════════════════
   PAGE ACCUEIL — rendu
══════════════════════════════════════ */
function renderHome() {
  document.getElementById('s-q').textContent = db.quartiers.length;
  document.getElementById('s-b').textContent = db.batiments.length;
  document.getElementById('s-v').textContent = db.visites.length;
  document.getElementById('topbar-badge').textContent =
    db.visites.length + ' visite' + (db.visites.length > 1 ? 's' : '');

  // Activité récente
  const rl = document.getElementById('recent-list');
  const rec = db.visites.slice(0, 5);
  if (!rec.length) {
    rl.innerHTML = `<div class="empty"><div class="empty-icon">📭</div><p>Aucune visite encore.<br>Commencez par ajouter un quartier !</p></div>`;
  } else {
    rl.innerHTML = rec.map(v => {
      const b  = db.batiments.find(x => x.id === v.batiment_id);
      const vt = db.visiteurs.find(x => x.id === v.visiteur_id);
      const lr = lastResult(v);
      return `<div class="card card-nc">
        <div class="card-head">
          <div>
            <div style="font-size:.85rem;font-weight:600">${b?.adresse || '?'} · Ét.${v.etage} P.${v.porte}${v.nom_porte ? ' <span style="color:var(--muted)">· ' + v.nom_porte + '</span>' : ''}</div>
            ${v.contact_nom ? `<div style="font-size:.78rem;color:var(--text);margin-top:2px">👤 ${v.contact_nom}</div>` : ''}
            <div class="card-sub">${fDate(v.date)} · ${vt?.nom || '?'}</div>
          </div>
          <span class="chip ${rChip(lr)}">${rLabel(lr)}</span>
        </div>
      </div>`;
    }).join('');
  }

  // Graphique résultats
  const cnt = { interesse: 0, absent: 0, rappeler: 0, signe: 0, refuse: 0 };
  db.visites.forEach(v => {
    const r = lastResult(v);
    if (cnt[r] !== undefined) cnt[r]++;
  });
  const tot = db.visites.length || 1;
  const bars = [
    { k: 'signe',     l: 'Signé',      c: 'var(--success)' },
    { k: 'interesse', l: 'Intéressé',  c: 'var(--accent)'  },
    { k: 'rappeler',  l: 'À rappeler', c: 'var(--warning)' },
    { k: 'absent',    l: 'Absent',     c: 'var(--muted)'   },
    { k: 'refuse',    l: 'Refus',      c: 'var(--danger)'  },
  ];
  document.getElementById('result-chart').innerHTML = bars.map(b => `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <div style="width:80px;font-size:.75rem;color:var(--muted);text-align:right">${b.l}</div>
      <div style="flex:1;background:var(--surface2);border-radius:6px;height:18px;overflow:hidden">
        <div style="height:100%;background:${b.c};width:${Math.round(cnt[b.k] / tot * 100)}%;border-radius:6px"></div>
      </div>
      <div style="width:24px;font-size:.75rem;font-weight:600">${cnt[b.k]}</div>
    </div>`).join('');
}
