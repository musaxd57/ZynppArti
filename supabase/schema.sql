-- ZynppArti — Supabase şeması (Faz 3 backend, ADR-0047).
-- Supabase Dashboard → SQL Editor'da bir kez çalıştır. Idempotent (tekrar çalıştırılabilir).
--
-- İLKE (CLAUDE.md §6.5): Çizim ENTITY'leri burada DEĞİL — model = Storage'da tek JSON dosyası.
-- Bu şema yalnız METADATA tutar (kim, hangi proje, hangi izin, yorumlar). RLS her satırı korur.

-- ───────────────────────────────────────────────────────────────────────────
-- 1) profiles — auth.users'a 1:1 (Supabase Auth kullanıcısının uygulama profili)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  plan        text not null default 'free',          -- free | pro | studio (Paddle sonra)
  created_at  timestamptz not null default now()
);

-- Yeni kullanıcı kaydolunca otomatik profil oluştur (auth.users trigger'ı).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────────────────────────────────────────────────────────
-- 2) projects — bulut projeler (içerik Storage'da: storage_path)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  owner         uuid not null references auth.users (id) on delete cascade,
  name          text not null default 'Adsız Plan',
  storage_path  text,                                 -- models/<owner>/<id>.json (versiyonlu zarf)
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index if not exists projects_owner_idx on public.projects (owner);

-- ───────────────────────────────────────────────────────────────────────────
-- 3) project_members — paylaşım/izin (sahip dışı kullanıcılar)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.project_members (
  project   uuid not null references public.projects (id) on delete cascade,
  member    uuid not null references auth.users (id) on delete cascade,
  role      text not null default 'viewer',           -- viewer | commenter | editor
  added_at  timestamptz not null default now(),
  primary key (project, member)
);

-- ───────────────────────────────────────────────────────────────────────────
-- 4) comments — proje markup/yorumları (içerik metni; konum entity'de)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  project    uuid not null references public.projects (id) on delete cascade,
  -- author NULLABLE: ON DELETE SET NULL ile NOT NULL ÇELİŞİR (kullanıcı silinince author=NULL
  -- yazılamayıp silme işlemi abort olurdu). Yazar gidince yorum kalsın → nullable. (Denetim bulgusu.)
  author     uuid references auth.users (id) on delete set null,
  body       text not null,
  resolved   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists comments_project_idx on public.comments (project);

-- ───────────────────────────────────────────────────────────────────────────
-- RLS — kullanıcı yalnız sahibi VEYA üyesi olduğu projeyi görür/değiştirir.
-- ───────────────────────────────────────────────────────────────────────────
alter table public.profiles        enable row level security;
alter table public.projects        enable row level security;
alter table public.project_members enable row level security;
alter table public.comments        enable row level security;

-- profiles: kendi profilini OKURSUN; güncelleyebilirsin AMA `plan`'ı DEĞİŞTİREMEZSİN (denetim H1).
-- Sebep: `plan` yetkilendirme kaynağıdır (ücretsiz/pro kotası). Eski `for all ... check(id=uid)` politikası
-- istemcinin `update({plan:'studio'})` ile kendini ücretsizden Pro'ya çekmesine izin veriyordu (Paddle baypas).
-- INSERT istemcide YOK: handle_new_user trigger'ı (security definer, RLS-atlar) satırı açar.
-- `plan`'ı yalnız Paddle webhook'u servis anahtarıyla (RLS-muaf) yazar.
drop policy if exists profiles_self on public.profiles;
drop policy if exists profiles_select_self on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid());
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and plan = (select p.plan from public.profiles p where p.id = auth.uid()));

-- Bir kullanıcının bir projeye erişimi var mı? (sahip veya üye) — yardımcı.
-- SECURITY DEFINER: gövdedeki sorgular RLS'i ATLAR → policy içinde kullanınca özyineleme olmaz (KRİTİK).
create or replace function public.can_access_project(p uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.projects pr where pr.id = p and pr.owner = auth.uid()
    union
    select 1 from public.project_members m where m.project = p and m.member = auth.uid()
  );
