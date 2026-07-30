/**
 * PLAN.md bölüm 13'teki beş kareyi üretir.
 *
 * Bağımlılık yok: kurulu Chrome/Edge'i headless başlatıp CDP ile sürüyor
 * (Node 22'nin global WebSocket'i yeterli).
 *
 *   node scripts/ekran-goruntuleri.mjs <dataset-id> [tema]
 *
 * Ön koşullar: backend 8000'de, `npm run build && npm run start` ile arayüz
 * 3000'de ayakta. AI kareleri için analizin önbellekte olması gerekir
 * (/d/<id>/analiz sayfasında bir kez üretin).
 *
 * Çıktı: screenshots/*.png — bunlar backend reposunun README'sine gidiyor.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const PORT = 9455;
const OUT = "screenshots";
const WIDTH = 1440;
const THEME = process.argv[3] ?? "light";
const ID = process.argv[2];

if (!ID) {
  console.error("Kullanım: node scripts/ekran-goruntuleri.mjs <dataset-id> [light|dark]");
  process.exit(1);
}

const CHROME_CANDIDATES = [
  `${process.env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env["ProgramFiles(x86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env["ProgramFiles(x86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
  `${process.env.ProgramFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

const browser = CHROME_CANDIDATES.find((p) => p && existsSync(p));
if (!browser) {
  console.error("Chrome veya Edge bulunamadı.");
  process.exit(1);
}

/** Her kare: rota, dosya adı ve kadraja girmesi gereken şeyi açan adım. */
const SHOTS = [
  { file: "01-dashboard.png", path: `/d/${ID}`, prepare: null },
  { file: "02-veri-kalitesi.png", path: `/d/${ID}/kalite`, prepare: null },
  {
    file: "03-risk-sicili.png",
    path: `/d/${ID}/riskler`,
    // İlk risk zaten açık geliyor; kanıt pill'leri kadrajda.
    prepare: null,
  },
  {
    file: "04-donemsel-analiz.png",
    path: `/d/${ID}/analiz`,
    prepare: `[...document.querySelectorAll('button[aria-expanded="false"]')].slice(0,3).forEach(b => b.click())`,
    wait: 6000,
  },
  {
    file: "05-soru-cevap.png",
    path: `/d/${ID}/sor`,
    prepare: `[...document.querySelectorAll('button')].find(b => b.textContent.includes('Marjı en hızlı'))?.click()`,
    wait: 9000,
  },
];

const proc = spawn(
  browser,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--force-color-profile=srgb",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${process.env.TEMP ?? "/tmp"}/sonart-shots`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

async function waitForCdp() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return;
    } catch {
      /* henüz açılmadı */
    }
    await sleep(250);
  }
  throw new Error("Tarayıcı CDP portunu açmadı.");
}

async function openPage() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" });
  const target = await res.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id === undefined) return;
    const slot = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) slot?.reject(new Error(JSON.stringify(msg.error)));
    else slot?.resolve(msg.result);
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const msgId = ++id;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

  return { send, close: () => ws.close() };
}

await waitForCdp();
mkdirSync(OUT, { recursive: true });

for (const shot of SHOTS) {
  const page = await openPage();
  await page.send("Page.enable");
  await page.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: THEME }],
  });
  // Ölçüm için kısa bir viewport: gövdede `min-h-screen` var, uzun viewport
  // boş alanı da içerik sanmaya yol açıyor.
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: WIDTH,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  });
  await page.send("Page.navigate", { url: BASE + shot.path });
  await sleep(shot.wait ?? 3000);

  if (shot.prepare) {
    await page.send("Runtime.evaluate", { expression: shot.prepare, awaitPromise: true });
    await sleep(1200);
  }

  // Kadrajı içeriğe göre kırp: boş alan ekran görüntüsüne girmesin.
  const { result } = await page.send("Runtime.evaluate", {
    expression: "Math.ceil(document.documentElement.scrollHeight)",
    returnByValue: true,
  });
  const height = Math.min(Math.max(result.value ?? 900, 700), 6400);
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: WIDTH,
    height,
    deviceScaleFactor: 2,
    mobile: false,
  });
  await sleep(900);

  const { data } = await page.send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${OUT}/${shot.file}`, Buffer.from(data, "base64"));
  console.log(`✓ ${OUT}/${shot.file}  (${WIDTH}×${height}, ${THEME})`);

  page.close();
  await sleep(200);
}

proc.kill();
console.log(`\nBitti. Bu kareler backend reposunun README'sine eklenecek.`);
