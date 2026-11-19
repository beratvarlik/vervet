-- Vervet: ilk şema (Faz 2)
-- Tarihler date + time (yerel, Europe/Istanbul) olarak tutulur; saat dilimi dönüşümü yok.
-- Kategori davranışları src/lib/categories.ts ile aynı kuralı izler (bkz. category_* fonksiyonları).

------------------------------------------------------------------
-- Extension'lar (pg_cron job'u Faz 3'te eklenecek)
------------------------------------------------------------------
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

------------------------------------------------------------------
-- Enum'lar
------------------------------------------------------------------
create type public.plan_category as enum (
  'ders',
  'duzenli_odeme',
  'odeme',
  'onemli',
  'ertelenebilir'
);

create type public.plan_status as enum ('pending', 'done', 'skipped');

------------------------------------------------------------------
-- Kategori kuralları (categories.ts ile aynı kaynak kural)
------------------------------------------------------------------
-- Yalnızca ödeme kategorilerinde tutar olur.
create function public.category_has_amount(c public.plan_category)
returns boolean
language sql
immutable
parallel safe
as $$
  select c in ('duzenli_odeme', 'odeme');
$$;

-- Ders ertesi güne taşınmaz; diğerleri taşınır.
create function public.category_carries_over(c public.plan_category)
returns boolean
language sql
immutable
parallel safe
as $$
  select c <> 'ders';
$$;

------------------------------------------------------------------
-- updated_at tetikleyicisi
------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

------------------------------------------------------------------
-- series: tekrarlayan planların şablonu
------------------------------------------------------------------
create table public.series (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  title text not null,
  category public.plan_category not null,
  start_time time,
  end_time time,
  details text,
  location text,
  url text,
  amount numeric(12, 2),
  remind_before_min integer,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  interval_n integer not null default 1 check (interval_n >= 1),
  weekdays smallint[] check (
    weekdays is null or weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
  ), -- 1 = Pazartesi ... 7 = Pazar (ISO)
  day_of_month smallint check (day_of_month between 1 and 31),
  starts_on date not null,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint series_end_after_start check (
    end_time is null or (start_time is not null and end_time > start_time)
  ),
  constraint series_amount_only_payments check (
    amount is null or public.category_has_amount(category)
  ),
  constraint series_ends_after_starts check (ends_on is null or ends_on >= starts_on)
);

------------------------------------------------------------------
-- plans
------------------------------------------------------------------
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  title text not null,
  category public.plan_category not null,
  date date not null,
  start_time time,           -- null = tüm gün
  end_time time,
  details text,
  location text,
  url text,
  amount numeric(12, 2),
  status public.plan_status not null default 'pending',
  done_at timestamptz,
  remind_before_min integer check (remind_before_min is null or remind_before_min >= 0),
  series_id uuid references public.series (id) on delete set null,
  original_date date,        -- ertelenmişse/taşınmışsa ilk planlanan gün
  carry_count integer not null default 0 check (carry_count >= 0),
  snooze_count integer not null default 0 check (snooze_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plans_end_after_start check (
    end_time is null or (start_time is not null and end_time > start_time)
  ),
  constraint plans_amount_only_payments check (
    amount is null or public.category_has_amount(category)
  ),
  constraint plans_done_at_only_when_done check (
    done_at is null or status = 'done'
  )
);

------------------------------------------------------------------
-- settings: kullanıcı başına tek satır
------------------------------------------------------------------
create table public.settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  digest_times jsonb not null default
    '[{"time":"08:00","scope":"today"},{"time":"21:00","scope":"tomorrow"}]'::jsonb,
  -- Kategori başına varsayılan "plandan kaç dk önce" (categories.ts ile aynı değerler)
  remind_defaults jsonb not null default
    '{"ders":30,"duzenli_odeme":60,"odeme":60,"onemli":60,"ertelenebilir":15}'::jsonb,
  payment_remind_days_before integer not null default 1
    check (payment_remind_days_before >= 0),
  quiet_start time not null default '23:00',
  quiet_end time not null default '07:00',
  last_rollover_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settings_one_row_per_owner unique (owner_id),
  constraint settings_digest_times_is_array check (jsonb_typeof(digest_times) = 'array'),
  constraint settings_remind_defaults_is_object check (jsonb_typeof(remind_defaults) = 'object')
);

------------------------------------------------------------------
-- push_subscriptions
------------------------------------------------------------------
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

------------------------------------------------------------------
-- notification_log: gönderilen bildirimlerin tekilleştirme kaydı
------------------------------------------------------------------
create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  kind text not null check (kind in ('digest', 'reminder', 'payment')),
  plan_id uuid references public.plans (id) on delete set null,
  dedupe_key text not null,
  payload jsonb,
  sent_at timestamptz not null default now()
);

------------------------------------------------------------------
-- İndeksler
------------------------------------------------------------------
create index plans_owner_date_idx on public.plans (owner_id, date);
create index plans_status_date_idx on public.plans (status, date);
create unique index notification_log_dedupe_key_idx
  on public.notification_log (dedupe_key);
create unique index push_subscriptions_endpoint_idx
  on public.push_subscriptions (endpoint);

------------------------------------------------------------------
-- updated_at tetikleyicileri
------------------------------------------------------------------
create trigger plans_set_updated_at before update on public.plans
  for each row execute function public.set_updated_at();
create trigger series_set_updated_at before update on public.series
  for each row execute function public.set_updated_at();
create trigger settings_set_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

------------------------------------------------------------------
-- RLS: her tabloda owner_id = auth.uid(), dört işlem için
------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'plans', 'series', 'settings', 'push_subscriptions', 'notification_log'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'create policy %I on public.%I for select to authenticated
         using (owner_id = (select auth.uid()))',
      t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated
         with check (owner_id = (select auth.uid()))',
      t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated
         using (owner_id = (select auth.uid()))
         with check (owner_id = (select auth.uid()))',
      t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated
         using (owner_id = (select auth.uid()))',
      t || '_delete_own', t);
  end loop;
end
$$;

-- anon rolü hiçbir tabloya erişemez.
revoke all on public.plans, public.series, public.settings,
  public.push_subscriptions, public.notification_log from anon;

------------------------------------------------------------------
-- Yeni kullanıcı için varsayılan settings satırı
------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.settings (owner_id) values (new.id)
  on conflict (owner_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