$$;

-- Kullanıcı bu projenin SAHİBİ mi? — definer (RLS-atlar) → project_members policy'sinde özyineleme kırar.
create or replace function public.is_project_owner(p uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from public.projects pr where pr.id = p and pr.owner = auth.uid());
$$;

-- projects: sahip tam yetki; üye okuyabilir.
drop policy if exists projects_owner_all on public.projects;
create policy projects_owner_all on public.projects
  for all using (owner = auth.uid()) with check (owner = auth.uid());

-- ÖNEMLİ: üye-okuma DEFINER fonksiyonla yapılır. Inline `exists(... project_members ...)` kullanılırsa
-- projects↔project_members policy'leri KARŞILIKLI ÖZYİNELEME yapar ("infinite recursion detected") ve
-- HER projects sorgusu (listCloudProjects) çöker. can_access_project RLS'i atladığından döngü kırılır. (Denetim.)
drop policy if exists projects_member_read on public.projects;
create policy projects_member_read on public.projects
  for select using (public.can_access_project(id));

-- project_members: sahip üye ekler/çıkarır/listeler (sahip kontrolü DEFINER fn ile → özyineleme yok);
-- üye KENDİ üyelik satırını okuyabilir (paylaşılan projeyi listeleyebilmek için).
drop policy if exists members_owner on public.project_members;
create policy members_owner on public.project_members
  for all using (public.is_project_owner(project)) with check (public.is_project_owner(project));

drop policy if exists members_self_read on public.project_members;
create policy members_self_read on public.project_members
  for select using (member = auth.uid());

-- comments: projeye erişimi olan okur/yazar; yorumu yalnız yazarı düzenler/siler.
drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments
  for select using (public.can_access_project(project));

drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments
  for insert with check (author = auth.uid() and public.can_access_project(project));

-- Güncellemede projeye erişim de RE-CHECK edilir (denetim M8): yalnız `author=uid` istemcinin yorumu
-- erişimi OLMAYAN bir projeye taşımasına (cross-project enjeksiyon) izin verirdi. (Aynı projede içerik
-- düzenleme serbest; erişilebilir projeler arası taşımayı tümden yasaklamak ayrı BEFORE UPDATE trigger ister.)
drop policy if exists comments_modify on public.comments;
create policy comments_modify on public.comments
  for update using (author = auth.uid())
  with check (author = auth.uid() and public.can_access_project(project));

drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments
  for delete using (author = auth.uid());

-- ───────────────────────────────────────────────────────────────────────────
-- PAYLAŞIM RPC'leri (e-posta ile üye ekle/listele) — RLS profiles'ı `id=auth.uid()` ile kilitler,
-- yani istemci başka kullanıcının uid'sini e-postadan ÇÖZEMEZ. Bu işler SECURITY DEFINER fonksiyonla
-- yapılır: fonksiyon yalnız ÇAĞIRANIN proje SAHİBİ olduğunu doğrular, sonra auth.users'tan çözer.
-- ───────────────────────────────────────────────────────────────────────────

-- E-posta ile projeye üye ekle (yalnız sahip). Dönüş: 'ok' | 'not_owner' | 'no_user' | 'self'.
create or replace function public.share_project(p_project uuid, p_email text, p_role text default 'viewer')
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  target uuid;
  norm_role text := lower(coalesce(p_role, 'viewer'));
begin
  if not public.is_project_owner(p_project) then
    return 'not_owner';
  end if;
  if norm_role not in ('viewer', 'commenter', 'editor') then
    norm_role := 'viewer';
  end if;
  select id into target from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if target is null then
    return 'no_user';
  end if;
  if target = auth.uid() then
    return 'self'; -- sahip zaten tam yetkili; kendini üye ekleme
  end if;
  insert into public.project_members (project, member, role)
  values (p_project, target, norm_role)
  on conflict (project, member) do update set role = excluded.role;
  return 'ok';
end;
$$;

