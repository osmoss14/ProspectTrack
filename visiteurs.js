/**
 * batiments.js — CRUD des bâtiments
 */

function renderBatiments() {
  const q = db.quartiers.find(x => x.id === curQ);
  document.getElementById('batiments-header').innerHTML =
    `<h2 style="font-family:Syne;font-size:1.1rem;margin-bottom:12px">
       ${q?.nom} <span style="color:var(--muted);font-size:.8rem">${q?.ville}</span>
     </h2>`;

  const list = db.batiments.filter(b => b.quartier_id === curQ);
  const el   = document.getElementById('batiments-list');

  if (!list.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">🏢</div><p>Aucun bâtiment.<br>Appuyez sur <b>+</b>.</p></div>`;
    return;
  }

  el.innerHTML = list.map(b => {
    const vis   = db.visites.filter(v => v.batiment_id === b.id).length;
    const total = (b.etages + 1) * b.portes;
    const pct   = total > 0 ? Math.round(vis / total * 100) : 0;
    return `<div class="card">
      <div class="card-head" onclick="curB='${b.id}';showView('portes')">
        <div style="flex:1">
          <div class="card-title">${b.adresse}</div>
          <div class="card-sub">${vis}/${total} portes visitées · ${pct}%</div>
          <div class="prog-wrap"><div class="prog-bar" style="width:${pct}%"></div></div>
        </div>
        <span class="chip chip-gray" style="margin-left:10px">${b.etages} ét.</span>
      </div>
      <div class="card-actions">
        <button class="btn btn-secondary btn-sm" onclick="curB='${b.id}';showView('portes')">🚪 Voir portes</button>
        <button class="btn btn-danger-soft btn-sm" onclick="deleteBatiment('${b.id}','${b.adresse.replace(/'/g,"\\'")}')">🗑️ Supprimer</button>
      </div>
    </div>`;
  }).join('');
}

async function saveBatiment() {
  const adresse = document.getElementById('b-adresse').value.trim();
  const etages  = parseInt(document.getElementById('b-etages').value) || 0;
  const portes  = parseInt(document.getElementById('b-portes').value) || 4;
  if (!adresse) return toast('Entrez une adresse', 'error');

  setBtnLoading('btn-sb', true);
  try {
    const r = await api('batiments', 'POST', { quartier_id: curQ, adresse, etages, portes });
    db.batiments.push(r[0]);
    closeModal('modal-batiment');
    document.getElementById('b-adresse').value = '';
    document.getElementById('b-etages').value  = '';
    document.getElementById('b-portes').value  = '';
    renderBatiments();
    renderHome();
    toast('✅ Bâtiment ajouté !', 'success');
  } catch(e) { toast('❌ ' + e.message, 'error'); }
  setBtnLoading('btn-sb', false, 'Enregistrer');
}

async function deleteBatiment(id, adresse) {
  if (!confirm(`Supprimer le bâtiment "${adresse}" ?\n\nCela supprimera aussi toutes ses visites.`)) return;
  try {
    await api('batiments', 'DELETE', null, `?id=eq.${id}`);
    await syncAll(true);
    if (curView === 'portes') showView('batiments');
    else renderBatiments();
    toast('🗑️ Bâtiment supprimé', 'success');
  } catch(e) { toast('❌ ' + e.message, 'error'); }
}
