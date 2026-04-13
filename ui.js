/**
 * portes.js — Grille de portes et détail d'une porte
 * ─────────────────────────────────────────────────────
 * NOUVEAUTÉ : si une visite existe pour une porte avec un nom_porte,
 * ce nom est affiché directement sur la cellule de la grille.
 */

/* ══════════════════════════════════════
   GRILLE DE PORTES
══════════════════════════════════════ */
function renderPortes() {
  const b = db.batiments.find(x => x.id === curB);
  const q = db.quartiers.find(x => x.id === b?.quartier_id);

  document.getElementById('portes-header').innerHTML =
    `<h2 style="font-family:Syne;font-size:1.05rem;margin-bottom:4px">${b?.adresse}</h2>
     <div style="font-size:.8rem;color:var(--muted);margin-bottom:14px">${q?.nom}</div>`;

  let html = '';

  for (let et = 0; et <= b.etages; et++) {
    html += `<div class="section-title">${et === 0 ? 'Rez-de-chaussée' : 'Étage ' + et}</div>
             <div class="porte-grid">`;

    for (let p = 1; p <= b.portes; p++) {
      // Visites pour cette porte précise (triées par date desc)
      const visites = db.visites.filter(v =>
        v.batiment_id === curB &&
        String(v.etage) === String(et) &&
        String(v.porte) === String(p)
      );

      // Visite la plus récente
      const derniere = visites[0] || null;

      // Dernier résultat (visite ou suivi)
      let lr = derniere ? lastResult(derniere) : null;

      // Nom affiché sur la porte (depuis la première visite qui a un nom)
      const nomPorte = visites.find(v => v.nom_porte)?.nom_porte || null;

      html += `<div class="porte-cell" 
                    style="background:${rColor(lr)}" 
                    onclick="showPorteDetail(${et},${p})">
        <div class="porte-cell-icon">${rIcon(lr)}</div>
        <div class="porte-cell-num">${p}</div>
        ${nomPorte
          ? `<div class="porte-cell-name" title="${nomPorte}">${nomPorte}</div>`
          : '<div class="porte-cell-name" style="color:var(--muted)">—</div>'
        }
      </div>`;
    }

    html += '</div>'; // fin porte-grid
  }

  document.getElementById('portes-list').innerHTML = html;
}

/* ══════════════════════════════════════
   DÉTAIL D'UNE PORTE (modal)
══════════════════════════════════════ */
function showPorteDetail(et, p) {
  const visites = db.visites.filter(v =>
    v.batiment_id === curB &&
    String(v.etage) === String(et) &&
    String(v.porte) === String(p)
  );

  // Nom connu sur cette porte
  const nomPorteConnu = visites.find(v => v.nom_porte)?.nom_porte || null;

  document.getElementById('mp-title').innerHTML =
    `<div>
       <span>Étage ${et} · Porte ${p}</span>
       ${nomPorteConnu ? `<div style="font-size:.75rem;color:var(--accent);font-weight:500;margin-top:2px">📋 ${nomPorteConnu}</div>` : ''}
     </div>
     <button class="modal-close" onclick="closeModal('modal-porte')">✕</button>`;

  let html = '';

  if (!visites.length) {
    html = `<div class="empty">
      <div class="empty-icon">🚪</div>
      <p>Aucune visite pour cette porte.</p>
    </div>`;
  } else {
    visites.forEach(v => {
      const vt     = db.visiteurs.find(x => x.id === v.visiteur_id);
      const suivis = db.suivis
        .filter(s => s.visite_id === v.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      html += `<div class="card card-nc" style="margin-bottom:12px">`;

      // Contact
      if (v.contact_nom || v.contact_tel || v.nom_porte) {
        html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">👤</div>
          <div style="flex:1">
            ${v.contact_nom ? `<div class="contact-name">${v.contact_nom}</div>` : ''}
            ${v.nom_porte && v.nom_porte !== v.contact_nom ? `<div style="font-size:.75rem;color:var(--muted)">📋 Sonnette : ${v.nom_porte}</div>` : ''}
            ${v.contact_tel ? `<div class="contact-meta">${v.contact_tel}</div>` : ''}
          </div>
          ${v.contact_tel
            ? `<a href="tel:${v.contact_tel}" style="background:var(--surface2);border-radius:8px;padding:6px 10px;font-size:.75rem;color:var(--accent);text-decoration:none;white-space:nowrap">📞 Appeler</a>`
            : ''
          }
        </div>`;
      }

      // Timeline
      html += `<div class="timeline">`;

      // Visite initiale
      html += `<div class="tl-item">
        <div class="tl-dot-wrap">
          <div class="tl-dot" style="background:${rDot(v.result)}"></div>
          ${suivis.length ? '<div class="tl-line"></div>' : ''}
        </div>
        <div class="tl-content">
          <div class="tl-date">📅 ${fDate(v.date)} · Visite initiale · <span style="color:var(--muted)">${vt?.nom || '?'}</span></div>
          <span class="chip ${rChip(v.result)}">${rLabel(v.result)}</span>
          ${v.notes ? `<div class="tl-note" style="margin-top:4px">${v.notes}</div>` : ''}
        </div>
      </div>`;

      // Suivis
      suivis.forEach((s, i) => {
        html += `<div class="tl-item">
          <div class="tl-dot-wrap">
            <div class="tl-dot" style="background:${rDot(s.result)}"></div>
            ${i < suivis.length - 1 ? '<div class="tl-line"></div>' : ''}
          </div>
          <div class="tl-content">
            <div class="tl-date">📅 ${fDate(s.date)} · Relance</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
              <span class="chip ${rChip(s.result)}">${rLabel(s.result)}</span>
              <button onclick="deleteSuivi('${s.id}')" 
                      style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.75rem;padding:2px 4px;border-radius:4px">🗑️</button>
            </div>
            ${s.notes ? `<div class="tl-note" style="margin-top:4px">${s.notes}</div>` : ''}
          </div>
        </div>`;
      });

      html += `</div>`; // fin timeline

      // Actions
      html += `<div class="card-actions" style="flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="openSuivi('${v.id}')">📋 + Suivi</button>
        <button class="btn btn-secondary btn-sm" 
                onclick="closeModal('modal-porte');openVisiteModal('${curQ}','${curB}',${et},${p})">
          + Nouvelle visite
        </button>
        <button class="btn btn-danger-soft btn-sm" onclick="deleteVisite('${v.id}')">🗑️ Supprimer</button>
      </div>`;

      html += `</div>`; // fin card
    });
  }

  // Bouton si aucune visite
  if (!visites.length) {
    html += `<button class="btn btn-primary" style="margin-top:10px"
              onclick="closeModal('modal-porte');openVisiteModal('${curQ}','${curB}',${et},${p})">
               + Enregistrer une visite
             </button>`;
  }

  document.getElementById('mp-content').innerHTML = html;
  openModal('modal-porte');
}
