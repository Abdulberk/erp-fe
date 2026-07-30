# Sonart Insight — Frontend

ERP raporlarını yönetim dashboard'una çeviren servisin Next.js arayüzü.

**Backend:** <https://github.com/Abdulberk/zewnos>

---

## Çalıştırma

```bash
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL
npm run dev                        # http://localhost:3000
```

Backend'in ayrıca çalışıyor olması gerekiyor:

```bash
cd ../zewnos
.venv\Scripts\activate
uvicorn app.main:app --reload      # http://localhost:8000
```

Arayüz açıldığında `/` adresinden bir CSV yükleyin (`public/ornek/` altında
bozuk karakter kodlamalı bir örnek var) ya da daha önce yüklenmiş bir veri
setine tıklayın.

---

## Rotalar

| Rota | İçerik |
|---|---|
| `/` | Veri seti listesi + CSV yükleme (drag-drop) |
| `/d/[id]` | Dashboard — 5 KPI + 4 grafik + en kritik riskler |
| `/d/[id]/kalite` | Veri kalitesi paneli (bulgu + **ne yapıldığı**) |
| `/d/[id]/riskler` | Risk sicili + parasal etki grafiği + filtreler |
| `/d/[id]/urunler` | Sıralanabilir ürün tablosu + seçili ürünün zaman serisi |
| `/d/[id]/analiz` | Dönemsel AI analizi + yönetici özeti + telemetri |
| `/d/[id]/sor` | Serbest soru-cevap |

Sekme yerine ayrı rotalar: her biri paylaşılabilir bir URL ve temiz bir ekran
görüntüsü veriyor.

---

## Komutlar

```bash
npm run dev         # geliştirme sunucusu
npm run build       # üretim derlemesi
npm run start       # üretim sunucusu
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run api-types   # openapi.json -> src/lib/api-types.ts
```

Backend sözleşmesi değişirse şemayı tazeleyip tipleri yeniden üretin:

```bash
curl http://localhost:8000/api/v1/openapi.json -o openapi.json
npm run api-types
```

---

## Ekran görüntüleri

![Dashboard](screenshots/01-dashboard.png)

![Veri kalitesi](screenshots/02-veri-kalitesi.png)

![Risk sicili](screenshots/03-risk-sicili.png)

![Dönemsel AI analizi](screenshots/04-donemsel-analiz.png)

![Soru-cevap](screenshots/05-soru-cevap.png)

Kareler `sonart_erp_cok_donemli_2.csv` veri setiyle, 1440px genişlikte ve
light modda alındı. Tek komutla yeniden üretilebilir — kurulu Chrome/Edge'i
headless sürüyor, ek bağımlılık yok:

```bash
npm run build && npm run start          # ayrı bir terminalde
node scripts/ekran-goruntuleri.mjs <dataset-id>
```

AI kareleri için analizin önbellekte olması gerekir — `/d/<id>/analiz`
sayfasında bir kez üretmek yeterli, sonrası ücretsiz.

---

## Mimari

```
src/
  app/                     rotalar (Server Component'ler veriyi çeker)
  components/
    chart/                 ChartFrame, LineChartCard, AreaChartCard,
                           HBarChartCard, ComboChartCard, DataTable,
                           SeriesTooltip, ChartLegend
    domain/                KpiTile, SeverityChip, EvidencePill, RiskRow,
                           QualityIssueCard, HealthBadge, UploadDropzone
    analysis/  ask/  entities/  risks/  dashboard/   sayfaya özgü bileşenler
    layout/                DatasetShell, NavTabs, ThemeToggle
    ui/                    ErrorState, EmptyState, StatRow
  lib/
    api-types.ts           openapi.json'dan üretilir — elle yazılmaz
    types.ts               tip takma adları + satır şekilleri
    api.ts                 backend istemcisi
    errors.ts              hata kodu -> ekran metni
    format.ts              tr-TR sayı/tarih biçimlendirme
    tokens.ts              renk, şiddet, öncelik eşlemeleri
```

Veri sayfa başına bir kez Server Component içinden çekiliyor; etkileşim
gerektiren uçlar (yükleme, analiz üretimi, soru-cevap) tarayıcıdan çağrılıyor.
Ekstra veri kütüphanesi yok.

### Uyulan değişmez kurallar

Tamamı `PLAN.md` bölüm 2'de. Kodda karşılıkları:

- **Çift eksen yok** — TL ve % ayrı grafiklerde, ortak x ekseniyle yan yana.
- **Kategorik renkler sabit** — `buildColorMap()` haritayı *filtrelenmemiş*
  değer evreninden kuruyor; bir seriyi gizlemek kalanların rengini değiştirmiyor.
- **Durum renkleri yalnızca şiddet için**, her zaman ikon + etiketle
  (`StatusChip`).
- **Metin ink token'ıyla** — değer ve etiketler asla seri rengini giymiyor,
  kimliği yanındaki renkli işaret taşıyor.
- **Her grafiğin tablo görünümü var** (`ChartFrame` başlığındaki toggle).
- **Dark mode ayrı değerlerle** — çevirme yok, `globals.css`'te ikinci bir set.
- **Kanıtlar görünür** — AI aksiyonları, risk kayıtları ve soru-cevap
  yanıtlarının hepsinde `EvidencePill`.
- **Etiketler backend'den** — `label`, `unit` ve kolon başlıkları pack'ten
  geliyor; frontend kendi sözlüğünü tutmuyor.
- **`ai_not_configured` bir hata değil, bir durum** — AI sekmeleri kapanıyor,
  dashboard/kalite/riskler/ürünler/PDF çalışmaya devam ediyor.

---

## Referans dosyalar

| Dosya | Ne işe yarar |
|---|---|
| [`PLAN.md`](PLAN.md) | **Uygulama şartnamesi** — 16 bölüm |
| `openapi.json` | Backend API şeması — TypeScript tipleri buradan üretilir |
| `docs/ornek-yanitlar.json` | Canlı backend'den alınmış gerçek yanıt örnekleri |
| `docs/sonart_erp_bozuk_encoding.csv` | Test için örnek veri (bozuk karakter kodlamalı) |
