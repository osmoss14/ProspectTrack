/**
 * visites.js — CRUD des visites
 * ──────────────────────────────────────────────────────────
 * NOUVEAUTÉ : 
 *  - Sélecteurs en cascade Quartier → Bâtiment → Étage → Porte
 *  - Quand on choisit une porte, si un nom existe déjà, il est
 *    pré-rempli automatiquement dans le champ "Nom sonnette"
 *  - Le nom sauvegardé est affiché sur la grille de portes
 */

/* ══════════════════════════════════════
   OUVRIR LE MODAL DE VISITE
══════════════════════════════════════ */
function openVisiteModal(qId = null, bId = null, etage = null, porte = null) {
  // Réinitialiser le formulaire
  resetVisiteForm();

  // Pré-remplir si on vient d'une porte spécifique
  if (qId) {
    document.getElementById('v-quartier').value = qId;
    updateVBats();
  }
  if (bId) {
    setTimeout(() => {
      document.getElementById('v-batiment').value = bId;
      updateVEtages();
      if (etage !== null) {
        setTimeout(() => {
          document.getElementById('v-etage').value = etage;
          updateVPortes();
          if (porte !== null) {
            setTimeout(() => {
              document.getElementById('v-porte').value = porte;
              onPorteSelected();
            }, 60);
          }
        }, 60);
      }
    }, 60);
  }

  openModal('modal-visite');
}

/* ── Réinitialiser le formulaire ── */
function resetVisiteForm() {
  document.getElementById('v-quartier').innerHTML  = '<option value="">-- Choisir --</option>' +
    db.quartiers.map(q => `<option value="${q.id}">${q.nom} — ${q.ville}</option>`).join('');
  document.getElementById('v-visiteur').innerHTML  = '<option value="">-- Choisir --</option>' +
    db.visiteurs.map(p => `<option value="${p.id}">${p.nom}</option>`).join('');
  document.getElementById('v-batiment').innerHTML  = '<option value="">-- Choisir un quartier --</option>';
  document.getElementById('v-etage').innerHTML     = '<option value="">-- Choisir un bâtiment --</option>';
  document.getElementById('v-porte').innerHTML     = '<option value="">-- Choisir un étage --</option>';
  document.getElementById('v-date').value          = new Date().toISOString().split('T')[0];
  document.getElementById('v-result').value        = 'absent';
  document.getElementById('v-nom-porte').value     = '';
  document.getElementById('v-contact-nom').value   = '';
  document.getElementById('v-contact-tel').value   = '';
  document.getElementById('v-notes').value         = '';
  document.getElementById('porte-nom-existant').style.display = 'none';
}

/* ══════════════════════════════════════
   SÉLECTEURS EN CASCADE
══════════════════════════════════════ */

/** Quartier choisi → mettre à jour les bâtiments */
function updateVBats() {
  const qId = document.getElementById('v-quartier').value;
  document.getElementById('v-batiment').innerHTML =
    '<option value="">-- Choisir --</option>' +
    db.batiments
      .filter(b => b.quartier_id === qId)
      .map(b => `<option value="${b.id}">${b.adresse}</option>`)
      .join('');
  // Reset étages et portes
  document.getElementById('v-etage').innerHTML = '<option value="">-- Choisir un bâtiment --</option>';
  document.getElementById('v-porte').innerHTML = '<option value="">-- Choisir un étage --</option>';
  document.getElementById('porte-nom-existant').style.display = 'none';
}

/** Bâtiment choisi → mettre à jour les étages */
function updateVEtages() {
  const bId = document.getElementById('v-batiment').value;
  const bat = db.batiments.find(b => b.id === bId);
  if (!bat) return;

  let opts = '<option value="">-- Choisir --</option>';
  for (let e = 0; e <= bat.etages; e++) {
    opts += `<option value="${e}">${e === 0 ? 'Rez-de-chaussée (0)' : 'Étage ' + e}</option>`;
  }
  document.getElementById('v-etage').innerHTML = opts;
  document.getElementById('v-porte').innerHTML = '<option value="">-- Choisir un étage --</option>';
  document.getElementById('porte-nom-existant').style.display = 'none';
}

/** Étage choisi → mettre à jour les portes */
function updateVPortes() {
  const bId  = document.getElementById('v-batiment').value;
  const etage = document.getElementById('v-etage').value;
  const bat  = db.batiments.find(b => b.id === bId);
  if (!bat || etage === '') return;

  let opts = '<option value="">-- Choisir --</option>';
  for (let p = 1; p <= bat.portes; p++) {
    // Chercher si un nom existe déjà pour cette porte
    const nomExistant = getNomPorte(bId, etage, p);
    const label = nomExistant ? `${p} — ${nomExistant}` : `${p}`;
    opts += `<option value="${p}">${label}</option>`;
  }
  document.getElementById('v-porte').innerHTML = opts;
  document.getElementById('porte-nom-existant').style.display = 'none';
}

/** Porte choisie → pré-remplir le nom si connu */
function onPorteSelected() {
  const bId   = document.getElementById('v-batiment').value;
  const etage = document.getElementById('v-etage').value;
  const porte = document.getElementById('v-porte').value;

  if (!bId || etage === '' || !porte) return;

  const nomExistant = getNomPorte(bId, etage, porte);

  if (nomExistant) {
    // Pré-remplir le champ nom
    document.getElementById('v-nom-porte').value = nomExistant;
    // Afficher l'info box
    document.getElementById('porte-nom-label').innerHTML =
      `✅ Nom connu pour cette porte : <strong>${nomExistant}</strong>`;
    document.getElementById('porte-nom-existant').style.display = 'block';
  } else {
    document.getElementById('porte-nom-existant').style.display = 'none';
  }
}

