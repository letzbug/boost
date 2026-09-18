-- OPTIONAL: zentrale Auswahl für mehrere Arbeitsplätze
create table if not exists public.unipop_weekly_boost (
  slot smallint primary key check (slot between 1 and 8),
  course_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.unipop_weekly_boost enable row level security;

-- Für einen ersten internen Test kann man gezieltere Policies ergänzen.
-- Für Produktion NICHT einfach anonymes Schreiben freigeben.
