"use strict";
/* Italienisch lernen – die ganze App in einer Datei.
   Aufbau: Hilfsfunktionen → Daten → Speichern → Lernplan → Sprachausgabe → Spracherkennung → Bildschirme → Start */

// ---------- Hilfsfunktionen ----------
const $app = document.getElementById("app");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const mischen = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const TAG = 24 * 60 * 60 * 1000;
const heute = () => new Date().toISOString().slice(0, 10);

function toast(text, ms = 2500) {
  const t = document.getElementById("toast");
  t.textContent = text; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), ms);
}
// Zieht n Einträge; Einträge mit höherem Gewicht kommen eher dran (wie Lose in einer Lostrommel)
function gewichtetZiehen(liste, gewichtFn, n) {
  const pool = liste.map((x) => ({ x, g: Math.max(0.05, gewichtFn(x)) }));
  const aus = [];
  while (aus.length < n && pool.length) {
    let r = Math.random() * pool.reduce((s, p) => s + p.g, 0), i = 0;
    for (; i < pool.length - 1; i++) { r -= pool[i].g; if (r <= 0) break; }
    aus.push(pool.splice(i, 1)[0].x);
  }
  return aus;
}

// ---------- Daten aufbereiten ----------
function zeilen(text) {
  return text.split("\n").map((z) => z.trim()).filter((z) => z && z.includes("|"))
    .map((z) => { const [it, de] = z.split("|").map((s) => s.trim()); return { it, de }; });
}
const THEMEN = WORTSCHATZ.map((t) => ({ ...t, eintraege: zeilen(t.liste).map((e) => ({ ...e, id: t.id + ":" + e.it, thema: t.id })) }));
const PHRASEN_GRUPPEN = PHRASEN.map((t) => ({ ...t, eintraege: zeilen(t.liste).map((e) => ({ ...e, id: t.id + ":" + e.it, thema: t.id })) }));
const ALLE_WOERTER = THEMEN.flatMap((t) => t.eintraege);
const ALLE_PHRASEN = PHRASEN_GRUPPEN.flatMap((t) => t.eintraege);
const ALLE_KARTEN = ALLE_WOERTER.concat(ALLE_PHRASEN);
const KARTE_NACH_ID = Object.fromEntries(ALLE_KARTEN.map((k) => [k.id, k]));
const SAETZE_LISTE = zeilen(SAETZE);
const GRUPPE_NACH_ID = Object.fromEntries(THEMEN.concat(PHRASEN_GRUPPEN).map((g) => [g.id, g]));

