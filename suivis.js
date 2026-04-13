/**
 * visiteurs.js — CRUD des visiteurs (membres de l'équipe)
 */

function renderEquipe() {
  updateStatus();
  const el = document.getElementById('equipe-list');

  if (!db.visiteurs.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">👥</div><p>Aucun visiteur.<br>Appuyez sur <b>+</b> pour en ajouter.</p></div>`;
    return;
  }

  el.innerHTML = db.visiteurs.map(p => {
    const vis = db.visites.filter(v => v.visiteur_id === p.id).length;
    const sig = db.visites.filter(v => {
      if (v.visiteur_id !== p.id) return false;
      return lastResult(v) === 'signe';
    }).length;

    return `<div class="card card-nc">
      <div class="card-head">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:38px;height:38px;border-radius:50%;background:var(--accent);
                      display:flex;align-items:center;justify-content:center;
                      font-family:Syne;font-weight:800;font-size:.85rem">
            ${p.initiales || p.nom.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div class="card-title" style="font-size:.95rem">${p.nom}</div>
            <div class="card-sub">${vis} visite${vis > 1 ? 's' : ''} · ${sig} signé${sig > 1 ? 's' : ''}</div>
          </div>
        </div>
        <button class="del-btn" onclick="deleteVisiteur('${p.id}','${p.nom.replace(/'/g,"\\'")}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>`;
  }).join('');
}

async function saveVisiteur() {
  const nom       = document.getElementById('p-nom').value.trim();
  const initiales = document.getElementById('p-init').value.trim().toUpperCase() || nom.slice(0, 2).toUpperCase();
  if (!nom) return toast('Entrez un nom', 'error');

  setBtnLoading('btn-sp', true);
  try {
    const r = await api('visiteurs', 'POST', { nom, initiales });
    db.visiteurs.push(r[0]);
    closeModal('modal-visiteur');
    document.getElementById('p-nom').value  = '';
    document.getElementById('p-init').value = '';
    renderEquipe();
    toast('✅ Visiteur ajouté !', 'success');
  } catch(e) { toast('❌ ' + e.message, 'error'); }
  setBtnLoading('btn-sp', false, 'Ajouter');
}

async function deleteVisiteur(id, nom) {
  if (!confirm(`Supprimer le visiteur "${nom}" ?`)) return;
  try {
    await api('visiteurs', 'DELETE', null, `?id=eq.${id}`);
    db.visiteurs = db.visiteurs.filter(p => p.id !== id);
    renderEquipe();
    toast('Supprimé', 'success');
  } catch(e) { toast('❌ ' + e.message, 'error'); }
}
