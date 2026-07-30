# Sonart Insight — Frontend Uygulama Planı

Bu dosya, bu repoda geliştirilecek Next.js arayüzünün **eksiksiz uygulama
şartnamesidir**. Backend bitti, test edildi ve GitHub'da:
<https://github.com/Abdulberk/zewnos>

Bu planı okuyup uygulayan kişinin backend'e dokunmasına gerek yok. Soru
kalmaması için gerçek API yanıtları, doğrulanmış renk değerleri ve sayfa sayfa
spesifikasyon aşağıda.

---

## 1. Bu ne, neden yapılıyor

Sonart Tekstil'in ERP'sinden (Logo Netsis) alınan **6 aylık stok/satış raporu**
CSV olarak yükleniyor. Backend veriyi temizliyor, zaman serisi analizi yapıyor,
risk tespit ediyor ve Claude ile döneme özgü aksiyon önerileri üretiyor. Bu
repo o çıktıyı **yönetime hitap eden bir dashboard** haline getiriyor.

Bu bir teknik değerlendirme ödevi. Puanlama tablosu:

| Ağırlık | Kriter | Bu repoya düşen |
|---:|---|---|
| %25 | Çalışır ürün (uçtan uca akış) | Kısmen — arayüz olmadan akış tamamlanmıyor |
| %20 | AI entegrasyon kalitesi | Backend'de, ama **çıktıyı doğru sunmak** burada |
| **%15** | **Dashboard / görselleştirme kalitesi ve okunabilirliği** | **Tamamen burada** |
| %10 | Dönemsel farklılaşma | Backend hesaplıyor, **görselleştirme burada** |
| **%10** | **Sonucun anlaşılırlığı (ekran görüntüsü/video)** | **Tamamen burada** |
| %10 | Veri kalitesi | Backend tespit ediyor, **paneli burada** |
| %5 | Kod kalitesi & mimari | Burada da geçerli |
| %5 | README & karar gerekçeleri | Backend README'sinde |

**Yaklaşık %35-40'lık bölüm bu repoya bağlı.** Ekran görüntüleri backend
README'sine eklenecek.

---

## 2. Değişmez kurallar

Bunlar tercih değil, şart. İhlal edilirse iş yanlış olur.

1. **Çift eksen (dual-axis) yasak.** Ciro (TL) ve marj (%) farklı ölçekler —
   asla aynı grafikte iki y ekseniyle gösterilmez. İki ayrı grafik, ortak x
   ekseni, yan yana. Dashboard'ların 1 numaralı hatası budur.
2. **Kategorik renkler sabit sırayla atanır, asla döngüsel değil.** Bir filtre
   seri sayısını değiştirdiğinde kalan serilerin rengi **değişmez** — renk
   varlığı takip eder, sırasını değil.
3. **Durum renkleri (kritik/yüksek/orta/düşük) yalnızca risk şiddeti için.**
   Asla "seri 5" rengi olarak kullanılmaz. Ve her zaman **ikon + etiketle**
   birlikte — renk tek başına anlam taşımaz.
4. **Metin asla seri rengini giymez.** Değerler, etiketler, legend metni ink
   token'larıyla; yanındaki renkli işaret kimliği taşır.
5. **≥2 seri varsa legend her zaman var**, ≤4 seri ayrıca doğrudan etiketlenir.
   Tek seride legend kutusu yok — başlık zaten seriyi adlandırıyor.
6. **Her grafiğin tablo görünümü var.** Bu erişilebilirlik gereği ve light
   modda kontrast kuralının şartı (aşağıda).
7. **Dark mode çevrilmez, ayrıca seçilir.** Renk değerleri aşağıda verilmiş —
   otomatik ters çevirme yapılmaz.
8. **AI'ın ürettiği her aksiyonun kanıtları gösterilir.** Backend her aksiyona
   `evidence[]` koyuyor; bu projenin ana iddiası "AI sayı uydurmuyor" ve bunun
   arayüzde görünür olması gerekiyor.

---

## 3. Stack

| | Seçim | Not |
|---|---|---|
| Framework | Next.js 15, App Router | |
| Dil | TypeScript strict | Tipler backend'den üretilir, elle yazılmaz |
| Stil | Tailwind CSS v4 | Renkler CSS custom property, Tailwind'e bağlanır |
| Grafik | **Recharts** | `strokeWidth`, `radius`, custom `Tooltip`, `LabelList` destekliyor |
| Veri | Server Component `fetch` + Client Component etkileşim | Ekstra veri kütüphanesi **yok** |
| İkon | `lucide-react` | Durum ikonları için |

Ek bağımlılık ekleme: SWR/TanStack Query, UI kit, chart wrapper gerekmiyor.
Veri sayfa başına bir kez çekiliyor.

### Kurulum

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --eslint
npm i recharts lucide-react
npm i -D openapi-typescript
```

`.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Backend'i çalıştırma (geliştirme için şart)

```bash
cd ../zewnos          # backend reposu
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env      # ANTHROPIC_API_KEY doldur
uvicorn app.main:app --reload      # http://localhost:8000
```

