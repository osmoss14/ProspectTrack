-- ═══════════════════════════════════════════════════════
-- ProspectTrack — Script SQL de configuration Supabase
-- À exécuter une seule fois dans Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════

-- Visiteurs (membres de l'équipe)
create table if not exists visiteurs (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null,
  initiales  text,
  created_at timestamptz default now()
);

-- Quartiers
create table if not exists quartiers (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null,
  ville      text not null,
  created_at timestamptz default now()
);

-- Bâtiments
create table if not exists batiments (
  id          uuid primary key default gen_random_uuid(),
  quartier_id uuid references quartiers(id) on delete cascade,
  adresse     text not null,
  etages      integer default 0,
  portes      integer default 4,
  created_at  timestamptz default now()
);

-- Visites (avec nom affiché sur la porte)
create table if not exists visites (
  id          uuid primary key default gen_random_uuid(),
  quartier_id uuid references quartiers(id) on delete cascade,
  batiment_id uuid references batiments(id) on delete cascade,
  visiteur_id uuid references visiteurs(id) on delete set null,
  etage       integer not null,
  porte       text not null,
  nom_porte   text,        -- nom affiché sur la sonnette / interphone
  contact_nom text,        -- nom complet de la personne rencontrée
  contact_tel text,        -- téléphone
  date        date not null,
  result      text not null default 'absent',
  notes       text,
  created_at  timestamptz default now()
);

-- Suivis (historique de relances par visite)
create table if not exists suivis (
  id        uuid primary key default gen_random_uuid(),
  visite_id uuid references visites(id) on delete cascade,
  date      date not null,
  result    text not null default 'rappeler',
  notes     text,
  created_at timestamptz default now()
);

-- ── Activation de la sécurité RLS ──────────────────────
alter table visiteurs enable row level security;
alter table quartiers  enable row level security;
alter table batiments  enable row level security;
alter table visites    enable row level security;
alter table suivis     enable row level security;

-- ── Politiques d'accès (mode ouvert pour équipe) ───────
do $$ begin
  if not exists (select 1 from pg_policies where tablename='visiteurs' and policyname='open_visiteurs') then
    create policy open_visiteurs on visiteurs for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='quartiers' and policyname='open_quartiers') then
    create policy open_quartiers on quartiers for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='batiments' and policyname='open_batiments') then
    create policy open_batiments on batiments for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='visites' and policyname='open_visites') then
    create policy open_visites on visites for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='suivis' and policyname='open_suivis') then
    create policy open_suivis on suivis for all using (true) with check (true);
  end if;
end $$;
