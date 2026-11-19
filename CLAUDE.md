# Vervet

Tek kişilik, mobil öncelikli kişisel plan ve hatırlatma uygulaması.
Kullanıcı yalnızca ben (Berat). Uygulama iPhone'da ana ekrana eklenmiş PWA olarak kullanılır.

## Ürün kuralları
- Login ekranı, kayıt veya şifre formu YOK. Erişim gizli eşleme linkiyle (/p#<secret>) olur.
  Oturumu olmayan biri yalnızca logolu boş bir ekran görür.
- Belirli bir günün belirli saatine plan eklenir. Saat opsiyoneldir (yoksa tüm gün).
- Kategoriler: Ders, Düzenli Ödemeler, Ödemeler, Önemli Plan, Ertelenebilir Plan.
- Plan detayları: not, konum, link, tutar (yalnızca ödeme kategorilerinde).
- Planlar Yaptım ile işaretlenir, ertelenebilir. İşaretlenmeyenler ertesi güne taşınır
  ve orada en üstte "Dünden kalanlar" olarak görünür. Ders taşınmaz.
- Ayarlanabilir saatlerde bugünün veya yarının plan özeti Web Push ile gelir.
  Ayrıca plan saatinden önce tekil hatırlatma gelir.
- Görünümler: Bugün, Hafta (saat ızgarası), Takvim (ay), Ayarlar.

## Teknik kurallar
- Vite + React + TypeScript (strict), pnpm. Tailwind CSS v4 + shadcn/ui, vaul (bottom sheet).
- React Router, TanStack Query, supabase-js, react-hook-form + zod, date-fns + @date-fns/tz.
- PWA: vite-plugin-pwa, injectManifest, kendi service worker'ımız src/sw.ts.
- Backend: Supabase (Postgres + RLS + Edge Functions + pg_cron + pg_net). Vercel yalnızca statik hosting.
- Tüm tarih hesapları Europe/Istanbul saat diliminde. DB'de date + time (local) tutulur.
- Her tabloda owner_id = auth.uid() RLS politikası. Service role anahtarı asla istemciye girmez.
- Kategori davranışları tek kaynakta: src/lib/categories.ts (ve SQL'de aynı kural).

## Tasarım kuralları
- Mobil öncelik: 375px genişlik referans. Dokunma hedefleri en az 44px.
- Safe-area inset'leri, 100dvh, alt tab bar, sağ altta + butonu.
- Arayüz dili Türkçe. Tarih biçimi: 19 Kasım Çarşamba, saat 24'lük.
- Tarayıcı alert/confirm/prompt kullanma; onaylar bottom sheet ile.

## Çalışma kuralları
- Her prompt bir faz; istenmeyen özellik ekleme.
- Bitince pnpm build ve pnpm lint çalıştır, kabul kriterlerini tek tek raporla.
- Belirsizlikte varsayımı yaz ve devam et; geri alınamaz işlemlerde sor.