Backend `/docs` adresinde Swagger UI sunuyor — uçları elle denemek için.

### Tipleri üret

```bash
curl http://localhost:8000/api/v1/openapi.json -o openapi.json
npx openapi-typescript openapi.json -o src/lib/api-types.ts
```

`openapi.json` bu repoya kopyalandı (14 uç, 26 model). Backend değişirse
yeniden üret.

---

## 4. Backend sözleşmesi

Taban URL: `http://localhost:8000/api/v1`

| Metot | Yol | Ne döner |
|---|---|---|
| POST | `/datasets` | CSV yükle (multipart: `file`, opsiyonel `pack`) → kalite raporu + özet |
| GET | `/datasets` | Yüklenmiş veri setleri listesi |
| GET | `/datasets/{id}` | Tek veri seti özeti |
| DELETE | `/datasets/{id}` | Sil (204) |
| GET | `/datasets/{id}/quality` | Veri kalitesi raporu |
| GET | `/datasets/{id}/overview` | KPI'lar + dönem satırları + en kritik riskler |
| GET | `/datasets/{id}/periods` | Dönemsel satırlar + deltalar + boyut kırılımı |
| GET | `/datasets/{id}/entities` | Ürün özeti + `(ürün, dönem)` uzun tablo |
| GET | `/datasets/{id}/risks` | Risk sicili (`?severity=`, `?period=`) |
| GET | `/datasets/{id}/analysis/status` | AI analizi önbellekte mi, kaç çağrı gerekecek |
| POST | `/datasets/{id}/analysis` | AI analizi üret (`?refresh=true`) — **~100 sn** |
| POST | `/datasets/{id}/ask` | Serbest soru-cevap (`{"question": "..."}`) |
| GET | `/datasets/{id}/report.pdf` | Paylaşılabilir PDF |
| GET | `/packs` | Tanımlı rapor tipleri |
| GET | `/health`, `/health/ready` | Sağlık |

### Hata sözleşmesi

**Tüm hatalar aynı gövdeyi döner. İstemci `code` alanına göre dallanır, mesaj
metnine göre değil.**

```json
{
  "code": "schema_mismatch",
  "message": "Zorunlu kolonlar eksik: urun_adi, kategori, depo, ...",
  "details": {
    "missing_columns": ["urun_adi", "kategori", "depo", "giris_miktar",
                        "cikis_miktar", "donem_sonu_stok",
                        "birim_maliyet_tl", "birim_satis_tl"],
    "found_columns": ["stok_kodu", "donem"],
    "expected_pack": "sonart-erp"
  }
}
```

| `code` | HTTP | Kullanıcıya ne gösterilecek |
|---|---|---|
| `empty_dataset` | 422 | "Dosyada işlenebilir veri satırı yok." |
| `schema_mismatch` | 422 | "Şu kolonlar eksik: …" + `details.missing_columns` listesi |
| `unknown_pack` | 400 | `details.available` ile seçim sun |
| `file_too_large` | 413 | Boyut sınırı |
| `not_found` | 404 | "Veri seti bulunamadı" + listeye dön |
| `undecodable_file` | 422 | "Dosya okunamadı, kodlamayı kontrol edin" |
| `ai_not_configured` | 503 | "AI anahtarı tanımlı değil" — **dashboard çalışmaya devam eder**, sadece AI sekmeleri kapalı |
| `ai_rate_limited` | 429 | "Limit aşıldı, biraz sonra tekrar deneyin" |
| `ai_error` / `ai_response_invalid` | 502 | "AI yanıtı alınamadı, tekrar deneyin" |
| `validation_error` | 422 | Form doğrulama (örn. soru 3 karakterden kısa) |
| `internal_error` | 500 | Genel hata |

Her yanıt `x-request-id` ve `x-response-time-ms` başlıklarını taşır — hata
ekranında request id göstermek destek için faydalı.

---

## 5. Gerçek yanıt örnekleri

> Aşağıdakiler canlı backend'den alınmış gerçek yanıtlardır. Alan adları
> birebir budur.

### `GET /datasets/{id}/overview`

```jsonc
{
  "dataset": {
    "id": "625161c878c149ab",
    "filename": "sonart_erp_bozuk_encoding.csv",
    "pack_key": "sonart-erp",
    "pack_title": "Sonart Tekstil -- ERP Stok & Satis Raporu",
    "raw_row_count": 91,
    "clean_row_count": 90,
    "quarantined_row_count": 0,
    "health_score": 67,
    "encoding_detected": "utf-8-sig (mojibake onarildi)",
    "created_at": "2026-07-30T01:19:...Z"
  },
  "periods": ["2026-01","2026-02","2026-03","2026-04","2026-05","2026-06"],
  "entity_count": 15,
  "headline_metrics": [
    { "metric": "toplam_ciro_tl", "label": "Toplam Ciro",
      "value": 168696.0, "unit": "TL", "entity": null, "period": "2026-06" }
    // + toplam_brut_kar_tl, ortalama_marj_yuzde,
    //   toplam_stok_degeri_tl, tukenen_urun_sayisi
  ],
  "period_rows": [ /* aşağıda */ ],
  "risk_counts_by_severity": { "kritik":3, "yuksek":4, "orta":8, "dusuk":1, "bilgi":2 },
  "top_risks": [ /* RiskOut, aşağıda */ ]
}
```

