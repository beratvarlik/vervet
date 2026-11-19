-- Yerel geliştirme verisi (yalnızca `supabase db reset` ile yüklenir).
-- Bu haftanın (Pazartesi-Pazar, Europe/Istanbul) her kategorisinden 1-2 örnek plan.
-- Giriş: dev@vervet.local / vervet-dev-only (yalnızca yerel ortam).

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-0000000000a1',
  'authenticated', 'authenticated', 'dev@vervet.local',
  extensions.crypt('vervet-dev-only', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', ''
) on conflict (id) do nothing;
-- on_auth_user_created tetikleyicisi settings satırını kendisi oluşturur.

with w as (
  select date_trunc('week', (now() at time zone 'Europe/Istanbul')::date)::date as mon
)
insert into public.plans (
  owner_id, title, category, date, start_time, end_time,
  details, location, url, amount, status, done_at, remind_before_min
)
select '00000000-0000-0000-0000-0000000000a1', p.*
from w, lateral (values
  -- Ders
  ('Veri Yapıları',          'ders'::public.plan_category,          w.mon,     time '09:00', time '10:30', 'Ağaç yapıları konusu', 'B Blok Z-12', null, null::numeric, 'done'::public.plan_status, now(), 30),
  ('Lineer Cebir',           'ders',                                w.mon + 2, time '13:00', time '14:30', null, 'A Blok 204', null, null, 'pending', null, 30),
  -- Düzenli ödemeler
  ('Kira',                   'duzenli_odeme',                       w.mon + 3, null, null, 'Her ayın 20''si', null, null, 9500.00, 'pending', null, 60),
  ('Telefon faturası',       'duzenli_odeme',                       w.mon + 4, null, null, null, null, 'https://example.com/fatura', 349.90, 'pending', null, 60),
  -- Ödemeler
  ('Kitap siparişi',         'odeme',                               w.mon + 1, null, null, 'Kargoda ödeme', null, null, 275.00, 'pending', null, 60),
  -- Önemli plan
  ('Diş hekimi randevusu',   'onemli',                              w.mon + 2, time '16:30', time '17:15', 'Kimlik ve sigorta kartı al', 'Kadıköy Ağız ve Diş Sağlığı', null, null, 'pending', null, 60),
  ('Proje teslimi',          'onemli',                              w.mon + 4, time '23:00', null, 'PDF olarak yükle', null, 'https://example.com/odev', null, 'pending', null, 120),
  -- Ertelenebilir plan
  ('Spor salonu',            'ertelenebilir',                       w.mon + 1, time '19:00', time '20:00', null, 'Mahalle spor salonu', null, null, 'pending', null, 15),
  ('Odayı topla',            'ertelenebilir',                       w.mon + 5, null, null, 'Hafta sonu işi', null, null, null, 'pending', null, null)
) as p(title, category, date, start_time, end_time, details, location, url, amount, status, done_at, remind_before_min);
