/**
 * suivis.js — CRUD des suivis (relances)
 */

function openSuivi(visiteId) {
  document.getElementById('suivi-visite-id').value = visiteId;
  document.getElementById('suivi-date').value      = new Date().toISOString().split('T')[0];
  document.getElementById('suivi-result').value    = 'rappeler';
  document.getElementById('suivi-notes').value     = '';
  openModal('modal-suivi');
}

async function saveSuivi() {
  const visite_id = document.getElementById('suivi-visite-id').value;
  const date      = document.getElementById('suivi-date').value;
  const result    = document.getElementById('suivi-result').value;
  const notes     = document.getElementById('suivi-notes').value.trim();
  if (!date) return toast('Entrez une date', 'error');

  setBtnLoading('btn-ss', true);
  try {
    const r = await api('suivis', 'POST', { visite_id, date, result, notes: notes || null });
    db.suivis.push(r[0]);
    closeModal('modal-suivi');
    toast('✅ Suivi enregistré !', 'success');

    // Rafraîchir la grille si on est sur les portes
    if (curView === 'portes') renderPortes();
    renderHome();

    // Réouvrir le détail de la porte concernée
    const visite = db.visites.find(v => v.id === visite_id);
    if (visite) showPorteDetail(visite.etage, visite.porte);

  } catch(e) { toast('❌ ' + e.message, 'error'); }
  setBtnLoading('btn-ss', false, 'Enregistrer');
}

async function deleteSuivi(id) {
  if (!confirm('Supprimer ce suivi ?')) return;
  try {
    const s = db.suivis.find(x => x.id === id);
    await api('suivis', 'DELETE', null, `?id=eq.${id}`);
    db.suivis = db.suivis.filter(x => x.id !== id);
    toast('🗑️ Suivi supprimé', 'success');

    if (curView === 'portes') renderPortes();
    if (s) {
      const v = db.visites.find(x => x.id === s.visite_id);
      if (v) showPorteDetail(v.etage, v.porte);
    }
  } catch(e) { toast('❌ ' + e.message, 'error'); }
}