**`period_rows[i]` alanları** — her toplulaştırma için ayrıca `_delta` ve
`_delta_pct` geliyor, KPI kartlarındaki değişim okunu bundan besleyin:

```
donem
toplam_ciro_tl            toplam_ciro_tl_delta            toplam_ciro_tl_delta_pct
toplam_brut_kar_tl        toplam_brut_kar_tl_delta        …_delta_pct
ortalama_marj_yuzde       ortalama_marj_yuzde_delta       …_delta_pct
toplam_stok_degeri_tl     toplam_stok_degeri_tl_delta     …_delta_pct
tukenen_urun_sayisi       tukenen_urun_sayisi_delta       …_delta_pct
toplam_cikis / toplam_giris / toplam_stok_adet + delta'ları
```

İlk dönemde `_delta` alanları `null` — KPI kartı o durumda ok göstermez.

### `RiskOut` (hem `top_risks` hem `/risks`)

```jsonc
{
  "code": "STOCKOUT",
  "title": "Stok tukenmis -- satis tedarikle sinirli",
  "severity": "kritik",                    // kritik|yuksek|orta|dusuk|bilgi
  "entity": "U005",
  "entity_label": "Barcelona Ayakkabılık Deri",
  "dimensions": { "kategori": "Ayakkabılık", "depo": "Ana Depo" },
  "narrative": "5 donemdir stok sifir. Bu donemlerin 4 tanesinde cikis girise kilitlenmis durumda -- yani satisi talep degil tedarik belirliyor. …",
  "recommendation": "Tedarik siparisini acil buyutun. …",
  "evidence": [
    { "metric":"son_stok", "label":"Son Stok", "value":0.0, "unit":"adet",
      "entity":"U005", "period":null },
    { "metric":"sifir_stok_donem", "label":"Stoksuz Donem Sayisi", "value":5.0,
      "unit":"sayi", "entity":"U005", "period":null }
    // …
  ],
  "financial_impact_tl": 33480.0,          // null olabilir
  "first_seen_period": "2026-02"           // null olabilir (trend bazlı riskler)
}
```

### `GET /datasets/{id}/periods`

```jsonc
{
  "periods": ["2026-01", …],
  "rows": [ /* period_rows ile aynı */ ],
  "deltas": [
    {
      "period": "2026-03",
      "previous_period": "2026-02",        // ilk dönemde null
      "metrics": [ { "metric":"toplam_ciro_tl", "label":"Toplam Ciro",
                     "value":174254.0, "unit":"TL", … } ],
      "movers_up":   [ { "metric":"cikis_miktar_change", "label":"Cikis degisimi",
                         "value":92.0, "unit":"adet", "entity":"U006",
                         "period":"2026-03" } ],
      "movers_down": [ /* aynı şekil, negatif değerler */ ],
      "new_risks": ["COST_SHOCK","MARGIN_EROSION"],   // o dönemde İLK KEZ açılan
      "resolved_risks": []
    }
  ],
  "dimension_rows": [
    { "dimension":"kategori", "dimension_value":"Ayakkabılık", "donem":"2026-01",
      "toplam_ciro_tl":44560.0, "toplam_brut_kar_tl":17160.0,
      "ortalama_marj_yuzde":38.51, "toplam_stok_degeri_tl":120124.0,
      "toplam_cikis":1190.0, "urun_sayisi":3 }
  ]
}
```

`dimension_rows` iki boyut içerir: `dimension` alanı `"kategori"` veya
`"depo"`. **Filtrelemeyi bu alana göre yapın** — 4 kategori × 6 dönem +
2 depo × 6 dönem = 36 satır.

### `GET /datasets/{id}/entities`

```jsonc
{
  "entity_key": "stok_kodu",
  "entity_label_key": "urun_adi",
  "dimensions": ["kategori","depo"],
  "columns": [                              // 27 adet — TABLO BAŞLIKLARI BURADAN
    { "name":"stok_kodu",      "label":"Kod",         "unit":"" },
    { "name":"urun_adi",       "label":"Ad",          "unit":"" },
    { "name":"kategori",       "label":"Kategori",    "unit":"" },
    { "name":"depo",           "label":"Depo",        "unit":"" },
    { "name":"toplam_ciro_tl", "label":"Toplam Ciro", "unit":"TL" },
    { "name":"son_stok",       "label":"Son Stok",    "unit":"adet" },
    { "name":"son_kapama_ay",  "label":"Stok Kapama", "unit":"ay" }
    // …
  ],
  "rows": [ /* 15 ürün, columns'taki name'lere karşılık gelen alanlar */ ],
  "series_rows": [ /* 90 satır: (ürün, dönem) uzun tablo */ ]
}
```