// ---------- Speichern im Handy ----------
const SPEICHER_KEY = "italienisch-app-v1";
const STANDARD = {
  version: 2,
  karten: {},          // "id|richtung" → { ease, intervall, wdh, faellig, richtig, falsch, vergessen }
  grammatik: {},       // "verb:essere:0", "art:il libro", "satz:…" → { intervall, faellig, richtig, falsch }
  aussprache: {},      // id → { versuche, bester, letzter }
  einstellungen: { tempo: 0.9, stimme: "", neueProTag: 10, automatischVorlesen: true, richtung: "beide", eintippen: true, sprechenModus: "zeigen", gespraechText: true, themen: ["grundwoerter"] },
  tage: {},            // Datum → Anzahl geübter Aufgaben
  neueHeute: { datum: "", anzahl: 0 }
};
let S = laden();
function laden() {
  try {
    const roh = JSON.parse(localStorage.getItem(SPEICHER_KEY) || "null");
    if (roh) return umstellen(roh);
  } catch (e) { /* kaputter Speicher → neu anfangen */ }
  return JSON.parse(JSON.stringify(STANDARD));
}
// Lernstand aus Version 1 (Karteikasten mit Fächern) übernehmen
function umstellen(roh) {
  const s = { ...JSON.parse(JSON.stringify(STANDARD)), ...roh, einstellungen: { ...STANDARD.einstellungen, ...(roh.einstellungen || {}) } };
  if (!roh.version) {
    const alteAbstaende = [0, 1, 2, 4, 8, 16, 35, 75, 150];
    const richtung = roh.einstellungen && roh.einstellungen.richtung === "de-it" ? "de-it" : "it-de";
    s.karten = {};
    Object.entries(roh.karten || {}).forEach(([id, k]) => {
      s.karten[id + "|" + richtung] = { ease: 2.5, intervall: alteAbstaende[k.box] || 0, wdh: k.box || 0, faellig: k.faellig || 0, richtig: k.richtig || 0, falsch: k.falsch || 0, vergessen: 0 };
    });
    s.einstellungen.richtung = "beide"; // neu: beide Richtungen üben
    s.version = 2;
  }
  s.grammatik = s.grammatik || {}; s.aussprache = s.aussprache || {};
  if (!s.einstellungen.sprechenModus) s.einstellungen.sprechenModus = s.einstellungen.sprechenVerdeckt ? "gedaechtnis" : "zeigen";
  return s;
}
function speichern() {
  try { localStorage.setItem(SPEICHER_KEY, JSON.stringify(S)); } catch (e) { toast("Speichern hat nicht geklappt."); }
}
function geuebt() {
  S.tage[heute()] = (S.tage[heute()] || 0) + 1;
  speichern();
}
function serie() { // wie viele Tage am Stück geübt
  let n = 0; const d = new Date();
  if (!S.tage[heute()]) d.setDate(d.getDate() - 1);
  while (S.tage[d.toISOString().slice(0, 10)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

// ---------- Lernplan für Karteikarten (nach dem SM-2-Prinzip) ----------
// Jede Karte hat je Richtung ihren eigenen Stand:
//  - intervall: nach wie vielen Tagen sie wiederkommt
//  - ease: wie leicht sie dir fällt (1,3 = sehr schwer … 3,0 = sehr leicht); damit wird der Abstand jedes Mal malgenommen
const RICHTUNGEN = ["it-de", "de-it"];
const RICHTUNG_NAME = { "it-de": "Italienisch → Deutsch", "de-it": "Deutsch → Italienisch" };
const schluessel = (id, r) => id + "|" + r;
const zustand = (id, r) => S.karten[schluessel(id, r)];
const istFaellig = (id, r) => { const k = zustand(id, r); return !!k && k.faellig <= Date.now(); };
const istNeu = (id, r) => !zustand(id, r);
const istGelernt = (id, r) => { const k = zustand(id, r); return !!k && k.intervall >= 3; };
function startDesTages(ms) { const d = new Date(ms); d.setHours(3, 0, 0, 0); return d.getTime(); }
const tageText = (t) => (t === 0 ? "gleich wieder" : t === 1 ? "1 Tag" : t < 60 ? t + " Tage" : Math.round(t / 30) + " Monate");

function naechsterAbstand(k, note) { // note: 0 nochmal, 1 schwer, 2 gut, 3 leicht
  if (note === 0) return 0;
  if (!k || k.wdh === 0 || k.intervall === 0) return [0, 1, 2, 4][note];
  const v = k.intervall;
  const t = note === 1 ? Math.max(v + 1, Math.round(v * 1.2))
          : note === 2 ? Math.max(v + 1, Math.round(v * k.ease))
          : Math.max(v + 2, Math.round(v * k.ease * 1.3));
  return Math.min(365, t);
}
function bewerte(id, r, note) {
  const key = schluessel(id, r), alt = S.karten[key];
  const k = alt || { ease: 2.5, intervall: 0, wdh: 0, faellig: 0, richtig: 0, falsch: 0, vergessen: 0 };
  const t = naechsterAbstand(alt, note);
  if (note === 0) {
    if (k.wdh > 0) k.vergessen++;
    k.wdh = 0; k.intervall = 0; k.falsch++;
    k.ease = Math.max(1.3, k.ease - 0.2);
    k.faellig = Date.now() + 60 * 1000;
  } else {
    if (note === 1) k.ease = Math.max(1.3, k.ease - 0.15);
    if (note === 3) k.ease = Math.min(3.0, k.ease + 0.15);
    k.wdh++; k.intervall = t; k.richtig++;
    k.faellig = startDesTages(Date.now() + t * TAG);
  }
  k.zuletzt = Date.now();
  S.karten[key] = k; geuebt();
}
// Ergebnisse aus Hören und Sprechen fließen sanft in den Lernstand ein
function rueckmeldung(id, r, ok) {
  const key = schluessel(id, r), k = S.karten[key];
  if (!k) return; // neue Wörter werden nur über die Karteikarten eingeführt
  if (ok && k.faellig <= Date.now()) { bewerte(id, r, 2); return; } // fällige Karte richtig = zählt als Wiederholung
  if (ok) k.richtig++;
  else {
    k.falsch++;
    k.ease = Math.max(1.3, k.ease - 0.1);
    k.intervall = Math.max(1, Math.round(k.intervall / 2));
    k.faellig = Math.min(k.faellig, Date.now()); // gleich wieder fällig
  }
  S.karten[key] = k; speichern();
}
// Wie dringend ein Wort geübt werden sollte (für Hören und Sprechen)
function gewicht(id, r) {
  const k = zustand(id, r);
  if (!k) return 1;
  let g = 2;
  if (k.faellig <= Date.now()) g += 4;
  g += 4 * Math.min(1, k.falsch / (k.richtig + 1));
  g -= Math.min(1.5, k.intervall / 20);
  return Math.max(0.3, g);
}
function neueHeuteUebrig() {
  if (S.neueHeute.datum !== heute()) S.neueHeute = { datum: heute(), anzahl: 0 };
  return Math.max(0, S.einstellungen.neueProTag - S.neueHeute.anzahl);
}
function kartenDerThemen(ids) { return ids.flatMap((id) => (GRUPPE_NACH_ID[id] ? GRUPPE_NACH_ID[id].eintraege : [])); }
function richtungenFuer(modus) { return modus === "beide" ? RICHTUNGEN : [modus]; }
function anzahlFaellig() {
  const jetzt = Date.now();
  return Object.entries(S.karten).filter(([key, k]) => k.faellig <= jetzt && KARTE_NACH_ID[key.split("|")[0]]).length;
}

// Stellt eine Übungsrunde zusammen: fällige Wiederholungen gemischt, neue Karten reihum aus den Themen dazwischen
function rundePlanen(karten, modus) {
  const richt = richtungenFuer(modus);
  const faellige = [], neuNachThema = {};
  karten.forEach((k) => richt.forEach((r) => {
    if (istFaellig(k.id, r)) faellige.push({ k, r });
    else if (istNeu(k.id, r)) {
      // Deutsch → Italienisch erst, wenn das Wort in der anderen Richtung schon einmal gekonnt wurde
      if (modus === "beide" && r === "de-it") { const v = zustand(k.id, "it-de"); if (!v || v.wdh < 1) return; }
      (neuNachThema[k.thema] = neuNachThema[k.thema] || { de: [], it: [] })[r === "de-it" ? "de" : "it"].push({ k, r });
    }
  }));
  const reihen = Object.values(neuNachThema).map((t) => t.de.concat(t.it));
  const neue = [];
  for (let i = 0; reihen.some((x) => i < x.length); i++) reihen.forEach((x) => { if (i < x.length) neue.push(x[i]); });
  return { faellige: mischen(faellige), neue };
}

// ---------- Lernplan für Grammatik ----------
function gBewerte(key, ok) {
  const g = S.grammatik[key] || { intervall: 0, faellig: 0, richtig: 0, falsch: 0 };
  if (ok) { g.richtig++; g.intervall = g.intervall ? Math.min(120, Math.round(g.intervall * 2.5)) : 1; g.faellig = startDesTages(Date.now() + g.intervall * TAG); }
  else { g.falsch++; g.intervall = 0; g.faellig = Date.now(); }
  S.grammatik[key] = g; geuebt();
}
function gGewicht(key) {
  const g = S.grammatik[key];
  if (!g) return 1.5;                                   // noch nie geübt
  if (g.faellig <= Date.now()) return g.intervall === 0 ? 8 : 5; // zuletzt falsch / fällig
  return 0.3;                                           // sitzt gerade
}
const gFaellig = (praefix) => Object.entries(S.grammatik).filter(([k, g]) => k.startsWith(praefix) && g.faellig <= Date.now()).length;

// ---------- Sprachausgabe (Vorlesen) ----------
const TTS = "speechSynthesis" in window;
let stimmen = [];
function stimmenLaden() { if (TTS) stimmen = speechSynthesis.getVoices().filter((v) => /^it/i.test(v.lang)); }
if (TTS) { stimmenLaden(); speechSynthesis.onvoiceschanged = stimmenLaden; }
function sprich(text, langsam = false) {
  if (!TTS) { toast("Dieses Gerät kann nicht vorlesen."); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "it-IT";
  const gewaehlt = stimmen.find((v) => v.name === S.einstellungen.stimme) || stimmen.find((v) => v.lang === "it-IT") || stimmen[0];
  if (gewaehlt) u.voice = gewaehlt;
  u.rate = langsam ? 0.6 : S.einstellungen.tempo;
  speechSynthesis.speak(u);
}

// ---------- Spracherkennung ----------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let erkennung = null;
function zuhoeren({ start, ergebnis, fehler, ende }) {
  if (!SR) { fehler("Dieses Gerät oder dieser Browser unterstützt keine Spracherkennung. Bitte Chrome verwenden."); return; }
  if (erkennung) { try { erkennung.abort(); } catch (e) {} }
  const r = new SR();
  erkennung = r;
  r.lang = "it-IT"; r.interimResults = false; r.maxAlternatives = 5; r.continuous = false;
  let bekommen = false;
  r.onstart = start;
  r.onresult = (e) => {
    bekommen = true;
    const alt = []; for (let i = 0; i < e.results[0].length; i++) alt.push(e.results[0][i].transcript);
    ergebnis(alt);
  };
  r.onerror = (e) => {
    bekommen = true;
    const texte = {
      "not-allowed": "Das Mikrofon ist nicht erlaubt. Bitte in Chrome beim Schloss-Symbol bzw. in den App-Einstellungen das Mikrofon erlauben.",
      "service-not-allowed": "Die Spracherkennung ist auf diesem Gerät nicht freigegeben.",
      "network": "Keine Internetverbindung. Die Spracherkennung braucht auf Android meist Internet.",
      "no-speech": "Ich habe nichts gehört. Bitte noch einmal tippen und deutlich sprechen.",
      "audio-capture": "Kein Mikrofon gefunden.",
      "aborted": "Abgebrochen.",
      "language-not-supported": "Italienisch wird von der Spracherkennung hier nicht unterstützt."
    };
    fehler(texte[e.error] || "Fehler bei der Spracherkennung: " + e.error);
  };
  r.onend = () => { erkennung = null; if (!bekommen) fehler("Ich habe nichts verstanden. Bitte noch einmal versuchen."); ende && ende(); };
  try { r.start(); } catch (e) { fehler("Spracherkennung konnte nicht starten."); }
}

// ---------- Vergleich: Gesagtes ↔ Zielsatz ----------
const ZAHLWOERTER = { 0: "zero", 1: "uno", 2: "due", 3: "tre", 4: "quattro", 5: "cinque", 6: "sei", 7: "sette", 8: "otto", 9: "nove", 10: "dieci",
  11: "undici", 12: "dodici", 13: "tredici", 14: "quattordici", 15: "quindici", 16: "sedici", 17: "diciassette", 18: "diciotto", 19: "diciannove",
  20: "venti", 21: "ventuno", 30: "trenta", 40: "quaranta", 50: "cinquanta", 60: "sessanta", 70: "settanta", 80: "ottanta", 90: "novanta", 100: "cento", 1000: "mille" };
function normWort(w) {
  let s = w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
  if (/^\d+$/.test(s) && ZAHLWOERTER[+s]) s = ZAHLWOERTER[+s];
  return s;
}
// Zerlegt einen Satz in Wörter; "l'acqua" → "l'" + "acqua"
function woerterVon(text) {
  const teile = [];
  text.replace(/[’`´]/g, "'").split(/\s+/).forEach((w) => {
    const m = w.match(/^([^']+')(.+)$/);
    (m ? [m[1], m[2]] : [w]).forEach((x) => { const n = normWort(x); if (n) teile.push({ zeigen: x.replace(/^[¿¡«"(]+|[.,!?;:»")]+$/g, ""), n }); });
  });
  return teile;
}
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
const aehnlich = (a, b) => (a === b ? 1 : 1 - lev(a, b) / Math.max(a.length, b.length, 1));
// Ordnet die gesagten Wörter den Zielwörtern zu (wie ein Rechtschreibvergleich, nur wortweise)
function vergleiche(ziel, gesagt) {
  const Z = woerterVon(ziel), G = woerterVon(gesagt);
  const m = Z.length, n = G.length;
  const D = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) D[i][0] = i;
  for (let j = 0; j <= n; j++) D[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (1 - aehnlich(Z[i - 1].n, G[j - 1].n)) * 1.2);
  const ergebnis = []; const extra = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && Math.abs(D[i][j] - (D[i - 1][j - 1] + (1 - aehnlich(Z[i - 1].n, G[j - 1].n)) * 1.2)) < 1e-9) {
      const s = aehnlich(Z[i - 1].n, G[j - 1].n);
      ergebnis.unshift({ wort: Z[i - 1].zeigen, art: s === 1 ? "ok" : s >= 0.67 ? "fast" : "falsch", gehoert: G[j - 1].zeigen });
      i--; j--;
    } else if (i > 0 && (j === 0 || Math.abs(D[i][j] - (D[i - 1][j] + 1)) < 1e-9)) {
      ergebnis.unshift({ wort: Z[i - 1].zeigen, art: "fehlt" }); i--;
    } else { extra.unshift(G[j - 1].zeigen); j--; }
  }
  const a = Z.map((x) => x.n).join(" "), b = G.map((x) => x.n).join(" ");
  // Note aus zwei Teilen: Buchstaben-Ähnlichkeit und Anteil richtiger Wörter (ein "fast" zählt halb)
  const wortQuote = ergebnis.reduce((s, w) => s + (w.art === "ok" ? 1 : w.art === "fast" ? 0.5 : 0), 0) / Math.max(1, ergebnis.length + extra.length);
  const prozent = Math.round(((Math.max(0, aehnlich(a, b)) + wortQuote) / 2) * 100);
  return { woerter: ergebnis, extra, prozent };
}

// ---------- Eingetippte Antwort prüfen (Deutsch → Italienisch) ----------
const ohneAkzente = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const saeubern = (s) => s.toLowerCase().replace(/[’`´]/g, "'").replace(/[.,!?;:¿¡"«»()]/g, " ").replace(/'\s*/g, "'").replace(/\s+/g, " ").trim();
const ARTIKEL_RE = /^(il |lo |la |i |gli |le |l')/;
function pruefeEingabe(eingabe, karte) {
  const e = saeubern(eingabe);
  if (!e) return { stufe: "falsch", text: "Keine Antwort eingegeben." };
  // Alle italienischen Einträge mit derselben deutschen Bedeutung zählen als richtig
  const ziele = [...new Set(ALLE_KARTEN.filter((k) => k.de === karte.de).map((k) => k.it).concat(karte.it))];
  let best = { stufe: "falsch", wert: 0 };
  ziele.forEach((z) => {
    const zs = saeubern(z);
    let r;
    if (e === zs) r = { stufe: "richtig", wert: 4 };
    else if (ohneAkzente(e) === ohneAkzente(zs)) r = { stufe: "akzent", wert: 3 };
    else if (ARTIKEL_RE.test(zs) && ohneAkzente(e) === ohneAkzente(zs.replace(ARTIKEL_RE, ""))) r = { stufe: "artikel", wert: 2 };
    else {
      const s = aehnlich(ohneAkzente(e), ohneAkzente(zs));
      r = s >= 0.8 ? { stufe: "fast", wert: 1 + s } : { stufe: "falsch", wert: s };
    }
    if (r.wert > best.wert) best = { ...r, ziel: z };
  });
  const texte = {
    richtig: "✅ Richtig!",
    akzent: "✅ Richtig – achte noch auf die Akzente.",
    artikel: "🟠 Fast – der Artikel fehlt.",
    fast: "🟠 Fast richtig – kleiner Tippfehler.",
    falsch: "❌ Leider falsch."
  };
  return { stufe: best.stufe, text: texte[best.stufe], ziel: best.ziel || karte.it };
}
const VORSCHLAG = { richtig: 2, akzent: 2, artikel: 1, fast: 1, falsch: 0 };

// ---------- Kleine Bausteine für Bildschirme ----------
function setzeKopf(titel, zurueck) {
  document.getElementById("titel").textContent = titel;
  const b = document.getElementById("zurueck");
  b.hidden = !zurueck;
  b.onclick = () => (history.length > 1 ? history.back() : geheZu(zurueck));
}
function geheZu(ziel) { location.hash = ziel; }
function zeige(html) { $app.innerHTML = html; window.scrollTo(0, 0); }
const lautBtn = (text, klein) => `<button class="lautsprecher${klein ? " klein" : ""}" data-sprich="${esc(text)}" aria-label="Vorlesen">🔊</button>`;
const langsamBtn = (text) => `<button class="lautsprecher" data-sprich="${esc(text)}" data-langsam="1" aria-label="Langsam vorlesen">🐢</button>`;
$app.addEventListener("click", (e) => {
  const b = e.target.closest("[data-sprich]");
  if (b) { e.stopPropagation(); sprich(b.dataset.sprich, b.dataset.langsam === "1"); }
  const g = e.target.closest("[data-gehe]");
  if (g) geheZu(g.dataset.gehe);
});
const fortschrittsLeiste = (nr, gesamt) => `<div class="fortschritt"><span>${nr} / ${gesamt}</span><div class="balken"><i style="width:${(100 * (nr - 1)) / gesamt}%"></i></div></div>`;
function umschalter(id, wert, optionen) {
  return `<div class="umschalter" id="${id}">${optionen.map(([w, t]) => `<button data-w="${w}" class="${w === wert ? "an" : ""}">${t}</button>`).join("")}</div>`;
}

// ---------- Startseite ----------
function startseite() {
  setzeKopf("Italienisch lernen", null);
  const verstanden = ALLE_KARTEN.filter((k) => istGelernt(k.id, "it-de")).length;
  const sagen = ALLE_KARTEN.filter((k) => istGelernt(k.id, "de-it")).length;
  const gram = gFaellig("verb:") + gFaellig("art:") + gFaellig("satz:");
  const gespr = gFaellig("dialog:");
  zeige(`
    <div class="statistik">
      <div><b>${anzahlFaellig()}</b><span>Karten heute wiederholen</span></div>
      <div><b>${serie()}</b><span>Tage am Stück geübt</span></div>
      <div><b>${verstanden}</b><span>verstehe ich (von ${ALLE_KARTEN.length})</span></div>
      <div><b>${sagen}</b><span>kann ich selbst sagen</span></div>
    </div>
    <div class="kacheln">
      <button class="kachel breit" data-gehe="karten"><span class="sym">🗂️</span><span><b>Karteikarten</b><br><small>Vokabeln und Phrasen lernen und wiederholen</small></span></button>
      <button class="kachel" data-gehe="grammatik"><span class="sym">📘</span><b>Grammatik</b><small>${gram ? `<b>${gram} zum Wiederholen</b>` : "Verben, Artikel, Satzbau"}</small></button>
      <button class="kachel" data-gehe="hoeren"><span class="sym">👂</span><b>Hören</b><small>Hören und verstehen</small></button>
      <button class="kachel" data-gehe="sprechen"><span class="sym">🎤</span><b>Sprechen</b><small>Nachsprechen mit Korrektur</small></button>
      <button class="kachel breit" data-gehe="gespraech"><span class="sym">🗣️</span><span><b>Frage &amp; Antwort</b><br><small>${gespr ? `<b>${gespr} Fragen zum Wiederholen</b>` : "Auf italienische Fragen italienisch antworten"}</small></span></button>
      <button class="kachel" data-gehe="phrasen"><span class="sym">💬</span><b>Phrasen</b><small>Alltagssätze anhören</small></button>
      <button class="kachel" data-gehe="nachschlagen"><span class="sym">🔎</span><b>Wörterbuch</b><small>Alle Wörter suchen</small></button>
      <button class="kachel" data-gehe="einstellungen"><span class="sym">⚙️</span><b>Einstellungen</b><small>Stimme, Tempo, Sicherung</small></button>
    </div>
    ${TTS ? "" : `<div class="meldung info">Dieses Gerät kann nicht vorlesen. Bitte Chrome verwenden.</div>`}
  `);
}

// ---------- Themen auswählen (für Karten, Hören, Sprechen) ----------
function themenAuswahl(gruppen, gewaehlt) {
  return `<div class="liste">${gruppen.map((g) => {
    const ids = g.eintraege.map((e) => e.id);
    const vers = ids.filter((id) => istGelernt(id, "it-de")).length, sag = ids.filter((id) => istGelernt(id, "de-it")).length;
    const f = ids.reduce((s, id) => s + RICHTUNGEN.filter((r) => istFaellig(id, r)).length, 0);
    const an = gewaehlt.includes(g.id);
    return `<button class="zeile${an ? " aktiv" : ""}" data-thema="${g.id}">
      <span class="sym">${g.icon}</span>
      <span class="mitte">${esc(g.name)}<small>${ids.length} Einträge · verstehe ${vers} · sage ${sag}${f ? ` · <b>${f} fällig</b>` : ""}</small>
      <span class="balken"><i style="width:${(50 * (vers + sag)) / ids.length}%"></i></span></span>
      <span class="haken">${an ? "✓" : ""}</span></button>`;
  }).join("")}</div>`;
}
function themenKlickbar(neuZeichnen) {
  $app.querySelectorAll("[data-thema]").forEach((b) => (b.onclick = () => {
    const id = b.dataset.thema, liste = S.einstellungen.themen;
    S.einstellungen.themen = liste.includes(id) ? liste.filter((x) => x !== id) : liste.concat(id);
    speichern(); neuZeichnen();
  }));
}

// ---------- Karteikarten ----------
let sitzung = null;
function kartenMenue() {
  setzeKopf("Karteikarten", "start");
  const gew = S.einstellungen.themen;
  const karten = kartenDerThemen(gew);
  const modus = S.einstellungen.richtung;
  const plan = rundePlanen(karten, modus);
  const f = plan.faellige.length;
  const neu = Math.min(plan.neue.length, neueHeuteUebrig());
  zeige(`
    <p class="leise">Wähle Themen aus (antippen). Fällige Wiederholungen und neue Karten werden gemischt.</p>
    ${umschalter("richtung", modus, [["it-de", "IT → DE"], ["de-it", "DE → IT"], ["beide", "Beide"]])}
    <button class="btn voll" id="los" ${f + neu ? "" : "disabled"}>Los geht's: ${f} Wiederholungen, ${neu} neue</button>
    ${f + neu ? "" : `<p class="leise">Für die gewählten Themen ist heute nichts mehr zu tun. Wähle weitere Themen oder erhöhe in den Einstellungen die Zahl der neuen Karten pro Tag.</p>
      <button class="btn zweit voll" id="extra">Trotzdem üben (10 zufällige Karten, ohne Wertung)</button>`}
    <details class="hilfe" style="margin-top:12px"><summary>So funktioniert das Wiederholen</summary>
      <p>Jedes Wort hat <b>zwei Karten</b>: „verstehen“ (Italienisch → Deutsch) und „selbst sagen“ (Deutsch → Italienisch). Beide werden getrennt geplant.</p>
      <p>Nach jeder Karte sagst du, wie gut es ging. Daraus berechnet die App, <b>wann die Karte wiederkommt</b>: kurz bevor du sie vergessen würdest. Was dir leicht fällt, kommt in immer größeren Abständen (Tage, Wochen, Monate), was schwer fällt, öfter.</p>
      <p>Bei „Beide“ kommt ein neues Wort zuerst als Italienisch → Deutsch und erst später auch andersherum.</p>
      <p>Bei Deutsch → Italienisch tippst du die Antwort ein (abschaltbar in den Einstellungen) – das prägt sich besser ein als nur Nachdenken.</p>
      <p>Auch Fehler beim Hören und Sprechen fließen ein: Das Wort kommt dann früher wieder.</p></details>
    <h2>Wortschatz</h2>${themenAuswahl(THEMEN, gew)}
    <h2>Phrasen</h2>${themenAuswahl(PHRASEN_GRUPPEN, gew)}
  `);
  themenKlickbar(kartenMenue);
  $app.querySelectorAll("#richtung button").forEach((b) => (b.onclick = () => { S.einstellungen.richtung = b.dataset.w; speichern(); kartenMenue(); }));
  document.getElementById("los").onclick = () => {
    const neue = plan.neue.slice(0, neu), fa = plan.faellige, liste = [];
    // jede dritte Karte eine neue, damit Neues und Wiederholung gemischt sind
    let d = 0, n = 0;
    while (d < fa.length || n < neue.length) {
      if (n < neue.length && (d >= fa.length || liste.length % 3 === 2)) liste.push(neue[n++]); else liste.push(fa[d++]);
    }
    sitzung = { liste, pos: 0, neuKeys: new Set(neue.map((x) => schluessel(x.k.id, x.r))), aufgedeckt: false, eingabe: null, gesamt: liste.length, fertig: 0 };
    geheZu("karte");
  };
  const extra = document.getElementById("extra");
  if (extra) extra.onclick = () => {
    const richt = richtungenFuer(modus);
    const l = mischen(karten.length ? karten : ALLE_WOERTER).slice(0, 10).map((k) => ({ k, r: richt[Math.floor(Math.random() * richt.length)] }));
    sitzung = { liste: l, pos: 0, neuKeys: new Set(), aufgedeckt: false, eingabe: null, gesamt: l.length, fertig: 0, frei: true };
    geheZu("karte");
  };
}
function karteZeigen() {
  if (!sitzung) return geheZu("karten");
  setzeKopf("Karteikarten", "karten");
  if (sitzung.pos >= sitzung.liste.length) {
    zeige(`<div class="karte"><div class="wort">🎉 Geschafft!</div><p>Du hast ${sitzung.gesamt} Karten geübt.</p></div>
      <div class="reihe"><button class="btn" data-gehe="karten">Zurück zu den Themen</button><button class="btn zweit" data-gehe="start">Startseite</button></div>`);
    sitzung = null; return;
  }
  const { k, r } = sitzung.liste[sitzung.pos];
  const itDe = r === "it-de";
  const vorne = itDe ? k.it : k.de, hinten = itDe ? k.de : k.it;
  const key = schluessel(k.id, r);
  const neu = sitzung.neuKeys.has(key) && istNeu(k.id, r);
  const tippen = !itDe && S.einstellungen.eintippen && !sitzung.frei;
  const ein = sitzung.eingabe;
  const vorschlag = ein ? VORSCHLAG[ein.stufe] : -1;
  const knopf = (n, cls, name) => `<button class="${cls}${n === vorschlag ? " vorschlag" : ""}" data-n="${n}">${name}<small>${tageText(naechsterAbstand(zustand(k.id, r), n))}</small></button>`;
  zeige(`
    ${fortschrittsLeiste(Math.min(sitzung.fertig + 1, sitzung.gesamt), sitzung.gesamt)}
    <div class="karte" id="karte">
      <span class="leise">${neu ? "✨ Neu · " : ""}${itDe ? "Was heißt das?" : "Wie sagt man auf Italienisch?"}</span>
      <div class="wort">${esc(vorne)}</div>
      ${itDe ? lautBtn(k.it) : ""}
      ${sitzung.aufgedeckt
        ? `<div class="trenner"></div>
           ${ein && ein.eingabe ? `<div class="leise">Deine Antwort: <b>${esc(ein.eingabe)}</b></div>` : ""}
           ${ein ? `<div class="meldung ${ein.stufe === "falsch" ? "schlecht" : ein.stufe === "richtig" || ein.stufe === "akzent" ? "gut" : "info"}" style="margin:4px 0">${esc(ein.text)}</div>` : ""}
           <div class="loesung">${esc(hinten)}</div>${itDe ? "" : lautBtn(k.it)}`
        : tippen
          ? `<input type="text" id="antwort" lang="it" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Italienisch eintippen …" style="text-align:center;margin:6px 0 0">`
          : `<p class="leise">Überlege die Antwort, dann tippe auf „Aufdecken“.</p>`}
    </div>
    ${sitzung.aufgedeckt
      ? `<div class="bewertung">
          ${knopf(0, "b-nochmal", "Nochmal")}${knopf(1, "b-schwer", "Schwer")}${knopf(2, "b-gut", "Gut")}${knopf(3, "b-leicht", "Leicht")}
        </div>
        ${ein ? `<p class="leise" style="text-align:center">Der umrandete Knopf ist der Vorschlag der App – du kannst auch anders bewerten.</p>` : ""}`
      : tippen
        ? `<div class="reihe"><button class="btn" id="pruefen">Prüfen</button><button class="btn zweit" id="weissnicht">Weiß ich nicht</button></div>`
        : `<button class="btn voll" id="aufdecken" style="margin-top:14px">Aufdecken</button>`}
  `);
  if (!sitzung.aufgedeckt && itDe && S.einstellungen.automatischVorlesen) sprich(k.it);
  if (sitzung.aufgedeckt && !itDe && S.einstellungen.automatischVorlesen) sprich(k.it);
  const auf = document.getElementById("aufdecken");
  if (auf) auf.onclick = () => { sitzung.aufgedeckt = true; karteZeigen(); };
  const feld = document.getElementById("antwort");
  if (feld) {
    const pruefen = () => { sitzung.eingabe = { ...pruefeEingabe(feld.value, k), eingabe: feld.value.trim() }; sitzung.aufgedeckt = true; karteZeigen(); };
    feld.focus();
    feld.onkeydown = (e) => { if (e.key === "Enter") pruefen(); };
    document.getElementById("pruefen").onclick = pruefen;
    document.getElementById("weissnicht").onclick = () => { sitzung.eingabe = { stufe: "falsch", text: "Kein Problem – so heißt es:", eingabe: "" }; sitzung.aufgedeckt = true; karteZeigen(); };
  }
  $app.querySelectorAll("[data-n]").forEach((b) => (b.onclick = () => {
    const n = +b.dataset.n;
    if (!sitzung.frei) {
      if (sitzung.neuKeys.has(key) && istNeu(k.id, r)) { neueHeuteUebrig(); S.neueHeute.anzahl++; }
      bewerte(k.id, r, n);
    } else geuebt();
    if (n === 0) sitzung.liste.push({ k, r }); else sitzung.fertig++;
    sitzung.pos++; sitzung.aufgedeckt = false; sitzung.eingabe = null; karteZeigen();
  }));
}

// ---------- Grammatik ----------
function grammatikMenue() {
  setzeKopf("Grammatik", "start");
  const fv = gFaellig("verb:"), fa = gFaellig("art:"), fs = gFaellig("satz:");
  const hinweis = (n) => (n ? ` · <b>${n} zum Wiederholen</b>` : "");
  zeige(`
    <div class="liste">
      <button class="zeile" data-gehe="verben"><span class="sym">🔤</span><span class="mitte">Verben konjugieren<small>essere, avere, -are/-ere/-ire, unregelmäßige${hinweis(fv)}</small></span><span class="pfeil">›</span></button>
      <button class="zeile" data-gehe="tabellen"><span class="sym">📋</span><span class="mitte">Verbtabellen nachschlagen<small>Alle Formen zum Anhören</small></span><span class="pfeil">›</span></button>
      <button class="zeile" data-gehe="artikel"><span class="sym">🏷️</span><span class="mitte">Artikel üben<small>il, lo, la, l', i, gli, le${hinweis(fa)}</small></span><span class="pfeil">›</span></button>
      <button class="zeile" data-gehe="satzbau"><span class="sym">🧩</span><span class="mitte">Satzbau<small>Wörter in die richtige Reihenfolge bringen${hinweis(fs)}</small></span><span class="pfeil">›</span></button>
    </div>
    <p class="leise">Die App merkt sich deine Fehler: Was du falsch hattest, kommt bald wieder, was sitzt, kommt seltener.</p>
    <h2>Kurz erklärt</h2>
    <details class="hilfe"><summary>Verben im Präsens</summary>${GRAMMATIK_HILFE.verben}</details>
    <details class="hilfe" style="margin-top:8px"><summary>Artikel</summary>${GRAMMATIK_HILFE.artikel}</details>
    <details class="hilfe" style="margin-top:8px"><summary>Satzbau und Verneinung</summary>${GRAMMATIK_HILFE.satz}</details>
  `);
}
function konjugiere(v) {
  if (VERBEN_UNREGELMAESSIG[v.inf]) return VERBEN_UNREGELMAESSIG[v.inf].formen;
  const stamm = v.inf.slice(0, -3), end = v.inf.slice(-3);
  if (end === "are") {
    const s = stamm, t = ["o", "i", "a", "iamo", "ate", "ano"];
    const harte = /[cg]$/.test(s) ? "h" : "";       // cercare → cerchi, pagare → paghi
    const iEnde = /i$/.test(s);                        // mangiare → mangi, mangiamo
    return t.map((e, i) => (i === 1 || i === 3) ? (iEnde ? s.slice(0, -1) + "i" + e.slice(1) : s + harte + e) : s + e);
  }
  if (end === "ere") return ["o", "i", "e", "iamo", "ete", "ono"].map((e) => stamm + e);
  if (v.isc) return ["isco", "isci", "isce", "iamo", "ite", "iscono"].map((e) => stamm + e);
  return ["o", "i", "e", "iamo", "ite", "ono"].map((e) => stamm + e);
}
const ALLE_VERBEN = Object.entries(VERBEN_UNREGELMAESSIG).map(([inf, v]) => ({ inf, de: v.de, unreg: true }))
  .concat(VERBEN_REGELMAESSIG.map((v) => ({ ...v, unreg: false })));
let quiz = null;
function verbenMenue() {
  setzeKopf("Verben konjugieren", "grammatik");
  const zaehle = (pool) => pool.reduce((s, v) => s + [0, 1, 2, 3, 4, 5].filter((p) => { const g = S.grammatik[`verb:${v.inf}:${p}`]; return g && g.faellig <= Date.now(); }).length, 0);
  const gruppen = {
    "essere-avere": ALLE_VERBEN.filter((v) => ["essere", "avere"].includes(v.inf)),
    regel: ALLE_VERBEN.filter((v) => !v.unreg),
    unreg: ALLE_VERBEN.filter((v) => v.unreg && !["essere", "avere"].includes(v.inf)),
    alle: ALLE_VERBEN
  };
  const z = (n) => (n ? ` · <b>${n} zum Wiederholen</b>` : "");
  zeige(`
    <p>Welche Verben möchtest du üben? Formen, die du falsch hattest, kommen bevorzugt dran.</p>
    <div class="liste">
      <button class="zeile" data-art="essere-avere"><span class="sym">⭐</span><span class="mitte">essere und avere<small>sein und haben – die wichtigsten${z(zaehle(gruppen["essere-avere"]))}</small></span><span class="pfeil">›</span></button>
      <button class="zeile" data-art="regel"><span class="sym">✅</span><span class="mitte">Regelmäßige Verben<small>-are, -ere, -ire${z(zaehle(gruppen.regel))}</small></span><span class="pfeil">›</span></button>
      <button class="zeile" data-art="unreg"><span class="sym">⚡</span><span class="mitte">Unregelmäßige Verben<small>andare, fare, volere, potere …${z(zaehle(gruppen.unreg))}</small></span><span class="pfeil">›</span></button>
      <button class="zeile" data-art="alle"><span class="sym">🎲</span><span class="mitte">Alles gemischt<small>alle Verben durcheinander${z(zaehle(gruppen.alle))}</small></span><span class="pfeil">›</span></button>
    </div>`);
  $app.querySelectorAll("[data-art]").forEach((b) => (b.onclick = () => {
    const pool = gruppen[b.dataset.art].flatMap((v) => [0, 1, 2, 3, 4, 5].map((p) => ({ v, p, key: `verb:${v.inf}:${p}` })));
    const aufgaben = gewichtetZiehen(pool, (x) => gGewicht(x.key), 10).map(({ v, p, key }) => {
      const formen = konjugiere(v), richtig = formen[p];
      const falsche = mischen([...new Set(formen.filter((f) => f !== richtig))]).slice(0, 3);
      return { frage: `<div class="leise">${esc(v.inf)} = ${esc(v.de)}</div><div class="gross">${PERSONEN[p]} ___</div><div class="leise">(${PERSONEN_DE[p]})</div>`,
        optionen: mischen([richtig, ...falsche]), richtig, sprechen: `${PERSONEN[p].split("/")[0]} ${richtig}`, erklaerung: `${PERSONEN[p]} ${richtig}`,
        beiAntwort: (ok) => gBewerte(key, ok) };
    });
    quizStarten({ aufgaben, pos: 0, punkte: 0, zurueck: "verben", titel: "Verben konjugieren" });
  }));
}
function verbTabellen() {
  setzeKopf("Verbtabellen", "grammatik");
  zeige(`<input type="search" id="vsuche" placeholder="Verb suchen …"><div class="liste" id="vliste"></div>`);
  const zeichnen = (q) => {
    document.getElementById("vliste").innerHTML = ALLE_VERBEN.filter((v) => !q || v.inf.includes(q) || v.de.toLowerCase().includes(q)).map((v) => {
      const f = konjugiere(v);
      return `<details class="hilfe"><summary>${esc(v.inf)} – ${esc(v.de)} ${v.unreg ? "⚡" : ""}</summary>
        <table class="tab">${f.map((x, i) => `<tr><td>${PERSONEN[i]}</td><td><b>${esc(x)}</b></td><td style="width:50px">${lautBtn(PERSONEN[i].split("/")[0] + " " + x, true)}</td></tr>`).join("")}</table></details>`;
    }).join("");
  };
  zeichnen("");
  document.getElementById("vsuche").oninput = (e) => zeichnen(e.target.value.trim().toLowerCase());
}
const ARTIKEL_NOMEN = ALLE_WOERTER.map((w) => {
  const m = w.it.match(/^(il|lo|la|i|gli|le) (.+)$/) || w.it.match(/^(l')(.+)$/);
  return m ? { artikel: m[1], nomen: m[2], de: w.de, ganz: w.it } : null;
}).filter(Boolean);
function artikelStart() {
  const aufgaben = gewichtetZiehen(ARTIKEL_NOMEN, (a) => gGewicht("art:" + a.ganz), 10).map((a) => ({
    frage: `<div class="leise">Welcher Artikel passt?</div><div class="gross">___ ${esc(a.nomen)}</div>`,
    optionen: ["il", "lo", "la", "l'", "i", "gli", "le"], richtig: a.artikel, sprechen: a.ganz,
    erklaerung: `${a.ganz} = ${a.de}`, zwei: true, beiAntwort: (ok) => gBewerte("art:" + a.ganz, ok)
  }));
  quizStarten({ aufgaben, pos: 0, punkte: 0, zurueck: "grammatik", titel: "Artikel üben", nochmal: "artikel" });
}

// Allgemeines Quiz (Verben, Artikel, Hören)
function quizStarten(q) {
  quiz = q;
  if (location.hash === "#quiz") quizZeigen();
  else if (location.hash === "#artikel") location.replace("#quiz"); // sonst startet "Zurück" sofort ein neues Quiz
  else geheZu("quiz");
}
function quizZeigen() {
  if (!quiz) return geheZu("start");
  setzeKopf(quiz.titel, quiz.zurueck);
  if (quiz.pos >= quiz.aufgaben.length) {
    const n = quiz.aufgaben.length, p = quiz.punkte;
    zeige(`<div class="karte"><div class="wort">${p === n ? "🏆" : p >= n * 0.7 ? "👍" : "💪"} ${p} von ${n}</div>
      <p>${p === n ? "Perfetto! Alles richtig." : p >= n * 0.7 ? "Bravo! Sehr gut." : "Weiter üben – das wird!"}</p>
      ${p < n ? `<p class="leise">Die Fehler hat sich die App gemerkt – sie kommen bald wieder.</p>` : ""}</div>
      <div class="reihe"><button class="btn" id="nochmal">Nochmal</button><button class="btn zweit" data-gehe="${quiz.zurueck}">Zurück</button></div>`);
    document.getElementById("nochmal").onclick = () => { const z = quiz.nochmal || quiz.zurueck; quiz = null; z === "artikel" ? artikelStart() : z === "hoeren-neu" ? hoerenStart() : geheZu(z); };
    return;
  }
  const a = quiz.aufgaben[quiz.pos];
  zeige(`${fortschrittsLeiste(quiz.pos + 1, quiz.aufgaben.length)}
    <div class="frage">${a.frage}</div>
    <div class="optionen${a.zwei ? " zwei" : ""}">${a.optionen.map((o) => `<button data-o="${esc(o)}">${esc(o)}</button>`).join("")}</div>
    <div id="rueck"></div>`);
  if (a.beimStart) a.beimStart();
  let beantwortet = false;
  $app.querySelectorAll("[data-o]").forEach((b) => (b.onclick = () => {
    if (beantwortet) return; beantwortet = true;
    const ok = b.dataset.o === a.richtig;
    if (ok) quiz.punkte++;
    if (a.beiAntwort) a.beiAntwort(ok); else geuebt();
    $app.querySelectorAll("[data-o]").forEach((x) => { if (x.dataset.o === a.richtig) x.classList.add("richtig"); });
    if (!ok) b.classList.add("falsch");
    if (a.sprechen) sprich(a.sprechen);
    document.getElementById("rueck").innerHTML = `<div class="meldung ${ok ? "gut" : "schlecht"}">${ok ? "✅ Richtig!" : "❌ Leider falsch."} <b>${esc(a.erklaerung)}</b></div>
      <button class="btn voll" id="weiter">Weiter</button>`;
    document.getElementById("weiter").onclick = () => { quiz.pos++; quizZeigen(); };
  }));
}

// Satzbau
let satz = null;
function satzbauStart() {
  const s = gewichtetZiehen(SAETZE_LISTE, (x) => gGewicht("satz:" + x.it), 1)[0];
  const woerter = s.it.replace(/[.?!]$/, "").split(" ");
  let gemischt = mischen(woerter.map((w, i) => ({ w, i })));
  if (gemischt.every((x, i) => x.i === i)) gemischt = gemischt.reverse();
  satz = { s, woerter, gemischt, gewaehlt: [], geprueft: false };
  satzbauZeigen();
}
function satzbauZeigen() {
  setzeKopf("Satzbau", "grammatik");
  if (!satz) return satzbauStart();
  const { s, gemischt, gewaehlt, geprueft } = satz;
  const benutzt = new Set(gewaehlt);
  const fertig = gewaehlt.length === gemischt.length;
  const richtig = fertig && gewaehlt.map((k) => gemischt[k].w).join(" ") === satz.woerter.join(" ");
  zeige(`
    <div class="frage"><div class="leise">Bilde den Satz:</div><div style="font-size:22px;font-weight:600">${esc(s.de)}</div></div>
    <div class="antwortfeld">${gewaehlt.map((k, i) => `<button class="baustein" data-weg="${i}">${esc(gemischt[k].w)}</button>`).join("") || `<span class="leise">Tippe die Wörter unten in der richtigen Reihenfolge an.</span>`}</div>
    <div class="bausteine">${gemischt.map((x, k) => `<button class="baustein${benutzt.has(k) ? " weg" : ""}" data-k="${k}">${esc(x.w)}</button>`).join("")}</div>
    <div id="rueck">${geprueft ? `<div class="meldung ${richtig ? "gut" : "schlecht"}">${richtig ? "✅ Richtig!" : "❌ Nicht ganz. Richtig ist:"}<br><b>${esc(s.it)}</b></div>` : ""}</div>
    <div class="reihe">
      ${geprueft ? `<button class="btn" id="neu">Nächster Satz</button>${lautBtn(s.it)}` : `<button class="btn" id="pruefen" ${fertig ? "" : "disabled"}>Prüfen</button><button class="btn zweit" id="leeren">Zurücksetzen</button>`}
    </div>`);
  $app.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => { if (satz.geprueft) return; satz.gewaehlt.push(+b.dataset.k); satzbauZeigen(); }));
  $app.querySelectorAll("[data-weg]").forEach((b) => (b.onclick = () => { if (satz.geprueft) return; satz.gewaehlt.splice(+b.dataset.weg, 1); satzbauZeigen(); }));
  const p = document.getElementById("pruefen"); if (p) p.onclick = () => { satz.geprueft = true; gBewerte("satz:" + s.it, richtig); satzbauZeigen(); sprich(s.it); };
  const l = document.getElementById("leeren"); if (l) l.onclick = () => { satz.gewaehlt = []; satzbauZeigen(); };
  const n = document.getElementById("neu"); if (n) n.onclick = () => satzbauStart();
}

// ---------- Hören ----------
function hoerenMenue() {
  setzeKopf("Hören", "start");
  zeige(`
    <p>Du hörst ein italienisches Wort oder einen Satz und wählst die richtige Übersetzung. Tipp: 🐢 spielt es langsam ab.</p>
    <p class="leise">Wörter, die gerade fällig sind oder dir schwerfallen, kommen bevorzugt dran. Deine Antworten zählen für den Lernstand „verstehen“.</p>
    <button class="btn voll" id="los" ${kartenDerThemen(S.einstellungen.themen).length >= 4 ? "" : "disabled"}>10 Aufgaben starten</button>
    <h2>Themen</h2>
    <p class="leise">Dieselbe Auswahl wie bei den Karteikarten.</p>
    ${themenAuswahl(THEMEN, S.einstellungen.themen)}
    <h2>Phrasen</h2>${themenAuswahl(PHRASEN_GRUPPEN, S.einstellungen.themen)}`);
  themenKlickbar(hoerenMenue);
  document.getElementById("los").onclick = hoerenStart;
}
function hoerenStart() {
  const pool = kartenDerThemen(S.einstellungen.themen);
  if (pool.length < 4) return geheZu("hoeren");
  const aufgaben = gewichtetZiehen(pool, (k) => gewicht(k.id, "it-de"), 10).map((k) => {
    const falsche = mischen([...new Set(pool.filter((x) => x.de !== k.de).map((x) => x.de))]).slice(0, 3);
    return {
      frage: `<div class="leise">Was bedeutet das?</div>
        <div class="mitte-zentriert" style="margin:8px 0;flex-direction:row;justify-content:center">${lautBtn(k.it)}${langsamBtn(k.it)}</div>`,
      optionen: mischen([k.de, ...falsche]), richtig: k.de, erklaerung: `${k.it} = ${k.de}`,
      beimStart: () => setTimeout(() => sprich(k.it), 250),
      beiAntwort: (ok) => { rueckmeldung(k.id, "it-de", ok); geuebt(); }
    };
  });
  quizStarten({ aufgaben, pos: 0, punkte: 0, zurueck: "hoeren", titel: "Hören", nochmal: "hoeren-neu" });
}

// ---------- Sprechen ----------
let sprechen = null;
function sprechGewicht(k) {
  const a = S.aussprache[k.id];
  return gewicht(k.id, "de-it") + (a && a.letzter < 70 ? 3 : 0) + (a ? 0 : 0.5);
}
function sprechenStarten(eintraege) {
  sprechen = { liste: gewichtetZiehen(eintraege, sprechGewicht, eintraege.length), pos: 0, ergebnis: null, status: "", gezeigt: false };
  geheZu("sprechen-ueben");
}
function sprechenMenue() {
  setzeKopf("Sprechen", "start");
  zeige(`
    <div class="meldung info">ℹ️ Gut zu wissen: Die Spracherkennung schreibt auf, was sie verstanden hat, und vergleicht es mit dem Zielsatz. Das ist <b>keine echte Bewertung deiner Aussprache</b>, aber ein guter Hinweis: Wenn das Handy dich versteht, verstehen dich meist auch Menschen. Auf Android braucht die Erkennung meist <b>Internet</b>.</div>
    ${SR ? "" : `<div class="meldung schlecht">Dieser Browser hat keine Spracherkennung. Bitte die App in Chrome öffnen.</div>`}
    <h2>Wie möchtest du üben?</h2>
    ${umschalter("smodus", S.einstellungen.sprechenModus, [["zeigen", "Lesen + hören"], ["hoeren", "Nur hören"], ["gedaechtnis", "Gedächtnis"]])}
    <p class="leise">${{
      zeigen: "Du siehst und hörst den italienischen Satz und sprichst ihn nach – gut für die Aussprache.",
      hoeren: "Du siehst nur den deutschen Satz und hörst den italienischen vorgelesen. Den italienischen Text zeigt die App erst, wenn du auf „Text zeigen“ tippst oder gesprochen hast.",
      gedaechtnis: "Du siehst nur den deutschen Satz und sagst ihn ohne Hilfe auf Italienisch. Das Ergebnis zählt für den Lernstand „selbst sagen“."
    }[S.einstellungen.sprechenModus]} Was dir schwerfällt, kommt bevorzugt dran.</p>
    <h2>Was möchtest du sprechen?</h2>
    <div class="liste">
      ${PHRASEN_GRUPPEN.concat(THEMEN).map((g) => `<button class="zeile" data-gruppe="${g.id}"><span class="sym">${g.icon}</span><span class="mitte">${esc(g.name)}<small>${g.eintraege.length} ${g.id.startsWith("p_") ? "Sätze" : "Wörter"}</small></span><span class="pfeil">›</span></button>`).join("")}
    </div>`);
  $app.querySelectorAll("#smodus button").forEach((b) => (b.onclick = () => { S.einstellungen.sprechenModus = b.dataset.w; speichern(); sprechenMenue(); }));
  $app.querySelectorAll("[data-gruppe]").forEach((b) => (b.onclick = () => sprechenStarten(GRUPPE_NACH_ID[b.dataset.gruppe].eintraege)));
}
function sprechenZeigen() {
  if (!sprechen) return geheZu("sprechen");
  setzeKopf("Sprechen", "sprechen");
  const k = sprechen.liste[sprechen.pos];
  const e = sprechen.ergebnis;
  const modus = S.einstellungen.sprechenModus;
  const verdeckt = modus === "gedaechtnis";
  const zeigeItalienisch = modus === "zeigen" || sprechen.gezeigt || !!e;
  const zeigeLautsprecher = !verdeckt || zeigeItalienisch;
  let ergebnisHtml = "";
  if (e) {
    const urteil = e.prozent >= 90 ? "🌟 Super!" : e.prozent >= 70 ? "👍 Gut, fast richtig!" : e.prozent >= 40 ? "🙂 Teilweise richtig" : "🔁 Nochmal versuchen";
    ergebnisHtml = `<div class="frage">
      <div class="punkte" style="color:${e.prozent >= 70 ? "var(--gruen)" : e.prozent >= 40 ? "var(--orange)" : "var(--rot)"}">${e.prozent} %</div>
      <div><b>${urteil}</b></div>
      <div class="woerter">${e.woerter.map((w) => `<span class="w-${w.art}">${esc(w.wort)}${(w.art === "fast" || w.art === "falsch") ? `<small>gehört: ${esc(w.gehoert)}</small>` : ""}</span>`).join("")}</div>
      ${e.extra.length ? `<p class="leise">Zusätzlich gehört: ${esc(e.extra.join(" "))}</p>` : ""}
      <p class="leise">Verstanden wurde: „${esc(e.text)}“</p>
      <div class="legende"><span class="l-ok">richtig</span><span class="l-fast">fast</span><span class="l-falsch">falsch</span><span class="l-fehlt">fehlt</span></div>
    </div>`;
  }
  zeige(`
    ${fortschrittsLeiste(sprechen.pos + 1, sprechen.liste.length)}
    <div class="karte" style="min-height:auto">
      <div class="leise">Sag auf Italienisch:</div>
      <div style="font-size:20px">${esc(k.de)}</div>
      <div class="trenner"></div>
      ${zeigeItalienisch ? `<div class="wort" style="font-size:28px">${esc(k.it)}</div>` : ""}
      ${zeigeLautsprecher ? `<div class="reihe" style="justify-content:center;margin:4px 0">${lautBtn(k.it)}${langsamBtn(k.it)}</div>` : ""}
      ${zeigeItalienisch ? "" : `<button class="btn zweit" id="zeigen">${verdeckt ? "Lösung zeigen" : "Text zeigen"}</button>`}
    </div>
    <div class="mitte-zentriert">
      <button class="mikro" id="mikro" aria-label="Sprechen">🎤</button>
      <div id="status" class="leise">${esc(sprechen.status || (verdeckt && !zeigeItalienisch ? "Tippe aufs Mikrofon und sag den Satz auf Italienisch." : "Erst anhören, dann aufs Mikrofon tippen und nachsprechen."))}</div>
    </div>
    ${ergebnisHtml}
    <div class="reihe">
      <button class="btn zweit" id="zurueckK" ${sprechen.pos ? "" : "disabled"}>‹ Vorheriger</button>
      <button class="btn" id="weiterK">Nächster ›</button>
    </div>`);
  const zeigen = document.getElementById("zeigen");
  if (zeigen) zeigen.onclick = () => {
    sprechen.gezeigt = true;
    if (verdeckt && !sprechen.gewertet) { sprechen.gewertet = true; rueckmeldung(k.id, "de-it", false); } // nachgeschaut = nicht gewusst
    sprechenZeigen(); if (verdeckt) sprich(k.it);
  };
  // "Nur hören": Satz beim Erscheinen automatisch vorlesen
  if (modus === "hoeren" && !e && !sprechen.vorgelesen) { sprechen.vorgelesen = true; setTimeout(() => sprich(k.it), 300); }
  const mikro = document.getElementById("mikro"), status = document.getElementById("status");
  mikro.onclick = () => {
    if (TTS) speechSynthesis.cancel();
    zuhoeren({
      start: () => { mikro.classList.add("hoert"); status.textContent = "Ich höre zu … jetzt sprechen!"; },
      ergebnis: (alternativen) => {
        // die Variante nehmen, die dem Zielsatz am nächsten kommt
        const beste = alternativen.map((t) => ({ t, v: vergleiche(k.it, t) })).sort((a, b) => b.v.prozent - a.v.prozent)[0];
        sprechen.ergebnis = { ...beste.v, text: beste.t };
        sprechen.status = beste.v.prozent >= 90 ? "Sehr gut! Noch einmal oder weiter." : "Hör dir die richtige Aussprache an und versuch es noch einmal.";
        const a = S.aussprache[k.id] || { versuche: 0, bester: 0, letzter: 0 };
        a.versuche++; a.letzter = beste.v.prozent; a.bester = Math.max(a.bester, beste.v.prozent);
        S.aussprache[k.id] = a;
        // aus dem Gedächtnis gesprochen → zählt für "selbst sagen" (nur der erste Versuch je Karte)
        if (verdeckt && !sprechen.gezeigt && !sprechen.gewertet) { sprechen.gewertet = true; rueckmeldung(k.id, "de-it", beste.v.prozent >= 80); }
        geuebt();
        sprechenZeigen();
        if (beste.v.prozent < 90) setTimeout(() => sprich(k.it), 500);
      },
      fehler: (text) => { mikro.classList.remove("hoert"); status.textContent = text; sprechen.status = ""; },
      ende: () => mikro.classList.remove("hoert")
    });
  };
  const wechsel = (pos) => { sprechen.pos = pos; sprechen.ergebnis = null; sprechen.status = ""; sprechen.gezeigt = false; sprechen.gewertet = false; sprechen.vorgelesen = false; sprechenZeigen(); };
  document.getElementById("weiterK").onclick = () => wechsel((sprechen.pos + 1) % sprechen.liste.length);
  document.getElementById("zurueckK").onclick = () => wechsel(Math.max(0, sprechen.pos - 1));
}

// ---------- Frage-Antwort-Übung (Gespräch) ----------
// Antwortmuster in Bausteine zerlegen (Schreibweise siehe data/gespraech.js)
function musterBauen(text) {
  return (text.match(/\[[^\]]+\]|\{\w+\}|\S+/g) || []).map((tok) => {
    const frei = tok.match(/^\{(\w+)\}$/);
    if (frei) return { frei: true, min: frei[1] === "rest" ? 0 : 1, max: frei[1] === "zahl" || frei[1] === "name" ? 3 : frei[1] === "rest" ? 5 : 4 };
    const opt = /^\[.*\]$/.test(tok), inner = opt ? tok.slice(1, -1) : tok;
    const seq = inner.includes("|") ? [inner.split("|").map(normWort).filter(Boolean)] : woerterVon(inner).map((t) => [t.n]);
    return { opt, seq };
  }).filter((m) => m.frei || m.seq.length);
}
function musterPasst(M, T, i = 0, j = 0) {
  if (i === M.length) return j === T.length;
  const m = M[i];
  if (m.frei) {
    for (let n = m.min; n <= m.max && j + n <= T.length; n++) if (musterPasst(M, T, i + 1, j + n)) return true;
    return false;
  }
  if (m.opt && musterPasst(M, T, i + 1, j)) return true;
  const ok = m.seq.every((alts, k) => j + k < T.length && alts.includes(T[j + k]));
  return ok && musterPasst(M, T, i + 1, j + m.seq.length);
}
const GESPRAECH_THEMEN = GESPRAECH.map((t, ti) => ({ ...t, id: "g" + ti, fragen: t.fragen.map((q) => ({ ...q, key: "dialog:" + q.f, muster: q.m.map(musterBauen) })) }));
const ALLE_FRAGEN = GESPRAECH_THEMEN.flatMap((t) => t.fragen);
function pruefeAntwort(q, texte) {
  for (const t of texte) {
    const T = woerterVon(t).map((x) => x.n);
    if (T.length && q.muster.some((M) => musterPasst(M, T))) return { stufe: "richtig", text: t };
  }
  const beste = texte.map((t) => ({ t, v: vergleiche(q.b, t) })).sort((a, b) => b.v.prozent - a.v.prozent)[0];
  return { stufe: beste.v.prozent >= 70 ? "fast" : "falsch", text: beste.t, vergleich: beste.v };
}

let gespraech = null;
function gespraechMenue() {
  setzeKopf("Frage & Antwort", "start");
  const f = (fragen) => fragen.filter((q) => { const g = S.grammatik[q.key]; return g && g.faellig <= Date.now(); }).length;
  const z = (n) => (n ? ` · <b>${n} zum Wiederholen</b>` : "");
  zeige(`
    <p>Die App stellt eine Frage auf Italienisch – du antwortest auf Italienisch, gesprochen 🎤 oder getippt.</p>
    <div class="meldung info">ℹ️ Die App kennt für jede Frage typische Antworten (z. B. „Mi chiamo …“ mit beliebigem Namen). Eine ungewöhnliche, aber richtige Antwort erkennt sie vielleicht nicht – dann tippst du auf „Meine Antwort war richtig“.</div>
    ${umschalter("gtext", S.einstellungen.gespraechText ? "ja" : "nein", [["ja", "Frage lesen + hören"], ["nein", "Frage nur hören"]])}
    <button class="btn voll" id="alle">🎲 10 Fragen aus allen Themen</button>
    <h2>Themen</h2>
    <div class="liste">${GESPRAECH_THEMEN.map((t) => `<button class="zeile" data-gthema="${t.id}"><span class="sym">💬</span><span class="mitte">${esc(t.thema)}<small>${t.fragen.length} Fragen${z(f(t.fragen))}</small></span><span class="pfeil">›</span></button>`).join("")}</div>`);
  $app.querySelectorAll("#gtext button").forEach((b) => (b.onclick = () => { S.einstellungen.gespraechText = b.dataset.w === "ja"; speichern(); gespraechMenue(); }));
  const starten = (fragen, n) => {
    gespraech = { liste: gewichtetZiehen(fragen, (q) => gGewicht(q.key), n), pos: 0 };
    neueFrage(); geheZu("gespraech-ueben");
  };
  document.getElementById("alle").onclick = () => starten(ALLE_FRAGEN, 10);
  $app.querySelectorAll("[data-gthema]").forEach((b) => (b.onclick = () => { const t = GESPRAECH_THEMEN.find((x) => x.id === b.dataset.gthema); starten(t.fragen, t.fragen.length); }));
}
function neueFrage() { Object.assign(gespraech, { ergebnis: null, gewertet: false, korrigiert: false, textGezeigt: false, deGezeigt: false, tippGezeigt: false, vorgelesen: false, status: "" }); }
function gespraechZeigen() {
  if (!gespraech) return geheZu("gespraech");
  setzeKopf("Frage & Antwort", "gespraech");
  if (gespraech.pos >= gespraech.liste.length) {
    zeige(`<div class="karte"><div class="wort">🎉 Bravo!</div><p>Du hast ${gespraech.liste.length} Fragen beantwortet.</p></div>
      <div class="reihe"><button class="btn" data-gehe="gespraech">Zurück zu den Themen</button><button class="btn zweit" data-gehe="start">Startseite</button></div>`);
    gespraech = null; return;
  }
  const q = gespraech.liste[gespraech.pos], g = gespraech, e = g.ergebnis;
  const frageSichtbar = S.einstellungen.gespraechText || g.textGezeigt || !!e;
  let ergebnisHtml = "";
  if (e) {
    const kopf = e.stufe === "richtig" ? "✅ Richtig – gute Antwort!" : e.stufe === "fast" ? "🟠 Fast – vergleiche mit der Beispielantwort." : "❌ Das passt noch nicht.";
    ergebnisHtml = `<div class="frage">
      <div class="meldung ${e.stufe === "richtig" ? "gut" : e.stufe === "fast" ? "info" : "schlecht"}" style="margin-top:0"><b>${kopf}</b></div>
      <p class="leise">Deine Antwort: „${esc(e.text)}“</p>
      ${e.stufe === "fast" && e.vergleich ? `<div class="woerter">${e.vergleich.woerter.map((w) => `<span class="w-${w.art}">${esc(w.wort)}${(w.art === "fast" || w.art === "falsch") ? `<small>du: ${esc(w.gehoert)}</small>` : ""}</span>`).join("")}</div>` : ""}
      <p style="margin-bottom:2px">${e.stufe === "richtig" ? "Eine weitere mögliche Antwort:" : "Beispielantwort:"}</p>
      <div style="font-size:21px;font-weight:650;color:var(--gruen)">${esc(q.b)}</div>
      <div class="leise">${esc(q.bde)}</div>
      <div class="reihe" style="justify-content:center">${lautBtn(q.b)}${langsamBtn(q.b)}</div>
      ${e.stufe !== "richtig" && !g.korrigiert ? `<button class="btn zweit voll" id="warRichtig">Meine Antwort war richtig</button>` : ""}
    </div>`;
  }
  zeige(`
    ${fortschrittsLeiste(g.pos + 1, g.liste.length)}
    <div class="karte" style="min-height:auto">
      <div class="leise">🗣️ Die Frage:</div>
      ${frageSichtbar ? `<div class="wort" style="font-size:28px">${esc(q.f)}</div>` : `<div class="leise">(nur hören)</div>`}
      <div class="reihe" style="justify-content:center;margin:4px 0">${lautBtn(q.f)}${langsamBtn(q.f)}</div>
      <div class="reihe" style="justify-content:center;margin:0">
        ${frageSichtbar ? "" : `<button class="btn zweit" id="textZeigen">Text zeigen</button>`}
        ${g.deGezeigt ? `<div class="leise" style="align-self:center">🇩🇪 ${esc(q.de)}</div>` : `<button class="btn zweit" id="deZeigen">🇩🇪 Übersetzung</button>`}
      </div>
    </div>
    ${e ? ergebnisHtml : `
      <div class="mitte-zentriert">
        <button class="mikro" id="mikro" aria-label="Antwort sprechen">🎤</button>
        <div id="status" class="leise">${esc(g.status || "Tippe aufs Mikrofon und antworte auf Italienisch – oder schreib die Antwort.")}</div>
      </div>
      <div class="reihe" style="flex-wrap:nowrap">
        <input type="text" id="gantwort" lang="it" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Antwort eintippen …" style="margin:0;flex:1">
        <button class="btn" id="gpruefen" style="flex:none">Prüfen</button>
      </div>
      ${g.tippGezeigt ? `<div class="meldung info">💡 Zum Beispiel: <b>${esc(q.b)}</b><br><span class="leise">${esc(q.bde)}</span></div>` : `<button class="btn zweit voll" id="tipp">💡 Beispielantwort zeigen</button>`}`}
    <div class="reihe">
      ${e ? `<button class="btn zweit" id="nochmalAntworten">Nochmal antworten</button>` : ""}
      <button class="btn" id="naechste">${e ? "Nächste Frage ›" : "Überspringen ›"}</button>
    </div>`);
  if (!g.vorgelesen) { g.vorgelesen = true; setTimeout(() => sprich(q.f), 300); }
  const auswerten = (texte) => {
    const r = pruefeAntwort(q, texte);
    g.ergebnis = r;
    if (!g.gewertet) { g.gewertet = true; gBewerte(q.key, r.stufe === "richtig"); } else geuebt();
    gespraechZeigen();
    setTimeout(() => sprich(r.stufe === "richtig" ? "Bravo!" : q.b), 400);
  };
  const klick = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
  klick("textZeigen", () => { g.textGezeigt = true; gespraechZeigen(); });
  klick("deZeigen", () => { g.deGezeigt = true; gespraechZeigen(); });
  klick("tipp", () => { g.tippGezeigt = true; gespraechZeigen(); sprich(q.b); });
  klick("naechste", () => { g.pos++; neueFrage(); gespraechZeigen(); });
  klick("nochmalAntworten", () => { g.ergebnis = null; g.status = ""; gespraechZeigen(); });
  klick("warRichtig", () => {
    g.korrigiert = true;
    const st = S.grammatik[q.key]; if (st) { st.falsch = Math.max(0, st.falsch - 1); speichern(); }
    gBewerte(q.key, true);
    g.ergebnis = { ...g.ergebnis, stufe: "richtig" }; gespraechZeigen();
  });
  const feld = document.getElementById("gantwort");
  if (feld) {
    const pruefen = () => { if (feld.value.trim()) auswerten([feld.value]); };
    feld.onkeydown = (ev) => { if (ev.key === "Enter") pruefen(); };
    klick("gpruefen", pruefen);
  }
  const mikro = document.getElementById("mikro"), status = document.getElementById("status");
  if (mikro) mikro.onclick = () => {
    if (TTS) speechSynthesis.cancel();
    zuhoeren({
      start: () => { mikro.classList.add("hoert"); status.textContent = "Ich höre zu … jetzt antworten!"; },
      ergebnis: (alternativen) => auswerten(alternativen),
      fehler: (text) => { mikro.classList.remove("hoert"); status.textContent = text; },
      ende: () => mikro && mikro.classList.remove("hoert")
    });
  };
}

// ---------- Phrasen ansehen ----------
function phrasenMenue() {
  setzeKopf("Phrasen", "start");
  zeige(`<div class="liste">${PHRASEN_GRUPPEN.map((g) => `<button class="zeile" data-gehe="phrasen/${g.id}"><span class="sym">${g.icon}</span><span class="mitte">${esc(g.name)}<small>${g.eintraege.length} Sätze</small></span><span class="pfeil">›</span></button>`).join("")}</div>`);
}
const eintragHtml = (e) => `<div class="eintrag">${lautBtn(e.it, true)}<div class="mitte"><div class="it">${esc(e.it)}</div><div class="de">${esc(e.de)}</div></div></div>`;
// Verdeckt: nur Deutsch sichtbar, Italienisch erst nach Antippen
const eintragVerdecktHtml = (e, i) => `<div class="eintrag" data-auf="${i}" style="cursor:pointer">${lautBtn(e.it, true)}<div class="mitte">
  <div class="it">${esc(e.de)}</div><div class="de verdeckt-it" data-it="${esc(e.it)}">👆 antippen zum Aufdecken</div></div></div>`;
function phrasenGruppe(id) {
  const g = GRUPPE_NACH_ID[id]; if (!g) return geheZu("phrasen");
  setzeKopf(g.name, "phrasen");
  const verdeckt = !!S.einstellungen.phrasenVerdeckt;
  zeige(`${umschalter("pverdeckt", verdeckt ? "ja" : "nein", [["nein", "Alles zeigen"], ["ja", "Italienisch verdecken"]])}
    <p class="leise">${verdeckt ? "Du siehst nur den deutschen Satz. Hör ihn dir mit 🔊 an oder überleg selbst – antippen zeigt das Italienische." : "Tippe auf 🔊 zum Anhören."}</p>
    <div class="liste">${g.eintraege.map((e, i) => (verdeckt ? eintragVerdecktHtml(e, i) : eintragHtml(e))).join("")}</div>
    <div class="reihe"><button class="btn" id="ueben">🎤 Diese Sätze sprechen üben</button></div>`);
  $app.querySelectorAll("#pverdeckt button").forEach((b) => (b.onclick = () => { S.einstellungen.phrasenVerdeckt = b.dataset.w === "ja"; speichern(); phrasenGruppe(id); }));
  $app.querySelectorAll("[data-auf]").forEach((z) => (z.onclick = (ev) => {
    if (ev.target.closest("[data-sprich]")) return;
    const feld = z.querySelector("[data-it]");
    if (feld.classList.contains("verdeckt-it")) { feld.textContent = feld.dataset.it; feld.classList.remove("verdeckt-it"); feld.style.color = "var(--gruen)"; feld.style.fontWeight = "650"; }
  }));
  document.getElementById("ueben").onclick = () => sprechenStarten(g.eintraege);
}
function nachschlagen() {
  setzeKopf("Wörterbuch", "start");
  zeige(`<input type="search" id="suche" placeholder="Italienisch oder Deutsch suchen …" autocomplete="off"><div class="liste" id="treffer"></div>`);
  const feld = document.getElementById("suche"), aus = document.getElementById("treffer");
  const n = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const zeichnen = () => {
    const q = n(feld.value.trim());
    const liste = q ? ALLE_KARTEN.filter((k) => n(k.it).includes(q) || n(k.de).includes(q)).slice(0, 80) : [];
    aus.innerHTML = q ? (liste.map(eintragHtml).join("") || `<p class="leise">Nichts gefunden.</p>`) : `<p class="leise">${ALLE_WOERTER.length} Wörter und ${ALLE_PHRASEN.length} Phrasen sind enthalten.</p>`;
  };
  feld.oninput = zeichnen; zeichnen();
}

// ---------- Einstellungen ----------
function einstellungen() {
  setzeKopf("Einstellungen", "start");
  const E = S.einstellungen;
  zeige(`
    <div class="einstellung"><label>Stimme</label>
      ${stimmen.length ? `<select id="stimme"><option value="">Automatisch</option>${stimmen.map((v) => `<option ${v.name === E.stimme ? "selected" : ""}>${esc(v.name)}</option>`).join("")}</select>`
        : `<p class="leise">Keine italienische Stimme gefunden. Auf Android: Einstellungen → „Sprachausgabe“ (Text-in-Sprache) → Google-Sprachausgabe → Sprachdaten installieren → Italienisch.</p>`}
      <button class="btn zweit voll" id="test">🔊 Probe hören</button></div>
    <div class="einstellung"><label>Sprechtempo: <span id="tempoWert">${Math.round(E.tempo * 100)} %</span></label>
      <input type="range" id="tempo" min="0.5" max="1.2" step="0.05" value="${E.tempo}"></div>
    <div class="einstellung"><label>Neue Karten pro Tag: <span id="neuWert">${E.neueProTag}</span></label>
      <input type="range" id="neu" min="5" max="40" step="5" value="${E.neueProTag}">
      <p class="leise">Gezählt wird jede Richtung einzeln.</p></div>
    <div class="einstellung schalter"><span><b>Automatisch vorlesen</b><br><small class="leise">bei Karteikarten</small></span><input type="checkbox" id="auto" ${E.automatischVorlesen ? "checked" : ""}></div>
    <div class="einstellung schalter"><span><b>Antwort eintippen</b><br><small class="leise">bei Deutsch → Italienisch (prägt sich besser ein)</small></span><input type="checkbox" id="tippen" ${E.eintippen ? "checked" : ""}></div>
    <h2>Lernstand sichern</h2>
    <p class="leise">Dein Lernstand ist nur auf diesem Handy gespeichert. Mit „Sichern“ bekommst du eine Datei, die du z. B. in Google Drive ablegen und später wieder einlesen kannst.</p>
    <div class="reihe"><button class="btn zweit" id="export">💾 Sichern</button><button class="btn zweit" id="import">📂 Einlesen</button></div>
    <input type="file" id="datei" accept=".json,application/json" hidden>
    <button class="btn rot voll" id="reset" style="margin-top:20px">Lernstand löschen</button>
    <p class="leise" style="margin-top:20px">Version 3 · Vorlesen: ${TTS ? "ja" : "nein"} · Spracherkennung: ${SR ? "ja" : "nein"}</p>`);
  const sel = document.getElementById("stimme");
  if (sel) sel.onchange = () => { E.stimme = sel.value; speichern(); sprich("Ciao, come stai?"); };
  document.getElementById("test").onclick = () => sprich("Ciao! Benvenuto. Impariamo l'italiano insieme.");
  document.getElementById("tempo").oninput = (e) => { E.tempo = +e.target.value; document.getElementById("tempoWert").textContent = Math.round(E.tempo * 100) + " %"; speichern(); };
  document.getElementById("tempo").onchange = () => sprich("Buongiorno, come sta?");
  document.getElementById("neu").oninput = (e) => { E.neueProTag = +e.target.value; document.getElementById("neuWert").textContent = E.neueProTag; speichern(); };
  document.getElementById("auto").onchange = (e) => { E.automatischVorlesen = e.target.checked; speichern(); };
  document.getElementById("tippen").onchange = (e) => { E.eintippen = e.target.checked; speichern(); };
  document.getElementById("export").onclick = () => {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `italienisch-lernstand-${heute()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const datei = document.getElementById("datei");
  document.getElementById("import").onclick = () => datei.click();
  datei.onchange = async () => {
    try {
      const d = JSON.parse(await datei.files[0].text());
      if (!d.karten) throw new Error();
      if (!confirm("Den aktuellen Lernstand durch die Datei ersetzen?")) return;
      localStorage.setItem(SPEICHER_KEY, JSON.stringify(d)); S = laden(); speichern(); toast("Lernstand eingelesen ✓"); einstellungen();
    } catch (e) { toast("Die Datei konnte nicht gelesen werden."); }
  };
  document.getElementById("reset").onclick = () => {
    if (confirm("Wirklich den gesamten Lernstand löschen? Das kann nicht rückgängig gemacht werden.")) {
      S = JSON.parse(JSON.stringify(STANDARD)); speichern(); toast("Lernstand gelöscht."); einstellungen();
    }
  };
}

// ---------- Navigation ----------
function route() {
  if (TTS) speechSynthesis.cancel();
  if (erkennung) { try { erkennung.abort(); } catch (e) {} }
  const h = location.hash.replace(/^#/, "") || "start";
  const [teil, arg] = h.split("/");
  const seiten = {
    start: startseite, karten: kartenMenue, karte: karteZeigen, grammatik: grammatikMenue, verben: verbenMenue,
    tabellen: verbTabellen, artikel: artikelStart, satzbau: () => { satz = null; satzbauZeigen(); }, quiz: quizZeigen,
    hoeren: hoerenMenue, sprechen: sprechenMenue, "sprechen-ueben": sprechenZeigen,
    gespraech: gespraechMenue, "gespraech-ueben": gespraechZeigen,
    phrasen: () => (arg ? phrasenGruppe(arg) : phrasenMenue()), nachschlagen, einstellungen
  };
  (seiten[teil] || startseite)();
}
window.addEventListener("hashchange", route);
speichern(); // übernommenen Lernstand (Version 1 → 2) gleich sichern
route();

// ---------- Offline-Funktion ----------
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  const hatteSteuerung = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("sw.js").catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hatteSteuerung) toast("Neue Version geladen – App einmal schließen und neu öffnen.", 5000);
  });
}