-- Bir projenin üyelerini e-posta + rolüyle listele (yalnız sahip). profiles_self RLS'i atlamak için definer.
create or replace function public.list_project_members(p_project uuid)
returns table (member uuid, email text, role text)
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_project_owner(p_project) then
    return; -- sahip değil → boş
  end if;
  return query
    select m.member, u.email::text, m.role
    from public.project_members m
    join auth.users u on u.id = m.member
    where m.project = p_project
    order by m.added_at asc;
end;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- Storage bucket — model dosyaları (her proje = bir JSON zarfı).
-- 'models' bucket'ını Dashboard → Storage'dan da kurabilirsin; bu SQL idempotent eşdeğeri.
-- ───────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('models', 'models', false)
on conflict (id) do nothing;

-- Storage RLS: yazma/silme yalnız KENDİ klasörüne ('models/<auth.uid>/...'); kullanıcı kendi
-- dosyalarını tam yönetir.
drop policy if exists models_own_folder on storage.objects;
create policy models_own_folder on storage.objects
  for all using (
    bucket_id = 'models' and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'models' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Paylaşılan OKUMA: dosya adı '<projectId>.json' → erişebildiği projenin (üye/sahip) modelini indirebilir.
-- Yol 'models/<owner>/<projectId>.json'; project id = dosya adı (uzantısız). Yalnız SELECT (üye yazamaz).
drop policy if exists models_shared_read on storage.objects;
create policy models_shared_read on storage.objects
  for select using (
    bucket_id = 'models'
    -- UUID-biçim guard ÖNCE (AND kısa-devre): bucket'ta UUID-olmayan bir dosya adı varsa `::uuid` cast'i
    -- 'invalid input syntax' fırlatıp TÜM sorguyu (list/download) düşürmesin. (Denetim — savunma.)
    and split_part(storage.filename(name), '.', 1) ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and public.can_access_project((split_part(storage.filename(name), '.', 1))::uuid)
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- AI RENDER GÜNLÜK KOTASI (ADR — "geometriyi koru" ControlNet maliyet backstop'u)
-- ─────────────────────────────────────────────────────────────────────────────
-- "Geometriyi koru" render her çağrıda GERÇEK PARA harcar (Replicate). Plan-gate (Pro/Studio+admin)
-- kimin çağırabileceğini sınırlar ama ödeyen bir hesap günde on binlerce çağrı yapabilir → bu tablo +
-- ATOMİK RPC günlük üst sınırı (kullanıcı/gün) tek transaction'da say+ekle ile uygular (TOCTOU-güvenli).
-- route /api/copilot (mode=render, renderMode=preserve) bunu pahalı çağrıdan ÖNCE fail-closed çağırır.
create table if not exists public.render_events (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists render_events_user_day on public.render_events (user_id, created_at);

alter table public.render_events enable row level security;
-- Kullanıcı yalnız KENDİ render olaylarını görür (RPC security definer ile yazar; doğrudan insert'e gerek yok).
drop policy if exists render_events_self_read on public.render_events;
create policy render_events_self_read on public.render_events
  for select using (user_id = auth.uid());

-- Atomik kota: bugünkü sayım < p_cap ise satır ekle + true döner; değilse false (insert YOK).
-- Kullanıcı-başı TRANSACTION advisory lock → aynı kullanıcının eşzamanlı iki isteği SERİleşir (count+insert
-- yarışı tam kapanır; lock işlem sonunda bırakılır). security definer → RLS'i aşar ama YALNIZ p_user için
-- sayar/ekler; search_path sabitlenir (enjeksiyon önlemi).
create or replace function public.claim_render_slot(p_user uuid, p_cap int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  perform pg_advisory_xact_lock(hashtext('render_slot:' || p_user::text));
  select count(*) into n from public.render_events
    where user_id = p_user and created_at >= date_trunc('day', now());
  if n >= p_cap then
    return false;
  end if;
  insert into public.render_events (user_id) values (p_user);
  return true;
end;
$$;