**Kolon etiketlerini frontend'de yeniden tanımlamayın** — `columns` dizisi
`{name,label,unit}` taşıyor, tablo başlıkları oradan gelsin. Yeni bir rapor
tipi eklendiğinde frontend hiç değişmez.

**`series_rows[i]` alanları** (ürün detay grafikleri için):

```
stok_kodu urun_adi kategori depo donem
giris_miktar cikis_miktar donem_sonu_stok birim_maliyet_tl birim_satis_tl
giris_miktar__imputed  cikis_miktar__imputed  donem_sonu_stok__imputed   ← bool
ciro_tl satis_maliyeti_tl brut_kar_tl marj_yuzde stok_degeri_tl net_akis
arz_kisitli onceki_stok cikis_ort3 cikis_mom_yuzde maliyet_mom_yuzde
marj_delta_puan kapama_ay mutabakat_farki
```

`*__imputed` alanları `true` ise o değer backend tarafından **türetilmiştir**.
Grafikte o noktayı kesikli çizgi veya içi boş işaretçiyle göster ve tooltip'te
"türetilmiş değer" notu ver. Bu küçük detay veri kalitesi iddiasını görünür
kılıyor.

### `GET /datasets/{id}/quality`

```jsonc
{
  "raw_row_count": 91, "clean_row_count": 90, "quarantined_row_count": 0,
  "encoding_detected": "utf-8-sig (mojibake onarildi)",
  "encoding_repaired": true,
  "health_score": 67,
  "issues": [
    { "code":"IMPUTATION_AMBIGUOUS",
      "title":"Eksik deger iki yonden farkli hesaplaniyor",
      "severity":"yuksek",
      "action":"isaretlendi",            // onarildi|turetildi|silindi|karantina|isaretlendi
      "affected_rows":1,
      "detail":"Eksik satir, onceki donemden ileri dogru ve sonraki donemden geri dogru hesaplandiginda farkli sonuc veriyor. …",
      "samples":["U010 / 2026-04: ileri=5180 geri=5160"] }
  ]
}
```

`action` alanı bu panelin can damarı — *"sorunu buldum"* değil *"sorunu buldum
**ve şunu yaptım**"* mesajını veriyor. Her bulguda rozet olarak göster.

### `POST /datasets/{id}/analysis`

```jsonc
{
  "dataset_id": "…", "pack_key": "sonart-erp",
  "model": "claude-sonnet-5",
  "cached": false, "cached_at": null,
  "periods": [
    {
      "period": "2026-03",
      "headline": "U007'de maliyet şoku marjı çökerten … bir dönem.",
      "delta_vs_prev": "Ciro 169.794 TL'den 174.254 TL'ye çıktı ama … ",
      "dominant_dynamics": ["maliyet_artisi","marj_baskisi","stok_riski"],
      "actions": [
        { "priority":"kritik",              // kritik|yuksek|orta|dusuk
          "title":"U007 Cortina için satış fiyatını bu hafta güncelleyin",
          "rationale":"Maliyet %21,67 artıp 146 TL'ye oturdu …",
          "evidence":[ { "metric":"maliyet_degisim_yuzde", "value":21.67,
                         "unit":"%", "entity":"U007", "period":"2026-03" } ],
          "owner":"satis",                  // satinalma|uretim|satis|finans
          "horizon":"bu_hafta",             // bu_hafta|bu_ay|bu_ceyrek
          "expected_impact_tl": 572.0 }     // null olabilir
      ],
      "watch_items": ["U002 Toscana'da sessiz birikim sürüyor"]
    }
  ],
  "summary": {
    "headline": "…", "situation": "…",
    "period_narrative": "Şubat ve Mart ayları dönüm noktaları oldu — …",
    "top_risks":      [ { "entity":"U005", "title":"…", "why_it_matters":"…",
                          "evidence":[…] } ],
    "opportunities":  [ /* aynı şekil */ ],
    "strategic_actions": [ /* Action ile aynı şekil */ ]
  },
  "grounding": { "total_evidence":118, "verified_evidence":116,
                 "grounding_ratio":0.983, "issues":[…] },
  "telemetry": { "call_count":7, "input_tokens":8373, "output_tokens":15449,
                 "cache_write_tokens":26760, "cache_read_tokens":66480,
                 "cache_hit_calls":5, "total_cost_usd":0.3225,
                 "duration_ms":122000 },
  "failed_periods": []
}
```

### `POST /datasets/{id}/ask`

İstek: `{"question": "Marjı en hızlı daralan ürün hangisi?"}` (3–500 karakter)

```jsonc
{
  "dataset_id":"…", "question":"…",
  "answer": { "answer":"U007 Cortina Çantalık Deri. Marj %42,86'dan …",
              "evidence":[ { "metric":"marj_degisim_puan", "value":-12.38,
                             "unit":"%", "entity":"U007", "period":null } ],
              "confidence":"yuksek",        // yuksek|orta|dusuk
              "caveats":[] },
  "grounding": { … }, "telemetry": { … }, "cached": false
}
```