/* ══════════════════════════════════════
   SAUVEGARDER UNE VISITE
══════════════════════════════════════ */
async function saveVisite() {
  const quartier_id = document.getElementById('v-quartier').value;
  const batiment_id = document.getElementById('v-batiment').value;
  const etage       = parseInt(document.getElementById('v-etage').value);
  const porte       = document.getElementById('v-porte').value.trim();
  const visiteur_id = document.getElementById('v-visiteur').value;
  const date        = document.getElementById('v-date').value;
  const result      = document.getElementById('v-result').value;
  const nom_porte   = document.getElementById('v-nom-porte').value.trim();
  const contact_nom = document.getElementById('v-contact-nom').value.trim();
  const contact_tel = document.getElementById('v-contact-tel').value.trim();
  const notes       = document.getElementById('v-notes').value.trim();

  if (!quartier_id || !batiment_id || isNaN(etage) || !porte || !visiteur_id || !date) {
    return toast('Remplissez tous les champs obligatoires', 'error');
  }

  setBtnLoading('btn-sv', true);
  try {
    const body = {
      quartier_id,
      batiment_id,
      visiteur_id,
      etage,
      porte,
      date,
      result,
      nom_porte:   nom_porte   || null,
      contact_nom: contact_nom || null,
      contact_tel: contact_tel || null,
      notes:       notes       || null,
    };
    const r = await api('visites', 'POST', body);
    db.visites.unshift(r[0]);

    closeModal('modal-visite');
    renderHome();
    if (curPage === 'visites')  renderVisites();
    if (curView === 'portes')   renderPortes();
    toast('✅ Visite enregistrée !', 'success');
  } catch(e) { toast('❌ ' + e.message, 'error'); }
  setBtnLoading('btn-sv', false, 'Enregistrer la visite');
}

/* ══════════════════════════════════════
   SUPPRIMER UNE VISITE
══════════════════════════════════════ */
async function deleteVisite(id) {
  if (!confirm('Supprimer cette visite et tous ses suivis ?')) return;
  try {
    await api('visites', 'DELETE', null, `?id=eq.${id}`);
    db.visites = db.visites.filter(v => v.id !== id);
    db.suivis  = db.suivis.filter(s => s.visite_id !== id);
    closeModal('modal-porte');
    await syncAll(true);
    toast('🗑️ Visite supprimée', 'success');
  } catch(e) { toast('❌ ' + e.message, 'error'); }
}

/* ══════════════════════════════════════
   PAGE VISITES — rendu liste
══════════════════════════════════════ */
function renderVisites() {
  // Filtres
  document.getElementById('visit-filter').innerHTML =
    `<div class="filter-chip ${filterV==='all'       ?'active':''}" onclick="filterV='all';renderVisites()">Tous</div>` +
    `<div class="filter-chip ${filterV==='interesse' ?'active':''}" onclick="filterV='interesse';renderVisites()">🟢 Intéressés</div>` +
    `<div class="filter-chip ${filterV==='rappeler'  ?'active':''}" onclick="filterV='rappeler';renderVisites()">🟡 À rappeler</div>` +
    `<div class="filter-chip ${filterV==='signe'     ?'active':''}" onclick="filterV='signe';renderVisites()">⭐ Signés</div>`;

  let vis = [...db.visites];
  if (filterV !== 'all') {
    vis = vis.filter(v => lastResult(v) === filterV);
  }

  const el = document.getElementById('visites-list');
  if (!vis.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">📋</div><p>Aucune visite.</p></div>`;
    return;
  }

  el.innerHTML = vis.map(v => {
    const b   = db.batiments.find(x => x.id === v.batiment_id);
    const q   = db.quartiers.find(x => x.id === v.quartier_id);
    const vt  = db.visiteurs.find(x => x.id === v.visiteur_id);
    const lr  = lastResult(v);
    const nbS = db.suivis.filter(s => s.visite_id === v.id).length;

    return `<div class="card card-nc">
      <div class="card-head">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span class="card-title" style="font-size:.9rem">${b?.adresse || '?'} · Ét.${v.etage} P.${v.porte}</span>
            <span class="chip ${rChip(lr)}">${rLabel(lr)}</span>
          </div>
          ${v.nom_porte ? `<div style="font-size:.78rem;color:var(--muted);margin-top:3px">📋 ${v.nom_porte}</div>` : ''}
          ${v.contact_nom ? `<div style="font-size:.82rem;color:var(--text);margin-top:3px">👤 ${v.contact_nom}${v.contact_tel ? ' · ' + v.contact_tel : ''}</div>` : ''}
          <div class="card-sub">
            ${q?.nom || ''} · ${fDate(v.date)} · ${vt?.nom || '?'}
            ${nbS ? ` · <span style="color:var(--accent)">${nbS} suivi${nbS > 1 ? 's' : ''}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn btn-primary btn-sm"      onclick="openSuivi('${v.id}')">📋 + Suivi</button>
        ${v.contact_tel ? `<a href="tel:${v.contact_tel}" class="btn btn-secondary btn-sm" style="text-decoration:none;display:inline-flex;align-items:center">📞</a>` : ''}
        <button class="btn btn-danger-soft btn-sm"  onclick="deleteVisite('${v.id}')">🗑️</button>
      </div>
    </div>`;
  }).join('');
}
