-- ============================================================
--  DOMINUS JOYERÍA · Esquema Supabase
--  Pega TODO esto en: Supabase -> SQL Editor -> New query -> Run
-- ============================================================

-- 1) Tabla de inventario "Madre"
create table if not exists public.relojes (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  marca            text    not null,
  milimetros       text    not null,
  automatico       boolean not null default false,
  precio_compra    numeric not null default 0,
  precio_cliente   numeric not null default 0,
  precio_mayorista numeric not null default 0,
  estado           text    not null default 'disponible'
                     check (estado in ('disponible', 'vendido')),
  fotos            text[]  not null default '{}',
  ubicacion        text    -- Ubicación / vendedor (privado, solo admin)
);

create index if not exists relojes_created_at_idx on public.relojes (created_at desc);

-- 2) RLS con políticas permisivas para el rol anónimo.
--    La app es una herramienta interna protegida por Basic Auth (middleware).
--    Si más adelante quieres seguridad fuerte, integra Supabase Auth y
--    reemplaza estas políticas por unas basadas en auth.uid().
alter table public.relojes enable row level security;

drop policy if exists "relojes_select_anon" on public.relojes;
drop policy if exists "relojes_insert_anon" on public.relojes;
drop policy if exists "relojes_update_anon" on public.relojes;
drop policy if exists "relojes_delete_anon" on public.relojes;

create policy "relojes_select_anon" on public.relojes for select to anon using (true);
create policy "relojes_insert_anon" on public.relojes for insert to anon with check (true);
create policy "relojes_update_anon" on public.relojes for update to anon using (true) with check (true);
create policy "relojes_delete_anon" on public.relojes for delete to anon using (true);

-- 3) Bucket de Storage para las fotos (público para poder leerlas en PDFs/tarjetas)
insert into storage.buckets (id, name, public)
values ('relojes', 'relojes', true)
on conflict (id) do update set public = true;

-- 4) Políticas de Storage para el bucket "relojes"
drop policy if exists "relojes_storage_read"   on storage.objects;
drop policy if exists "relojes_storage_insert" on storage.objects;
drop policy if exists "relojes_storage_delete" on storage.objects;

create policy "relojes_storage_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'relojes');

create policy "relojes_storage_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'relojes');

create policy "relojes_storage_delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'relojes');