---

## 6. Renk sistemi

**Bu değerler doğrulayıcıdan geçirildi, değiştirmeyin.** Kategorik palet her
iki modda da tüm kapıları geçiyor (CVD ΔE 9.1 light / 8.4 dark; normal görüş
ΔE 22.9 / 19.8).

```css
/* src/app/globals.css */
:root {
  color-scheme: light;
  --surface-1: #fcfcfb;   /* grafik yüzeyi */
  --page:      #f9f9f7;
  --ink-1:     #0b0b0b;   /* birincil metin */
  --ink-2:     #52514e;   /* ikincil metin */
  --ink-muted: #898781;   /* eksen, etiket */
  --grid:      #e1e0d9;   /* ızgara (kıl çizgi) */
  --axis:      #c3c2b7;
  --border:    rgba(11,11,11,0.10);
  --delta-up:  #006300;   /* iyi yönde değişim metni */

  /* kategorik — SABİT SIRA */
  --series-1: #2a78d6;    /* Giyimlik    */
  --series-2: #eb6834;    /* Döşemelik   */
  --series-3: #1baf7a;    /* Ayakkabılık */
  --series-4: #eda100;    /* Çantalık    */

  /* durum — sadece risk şiddeti */
  --critical: #d03b3b;    /* kritik */
  --serious:  #ec835a;    /* yüksek */
  --warning:  #fab219;    /* orta   */
  --good:     #0ca30c;    /* düşük  */
  /* bilgi → --ink-muted, durum rengi harcanmıyor */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --surface-1: #1a1a19;  --page: #0d0d0d;
    --ink-1: #ffffff;      --ink-2: #c3c2b7;   --ink-muted: #898781;
    --grid: #2c2c2a;       --axis: #383835;
    --border: rgba(255,255,255,0.10);
    --delta-up: #0ca30c;
    --series-1: #3987e5;  --series-2: #d95926;
    --series-3: #199e70;  --series-4: #c98500;
    /* durum renkleri mod-bağımsız, aynen kalır */
  }
}
:root[data-theme="dark"] { /* yukarıdaki dark bloğun aynısı */ }
```

Tema toggle `data-theme` damgası basar ve her iki yönde de OS ayarını yener.

**Light modda `--series-3` (aqua) ve `--series-4` (sarı) yüzeye karşı 3:1
altında.** Bu yüzden o iki seri **doğrudan etiketlenmek zorunda** ve grafiğin
tablo görünümü bulunmak zorunda. Bu bir ödün değil, kuralın gereği.

### Kategori → renk eşlemesi sabit

```ts
export const CATEGORY_COLOR: Record<string, string> = {
  "Giyimlik":    "var(--series-1)",
  "Döşemelik":   "var(--series-2)",
  "Ayakkabılık": "var(--series-3)",
  "Çantalık":    "var(--series-4)",
};
```

Filtreyle kategori sayısı azalırsa kalanların rengi **değişmez**. Bilinmeyen
bir kategori gelirse (başka veri seti) sıradaki slotu ver, asla döngüye alma;
5'ten fazlaysa "Diğer" olarak topla.

### Şiddet → durum eşlemesi

```ts
export const SEVERITY = {
  kritik: { color: "var(--critical)", label: "Kritik", Icon: AlertOctagon },
  yuksek: { color: "var(--serious)",  label: "Yüksek", Icon: AlertTriangle },
  orta:   { color: "var(--warning)",  label: "Orta",   Icon: AlertCircle },
  dusuk:  { color: "var(--good)",     label: "Düşük",  Icon: Info },
  bilgi:  { color: "var(--ink-muted)",label: "Bilgi",  Icon: Info },
} as const;
```

**İkon ve etiket her zaman birlikte** — renk tek başına anlam taşımaz.

---

## 7. Grafik formları

Her form "verinin işi ne" sorusuyla seçildi. Değiştirmeyin.

| # | İçerik | Form | Seri | Not |
|---|---|---|---|---|
| 1 | 5 KPI | **Stat tile** (grafik değil) | — | Değer + `_delta_pct` oku |
| 2 | Ciro + Brüt Kâr | Çizgi | 2 (slot 1,2) | Aynı birim (TL), aynı eksen meşru |
| 3 | Ağırlıklı Marj | Çizgi | 1 | **Ayrı grafik.** Legend yok, başlık adlandırıyor |
| 4 | Stokta bağlı sermaye | Alan | 1 | slot 1 |
| 5 | Kategori kırılımı | Çizgi | 4 | Sabit renk eşlemesi, hepsi doğrudan etiketli |
| 6 | Risk parasal etkisi | Yatay çubuk | — | Azalan sıralı, şiddet rengi |
| 7 | Stok kapama süresi | Yatay çubuk + eşik | — | 1,5 / 6 / 12 ay referans çizgileri |
| 8 | Ürün detay | Çizgi (stok) + çubuk (çıkış) | 2 | Ürün seçilince açılır |

**2 ve 3 numara ayrı grafiktir.** Aynı karta koyup iki eksen çizmek yasak.

