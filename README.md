# Vervet

Tek kişilik, mobil öncelikli kişisel plan ve hatırlatma uygulaması (PWA).
Ürün, teknik ve tasarım kuralları için `CLAUDE.md`'ye bak.

## Geliştirme

```bash
pnpm install
cp .env.example .env.local   # VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY'i doldur
pnpm dev
pnpm build && pnpm lint
```

`VITE_SUPABASE_ANON_KEY` olarak Supabase panelindeki **Publishable key** (`sb_publishable_...`) kullanılır.
`service_role` / secret key'i asla `.env.local`'e ya da istemci koduna koyma.

## Erişim modeli (giriş ekranı yok)

Uygulamada login, kayıt veya şifre formu yoktur. Erişim, gizli bir eşleme linkiyle olur:

```
https://<site-adresin>/p#<secret>
```

Akış: `/p` sayfası `#<secret>`'ı okur ve adres çubuğundan siler → `pair` Edge Function'ına gönderir →
fonksiyon secret'ı sabit zamanlı karşılaştırır, doğruysa sahip kullanıcı için bir magic link
token'ı üretip yalnızca `hashed_token`'ı döndürür → istemci `verifyOtp` ile oturum açar.
Oturumu olmayan kişi yalnızca ortada Vervet logosu olan boş bir ekran görür.

Hash (`#...`) sunucuya hiç gönderilmez, ama linki başkalarına göstermemeye / sohbetlere
yapıştırmamaya dikkat et: link = tam erişim.

## Kurulum (bir kez)

### 1. Sahip kullanıcıyı oluştur

Supabase paneli → **Authentication → Users → Add user → Create new user**.
E-postanı gir, **Auto Confirm User**'ı işaretle. Şifre rastgele olabilir, kullanılmayacak.
Bu e-posta `OWNER_EMAIL` olacak. Kullanıcı oluşunca `settings` satırı otomatik açılır.

### 2. Signup'ı kapat

**Authentication → Sign In / Providers** (eski panelde *Settings*) altında
**Allow new users to sign up**'ı kapat. Böylece sahibin dışında kimse kullanıcı oluşturamaz.
(`pair` fonksiyonu service role ile çalıştığı için kapalı signup'tan etkilenmez.)

### 3. Oturum süresi sınırlarını kapat

**Authentication → Sessions** altında **Time-box user sessions** ve
**Inactivity timeout** alanlarını boş / kapalı bırak (varsayılan zaten kapalıdır; Pro planda görünür).
Böylece ana ekran uygulamasındaki oturum kendiliğinden düşmez. Access token kısa ömürlüdür
(JWT expiry, varsayılan 1 saat) ama refresh token ile arka planda yenilenir.

### 4. Secret üret

```bash
openssl rand -base64 32
```

Çıktıyı güvenli bir yere (parola yöneticisi) kaydet. Repoya veya sohbete yazma.

### 5. Edge Function'ı yapılandır ve yayınla

```bash
pnpm exec supabase secrets set \
  PAIRING_SECRET="<4. adımdaki değer>" \
  OWNER_EMAIL="<1. adımdaki e-posta>" \
  ALLOWED_ORIGINS="https://<site-adresin>,http://localhost:5173" \
  --project-ref <proje-ref>

pnpm exec supabase functions deploy pair --no-verify-jwt --project-ref <proje-ref>
```

- `ALLOWED_ORIGINS` virgülle ayrılmış, yalnızca bu origin'ler fonksiyonu tarayıcıdan çağırabilir.
  Yerel geliştirme gerekmiyorsa `http://localhost:5173`'ü çıkar.
- `SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` fonksiyona Supabase tarafından otomatik verilir.
- Yanlış secret'ta fonksiyon 1 sn bekleyip `404` döner.

### 6. Telefonda eşleştir

Eşleme linki:

```
https://<site-adresin>/p#<4. adımdaki secret>
```

Aynı secret'taki `+`, `/`, `=` karakterleri linkte olduğu gibi kalabilir.

**iPhone notu:** iOS'ta ana ekrana eklenmiş uygulama, Safari ile depolamayı paylaşmaz. Yani linki
Safari'de açıp eşleştirmek ana ekran uygulamasını eşleştirmez. Doğru sıra:

1. Siteyi Safari'de aç → Paylaş → **Ana Ekrana Ekle**.
2. Eşleme linkini kopyala (Notlar, mesaj vb.).
3. Ana ekrandaki Vervet'i aç (boş logolu ekran görünür).
4. Logoya **3 saniye içinde 5 kez dokun** → gizli **Panodan eşleştir** butonu çıkar.
5. Butona dokun, iOS'un "Yapıştır" iznini onayla → uygulama açılır.

Masaüstünde linki doğrudan tarayıcıda açmak yeterlidir.

## Tüm oturumları iptal etme

Telefon kaybı ya da link sızıntısı durumunda:

1. **Secret'ı değiştir** (eski link artık çalışmaz): 4. adımı tekrarlayıp `supabase secrets set PAIRING_SECRET=...` çalıştır.
2. **Açık oturumları sonlandır:** Supabase paneli → **SQL Editor**:

   ```sql
   delete from auth.sessions
   where user_id = (select id from auth.users where email = '<OWNER_EMAIL>');
   ```

   Bu, ilgili refresh token'ları da geçersiz kılar. Mevcut access token en fazla JWT süresi
   (varsayılan 1 saat) kadar daha geçerli kalabilir; acil durumda **Authentication → JWT Keys**
   üzerinden anahtarı döndür.
3. Yeni eşleme linkiyle cihazını yeniden eşleştir.
