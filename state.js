/**
 * config.js — Configuration Supabase et constantes
 * ─────────────────────────────────────────────────
 * Modifiez uniquement ce fichier pour changer les clés Supabase.
 */

const SUPABASE_URL = 'https://evwhwlcsmfyvwpkmhqii.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2d2h3bGNzbWZ5dndwa21ocWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MzI0NDcsImV4cCI6MjA5MTMwODQ0N30.fRGG4fXRYYLzw82qhBGqCtWO1LwLmcpG2lOo3fQXXaI';

// Clé du cache localStorage
const CACHE_KEY = 'pt_v4';

// Intervalle de synchronisation automatique (ms)
const SYNC_INTERVAL = 30000;

// Script SQL pour créer les tables (affiché sur l'écran de config)
const SQL_SETUP = `
-- Visiteurs
create table if not exists visiteurs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  initiales text,
  created_at timestamptz default now()
);

-- Quartiers
create table if not exists quartiers (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  ville text not null,
  created_at timestamptz default now()
);

-- Bâtiments
create table if not exists batiments (
  id uuid primary key default gen_random_uuid(),
  quartier_id uuid references quartiers(id) on delete cascade,
  adresse text not null,
  etages integer default 0,
  portes integer default 4,
  created_at timestamptz default now()
);

-- Visites (avec nom affiché sur la porte)
create table if not exists visites (
  id uuid primary key default gen_random_uuid(),
  quartier_id uuid references quartiers(id) on delete cascade,
  batiment_id uuid references batiments(id) on delete cascade,
  visiteur_id uuid references visiteurs(id) on delete set null,
  etage integer not null,
  porte text not null,
  nom_porte text,        -- nom affiché sur la sonnette
  contact_nom text,      -- nom complet de la personne
  contact_tel text,
  date date not null,
  result text not null default 'absent',
  notes text,
  created_at timestamptz default now()
);

-- Suivis (historique de relances)
create table if not exists suivis (
  id uuid primary key default gen_random_uuid(),
  visite_id uuid references visites(id) on delete cascade,
  date date not null,
  result text not null default 'rappeler',
  notes text,
  created_at timestamptz default now()
);

-- Activation RLS (sécurité)
alter table visiteurs enable row level security;
alter table quartiers  enable row level security;
alter table batiments  enable row level security;
alter table visites    enable row level security;
alter table suivis     enable row level security;

-- Politiques ouvertes (mode test - à restreindre en production)
do $$ begin
  if not exists (select 1 from pg_policies where tablename='visiteurs' and policyname='open_visiteurs') then
    create policy open_visiteurs on visiteurs for all using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='quartiers' and policyname='open_quartiers') then
    create policy open_quartiers on quartiers for all using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='batiments' and policyname='open_batiments') then
    create policy open_batiments on batiments for all using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='visites' and policyname='open_visites') then
    create policy open_visites on visites for all using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='suivis' and policyname='open_suivis') then
    create policy open_suivis on suivis for all using (true) with check (true); end if;
end $$;
`;

// Copier le SQL dans le presse-papier
function copySQL() {
  navigator.clipboard.writeText(SQL_SETUP)
    .then(() => alert('✅ SQL copié ! Collez dans Supabase → SQL Editor → Run'))
    .catch(() => {
      const t = document.createElement('textarea');
      t.value = SQL_SETUP;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      document.body.removeChild(t);
      alert('✅ SQL copié !');
    });
}