### Mark spesifikasyonları

- Çizgi kalınlığı **2px** (`strokeWidth={2}`)
- Nokta işaretçileri **≥8px**, sadece hover'da ve son noktada (`dot={false}`,
  `activeDot={{ r: 5 }}`)
- Çubuk uçları **4px yuvarlatılmış**, tabana sabitli (`radius={[4,4,0,0]}`,
  yatayda `[0,4,4,0]`)
- Bitişik dolgular arasında **2px yüzey boşluğu**
- Izgara ve eksen geri planda: `stroke="var(--grid)"`, eksen etiketleri
  `fill="var(--ink-muted)"`, font 11-12px
- Eksen tickleri `tabular-nums`

---

## 8. Rota yapısı

```
/                        Veri seti listesi + CSV yükleme (drag-drop)
/d/[id]                  Dashboard — KPI'lar + 4 grafik
/d/[id]/kalite           Veri kalitesi paneli
/d/[id]/riskler          Risk sicili + parasal etki grafiği
/d/[id]/urunler          Ürün tablosu + seçili ürün zaman serisi
/d/[id]/analiz           Dönemsel AI analizi + yönetici özeti
/d/[id]/sor              Serbest soru-cevap
```

Sekme yerine ayrı rotalar: her biri temiz bir ekran görüntüsü veriyor ve URL
paylaşılabilir.

`/d/[id]` altındaki tüm sayfalar ortak bir `layout.tsx` kullanır:
üst bar (dosya adı, dönem aralığı, sağlık rozeti, PDF indir, tema toggle) +
sekme navigasyonu.

---

## 9. Sayfa sayfa spesifikasyon

### `/` — Giriş

- **Yükleme alanı**: drag-drop + dosya seç. `POST /datasets` multipart.
  `pack` alanı **gönderilmez** — backend başlıklardan tespit ediyor. Tespit
  edemezse `empty_dataset` döner, o zaman `/packs`'ten seçim sun.
- Yükleme sırasında ilerleme; başarıda `/d/{id}` adresine yönlendir.
- **Yüklenmiş veri setleri listesi** (`GET /datasets`): dosya adı, pack başlığı,
  satır sayısı, sağlık rozeti, tarih. Tıklayınca dashboard'a git.
- Örnek CSV'ler backend reposunda `data/samples/` altında — indirilebilir link
  koymak iyi olur (3 dosya: temiz, bozuk encoding, reklam verisi).

