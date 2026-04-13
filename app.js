/**
 * quartiers.js — CRUD des quartiers
 */

function renderQuartiers() {
  const q = (document.getElementById('search-q').value || '').toLowerCase();
  const list = db.quartiers.filter(x =>
    x.nom.toLowerCase().includes(q) || x.ville.toLowerCase().includes(q)
  );
  const el = document.getElementById('quartiers-list');

  if (!list.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">🏘️</div><p>Aucun quartier.<br>Appuyez sur <b>+</b> pour en ajouter.</p></div>`;
    return;
  }

  el.innerHTML = list.map(q => {
    const bats = db.batiments.filter(b => b.quartier_id === q.id).length;
    const vis  = db.visites.filter(v => v.quartier_id === q.id).length;
    return `<div class="card">
      <div class="card-head" onclick="curQ='${q.id}';showView('batiments')">
        <div>
          <div class="card-title">${q.nom}</div>
          <div class="card-sub">${q.ville} · ${bats} bât. · ${vis} visite${vis > 1 ? 's' : ''}</div>
        </div>
        <span class="chip chip-orange">${bats} bât.</span>
      </div>
      <div class="card-actions">
        <button class="btn btn-secondary btn-sm" onclick="curQ='${q.id}';showView('batiments')">🏢 Voir bâtiments</button>
        <button class="btn btn-danger-soft btn-sm" onclick="deleteQuartier('${q.id}','${q.nom.replace(/'/g,"\\'")}')">🗑️ Supprimer</button>
      </div>
    </div>`;
  }).join('');
}

async function saveQuartier() {
  const nom   = document.getElementById('q-nom').value.trim();
  const ville = document.getElementById('q-ville').value.trim();
  if (!nom || !ville) return toast('Remplissez tous les champs', 'error');

  setBtnLoading('btn-sq', true);
  try {
    const r = await api('quartiers', 'POST', { nom, ville });
    db.quartiers.push(r[0]);
    closeModal('modal-quartier');
    document.getElementById('q-nom').value   = '';
    document.getElementById('q-ville').value = '';
    renderQuartiers();
    renderHome();
    toast('✅ Quartier ajouté !', 'success');
  } catch(e) { toast('❌ ' + e.message, 'error'); }
  setBtnLoading('btn-sq', false, 'Enregistrer');
}

async function deleteQuartier(id, nom) {
  if (!confirm(`Supprimer le quartier "${nom}" ?\n\nCela supprimera aussi tous ses bâtiments et visites.`)) return;
  try {
    await api('quartiers', 'DELETE', null, `?id=eq.${id}`);
    await syncAll(true);
    toast('🗑️ Quartier supprimé', 'success');
  } catch(e) { toast('❌ ' + e.message, 'error'); }
}