### `/d/[id]` — Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ [KPI] [KPI] [KPI] [KPI] [KPI]     ← headline_metrics, 5 adet    │
├───────────────────────────┬─────────────────────────────────────┤
│ Ciro + Brüt Kâr (çizgi)   │ Ağırlıklı Marj (çizgi, tek seri)   │
├───────────────────────────┼─────────────────────────────────────┤
│ Stokta Bağlı Sermaye      │ Kategori Kırılımı (4 seri)          │
│ (alan)                    │                                      │
├───────────────────────────┴─────────────────────────────────────┤
│ En kritik riskler (top_risks, 5 satır) → /riskler bağlantısı    │
└─────────────────────────────────────────────────────────────────┘
```

- **KPI kartı**: etiket, büyük değer (birime göre formatlı), altında
  `_delta_pct` oku. Ok yönü + renk: artış ciro/kârda iyi (`--delta-up`),
  "stoğu tükenen ürün"de kötü. Bu metriğe göre değişir, sabit kodlamayın:
  `tukenen_urun_sayisi` için artış kötü, diğer dördünde iyi.
- Birim formatlama: `TL` → `168.696 TL` (binlik nokta), `%` → `%39,6`,
  `adet` → `26.379`, `ay` → `13,7 ay`, `oran` → `2,07`.
- Kategori grafiği `dimension_rows`'tan `dimension === "kategori"` filtresiyle.

### `/d/[id]/kalite` — Veri kalitesi

- Üstte **sağlık rozeti** (67/100) + üç sayı: ham satır, işlenen, karantina +
  tespit edilen kodlama.
- Altında bulgu listesi. Her kart: şiddet chip'i (ikon+etiket), başlık,
  **işlem rozeti** (`onarıldı` / `türetildi` / `silindi` / `karantina` /
  `işaretlendi`), etkilenen satır sayısı, açıklama, `samples[]` monospace.
- Şiddete göre sırala (backend zaten sıralı gönderiyor).
- **Bu sayfa projenin en güçlü kartlarından biri** — `ENCODING_REPAIRED`
  bulgusunun `samples` alanı `"Marbella DÃ¶ÅŸemelik Deri -> Marbella Döşemelik Deri"`
  gösteriyor. Bunu görünür kılın, ekran görüntüsüne girecek.

### `/d/[id]/riskler` — Risk sicili

- Üstte üç sayı: toplam risk, kritik sayısı, toplam parasal etki.
- **Yatay çubuk grafik**: parasal etkisi olan riskler, azalan sıralı, şiddet
  rengiyle. Y ekseninde `entity + entity_label`.
- Altında liste. Her satır kapalıyken: şiddet chip'i, kod, ürün, başlık,
  parasal etki, ilk görülme dönemi. Açılınca: `narrative`, `recommendation`,
  ve **kanıt pill'leri** (`son_stok = 0 adet`, `sifir_stok_donem = 5`).
- Filtreler tek satırda üstte: şiddet, dönem (`first_seen_period`), kategori.
- `first_seen_period === null` olan riskler (trend bazlı) dönem filtresinde
  "dönem atfı yok" grubunda.

### `/d/[id]/urunler` — Ürün tablosu

- `columns` dizisinden üretilen sıralanabilir tablo, `rows` verisiyle.
- Sayısal kolonlar sağa yaslı, `tabular-nums`.
- Riskli ürünlerin satırında şiddet noktası.
- Satır tıklanınca alt panelde o ürünün zaman serisi: `series_rows` filtrelenip
  stok (çizgi) + çıkış (çubuk). `*__imputed === true` noktalar kesikli/içi boş.
- 27 kolon çok — varsayılan olarak 8-10 kolon göster, "tüm kolonlar" toggle'ı koy.

### `/d/[id]/analiz` — AI analizi

- İlk açılışta `GET /analysis/status`:
  - `ai_configured === false` → "AI anahtarı tanımlı değil" bilgi kartı,
    kurulum talimatı. Sayfanın geri kalanı kapalı.
  - `cached === true` → doğrudan `POST /analysis` (anında döner) ve göster.
  - `cached === false` → "Analiz üret" düğmesi + `estimated_calls` uyarısı
    (*"7 AI çağrısı yapılacak, ~2 dakika sürer"*).
- **Üretim sırasında**: iskelet ekran + geçen süre sayacı. ~100 sn sürüyor,
  spinner yetmez; ne olduğunu anlatan bir ilerleme metni koyun.
- **Yönetici özeti** üstte: `headline` büyük, `situation`, `period_narrative`
  ayrı bir blokta (bu 6 dönemin hikâyesi, öne çıkarın), `top_risks`,
  `opportunities`, `strategic_actions`.
- **Dönem zaman çizelgesi**: 6 kart, sırayla. Her kart: dönem, `headline`,
  `delta_vs_prev`, `dominant_dynamics` chip'leri, aksiyonlar.
  Aksiyon satırı: öncelik chip'i, başlık, sahip departman, zaman ufku,
  `expected_impact_tl`, ve açılınca `rationale` + kanıt pill'leri.
- **Telemetri satırı** en altta, küçük: model, çağrı sayısı, önbellek isabeti,
  maliyet, **grounding oranı**. Grounding rozeti bu projenin ana iddiasını
  görünür kılıyor — `%100` yeşil, `<%80` uyarı rengi.
- `failed_periods` boş değilse uyarı göster ama kalan dönemleri sun.

### `/d/[id]/sor` — Soru-cevap

- Metin girişi (3–500 karakter) + örnek soru chip'leri:
  - "Marjı en hızlı daralan ürün hangisi ve neden?"
  - "Hangi ürünlerde sermaye gereksiz bağlı duruyor?"
  - "Mart ayında ne değişti?"
- Yanıt kartı: `answer` metni, **kanıt pill'leri**, güven rozeti
  (`yuksek`/`orta`/`dusuk`), varsa `caveats` uyarı olarak.
- Soru geçmişi sayfa içinde tutulsun (state); backend aynı soruyu
  önbelleklediği için tekrar sormak ücretsiz.

---

## 10. Bileşen envanteri

**Layout**: `DatasetShell`, `NavTabs`, `ThemeToggle`

**Grafik primitifleri**: `ChartFrame` (başlık, alt başlık, tablo toggle,
`overflow-x` konteyner), `LineChartCard`, `AreaChartCard`, `HBarChartCard`,
`SeriesTooltip` (crosshair + değerler), `DataTable` (her grafiğin tablo
karşılığı), `ChartLegend`

**Domain**: `KpiTile`, `SeverityChip`, `ActionBadge` (kalite işlemi),
`EvidencePill`, `RiskRow`, `QualityIssueCard`, `PeriodCard`, `ActionRow`,
`GroundingBadge`, `TelemetryBar`, `AnalysisRunner`, `UploadDropzone`,
`ErrorState` (hata kodundan mesaj üretir), `EmptyState`

---

## 11. Etkileşim

- **Hover katmanı varsayılan.** Çizgi/alan grafiklerde crosshair + tek tooltip
  (tüm serilerin o dönemdeki değeri). Çubukta işaret başına tooltip.
- Vuruş alanı işaretten büyük (Recharts `<Tooltip>` + geniş `activeDot`).
- Tooltip içeriği: dönem başlığı, her seri için renkli nokta + etiket + değer.
  **Metin ink rengiyle**, nokta seri rengiyle.
- Filtreler grafiklerin **üstünde tek satırda**.
- Tablo görünümü toggle'ı her `ChartFrame` başlığının sağında.

---

## 12. Erişilebilirlik

- ≥2 seride legend her zaman; ≤4 seride ayrıca doğrudan etiket
  (`<LabelList>` son noktada).
- Her grafiğin tablo karşılığı (kural, opsiyon değil).
- Odak halkaları görünür; sekme sırası mantıklı.
- Durum renkleri ikon + etiketle.
- Dark mode ayrıca seçilmiş değerlerle.
- Geniş içerik (tablolar, grafikler) kendi `overflow-x: auto` konteynerinde —
  sayfa gövdesi asla yatay kaymaz.

---

## 13. Üretilecek ekran görüntüleri

Bunlar backend reposunun README'sine gidecek. Dosya adları birebir:

| Dosya | Sayfa | Kadrajda ne olmalı |
|---|---|---|
| `01-dashboard.png` | `/d/[id]` | KPI satırı + 4 grafik birlikte |
| `02-veri-kalitesi.png` | `/kalite` | Sağlık 67/100 + mojibake onarım örneği görünür |
| `03-risk-sicili.png` | `/riskler` | U005 açık, kanıt pill'leri görünür |
| `04-donemsel-analiz.png` | `/analiz` | 6 dönem kartı + biri açık, farklı hikâyeler görünür |
| `05-soru-cevap.png` | `/sor` | Soru + yanıt + kanıtlar + grounding rozeti |

Ekran görüntülerini **1440px genişlikte, light modda** alın (dark mode ayrıca
bir kare olabilir ama ana set light).

---

## 14. Yapım sırası

| Faz | İş |
|---|---|
| 1 | Proje kurulumu, Tailwind v4, renk token'ları, tema toggle, `openapi-typescript` ile tip üretimi, `src/lib/api.ts` |
| 2 | `ErrorState` + hata kodu eşlemesi, `DatasetShell`, `/` yükleme ekranı |
| 3 | `ChartFrame` + `DataTable` + `SeriesTooltip` primitifleri |
| 4 | `/d/[id]` dashboard: `KpiTile` + 4 grafik |
| 5 | `/kalite` ve `/riskler` |
| 6 | `/urunler` |
| 7 | `/analiz` + `AnalysisRunner`, `/sor` |
| 8 | Dark mode doğrulaması, responsive, erişilebilirlik geçişi, ekran görüntüleri |

---

## 15. Tuzaklar ve notlar

- **AI analizi ~100 saniye sürüyor.** İlk çalıştırmada. Sonrası önbellekten
  anında geliyor. Geliştirme sırasında bir kez üretin, sonra ücretsiz.
- **AI çağrısı para harcıyor** (~$0,22/analiz). Geliştirirken `?refresh=true`
  kullanmayın. `analysis/status` ile önce önbelleği kontrol edin.
- **Backend etiketleri şu an ASCII Türkçe** (`"Brut Kar"`, `"Agirlikli Marj"`).
  Backend tarafında düzeltilecek; frontend `label` alanını olduğu gibi
  kullansın, düzeltme geldiğinde kendiliğinden düzelir. **Kendi etiket
  sözlüğünüzü yazmayın.**
- **Sayı formatı Türkçe**: binlik ayracı nokta, ondalık virgül.
  `Intl.NumberFormat("tr-TR")` kullanın.
- **`null` değerler yaygın**: ilk dönemde `_delta` alanları, bazı risklerde
  `financial_impact_tl` ve `first_seen_period`, bazı metriklerde `kapama_ay`
  (çıkış sıfırsa). Hepsini "-" olarak gösterin, `0` değil.
- **`ai_not_configured` bir hata değil, bir durum.** Anahtar yoksa dashboard,
  kalite, riskler, ürünler ve PDF hepsi çalışır — sadece AI sekmeleri kapalı.
  Uygulamayı bu durumda da tam çalışır gösterin.
- **CORS zaten açık** `localhost:3000` için.
- **Boyut kırılımında iki boyut var** (`kategori` ve `depo`) — aynı dizide.
  Filtrelemeyi unutmayın yoksa 36 satır tek grafiğe girer.
- **PDF indirme** `GET /report.pdf` — yeni sekmede aç veya blob indir.
  `include_ai=false` ile AI'sız versiyon.

---

## 16. Bitti sayılma kriteri

- [ ] Tüm rotalar çalışıyor, veri geliyor
- [ ] Çift eksenli grafik yok
- [ ] Kategori renkleri filtreyle değişmiyor
- [ ] Her grafiğin tablo görünümü var
- [ ] Durum renkleri ikon + etiketle
- [ ] Dark mode ayrı değerlerle çalışıyor
- [ ] `ai_not_configured` durumunda uygulama tam çalışıyor
- [ ] AI aksiyonlarının kanıtları görünüyor
- [ ] Grounding oranı gösteriliyor
- [ ] Hata kodları anlamlı mesaja çevriliyor
- [ ] Sayılar Türkçe formatlı, `null` değerler "-" gösteriyor
- [ ] 5 ekran görüntüsü alındı
- [ ] Sayfa gövdesi yatay kaymıyor
