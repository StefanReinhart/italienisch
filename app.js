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
// Zeile: "italienisch | deutsch | kennung" – die Kennung bleibt fest, auch wenn sich der Text ändert
function zeilen(text) {
  return text.split("\n").map((z) => z.trim()).filter((z) => z && z.includes("|"))
    .map((z) => { const [it, de, id] = z.split("|").map((s) => s.trim()); return { it, de, kennung: id || "" }; });
}
const mitKennung = (t) => (e) => ({ it: e.it, de: e.de, id: e.kennung || t.id + ":" + e.it, thema: t.id });
const THEMEN = WORTSCHATZ.map((t) => ({ ...t, eintraege: zeilen(t.liste).map(mitKennung(t)) }));
// Eigene Wörter und Sätze jeder Lektion (aus lektionen-a1.js) – als eigene Gruppen, auch zum freien Üben
const LEKTION_GRUPPEN = (window.LEKTIONEN || []).filter((l) => l.neu).map((l, i) => {
  const g = { id: "lk_" + l.id, name: `Lektion ${i + 1}: ${l.titel}`, icon: l.icon };
  return { ...g, eintraege: zeilen(l.neu).map(mitKennung(g)) };
});
const PHRASEN_GRUPPEN = PHRASEN.map((t) => ({ ...t, eintraege: zeilen(t.liste).map(mitKennung(t)) })).concat(LEKTION_GRUPPEN);
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
  lektionen: {},       // Lektions-ID → { schritte, bestanden, best }
  wuensche: [],        // Wunschliste: Erklärungen { id, it, de, zeit, gesendet } und Antworten zur Prüfung { typ: "antwort", … }
  eigeneAntworten: {}, // Frage-Kennung → selbst als richtig markierte Antworten (vereinfachte Schreibweise)
  claudeFehler: [],    // Fehler, die Claude in Gesprächen gefunden hat: { text, zeit, genutzt }
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
  s.grammatik = s.grammatik || {}; s.aussprache = s.aussprache || {}; s.lektionen = s.lektionen || {}; s.wuensche = s.wuensche || [];
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

const SICHER_TAGE = 180; // "Kann ich sicher": direkt auf etwa ein halbes Jahr
function naechsterAbstand(k, note) { // note: 0 nochmal, 1 schwer, 2 gut, 3 leicht, 4 kann ich sicher
  if (note === 0) return 0;
  if (note === 4) return Math.max(SICHER_TAGE, naechsterAbstand(k, 2));
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
    k.wdh = 0; k.intervall = 0; k.falsch++; delete k.sicher;
    k.ease = Math.max(1.3, k.ease - 0.2);
    k.faellig = Date.now() + 60 * 1000;
  } else {
    if (note === 1) k.ease = Math.max(1.3, k.ease - 0.15);
    if (note >= 3) k.ease = Math.min(3.0, k.ease + 0.15);
    k.wdh++; k.intervall = t; k.richtig++;
    if (note === 4) k.sicher = true; // mit "Kann ich sicher" markiert → steht in den Listen oben mit 🏆
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
    k.falsch++; delete k.sicher;
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
function zuhoeren({ start, ergebnis, fehler, ende, sprache }) {
  if (!SR) { fehler("Dieses Gerät oder dieser Browser unterstützt keine Spracherkennung. Bitte Chrome verwenden."); return; }
  if (erkennung) { try { erkennung.abort(); } catch (e) {} }
  const r = new SR();
  erkennung = r;
  r.lang = sprache || "it-IT"; r.interimResults = false; r.maxAlternatives = 5; r.continuous = false;
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
// Ziffern → italienisches Zahlwort (die Spracherkennung schreibt Zahlen oft als Ziffern, z. B. "54")
const EINER = ["zero", "uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove", "dieci", "undici", "dodici", "tredici",
  "quattordici", "quindici", "sedici", "diciassette", "diciotto", "diciannove"];
const ZEHNER = ["", "", "venti", "trenta", "quaranta", "cinquanta", "sessanta", "settanta", "ottanta", "novanta"];
function zahlwort(n) {
  if (n < 20) return EINER[n];
  if (n < 100) { const z = ZEHNER[Math.floor(n / 10)], e = n % 10; if (!e) return z; return (e === 1 || e === 8 ? z.slice(0, -1) : z) + EINER[e]; } // ventuno, ventotto
  if (n < 1000) { const h = Math.floor(n / 100), r = n % 100, vorn = h === 1 ? "cento" : EINER[h] + "cento"; if (!r) return vorn; return (r >= 80 && r < 90 ? vorn.slice(0, -1) : vorn) + zahlwort(r); } // centottanta
  if (n < 10000) { const t = Math.floor(n / 1000), r = n % 1000, vorn = t === 1 ? "mille" : EINER[t] + "mila"; return r ? vorn + zahlwort(r) : vorn; }
  return String(n);
}
// wie zahlwort, aber mit Akzent am Ende (ventitré), damit es nicht als Akzentfehler gilt
const zahlMitAkzent = (n) => { const w = zahlwort(n); return n > 20 && /tre$/.test(w) ? w.slice(0, -1) + "é" : w; };
// Deutsche Zahlwörter (für Antworten auf Deutsch: das Handy schreibt „50“ statt „fünfzig“)
const EINER_DE = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf", "dreizehn",
  "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
const ZEHNER_DE = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];
function zahlwortDe(n) {
  if (n < 20) return EINER_DE[n];
  if (n < 100) { const e = n % 10, z = ZEHNER_DE[Math.floor(n / 10)]; return e ? (e === 1 ? "ein" : EINER_DE[e]) + "und" + z : z; }
  if (n < 1000) { const h = Math.floor(n / 100), r = n % 100; return (h === 1 ? "" : EINER_DE[h]) + "hundert" + (r ? zahlwortDe(r) : ""); }
  if (n < 10000) { const t = Math.floor(n / 1000), r = n % 1000; return (t === 1 ? "" : EINER_DE[t]) + "tausend" + (r ? zahlwortDe(r) : ""); }
  return String(n);
}
// Ersetzt alle Ziffern in einem Text durch Zahlwörter ("Ho 54 anni" → "Ho cinquantaquattro anni"); 1.000 → 1000
function zahlenAlsWorte(text, deutsch) {
  return String(text).replace(/(\d)[.'’ ](?=\d{3}\b)/g, "$1").replace(/\d+/g, (z) => (deutsch ? zahlwortDe(+z) : zahlMitAkzent(+z)));
}
function normWort(w) {
  let s = w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
  if (/^\d+$/.test(s)) s = zahlwort(+s);
  return s;
}
// Zerlegt einen Satz in Wörter; "l'acqua" → "l'" + "acqua"
function woerterVon(text) {
  const teile = [];
  text.replace(/[’`´]/g, "'").replace(/(\d)\.(?=\d{3}\b)/g, "$1").replace(/(\d)[:.,](\d)/g, "$1 $2").split(/\s+/).forEach((w) => {
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
const saeubern = (s) => zahlenAlsWorte(s).toLowerCase().replace(/[’`´]/g, "'").replace(/[.,!?;:¿¡"«»()]/g, " ").replace(/'\s*/g, "'").replace(/\s+/g, " ").trim();
const ARTIKEL_RE = /^(il |lo |la |i |gli |le |l')/;
// „Was?“ gibt es dreimal: che cosa / cosa / che (Cos'è = Che cos'è). Steht auf einer Seite cosa oder che cosa am Anfang,
// gelten alle drei Formen als gleich. Nur dann – sonst könnte „che“ auch „welche“ heißen (Che ore sono?).
const WAS_RE = /^(che cosa |cosa |che cos'|cos')/;
const wasNorm = (s) => s.replace(/^che cos'/, "cos'").replace(/^(che cosa|cosa|che) /, "§ ");
const wasGleich = (a, b) => (WAS_RE.test(a) || WAS_RE.test(b)) && wasNorm(a) === wasNorm(b);
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
    else if (wasGleich(e, zs)) r = { stufe: "richtig", wert: 4 };
    else if (ohneAkzente(e) === ohneAkzente(zs)) r = { stufe: "akzent", wert: 3 };
    else if (wasGleich(ohneAkzente(e), ohneAkzente(zs))) r = { stufe: "akzent", wert: 3 };
    else if (ARTIKEL_RE.test(zs) && ohneAkzente(e) === ohneAkzente(zs.replace(ARTIKEL_RE, ""))) r = { stufe: "artikel", wert: 2 };
    else {
      let a = ohneAkzente(e), b = ohneAkzente(zs);
      if (WAS_RE.test(a) || WAS_RE.test(b)) { a = wasNorm(a); b = wasNorm(b); } // Tippfehler bei „cosa fai …“ = fast richtig
      const s = aehnlich(a, b);
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

// Gesprochene deutsche Antwort prüfen (Italienisch → Deutsch): tolerant bei Artikeln, Klammern und „/“-Varianten
function pruefeDeutsch(gesagt, karte) {
  const norm = (s) => ohneAkzente(zahlenAlsWorte(s, true).toLowerCase()).replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9ß ]/g, " ")
    .replace(/\b(der|die|das|den|dem|ein|eine|einen|einem)\b/g, " ").replace(/\s+/g, " ").trim();
  const g = norm(gesagt);
  if (!g) return { stufe: "falsch", text: "Nichts verstanden." };
  const varianten = [karte.de].concat(karte.de.split(/\/|,|;| oder /)).map(norm).filter(Boolean);
  if (varianten.includes(g)) return { stufe: "richtig", text: "✅ Richtig!" };
  const best = Math.max(...varianten.map((v) => aehnlich(v, g)));
  const enthalten = varianten.some((v) => v.length > 3 && (g.includes(v) || v.includes(g)) && g.length > 2);
  if (best >= 0.8 || enthalten) return { stufe: "fast", text: "🟠 Fast – vergleiche genau mit der Lösung." };
  return { stufe: "falsch", text: "❌ Leider falsch." };
}
// Aus mehreren Erkennungs-Vorschlägen den besten nehmen
function besteSprachAntwort(alternativen, karte, itDe) {
  const rang = { richtig: 4, akzent: 3, artikel: 2, fast: 1, falsch: 0 };
  return alternativen.map((t) => ({ t, r: itDe ? pruefeDeutsch(t, karte) : pruefeEingabe(t, karte) }))
    .sort((a, b) => rang[b.r.stufe] - rang[a.r.stufe])[0];
}

// ---------- Kleine Bausteine für Bildschirme ----------
function setzeKopf(titel, zurueck) {
  document.getElementById("titel").textContent = titel;
  const b = document.getElementById("zurueck");
  b.hidden = !zurueck;
  // Gibt es in der App eine Seite davor, dorthin zurück; sonst (z. B. direkt geöffnet) zur übergeordneten Seite
  b.onclick = () => (tiefeJetzt() > 0 ? history.back() : ersetzeDurch(zurueck));
}
// Jede Seite merkt sich ihre "Tiefe" im Verlauf – so kann man gezielt mehrere Schritte zurückspringen.
const tiefeJetzt = () => (history.state && typeof history.state.tiefe === "number" ? history.state.tiefe : 0);
function geheZu(ziel) {
  if (location.hash === "#" + ziel) return route();
  history.pushState({ tiefe: tiefeJetzt() + 1 }, "", "#" + ziel);
  route();
}
function ersetzeDurch(ziel) { history.replaceState({ tiefe: tiefeJetzt() }, "", "#" + ziel); route(); }
// Eine schon beendete Übung ist ein "toter" Eintrag im Verlauf (man kommt nur mit Zurück dorthin).
// Statt nach vorne ins Menü zu springen (dann wirkt Zurück wie kaputt), einfach noch einen Schritt weiter zurückgehen.
function abgelaufen(eltern) {
  const hier = location.hash;
  history.back();
  setTimeout(() => { if (location.hash === hier) ersetzeDurch(eltern); }, 350); // falls es kein "davor" gibt
}
// Neue Seite → nach oben. Beim Auswählen/Umschalten auf derselben Seite (ohneSprung) bleibt die Seite stehen.
let scrollBehalten = false;
function zeige(html) { const y = window.scrollY; $app.innerHTML = html; window.scrollTo(0, scrollBehalten ? y : 0); }
function ohneSprung(fn) { scrollBehalten = true; try { fn(); } finally { scrollBehalten = false; } }
const lautBtn = (text, klein) => `<button class="lautsprecher${klein ? " klein" : ""}" data-sprich="${esc(text)}" aria-label="Vorlesen">🔊</button>`;
const langsamBtn = (text) => `<button class="lautsprecher" data-sprich="${esc(text)}" data-langsam="1" aria-label="Langsam vorlesen">🐢</button>`;
$app.addEventListener("click", (e) => {
  const b = e.target.closest("[data-sprich]");
  if (b) { e.stopPropagation(); sprich(b.dataset.sprich, b.dataset.langsam === "1"); }
  const g = e.target.closest("[data-gehe]");
  if (g) geheZu(g.dataset.gehe);
  if (e.target.closest("[data-heute-weiter]")) zurueckZuHeute();
  if (e.target.closest("[data-lektion-weiter]")) zurueckZuLektion();
  const wb = e.target.closest("[data-wunsch]");
  if (wb) { e.stopPropagation(); wunschHinzufuegen(wb.dataset.wunsch); wb.outerHTML = `<div class="leise" style="font-size:13px">✓ Erklärung gewünscht</div>`; }
  // Ergebnis-Seiten: "Zurück" geht einen Schritt zurück, "Startseite" springt ganz an den Anfang – ohne neue Seiten anzuhängen
  const z = e.target.closest("[data-zurueck]");
  if (z) { if (tiefeJetzt() > 0) history.back(); else ersetzeDurch(z.dataset.zurueck); }
  if (e.target.closest("[data-heim]")) { const t = tiefeJetzt(); if (t > 0) history.go(-t); else ersetzeDurch("start"); }
});
const fortschrittsLeiste = (nr, gesamt) => `<div class="fortschritt"><span>${nr} / ${gesamt}</span><div class="balken"><i style="width:${(100 * (nr - 1)) / gesamt}%"></i></div></div>`;
function umschalter(id, wert, optionen) {
  return `<div class="umschalter" id="${id}">${optionen.map(([w, t]) => `<button data-w="${w}" class="${w === wert ? "an" : ""}">${t}</button>`).join("")}</div>`;
}

// ---------- Lernstand: die vier Zahlen oben auf der Startseite ----------
// "Kann ich sicher" gedrückt? (Ältere Markierungen ohne Kennzeichen: schon ½ Jahr Abstand nach höchstens 3 Wiederholungen)
const istSicher = (id, r) => { const z = zustand(id, r); return !!z && (!!z.sicher || (z.intervall >= SICHER_TAGE && z.wdh <= 3)); };
const standGemerkt = {}; // Karten, deren Haken gerade weggenommen wurde – damit man ihn wieder setzen kann
function standSeite(art) {
  if (art === "faellig") return standFaellig();
  if (art === "serie") return standSerie();
  const r = art === "sagen" ? "de-it" : "it-de";
  setzeKopf(art === "sagen" ? "Kann ich selbst sagen" : "Verstehe ich", "start");
  zeige(`
    <p>Hier stehen alle Karten, die du schon gut kannst (${r === "de-it" ? "Deutsch → Italienisch" : "Italienisch → Deutsch"}).</p>
    <div class="meldung info">ℹ️ Diese Karten sind <b>nicht aus den Übungen heraus</b>. Sie kommen nur seltener dran: immer dann, wenn sie wieder „fällig“ sind – erst nach ein paar Tagen, dann nach Wochen. So festigt sich das Wissen.<br><br>
    <b>Haken wegnehmen</b> = „das kann ich doch noch nicht“: Die Karte fängt wieder von vorn an und kommt gleich bei der nächsten Wiederholung dran. Haken wieder setzen macht das rückgängig.</div>
    <p class="leise">Sortiert danach, wann die Karte wiederkommt – die nächsten zuerst.</p>
    <input type="search" id="ssuche" placeholder="Suchen …" autocomplete="off">
    <div class="liste" id="sliste"></div>`);
  const feld = document.getElementById("ssuche"), aus = document.getElementById("sliste");
  const n = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const zeichnen = () => {
    const q = n(feld.value.trim());
    const liste = ALLE_KARTEN.filter((k) => istGelernt(k.id, r) || standGemerkt[schluessel(k.id, r)])
      .filter((k) => !q || n(k.it).includes(q) || n(k.de).includes(q))
      // aufsteigend: was bald wiederkommt, steht oben; 🏆-Karten (½ Jahr) landen unten
      .sort((a, b) => zustand(a.id, r).faellig - zustand(b.id, r).faellig || a.it.localeCompare(b.it, "it"));
    aus.innerHTML = liste.length ? liste.map((k) => {
      const z = zustand(k.id, r), an = !standGemerkt[schluessel(k.id, r)];
      const sicher = an && istSicher(k.id, r) ? "🏆 " : "";
      const tage = Math.max(0, Math.round((z.faellig - Date.now()) / TAG));
      return `<button class="zeile${an ? " aktiv" : ""}" data-skarte="${esc(k.id)}"><span class="mitte">${sicher}${esc(k.it)}<small>${esc(k.de)} · ${an ? (tage === 0 ? "ist heute wieder dran" : tage === 1 ? "kommt morgen wieder" : "kommt in " + (tage < 60 ? tage + " Tagen" : Math.round(tage / 30) + " Monaten") + " wieder") : "<b>wird wieder geübt</b>"}</small></span><span class="haken haken-gross" role="checkbox" aria-checked="${an}">${an ? "✓" : ""}</span></button>`;
    }).join("") : `<p class="leise">${q ? "Nichts gefunden." : "Noch keine Karte. Eine Karte zählt hier, sobald sie erst nach 3 oder mehr Tagen wiederkommen muss."}</p>`;
    aus.querySelectorAll("[data-skarte]").forEach((b) => (b.onclick = () => {
      const key = schluessel(b.dataset.skarte, r);
      if (standGemerkt[key]) { S.karten[key] = standGemerkt[key]; delete standGemerkt[key]; }
      else {
        standGemerkt[key] = { ...S.karten[key] };
        S.karten[key] = { ...S.karten[key], intervall: 0, wdh: 0, faellig: Date.now(), sicher: undefined };
      }
      speichern(); ohneSprung(zeichnen);
    }));
  };
  feld.oninput = zeichnen; zeichnen();
}
function faelligeKarten() {
  const jetzt = Date.now();
  return Object.entries(S.karten).filter(([key, z]) => z.faellig <= jetzt && KARTE_NACH_ID[key.split("|")[0]])
    .sort((a, b) => a[1].faellig - b[1].faellig)
    .map(([key]) => { const [id, r] = key.split("|"); return { k: KARTE_NACH_ID[id], r }; });
}
function standFaellig() {
  setzeKopf("Heute wiederholen", "start");
  const liste = faelligeKarten();
  zeige(`
    <p>Diese Karten sind heute wieder dran. Wiederholen im richtigen Moment – kurz bevor man etwas vergisst – bringt am meisten.</p>
    ${liste.length ? `<button class="btn voll" id="sWdh" style="min-height:56px;font-size:18px">▶ Jetzt ${liste.length > 30 ? "30 davon" : "alle " + liste.length} wiederholen</button>` : `<div class="meldung gut">🎉 Heute ist nichts mehr zu wiederholen.</div>`}
    <div class="liste" style="margin-top:12px">${liste.map((x) => `<div class="zeile"><span class="mitte">${esc(x.r === "de-it" ? x.k.de : x.k.it)}<small>${x.r === "de-it" ? "🇩🇪 → 🇮🇹 selbst sagen" : "🇮🇹 → 🇩🇪 verstehen"} · ${esc(x.r === "de-it" ? x.k.it : x.k.de)}</small></span></div>`).join("")}</div>`);
  const b = document.getElementById("sWdh");
  if (b) b.onclick = () => {
    const l = liste.slice(0, 30);
    sitzung = { liste: l, pos: 0, neuKeys: new Set(), aufgedeckt: false, eingabe: null, gesamt: l.length, fertig: 0, zurueck: "start" };
    geheZu("karte");
  };
}
function standSerie() {
  setzeKopf("Tage am Stück", "start");
  const tag = (d) => d.toISOString().slice(0, 10);
  // Raster: 5 Wochen, beginnend mit einem Montag
  const start = new Date(); start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 28);
  const zellen = [];
  for (let i = 0; i < 35; i++) {
    const t = new Date(start); t.setDate(start.getDate() + i);
    const k = tag(t), zukunft = k > heute();
    zellen.push(`<span class="ktag${S.tage[k] ? " geuebt" : ""}${k === heute() ? " heute" : ""}${zukunft ? " zukunft" : ""}" title="${k}">${t.getDate()}</span>`);
  }
  const gesamt = Object.keys(S.tage).length;
  zeige(`
    <p>Du hast <b>${serie()} Tage am Stück</b> geübt${S.tage[heute()] ? ", heute schon mit dabei" : " – heute fehlt noch"}. Insgesamt an <b>${gesamt} Tagen</b>.</p>
    <div class="kalender"><b>Mo</b><b>Di</b><b>Mi</b><b>Do</b><b>Fr</b><b>Sa</b><b>So</b>${zellen.join("")}</div>
    <p class="leise">Grün = an diesem Tag geübt. Schon ein paar Minuten am Tag zählen – lieber täglich kurz als selten lang.</p>
    ${S.tage[heute()] ? "" : `<button class="btn voll" data-gehe="heute">▶ Heute üben</button>`}`);
}

// ---------- Startseite ----------
function startseite() {
  setzeKopf("Italienisch lernen", null);
  heuteAktiv = null; lektionAktiv = null;
  const akt = aktuelleLektion();
  const hs = heuteSchritte(), hst = heuteStand();
  const hOffen = hs.filter((s) => !s.leer && !hst.erledigt.includes(s.id)).length;
  const verstanden = ALLE_KARTEN.filter((k) => istGelernt(k.id, "it-de")).length;
  const sagen = ALLE_KARTEN.filter((k) => istGelernt(k.id, "de-it")).length;
  const gram = gFaellig("verb:") + gFaellig("art:") + gFaellig("satz:") + gFaellig("ce:") + gFaellig("vsatz:") + gFaellig("lk:") + gFaellig("zahl:");
  const gespr = gFaellig("dialog:");
  const fehlerZahl = anzahlFehler();
  zeige(`
    <div class="statistik">
      <button data-gehe="stand/faellig"><b>${anzahlFaellig()}</b><span>Karten heute wiederholen</span></button>
      <button data-gehe="stand/serie"><b>${serie()}</b><span>Tage am Stück geübt</span></button>
      <button data-gehe="stand/verstehe"><b>${verstanden}</b><span>verstehe ich (von ${ALLE_KARTEN.length})</span></button>
      <button data-gehe="stand/sagen"><b>${sagen}</b><span>kann ich selbst sagen</span></button>
    </div>
    <div class="kacheln">
      <button class="kachel breit haupt" data-gehe="heute"><span class="sym">▶️</span><span><b>Heute üben</b><br><small>${hOffen ? `${hs.length - hOffen} von ${hs.length} Schritten erledigt · ca. 15 Minuten` : "🎉 Für heute geschafft!"}</small></span></button>
      <button class="kachel breit" data-gehe="${akt ? "lektion/" + akt.id : "lektionen"}"><span class="sym">📚</span><span><b>Lektionen</b><br><small>${akt ? `Als Nächstes: Lektion ${akt.nr} – ${esc(akt.titel)}` : "🎉 Alle 12 Lektionen geschafft!"}</small></span></button>
      <button class="kachel breit" data-gehe="lektionen" style="min-height:auto;padding:10px 16px"><span class="sym" style="font-size:22px">🗺️</span><span><small>Alle Lektionen ansehen (${LEKTION_LISTE.filter((l) => lStand(l.id).bestanden).length} von 12 geschafft)</small></span></button>
      <button class="kachel breit" data-gehe="karten"><span class="sym">🗂️</span><span><b>Karteikarten</b><br><small>Vokabeln und Phrasen lernen und wiederholen</small></span></button>
      <button class="kachel" data-gehe="grammatik"><span class="sym">📘</span><b>Grammatik</b><small>${gram ? `<b>${gram} zum Wiederholen</b>` : "Verben, Artikel, Satzbau"}</small></button>
      <button class="kachel" data-gehe="dialoge"><span class="sym">🎧</span><b>Hör-Dialoge</b><small>Kurze Gespräche verstehen</small></button>
      <button class="kachel" data-gehe="hoeren"><span class="sym">👂</span><b>Hören</b><small>Wörter hören und verstehen</small></button>
      <button class="kachel" data-gehe="sprechen"><span class="sym">🎤</span><b>Sprechen</b><small>Nachsprechen mit Korrektur</small></button>
      <button class="kachel breit" data-gehe="gespraech"><span class="sym">🗣️</span><span><b>Frage &amp; Antwort</b><br><small>${gespr ? `<b>${gespr} Fragen zum Wiederholen</b>` : "Auf italienische Fragen italienisch antworten"}</small></span></button>
      <button class="kachel breit" data-gehe="fehler"><span class="sym">🎯</span><span><b>Fehler wiederholen</b><br><small>${fehlerZahl ? `<b>${fehlerZahl} Dinge, die oft falsch waren</b>` : "Nur das üben, was oft falsch war"}</small></span></button>
      <button class="kachel" data-gehe="phrasen"><span class="sym">💬</span><b>Phrasen</b><small>Alltagssätze anhören</small></button>
      <button class="kachel breit" data-gehe="claude"><span class="sym">🤖</span><span><b>Mit Claude üben</b><br><small>Rollenspiele, Korrektur, Fragen – über dein Claude-Abo</small></span></button>
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
    speichern(); ohneSprung(neuZeichnen);
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
  $app.querySelectorAll("#richtung button").forEach((b) => (b.onclick = () => { S.einstellungen.richtung = b.dataset.w; speichern(); ohneSprung(kartenMenue); }));
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
  if (!sitzung) return abgelaufen("karten");
  setzeKopf("Karteikarten", sitzung.zurueck || "karten");
  if (sitzung.pos >= sitzung.liste.length) {
    zeige(`<div class="karte"><div class="wort">🎉 Geschafft!</div><p>Du hast ${sitzung.gesamt} Karten geübt.</p></div>
      ${schrittFertig() ? heuteWeiterKnopf() : `<div class="reihe"><button class="btn" data-zurueck="${sitzung.zurueck || "karten"}">Zurück</button><button class="btn zweit" data-heim="1">Startseite</button></div>`}`);
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
           <div class="loesung">${esc(hinten)}</div>${itDe ? "" : lautBtn(k.it)}${hinweisHtml(k)}`
        : tippen
          ? `<input type="text" id="antwort" lang="it" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Italienisch eintippen …" style="text-align:center;margin:6px 0 0">`
          : `<p class="leise">Überlege die Antwort, dann tippe auf „Aufdecken“${SR ? " – oder sprich sie mit 🎤" : ""}.</p>`}
      ${!sitzung.aufgedeckt && SR ? `<div id="kstatus" class="leise" style="min-height:1.2em"></div>` : ""}
    </div>
    ${sitzung.aufgedeckt
      ? `<div class="bewertung">
          ${knopf(0, "b-nochmal", "Nochmal")}${knopf(1, "b-schwer", "Schwer")}${knopf(2, "b-gut", "Gut")}${knopf(3, "b-leicht", "Leicht")}
        </div>
        ${!ein || ein.stufe !== "falsch" ? `<button class="btn zweit voll b-sicher" data-n="4" title="Für Karten, die du schon lange sicher kannst">🏆 Kann ich sicher <small>kommt erst in ${Math.round(naechsterAbstand(zustand(k.id, r), 4) / 30)} Monaten wieder</small></button>` : ""}
        ${ein ? `<p class="leise" style="text-align:center">Der umrandete Knopf ist der Vorschlag der App – du kannst auch anders bewerten.</p>` : ""}`
      : tippen
        ? `<div class="reihe"><button class="btn" id="pruefen">Prüfen</button>${SR ? `<button class="btn zweit" id="ksprechen" title="Antwort sprechen" style="flex:0 0 64px">🎤</button>` : ""}<button class="btn zweit" id="weissnicht">Weiß ich nicht</button></div>`
        : `<div class="reihe" style="margin-top:14px"><button class="btn" id="aufdecken">Aufdecken</button>${SR ? `<button class="btn zweit" id="ksprechen">🎤 Antwort sprechen</button>` : ""}</div>`}
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
  // Antwort sprechen: Italienisch bei Deutsch → Italienisch, Deutsch bei Italienisch → Deutsch
  const ksp = document.getElementById("ksprechen");
  if (ksp) ksp.onclick = () => {
    if (TTS) speechSynthesis.cancel();
    const status = document.getElementById("kstatus");
    zuhoeren({
      sprache: itDe ? "de-DE" : "it-IT",
      start: () => { ksp.classList.add("hoert"); ksp.textContent = "🎤 …"; if (status) status.textContent = `Ich höre zu – sag die Antwort auf ${itDe ? "Deutsch" : "Italienisch"}.`; },
      ergebnis: (alternativen) => {
        const b = besteSprachAntwort(alternativen, k, itDe);
        sitzung.eingabe = { ...b.r, eingabe: "🎤 " + b.t }; sitzung.aufgedeckt = true; karteZeigen();
      },
      fehler: (text) => { if (status) status.textContent = text; ksp.textContent = tippen ? "🎤" : "🎤 Antwort sprechen"; },
      ende: () => ksp.classList.remove("hoert")
    });
  };
  $app.querySelectorAll("[data-n]").forEach((b) => (b.onclick = () => {
    const n = +b.dataset.n;
    if (!sitzung.frei || n === 4) {
      // "Kann ich sicher" bei einer neuen Karte verbraucht keinen Platz bei den neuen Karten des Tages
      if (n !== 4 && sitzung.neuKeys.has(key) && istNeu(k.id, r)) { neueHeuteUebrig(); S.neueHeute.anzahl++; }
      bewerte(k.id, r, n);
      if (n === 4) toast("🏆 Gemerkt – kommt erst in einem halben Jahr wieder.");
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
      ${Object.entries(LUECKEN).map(([id, set]) => `<button class="zeile" data-gehe="uebung/${id}"><span class="sym">🧷</span><span class="mitte">${esc(set.titel)}<small>Lückensätze${hinweis(gFaellig("lk:" + id + ":"))}</small></span><span class="pfeil">›</span></button>`).join("")}
      <button class="zeile" data-gehe="uebung/zahlen"><span class="sym">🔢</span><span class="mitte">Zahlen<small>0 bis 100 und mehr${hinweis(gFaellig("zahl:"))}</small></span><span class="pfeil">›</span></button>
      <button class="zeile" data-gehe="verbsatz"><span class="sym">✍️</span><span class="mitte">Verben im Satz (eintippen)<small>Die Verbform selbst schreiben – wirkt am stärksten${hinweis(gFaellig("vsatz:"))}</small></span><span class="pfeil">›</span></button>
      <button class="zeile" data-gehe="tabellen"><span class="sym">📋</span><span class="mitte">Verbtabellen nachschlagen<small>Alle Formen zum Anhören</small></span><span class="pfeil">›</span></button>
      <button class="zeile" data-gehe="artikel"><span class="sym">🏷️</span><span class="mitte">Artikel üben<small>il, lo, la, l', i, gli, le${hinweis(fa)}</small></span><span class="pfeil">›</span></button>
      <button class="zeile" data-gehe="satzbau"><span class="sym">🧩</span><span class="mitte">Satzbau<small>Wörter in die richtige Reihenfolge bringen${hinweis(fs)}</small></span><span class="pfeil">›</span></button>
      <button class="zeile" data-gehe="cecisono"><span class="sym">📍</span><span class="mitte">c'è / ci sono<small>„es gibt“ – Einzahl oder Mehrzahl?${hinweis(gFaellig("ce:"))}</small></span><span class="pfeil">›</span></button>
    </div>
    <p class="leise">Die App merkt sich deine Fehler: Was du falsch hattest, kommt bald wieder, was sitzt, kommt seltener.</p>
    <h2>Kurz erklärt</h2>
    <details class="hilfe"><summary>Verben im Präsens</summary>${GRAMMATIK_HILFE.verben}</details>
    <details class="hilfe" style="margin-top:8px"><summary>Artikel</summary>${GRAMMATIK_HILFE.artikel}</details>
    <details class="hilfe" style="margin-top:8px"><summary>Satzbau und Verneinung</summary>${GRAMMATIK_HILFE.satz}</details>
    <details class="hilfe" style="margin-top:8px"><summary>c'è / ci sono – „es gibt“</summary>${GRAMMATIK_HILFE.ce}</details>
  `);
}
// Übung c'è / ci sono
function ceAufgabe(x) {
  const gross = /^[A-Z]/.test(x.a);
  const optionen = gross ? ["C'è", "Ci sono"] : ["c'è", "ci sono"];
  const ganz = x.s.replace("___", x.a);
  return {
    frage: `<div class="leise">${esc(x.de)}</div><div class="gross" style="font-size:24px">${esc(x.s).replace("___", "<u>&nbsp;&nbsp;?&nbsp;&nbsp;</u>")}</div>`,
    optionen, richtig: x.a, zwei: true, sprechen: ganz, erklaerung: ganz,
    beiAntwort: (ok) => gBewerte("ce:" + x.s, ok)
  };
}
// Übung "Verben im Satz": Verbform selbst eintippen
function vsatzAufgabe(x) {
  const v = ALLE_VERBEN.find((y) => y.inf === x.inf), richtig = konjugiere(v)[x.p], key = "vsatz:" + x.s;
  const ganz = x.s.replace("___", richtig);
  return {
    frage: `<div class="leise">${esc(x.de)}</div><div class="gross" style="font-size:24px">${esc(x.s).replace("___", "<u>&nbsp;&nbsp;?&nbsp;&nbsp;</u>")}</div><div class="leise">Verb: <b>${esc(x.inf)}</b> (${esc(v.de)})</div>`,
    tippen: true, richtig, sprechen: ganz, erklaerung: ganz,
    beiAntwort: (ok) => gBewerte(key, ok), nichtGewusst: () => gBewerte(key, false)
  };
}
function vsatzStart() {
  const aufgaben = gewichtetZiehen(VERB_SAETZE, (x) => gGewicht("vsatz:" + x.s), 10).map(vsatzAufgabe);
  quizStarten({ aufgaben, pos: 0, punkte: 0, zurueck: "grammatik", titel: "Verben im Satz", nochmal: "verbsatz" });
}
function ceStart() {
  const aufgaben = gewichtetZiehen(CE_CI_SONO, (x) => gGewicht("ce:" + x.s), 10).map(ceAufgabe);
  quizStarten({ aufgaben, pos: 0, punkte: 0, zurueck: "grammatik", titel: "c'è / ci sono", nochmal: "cecisono" });
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
    const aufgaben = gewichtetZiehen(pool, (x) => gGewicht(x.key), 10).map(({ v, p }) => verbAufgabe(v, p));
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
  return m ? { artikel: m[1], nomen: m[2], de: w.de, ganz: w.it, thema: w.thema } : null;
}).filter(Boolean);
function verbAufgabe(v, p) {
  const key = `verb:${v.inf}:${p}`, formen = konjugiere(v), richtig = formen[p];
  const falsche = mischen([...new Set(formen.filter((f) => f !== richtig))]).slice(0, 3);
  return { frage: `<div class="leise">${esc(v.inf)} = ${esc(v.de)}</div><div class="gross">${PERSONEN[p]} ___</div><div class="leise">(${PERSONEN_DE[p]})</div>`,
    optionen: mischen([richtig, ...falsche]), richtig, sprechen: `${PERSONEN[p].split("/")[0]} ${richtig}`, erklaerung: `${PERSONEN[p]} ${richtig}`,
    beiAntwort: (ok) => gBewerte(key, ok) };
}
const artikelAufgabe = (a) => ({
  frage: `<div class="leise">Welcher Artikel passt?</div><div class="gross">___ ${esc(a.nomen)}</div>`,
  optionen: ["il", "lo", "la", "l'", "i", "gli", "le"], richtig: a.artikel, sprechen: a.ganz,
  erklaerung: `${a.ganz} = ${a.de}`, zwei: true, beiAntwort: (ok) => gBewerte("art:" + a.ganz, ok)
});
function artikelStart() {
  const aufgaben = gewichtetZiehen(ARTIKEL_NOMEN, (a) => gGewicht("art:" + a.ganz), 10).map(artikelAufgabe);
  quizStarten({ aufgaben, pos: 0, punkte: 0, zurueck: "grammatik", titel: "Artikel üben", nochmal: "artikel" });
}

// Allgemeines Quiz (Verben, Artikel, Hören)
function quizStarten(q) {
  quiz = q;
  if (location.hash === "#quiz") quizZeigen();
  else if (["#artikel", "#cecisono", "#verbsatz"].includes(location.hash) || location.hash.startsWith("#uebung/")) ersetzeDurch("quiz"); // sonst startet "Zurück" sofort ein neues Quiz
  else geheZu("quiz");
}
function quizZeigen() {
  if (!quiz) return abgelaufen("start");
  setzeKopf(quiz.titel, quiz.zurueck);
  if (quiz.pos >= quiz.aufgaben.length) {
    const n = quiz.aufgaben.length, p = quiz.punkte;
    if (quiz.beimEnde && !quiz.endeErledigt) { quiz.endeErledigt = true; quiz.beimEnde(p, n); }
    const ausHeute = schrittFertig();
    zeige(`<div class="karte"><div class="wort">${p === n ? "🏆" : p >= n * 0.7 ? "👍" : "💪"} ${p} von ${n}</div>
      <p>${p === n ? "Perfetto! Alles richtig." : p >= n * 0.7 ? "Bravo! Sehr gut." : "Weiter üben – das wird!"}</p>
      ${p < n ? `<p class="leise">Die Fehler hat sich die App gemerkt – sie kommen bald wieder.</p>` : ""}</div>
      ${quiz.endeHinweis ? quiz.endeHinweis(p, n) : ""}
      ${ausHeute ? heuteWeiterKnopf() : `<div class="reihe"><button class="btn" id="nochmal">Nochmal</button><button class="btn zweit" data-zurueck="${quiz.zurueck}">Zurück</button></div>`}`);
    const nm = document.getElementById("nochmal");
    if (nm) nm.onclick = () => { const z = quiz.nochmal || quiz.zurueck; quiz = null; z === "artikel" ? artikelStart() : z === "cecisono" ? ceStart() : z === "verbsatz" ? vsatzStart() : z === "hoeren-neu" ? hoerenStart() : geheZu(z); };
    return;
  }
  const a = quiz.aufgaben[quiz.pos];
  const antwortHtml = a.tippen
    ? `<div class="reihe" style="flex-wrap:nowrap;margin-top:0"><input type="text" id="qtipp" lang="it" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Antwort eintippen …" style="margin:0;flex:1">${SR ? `<button class="btn zweit" id="qsprechen" title="Antwort sprechen" style="flex:none">🎤</button>` : ""}<button class="btn" id="qpruefen" style="flex:none">Prüfen</button></div><div id="qstatus" class="leise"></div>`
    : `<div class="optionen${a.zwei ? " zwei" : ""}">${a.optionen.map((o) => `<button data-o="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
  zeige(`${fortschrittsLeiste(quiz.pos + 1, quiz.aufgaben.length)}
    <div class="frage">${a.frage}</div>
    ${antwortHtml}
    <div id="rueck"></div>
    ${a.nichtGewusst ? `<div class="reihe"><button class="btn zweit voll" id="nichtGewusst" style="border-color:var(--rot);color:var(--rot)">🙈 Nicht gewusst – öfter üben</button></div>` : ""}`);
  if (a.beimStart) a.beimStart();
  let beantwortet = false, richtigGezaehlt = false;
  const aufloesen = (ok, text, gewaehlt) => {
    $app.querySelectorAll("[data-o]").forEach((x) => { if (x.dataset.o === a.richtig) x.classList.add("richtig"); });
    if (gewaehlt && !ok) gewaehlt.classList.add("falsch");
    if (a.sprechen) sprich(a.sprechen);
    document.getElementById("rueck").innerHTML = `<div class="meldung ${ok ? "gut" : "schlecht"}">${text} <b>${esc(a.erklaerung)}</b></div>
      <button class="btn voll" id="weiter">Weiter</button>`;
    document.getElementById("weiter").onclick = () => { quiz.pos++; quizZeigen(); };
  };
  $app.querySelectorAll("[data-o]").forEach((b) => (b.onclick = () => {
    if (beantwortet) return; beantwortet = true;
    const ok = b.dataset.o === a.richtig;
    if (ok) { quiz.punkte++; richtigGezaehlt = true; }
    if (a.beiAntwort) a.beiAntwort(ok); else geuebt();
    aufloesen(ok, ok ? "✅ Richtig!" : "❌ Leider falsch.", b);
  }));
  // Eintippen: tolerant bei Groß-/Kleinschreibung; fehlender Akzent zählt als richtig, mit Hinweis
  const feld = document.getElementById("qtipp");
  if (feld) {
    feld.focus();
    const pruefen = () => {
      if (beantwortet || !feld.value.trim()) return;
      beantwortet = true; feld.disabled = true;
      const e = saeubern(feld.value), z = saeubern(a.richtig);
      const ok = e === z || ohneAkzente(e) === ohneAkzente(z);
      if (ok) { quiz.punkte++; richtigGezaehlt = true; }
      if (a.beiAntwort) a.beiAntwort(ok); else geuebt();
      aufloesen(ok, ok ? (e === z ? "✅ Richtig!" : "✅ Richtig – achte noch auf den Akzent:") : `❌ Leider falsch (du: „${esc(feld.value.trim())}“). Richtig:`);
    };
    feld.onkeydown = (ev) => { if (ev.key === "Enter") pruefen(); };
    document.getElementById("qpruefen").onclick = pruefen;
    // Antwort sprechen: der passendste Erkennungs-Vorschlag kommt ins Feld und wird gleich geprüft
    const qsp = document.getElementById("qsprechen");
    if (qsp) qsp.onclick = () => {
      const status = document.getElementById("qstatus");
      zuhoeren({
        start: () => { qsp.classList.add("hoert"); status.textContent = "Ich höre zu – sag die Antwort auf Italienisch."; },
        ergebnis: (alt) => {
          const z = ohneAkzente(saeubern(a.richtig));
          // oft erkennt das Handy ganze Sätze – dann das passende Wort darin suchen
          const genau = alt.find((t) => ohneAkzente(saeubern(t)) === z);
          const imSatz = alt.find((t) => (" " + ohneAkzente(saeubern(t)) + " ").includes(" " + z + " "));
          feld.value = genau || (imSatz ? a.richtig : alt[0]);
          status.textContent = "Verstanden: „" + alt[0] + "“"; pruefen();
        },
        fehler: (text) => { status.textContent = text; },
        ende: () => qsp.classList.remove("hoert")
      });
    };
  }
  const ng = document.getElementById("nichtGewusst");
  if (ng) ng.onclick = () => {
    ng.disabled = true; ng.textContent = "✓ Gemerkt – kommt öfter wieder";
    if (!beantwortet || richtigGezaehlt) a.nichtGewusst(); // falsche Antwort ist schon als Fehler gezählt
    if (!beantwortet) { beantwortet = true; aufloesen(false, "🙈 Kein Problem – so ist es richtig:"); }
    else if (richtigGezaehlt) { quiz.punkte--; richtigGezaehlt = false; } // geraten zählt nicht als gewusst
    toast("Gemerkt – kommt öfter wieder.");
  };
}

// Satzbau
let satz = null;
function satzbauStart(pool) {
  pool = pool && pool.length ? pool : SAETZE_LISTE;
  const s = gewichtetZiehen(pool, (x) => gGewicht("satz:" + x.it), 1)[0];
  const woerter = s.it.replace(/[.?!]$/, "").split(" ");
  let gemischt = mischen(woerter.map((w, i) => ({ w, i })));
  if (gemischt.every((x, i) => x.i === i)) gemischt = gemischt.reverse();
  satz = { s, woerter, gemischt, gewaehlt: [], geprueft: false, pool };
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
  const n = document.getElementById("neu"); if (n) n.onclick = () => satzbauStart(satz.pool === SAETZE_LISTE ? null : schwacheSaetze());
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
  const aufgaben = gewichtetZiehen(pool, (k) => gewicht(k.id, "it-de"), 10).map((k) => hoerAufgabe(k, pool));
  quizStarten({ aufgaben, pos: 0, punkte: 0, zurueck: "hoeren", titel: "Hören", nochmal: "hoeren-neu" });
}
function hoerAufgabe(k, pool) {
  const falsche = mischen([...new Set(pool.filter((x) => x.de !== k.de).map((x) => x.de))]).slice(0, 3);
  return {
    frage: `<div class="leise">Was bedeutet das?</div>
      <div class="mitte-zentriert" style="margin:8px 0;flex-direction:row;justify-content:center">${lautBtn(k.it)}${langsamBtn(k.it)}</div>`,
    optionen: mischen([k.de, ...falsche]), richtig: k.de, erklaerung: `${k.it} = ${k.de}`,
    beimStart: () => setTimeout(() => sprich(k.it), 250),
    // Neue Phrase richtig erkannt → als Karteikarte aufnehmen (wie "Gut": kommt in 2 Tagen wieder)
    beiAntwort: (ok) => { if (ok && istNeu(k.id, "it-de")) bewerte(k.id, "it-de", 2); else { rueckmeldung(k.id, "it-de", ok); geuebt(); } },
    nichtGewusst: () => { if (zustand(k.id, "it-de")) rueckmeldung(k.id, "it-de", false); else bewerte(k.id, "it-de", 0); }
  };
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
    <button class="btn voll" id="sLos" ${kartenDerThemen(S.einstellungen.themen).length ? "" : "disabled"}>🎤 Sprechen starten (${kartenDerThemen(S.einstellungen.themen).length} Einträge)</button>
    <h2>Was möchtest du sprechen?</h2>
    <p class="leise">Themen antippen, mehrere sind möglich. Dieselbe Auswahl wie bei den Karteikarten und beim Hören.</p>
    <h2>Phrasen</h2>${themenAuswahl(PHRASEN_GRUPPEN, S.einstellungen.themen)}
    <h2>Wortschatz</h2>${themenAuswahl(THEMEN, S.einstellungen.themen)}`);
  $app.querySelectorAll("#smodus button").forEach((b) => (b.onclick = () => { S.einstellungen.sprechenModus = b.dataset.w; speichern(); ohneSprung(sprechenMenue); }));
  themenKlickbar(sprechenMenue);
  document.getElementById("sLos").onclick = () => sprechenStarten(kartenDerThemen(S.einstellungen.themen));
}
function sprechenZeigen() {
  if (!sprechen) return abgelaufen("sprechen");
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
    </div>
    <div class="reihe" style="margin-top:0">
      ${sprechen.nichtGewusst
        ? `<button class="btn zweit voll" disabled>✓ Gemerkt – kommt öfter wieder</button>`
        : `<button class="btn zweit voll" id="nichtGewusst" style="border-color:var(--rot);color:var(--rot)">🙈 Nicht gewusst – öfter üben</button>`}
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
        if (verdeckt && !sprechen.gezeigt && !sprechen.gewertet) {
          sprechen.gewertet = true;
          const ok = beste.v.prozent >= 80;
          // neue Phrase richtig aus dem Gedächtnis gesagt → als Karteikarte "selbst sagen" aufnehmen (wie "Gut": in 2 Tagen)
          if (ok && istNeu(k.id, "de-it")) bewerte(k.id, "de-it", 2); else rueckmeldung(k.id, "de-it", ok);
        }
        geuebt();
        sprechenZeigen();
        if (beste.v.prozent < 90) setTimeout(() => sprich(k.it), 500);
      },
      fehler: (text) => { mikro.classList.remove("hoert"); status.textContent = text; sprechen.status = ""; },
      ende: () => mikro.classList.remove("hoert")
    });
  };
  const wechsel = (pos) => { sprechen.pos = pos; sprechen.ergebnis = null; sprechen.status = ""; sprechen.gezeigt = false; sprechen.gewertet = false; sprechen.vorgelesen = false; sprechen.nichtGewusst = false; sprechenZeigen(); };
  // Von Hand als "nicht gewusst" markieren: zählt als Fehler für "selbst sagen" und für die Auswahl beim Sprechen
  const ng = document.getElementById("nichtGewusst");
  if (ng) ng.onclick = () => {
    sprechen.nichtGewusst = true; sprechen.gewertet = true;
    if (zustand(k.id, "de-it")) rueckmeldung(k.id, "de-it", false);
    else bewerte(k.id, "de-it", 0); // noch nie gelernt: als Karteikarte aufnehmen, kommt gleich dran
    const a = S.aussprache[k.id] || { versuche: 0, bester: 0, letzter: 0 };
    a.letzter = 0; S.aussprache[k.id] = a; speichern();
    toast("Gemerkt – der Satz kommt öfter wieder.");
    sprechenZeigen();
  };
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
const GESPRAECH_THEMEN = GESPRAECH.map((t, ti) => ({ ...t, id: "g" + ti, fragen: t.fragen.map((q) => ({ ...q, key: "dialog:" + (q.id || q.f), muster: q.m.map(musterBauen) })) }));
const ALLE_FRAGEN = GESPRAECH_THEMEN.flatMap((t) => t.fragen);
// Antworten, die man selbst als richtig markiert hat (auf diesem Gerät), in vereinfachter Schreibweise
const antwortNorm = (t) => woerterVon(t).map((x) => x.n).join(" ");
function eigeneAntworten(key) {
  const abgelehnt = ((window.ABGELEHNTE_ANTWORTEN || {})[key] || []).map(antwortNorm);
  return ((S.eigeneAntworten || {})[key] || []).filter((a) => !abgelehnt.includes(a));
}
function pruefeAntwort(q, texte) {
  for (const t of texte) {
    const T = woerterVon(t).map((x) => x.n);
    if (T.length && q.muster.some((M) => musterPasst(M, T))) return { stufe: "richtig", text: t };
    if (T.length && eigeneAntworten(q.key).includes(T.join(" "))) return { stufe: "richtig", text: t, eigene: true };
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
  $app.querySelectorAll("#gtext button").forEach((b) => (b.onclick = () => { S.einstellungen.gespraechText = b.dataset.w === "ja"; speichern(); ohneSprung(gespraechMenue); }));
  const starten = (fragen, n) => {
    gespraech = { liste: gewichtetZiehen(fragen, (q) => gGewicht(q.key), n), pos: 0 };
    neueFrage(); geheZu("gespraech-ueben");
  };
  document.getElementById("alle").onclick = () => starten(ALLE_FRAGEN, 10);
  $app.querySelectorAll("[data-gthema]").forEach((b) => (b.onclick = () => { const t = GESPRAECH_THEMEN.find((x) => x.id === b.dataset.gthema); starten(t.fragen, t.fragen.length); }));
}
function neueFrage() { Object.assign(gespraech, { ergebnis: null, gewertet: false, korrigiert: false, textGezeigt: false, deGezeigt: false, tippGezeigt: false, vorgelesen: false, status: "", nichtGewusst: false, alsRichtigGezaehlt: false }); }
function gespraechZeigen() {
  if (!gespraech) return abgelaufen("gespraech");
  setzeKopf("Frage & Antwort", "gespraech");
  if (gespraech.pos >= gespraech.liste.length) {
    zeige(`<div class="karte"><div class="wort">🎉 Bravo!</div><p>Du hast ${gespraech.liste.length} Fragen beantwortet.</p></div>
      ${schrittFertig() ? heuteWeiterKnopf() : `<div class="reihe"><button class="btn" data-zurueck="${gespraech.zurueck || "gespraech"}">${gespraech.zurueck ? "Zurück" : "Zurück zu den Themen"}</button><button class="btn zweit" data-heim="1">Startseite</button></div>`}`);
    gespraech = null; return;
  }
  const q = gespraech.liste[gespraech.pos], g = gespraech, e = g.ergebnis;
  const frageSichtbar = S.einstellungen.gespraechText || g.textGezeigt || !!e;
  let ergebnisHtml = "";
  if (e) {
    const kopf = e.stufe === "richtig" ? (e.eigene ? "✅ Richtig – diese Antwort hast du als richtig markiert." : "✅ Richtig – gute Antwort!") :e.stufe === "fast" ? "🟠 Fast – vergleiche mit der Beispielantwort." : "❌ Das passt noch nicht.";
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
    </div>
    <div class="reihe" style="margin-top:0">
      ${g.nichtGewusst
        ? `<button class="btn zweit voll" disabled>✓ Gemerkt – kommt öfter wieder</button>`
        : `<button class="btn zweit voll" id="nichtGewusst" style="border-color:var(--rot);color:var(--rot)">🙈 Nicht gewusst – öfter üben</button>`}
    </div>`);
  if (!g.vorgelesen) { g.vorgelesen = true; setTimeout(() => sprich(q.f), 300); }
  const auswerten = (texte) => {
    const r = pruefeAntwort(q, texte);
    g.ergebnis = r;
    if (!g.gewertet) { g.gewertet = true; g.alsRichtigGezaehlt = r.stufe === "richtig"; gBewerte(q.key, g.alsRichtigGezaehlt); } else geuebt();
    gespraechZeigen();
    setTimeout(() => sprich(r.stufe === "richtig" ? "Bravo!" : q.b), 400);
  };
  const klick = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
  klick("textZeigen", () => { g.textGezeigt = true; gespraechZeigen(); });
  klick("deZeigen", () => { g.deGezeigt = true; gespraechZeigen(); });
  klick("tipp", () => { g.tippGezeigt = true; gespraechZeigen(); sprich(q.b); });
  klick("naechste", () => { g.pos++; neueFrage(); gespraechZeigen(); });
  klick("nichtGewusst", () => {
    g.nichtGewusst = true;
    if (!g.gewertet) { g.gewertet = true; gBewerte(q.key, false); }
    else if (g.alsRichtigGezaehlt) { // schon als richtig gezählt → zurücknehmen
      const st = S.grammatik[q.key];
      if (st) { st.richtig = Math.max(0, st.richtig - 1); st.falsch++; st.intervall = 0; st.faellig = Date.now(); speichern(); }
    }
    g.alsRichtigGezaehlt = false;
    if (!g.ergebnis) g.tippGezeigt = true; // Beispielantwort zeigen
    toast("Gemerkt – die Frage kommt öfter wieder.");
    gespraechZeigen();
    if (!g.ergebnis) sprich(q.b);
  });
  klick("nochmalAntworten", () => { g.ergebnis = null; g.status = ""; gespraechZeigen(); });
  klick("warRichtig", () => {
    g.korrigiert = true;
    const st = S.grammatik[q.key]; if (st) { st.falsch = Math.max(0, st.falsch - 1); speichern(); }
    gBewerte(q.key, true); g.alsRichtigGezaehlt = true;
    // Antwort merken: ab jetzt auf diesem Gerät als richtig erkannt – und zur Prüfung an Claude schicken
    const text = (g.ergebnis.text || "").trim(), norm = antwortNorm(text);
    if (norm) {
      S.eigeneAntworten = S.eigeneAntworten || {};
      const liste = (S.eigeneAntworten[q.key] = S.eigeneAntworten[q.key] || []);
      if (!liste.includes(norm)) liste.push(norm);
      antwortZurPruefung(q, text);
    }
    g.ergebnis = { ...g.ergebnis, stufe: "richtig", eigene: true }; gespraechZeigen();
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

// ---------- Hör-Dialoge ----------
const DIALOG_LISTE = DIALOGE.map((d) => {
  const zeilen = String(d.text).split("\n").map((z) => z.trim()).filter((z) => z.includes("|"))
    .map((z) => { const [wer, it, de] = z.split("|").map((s) => s.trim()); return { wer, it, de }; });
  const sprecher = [...new Set(zeilen.map((z) => z.wer))];
  return { ...d, zeilen, sprecher, key: "dlg:" + d.id };
});
const dialogGemacht = (d) => !!S.grammatik[d.key];
function naechsterDialog() {
  return DIALOG_LISTE.find((d) => !dialogGemacht(d)) || gewichtetZiehen(DIALOG_LISTE, (d) => gGewicht(d.key), 1)[0];
}
let dialogAnsicht = { text: false, de: false, offen: new Set(), langsam: false, laeuft: false };
function dialogeMenue() {
  setzeKopf("Hör-Dialoge", "start");
  zeige(`
    <p>Kurze Alltagsgespräche zum Anhören. Erst <b>nur hören</b> und verstehen versuchen, dann den Text aufdecken, zum Schluss drei Fragen beantworten.</p>
    <div class="liste">${DIALOG_LISTE.map((d) => {
      const g = S.grammatik[d.key];
      const stand = !g ? "neu" : g.faellig <= Date.now() ? "<b>zum Wiederholen</b>" : "✓ gemacht";
      return `<button class="zeile" data-gehe="dialog/${d.id}"><span class="sym">${d.icon}</span><span class="mitte">${esc(d.titel)}<small>${esc(d.situation)} · ${stand}</small></span><span class="pfeil">›</span></button>`;
    }).join("")}</div>`);
}
function dialogStimme(d, wer) {
  const i = d.sprecher.indexOf(wer);
  const it = stimmen.filter((v) => v.lang === "it-IT");
  const auswahl = it.length >= 2 ? it : stimmen;
  return { voice: auswahl.length ? auswahl[i % auswahl.length] : null, pitch: auswahl.length >= 2 ? 1 : (i % 2 ? 0.8 : 1.15) };
}
function dialogAbspielen(d, ab, nurEine) {
  if (!TTS) return toast("Dieses Gerät kann nicht vorlesen.");
  const meinLauf = (dialogAnsicht.lauf = (dialogAnsicht.lauf || 0) + 1); // ältere Abläufe stoppen sich dann selbst
  speechSynthesis.cancel();
  dialogAnsicht.laeuft = true;
  let i = ab;
  const markieren = (n) => document.querySelectorAll("[data-zeile]").forEach((el) => el.classList.toggle("aktiv", +el.dataset.zeile === n));
  const naechste = () => {
    if (dialogAnsicht.lauf !== meinLauf) return;
    if (!dialogAnsicht.laeuft || i >= d.zeilen.length || (nurEine && i > ab)) { dialogAnsicht.laeuft = false; markieren(-1); knopfAktualisieren(); return; }
    const z = d.zeilen[i], st = dialogStimme(d, z.wer);
    const u = new SpeechSynthesisUtterance(z.it);
    u.lang = "it-IT"; if (st.voice) u.voice = st.voice; u.pitch = st.pitch;
    u.rate = dialogAnsicht.langsam ? 0.65 : S.einstellungen.tempo;
    markieren(i);
    u.onend = u.onerror = () => { i++; setTimeout(naechste, nurEine ? 0 : 450); };
    speechSynthesis.speak(u);
  };
  const knopfAktualisieren = () => { const k = document.getElementById("abspielen"); if (k) k.textContent = dialogAnsicht.laeuft ? "⏹ Stopp" : "▶ Ganzen Dialog abspielen"; };
  knopfAktualisieren();
  naechste();
}
function dialogZeigen(id) {
  const d = DIALOG_LISTE.find((x) => x.id === id);
  if (!d) return geheZu("dialoge");
  if (dialogAnsicht.id !== id) dialogAnsicht = { id, text: false, de: false, offen: new Set(), langsam: false, laeuft: false };
  const A = dialogAnsicht;
  setzeKopf(d.titel, "dialoge");
  zeige(`
    <div class="frage" style="text-align:left"><div class="leise">${d.icon} Situation</div><div>${esc(d.situation)}</div></div>
    <div class="reihe">
      <button class="btn" id="abspielen">${A.laeuft ? "⏹ Stopp" : "▶ Ganzen Dialog abspielen"}</button>
    </div>
    ${umschalter("tempo", A.langsam ? "langsam" : "normal", [["normal", "Normal"], ["langsam", "🐢 Langsam"]])}
    ${umschalter("anzeige", A.de ? "de" : A.text ? "it" : "nichts", [["nichts", "Nur hören"], ["it", "Italienisch"], ["de", "+ Deutsch"]])}
    <p class="leise">Tipp: Erst ein- oder zweimal nur hören. Eine Zeile antippen spielt sie einzeln ab${A.text ? "" : " und deckt sie auf"}.</p>
    <div class="liste">${d.zeilen.map((z, i) => {
      const zeigeIt = A.text || A.offen.has(i);
      return `<div class="eintrag dialogzeile" data-zeile="${i}" style="cursor:pointer;align-items:flex-start">
        <div class="mitte"><div class="leise" style="font-size:13px">${esc(z.wer)}</div>
        <div class="it">${zeigeIt ? esc(z.it) : `<span class="leise">• • • (antippen)</span>`}</div>
        ${A.de && zeigeIt ? `<div class="de">${esc(z.de)}</div>` : ""}</div></div>`;
    }).join("")}</div>
    <button class="btn voll" id="fragen" style="margin-top:14px">❓ Fragen zum Dialog beantworten</button>`);
  document.getElementById("abspielen").onclick = () => {
    if (A.laeuft) { A.laeuft = false; speechSynthesis.cancel(); ohneSprung(() => dialogZeigen(id)); } else dialogAbspielen(d, 0);
  };
  $app.querySelectorAll("#tempo button").forEach((b) => (b.onclick = () => { A.langsam = b.dataset.w === "langsam"; ohneSprung(() => dialogZeigen(id)); }));
  $app.querySelectorAll("#anzeige button").forEach((b) => (b.onclick = () => { A.text = b.dataset.w !== "nichts"; A.de = b.dataset.w === "de"; ohneSprung(() => dialogZeigen(id)); }));
  $app.querySelectorAll("[data-zeile]").forEach((el) => (el.onclick = () => {
    const i = +el.dataset.zeile;
    if (!A.offen.has(i)) { A.offen.add(i); ohneSprung(() => dialogZeigen(id)); }
    A.laeuft = false; dialogAbspielen(d, i, true);
  }));
  document.getElementById("fragen").onclick = () => {
    A.laeuft = false; if (TTS) speechSynthesis.cancel();
    const aufgaben = d.fragen.map((f) => ({
      frage: `<div class="leise">${d.icon} ${esc(d.titel)}</div><div style="font-size:21px;font-weight:600">${esc(f.f)}</div>`,
      optionen: mischen(f.o), richtig: f.o[f.r], erklaerung: f.o[f.r]
    }));
    quizStarten({ aufgaben, pos: 0, punkte: 0, zurueck: heuteAktiv === "dialog" ? "heute" : "dialoge", titel: d.titel, nochmal: "dialog/" + d.id,
      beimEnde: (p, n) => gBewerte(d.key, p === n) });
  };
}

// ---------- Weitere Grammatik-Übungen: Lückensätze und Zahlen ----------
function lueckeAufgabe(setId, x) {
  const set = LUECKEN[setId], key = "lk:" + setId + ":" + x.s;
  const amAnfang = x.s.startsWith("___");
  const gross = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const optionen = x.o ? mischen(x.o) : set.optionen.map((o) => (amAnfang ? gross(o) : o));
  const ganz = x.s.replace("___", x.a).replace(" → ", ", ");
  return {
    frage: `<div class="leise">${esc(x.de)}</div><div class="gross" style="font-size:24px">${esc(x.s).replace("___", "<u>&nbsp;&nbsp;?&nbsp;&nbsp;</u>")}</div>`,
    optionen, richtig: x.a, zwei: optionen.length !== 3, sprechen: ganz, erklaerung: x.s.replace("___", x.a),
    beiAntwort: (ok) => gBewerte(key, ok), nichtGewusst: () => gBewerte(key, false)
  };
}
const ZAHLEN_POOL = Array.from({ length: 101 }, (_, i) => i).concat([200, 500, 1000]);
function zahlAufgabe(n) {
  const key = "zahl:" + n;
  const nahe = [...new Set([n + 1, n - 1, n + 10, n - 10, (n % 10) * 10 + Math.floor(n / 10), n + 2].filter((x) => x >= 0 && x !== n && x <= 1000))];
  const optionen = mischen([n, ...mischen(nahe).slice(0, 3)].map(zahlMitAkzent));
  return {
    frage: `<div class="leise">Wie heißt diese Zahl auf Italienisch?</div><div class="gross" style="font-size:44px">${n}</div>`,
    optionen, richtig: zahlMitAkzent(n), sprechen: zahlMitAkzent(n), erklaerung: `${n} = ${zahlMitAkzent(n)}`,
    beiAntwort: (ok) => gBewerte(key, ok), nichtGewusst: () => gBewerte(key, false)
  };
}
// Übungs-Topf einer Lektion (oder einer einzelnen Übung): Liste von { key, bau }
function grammatikTopf(specs, themen) {
  const topf = [];
  specs.forEach((sp, gi) => {
    if (sp.verben) sp.verben.forEach((inf) => {
      const v = ALLE_VERBEN.find((x) => x.inf === inf); if (!v) return;
      [0, 1, 2, 3, 4, 5].forEach((p) => topf.push({ gruppe: gi, key: `verb:${inf}:${p}`, bau: () => verbAufgabe(v, p) }));
      VERB_SAETZE.filter((x) => x.inf === inf).forEach((x) => topf.push({ gruppe: gi, key: "vsatz:" + x.s, bau: () => vsatzAufgabe(x) }));
    });
    if (sp.artikel) {
      let liste = themen ? ARTIKEL_NOMEN.filter((a) => themen.includes(a.thema)) : ARTIKEL_NOMEN;
      if (liste.length < 6) liste = ARTIKEL_NOMEN;
      liste.forEach((a) => topf.push({ gruppe: gi, key: "art:" + a.ganz, bau: () => artikelAufgabe(a) }));
    }
    if (sp.ce) CE_CI_SONO.forEach((x) => topf.push({ gruppe: gi, key: "ce:" + x.s, bau: () => ceAufgabe(x) }));
    if (sp.zahlen) ZAHLEN_POOL.forEach((n) => topf.push({ gruppe: gi, key: "zahl:" + n, bau: () => zahlAufgabe(n) }));
    if (sp.luecke && LUECKEN[sp.luecke]) LUECKEN[sp.luecke].saetze.forEach((x) => topf.push({ gruppe: gi, key: "lk:" + sp.luecke + ":" + x.s, bau: () => lueckeAufgabe(sp.luecke, x) }));
  });
  return topf;
}
// Zieht n Aufgaben – abwechselnd aus jedem Grammatik-Schwerpunkt, damit ein großer (z. B. Zahlen) die anderen nicht verdrängt
function ausTopf(topf, n) {
  const gruppen = Object.values(topf.reduce((g, x) => ((g[x.gruppe || 0] = g[x.gruppe || 0] || []).push(x), g), {})).map(mischen);
  const aus = [];
  for (let i = 0; aus.length < n && gruppen.some((g) => g.length); i++) {
    const g = gruppen[i % gruppen.length]; if (!g.length) continue;
    const x = gewichtetZiehen(g, (y) => gGewicht(y.key), 1)[0];
    g.splice(g.indexOf(x), 1); aus.push(x);
  }
  return mischen(aus).map((x) => x.bau());
}
function uebungStarten(titel, specs, zurueck, nochmal) {
  quizStarten({ aufgaben: ausTopf(grammatikTopf(specs), 10), pos: 0, punkte: 0, zurueck, titel, nochmal });
}

// ---------- Lektionen: aufbauender Lernpfad ----------
const LEKTION_LISTE = LEKTIONEN.map((l, i) => ({ ...l, nr: i + 1 }));
const LEKTION_NACH_ID = Object.fromEntries(LEKTION_LISTE.map((l) => [l.id, l]));
const LEKTION_SCHRITTE = [
  { id: "erkl", sym: "📖", name: "Kurz erklärt", text: "Worum es geht, die Grammatik in einfachen Worten" },
  { id: "woerter", sym: "🗂️", name: "Neue Wörter", text: "Wörter und Sätze der Lektion als Karteikarten" },
  { id: "grammatik", sym: "📘", name: "Grammatik", text: "Übungen zum Grammatik-Schwerpunkt" },
  { id: "dialog", sym: "🎧", name: "Hör-Dialog", text: "Ein kurzes Gespräch zum Thema" },
  { id: "sprechen", sym: "🗣️", name: "Sprechen", text: "Fragen zum Thema auf Italienisch beantworten" },
  { id: "check", sym: "🏁", name: "Abschluss-Check", text: "10 gemischte Aufgaben – ab 80 % geschafft" }
];
let lektionAktiv = null, lektionTiefe = null;
function lStand(id) { S.lektionen = S.lektionen || {}; return (S.lektionen[id] = S.lektionen[id] || { schritte: [], bestanden: false, best: 0 }); }
const aktuelleLektion = () => LEKTION_LISTE.find((l) => !lStand(l.id).bestanden) || null;
const offeneSchritte = (L) => LEKTION_SCHRITTE.filter((s) => !lStand(L.id).schritte.includes(s.id) && !(s.id === "check" && lStand(L.id).bestanden));
// Karten einer Lektion = Kernwortschatz (vorhandene Wörter/Sätze, über den italienischen Text gefunden) + eigene Lektions-Gruppe
const KARTE_NACH_TEXT = {};
ALLE_KARTEN.forEach((k) => { if (!k.thema.startsWith("lk_") && !KARTE_NACH_TEXT[k.it]) KARTE_NACH_TEXT[k.it] = k; });
function lektionKarten(L) {
  if (!L.kern && !L.neu) return kartenDerThemen(L.themen);
  // über die feste Kennung (bleibt beim Bearbeiten gleich); alte Einträge mit reinem Text gehen zur Sicherheit auch
  const kern = (L.kern || []).map((t) => KARTE_NACH_ID[t] || KARTE_NACH_TEXT[t]).filter(Boolean);
  const eigene = GRUPPE_NACH_ID["lk_" + L.id] ? GRUPPE_NACH_ID["lk_" + L.id].eintraege : [];
  return [...new Map(kern.concat(eigene).map((k) => [k.id, k])).values()];
}
// Fragen über ihre feste Kennung (id; bei noch nie bearbeiteten Fragen ist das der ursprüngliche Fragetext)
const lektionFragen = (L) => L.fragen.map((f) => ALLE_FRAGEN.find((q) => (q.id || q.f) === f) || ALLE_FRAGEN.find((q) => q.f === f)).filter(Boolean);
function lektionWoerterStand(L) {
  const karten = lektionKarten(L);
  return { gesamt: karten.length, kennen: karten.filter((k) => !istNeu(k.id, "it-de")).length };
}
function lektionenMenue() {
  setzeKopf("Lektionen", "start");
  lektionAktiv = null;
  const akt = aktuelleLektion(), geschafft = LEKTION_LISTE.filter((l) => lStand(l.id).bestanden).length;
  zeige(`
    <div class="meldung info">🎓 <b>Niveau A1</b> – Diese 12 Lektionen decken den Stoff von A1 ab, der ersten Stufe des europäischen Sprachrahmens. Wenn du alle geschafft hast, kannst du dich vorstellen, einkaufen, bestellen, nach dem Weg fragen, über Familie, Alltag und Freizeit sprechen und einfache Gespräche verstehen.</div>
    <p>Jede Lektion hat Erklärung, Wörter, Grammatik, Hör-Dialog, Sprechen und einen kleinen Abschluss-Check. Alle sind offen: Du kannst jederzeit springen.</p>
    <div class="fortschritt"><span>${geschafft} / ${LEKTION_LISTE.length} geschafft</span><div class="balken"><i style="width:${(100 * geschafft) / LEKTION_LISTE.length}%"></i></div></div>
    <div class="liste">${LEKTION_LISTE.map((L) => {
      const st = lStand(L.id), fertig = st.schritte.filter((s) => s !== "check").length;
      const status = st.bestanden ? `✓ geschafft (${st.best} %)` : L === akt ? `<b>▶ empfohlen</b> · ${fertig} von 5 Schritten` : fertig ? `${fertig} von 5 Schritten` : "noch nicht begonnen";
      return `<button class="zeile${st.bestanden ? " aktiv" : ""}" data-gehe="lektion/${L.id}"><span class="sym">${L.icon}</span>
        <span class="mitte">${L.nr}. ${esc(L.titel)}<small>${status}</small></span><span class="pfeil">›</span></button>`;
    }).join("")}</div>
    <p class="leise" style="margin-top:14px">Danach kommt <b>A2</b>: die Vergangenheit (ho mangiato, sono andato), „mir/dir/ihm“-Wörter (mi, ti, gli …), mehr reflexive Verben, Vergleiche (più grande di …) und die Zukunft – sag Bescheid, wenn du so weit bist.</p>`);
}
function lektionZeigen(id) {
  const L = LEKTION_NACH_ID[id]; if (!L) return geheZu("lektionen");
  setzeKopf(`Lektion ${L.nr}`, "lektionen");
  lektionAktiv = null; lektionTiefe = tiefeJetzt();
  const st = lStand(L.id), offen = offeneSchritte(L), w = lektionWoerterStand(L);
  zeige(`
    <div class="frage" style="text-align:left">
      <div style="font-size:24px;font-weight:700">${L.icon} ${esc(L.titel)}</div>
      <p style="margin-bottom:0">🎯 ${esc(L.ziel)}</p>
      ${st.bestanden ? `<div class="meldung gut" style="margin-bottom:0">✓ Lektion geschafft – Abschluss-Check: ${st.best} %</div>` : ""}
    </div>
    ${offen.length ? `<button class="btn voll" id="lWeiter" style="min-height:64px;font-size:20px;margin-bottom:12px">▶ ${st.schritte.length ? "Weiter" : "Los geht's"}: ${offen[0].sym} ${offen[0].name}</button>` : ""}
    <div class="liste">${LEKTION_SCHRITTE.map((s, i) => {
      const erledigt = st.schritte.includes(s.id) || (s.id === "check" && st.bestanden);
      const extra = s.id === "woerter" ? ` · ${w.kennen} von ${w.gesamt} kennengelernt` : "";
      // Abschluss-Check: nach dem ersten Versuch das letzte Ergebnis statt „ab 80 %“ zeigen
      const zul = st.zuletzt != null ? st.zuletzt : (st.best || null); // ältere Stände kennen nur das beste Ergebnis
      const text = s.id === "check" && zul != null
        ? `10 gemischte Aufgaben · <b>zuletzt ${zul} %</b>${st.best && st.best !== zul ? ` · bestes ${st.best} %` : ""}`
        : s.text + extra;
      return `<button class="zeile${erledigt ? " aktiv" : ""}" data-lschritt="${s.id}"><span class="sym">${s.sym}</span>
        <span class="mitte">${i + 1}. ${s.name}<small>${text}</small></span><span class="haken haken-gross" data-lhaken="${s.id}" role="checkbox" aria-checked="${erledigt}" title="Abhaken">${erledigt ? "✓" : ""}</span></button>`;
    }).join("")}</div>
    ${(() => { const n = lektionFehler(L).anzahl; return `<button class="zeile" data-gehe="lfehler/${L.id}" style="margin-top:8px${n ? "" : ";opacity:.6"}"><span class="sym">🎯</span><span class="mitte">Fehler dieser Lektion<small>${n ? `<b>${n} ${n === 1 ? "Sache" : "Dinge"}</b>, die oft falsch waren – gezielt üben` : "zurzeit nichts – sehr gut!"}</small></span><span class="pfeil">›</span></button>`; })()}
    <button class="btn zweit voll" id="lClaude" style="margin-top:12px">🤖 Passendes Rollenspiel mit Claude</button>
    <div class="reihe">
      ${L.nr > 1 ? `<button class="btn zweit" data-gehe="lektion/${LEKTION_LISTE[L.nr - 2].id}">‹ Lektion ${L.nr - 1}</button>` : ""}
      ${L.nr < LEKTION_LISTE.length ? `<button class="btn zweit" data-gehe="lektion/${LEKTION_LISTE[L.nr].id}">Lektion ${L.nr + 1} ›</button>` : ""}
    </div>`);
  const weiter = document.getElementById("lWeiter");
  if (weiter) weiter.onclick = () => lektionStarten(L, offen[0].id);
  $app.querySelectorAll("[data-lschritt]").forEach((b) => (b.onclick = () => lektionStarten(L, b.dataset.lschritt)));
  // Kästchen antippen = von Hand abhaken oder Haken wegnehmen (die Zeile selbst startet den Schritt)
  $app.querySelectorAll("[data-lhaken]").forEach((h) => (h.onclick = (ev) => {
    ev.stopPropagation();
    const id = h.dataset.lhaken;
    if (id === "check") {
      if (st.bestanden && confirm("Die Lektion wieder als „nicht geschafft“ markieren?")) { st.bestanden = false; speichern(); ohneSprung(() => lektionZeigen(L.id)); }
      else if (!st.bestanden) toast("Der Abschluss-Check wird erst mit 80 % abgehakt – tippe auf die Zeile, um ihn zu machen.", 4000);
      return;
    }
    st.schritte = st.schritte.includes(id) ? st.schritte.filter((x) => x !== id) : st.schritte.concat(id);
    speichern(); ohneSprung(() => lektionZeigen(L.id));
  }));
  document.getElementById("lClaude").onclick = () => { claudeWerte.szene = L.szene; geheZu("claude"); };
}
function zurueckZuLektion() {
  const id = letzteLektion;
  const schritte = lektionTiefe === null ? 0 : lektionTiefe - tiefeJetzt();
  if (schritte < 0) history.go(schritte); else geheZu("lektion/" + id);
}
function lektionErklaerung(id) {
  const L = LEKTION_NACH_ID[id]; if (!L) return geheZu("lektionen");
  setzeKopf(`${L.icon} ${L.titel}`, "lektion/" + id);
  zeige(`
    <div class="meldung info">🎯 ${esc(L.ziel)}</div>
    <div class="hilfe">${L.erklaerung}</div>
    <button class="btn voll" id="verstanden" style="margin-top:14px">✓ Verstanden – weiter</button>`);
  document.getElementById("verstanden").onclick = () => {
    if (!lektionAktiv) lektionAktiv = { lid: L.id, schritt: "erkl" };
    const ausHeute = !!heuteAktiv;
    schrittFertig();
    if (ausHeute) zurueckZuHeute(); else zurueckZuLektion();
  };
}
function lektionStarten(L, schritt) {
  lektionAktiv = { lid: L.id, schritt };
  letzteLektion = L.id;
  const zurueck = heuteAktiv ? "heute" : "lektion/" + L.id;
  if (schritt === "erkl") return geheZu("lerkl/" + L.id);
  if (schritt === "woerter") {
    const plan = rundePlanen(lektionKarten(L), S.einstellungen.richtung);
    const neue = plan.neue.slice(0, 12), fa = plan.faellige.slice(0, 20 - neue.length), liste = [];
    let d = 0, n = 0;
    while (d < fa.length || n < neue.length) { if (n < neue.length && (d >= fa.length || liste.length % 3 === 2)) liste.push(neue[n++]); else liste.push(fa[d++]); }
    let frei = false;
    if (!liste.length) { // alles schon gelernt und nichts fällig: zum Auffrischen 10 Karten ohne Wertung
      frei = true;
      mischen(lektionKarten(L)).slice(0, 10).forEach((k) => liste.push({ k, r: "it-de" }));
    }
    sitzung = { liste, pos: 0, neuKeys: new Set(neue.map((x) => schluessel(x.k.id, x.r))), aufgedeckt: false, eingabe: null, gesamt: liste.length, fertig: 0, zurueck, frei };
    return geheZu("karte");
  }
  if (schritt === "grammatik") {
    return quizStarten({ aufgaben: ausTopf(grammatikTopf(L.grammatik, L.themen), 8), pos: 0, punkte: 0, zurueck, titel: `Lektion ${L.nr}: Grammatik`, nochmal: zurueck });
  }
  if (schritt === "dialog") return geheZu("dialog/" + L.dialog);
  if (schritt === "sprechen") {
    gespraech = { liste: mischen(lektionFragen(L)), pos: 0 };
    neueFrage(); return geheZu("gespraech-ueben");
  }
  if (schritt === "check") {
    const karten = lektionKarten(L);
    const hoeren = gewichtetZiehen(karten, (k) => (istNeu(k.id, "it-de") ? 0.3 : gewicht(k.id, "it-de")), 4).map((k) => hoerAufgabe(k, karten));
    const gram = ausTopf(grammatikTopf(L.grammatik, L.themen), 6);
    // merken, was in diesem Check falsch war (für die Liste am Ende)
    const falsch = [];
    const aufgaben = mischen(hoeren.concat(gram)).map((a) => {
      const merk = () => { if (a.erklaerung && !falsch.includes(a.erklaerung)) falsch.push(a.erklaerung); };
      const bA = a.beiAntwort, nG = a.nichtGewusst;
      return { ...a, beiAntwort: (ok) => { if (!ok) merk(); if (bA) bA(ok); else geuebt(); }, nichtGewusst: nG ? () => { merk(); nG(); } : undefined };
    });
    const falschListe = () => falsch.length ? `<div class="frage" style="text-align:left"><b>Das war falsch:</b><ul style="margin:6px 0 0;padding-left:20px">${falsch.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>` : "";
    return quizStarten({ aufgaben, pos: 0, punkte: 0, zurueck, titel: `Lektion ${L.nr}: Abschluss-Check`, nochmal: zurueck,
      beimEnde: (p, n) => {
        const st = lStand(L.id), prozent = Math.round((100 * p) / n);
        st.best = Math.max(st.best || 0, prozent);
        st.zuletzt = prozent;
        if (prozent >= 80) st.bestanden = true;
        speichern();
      },
      endeHinweis: (p, n) => (Math.round((100 * p) / n) >= 80
        ? `<div class="meldung gut">🎉 <b>Lektion ${L.nr} geschafft!</b> ${aktuelleLektion() ? `Als Nächstes empfohlen: Lektion ${aktuelleLektion().nr} – ${esc(aktuelleLektion().titel)}.` : "Damit hast du alle 12 Lektionen geschafft – Bravissimo!"}</div>`
        : `<div class="meldung info">Für „geschafft“ braucht es 80 %. Üb am besten gezielt die Fehler dieser Lektion – dann den Check erneut.</div>`)
        + falschListe()
        + (falsch.length ? `<button class="btn zweit voll" data-gehe="lfehler/${L.id}" style="margin-bottom:12px">🎯 Fehler dieser Lektion üben</button>` : "") });
  }
}

// ---------- Heute üben: ein Tagesablauf von ca. 15 Minuten ----------
let heuteAktiv = null; // Schritt, der gerade aus "Heute üben" heraus läuft
function heuteStand() {
  if (!S.heute || S.heute.datum !== heute()) S.heute = { datum: heute(), erledigt: [] };
  return S.heute;
}
function heuteSchritte() {
  const plan = rundePlanen(kartenDerThemen(S.einstellungen.themen), S.einstellungen.richtung);
  const nKarten = Math.min(20, plan.faellige.length + Math.min(5, plan.neue.length, neueHeuteUebrig()));
  const nFehler = Math.min(8, schwacheKarten().filter((x) => !istFaellig(x.k.id, x.r)).length);
  // Zwei Schritte der aktuellen Lektion (offene Schritte der Reihe nach)
  const L = aktuelleLektion(), offeneL = L ? offeneSchritte(L) : [];
  const st = heuteStand();
  const lName = (nr) => {
    const vorher = ["lektionA", "lektionB"].slice(0, nr).filter((x) => st.erledigt.includes(x)).length; // schon heute erledigte Lektionsschritte
    const s = offeneL[nr - vorher];
    return s ? `Lektion ${L.nr}: ${s.sym} ${s.name}` : "";
  };
  const lA = st.erledigt.includes("lektionA") ? "erledigt" : lName(0), lB = st.erledigt.includes("lektionB") ? "erledigt" : lName(1);
  return [
    { id: "karten", sym: "🗂️", name: "Karteikarten", text: nKarten ? `${nKarten} Karten (fällige zuerst)` : "heute nichts fällig", leer: !nKarten },
    { id: "fehler", sym: "🎯", name: "Fehler wiederholen", text: nFehler ? `${nFehler} Karten, die oft falsch waren` : "keine Fehler offen", leer: !nFehler },
    { id: "lektionA", sym: "📚", name: "Lektion – nächster Schritt", text: lA || "alle Lektionen geschafft", leer: !lA },
    { id: "lektionB", sym: "📚", name: "Lektion – noch ein Schritt", text: lB || "nichts mehr offen", leer: !lB },
    { id: "gespraech", sym: "🗣️", name: "Frage & Antwort", text: "3 Fragen" }
  ];
}
let letzterKontext = null, letzteLektion = null;
function schrittFertig() { // am Ende einer Übung aufrufen; true = kam aus "Heute üben" oder einer Lektion
  let kam = false;
  if (lektionAktiv) {
    const ls = lStand(lektionAktiv.lid);
    // der Abschluss-Check zählt nur über "bestanden" (ab 80 %), nicht als bloß erledigter Schritt
    if (lektionAktiv.schritt !== "check" && !ls.schritte.includes(lektionAktiv.schritt)) ls.schritte.push(lektionAktiv.schritt);
    letzterKontext = "lektion"; letzteLektion = lektionAktiv.lid; lektionAktiv = null; kam = true;
  }
  if (heuteAktiv) {
    const st = heuteStand();
    if (!st.erledigt.includes(heuteAktiv)) st.erledigt.push(heuteAktiv);
    letzterKontext = "heute"; heuteAktiv = null; kam = true;
  }
  if (kam) speichern();
  return kam;
}
function heuteWeiterKnopf() {
  if (letzterKontext === "lektion") {
    const L = LEKTION_NACH_ID[letzteLektion], offen = L ? offeneSchritte(L) : [];
    return `<div class="reihe"><button class="btn voll" data-lektion-weiter="1">${offen.length ? `▶ Weiter mit Lektion ${L.nr}` : `📚 Zurück zu Lektion ${L ? L.nr : ""}`}</button></div>`;
  }
  const offen = heuteSchritte().filter((s) => !s.leer && !heuteStand().erledigt.includes(s.id)).length;
  return `<div class="reihe"><button class="btn voll" data-heute-weiter="1">${offen ? "▶ Weiter mit „Heute üben“" : "🎉 Zu „Heute üben“ – alles geschafft!"}</button></div>`;
}
// Zurück zur Seite "Heute üben" springen (statt sie neu anzuhängen), damit "Zurück" danach sauber zur Startseite führt
let heuteTiefe = null;
function zurueckZuHeute() {
  const schritte = heuteTiefe === null ? 0 : heuteTiefe - tiefeJetzt();
  if (schritte < 0) history.go(schritte); else geheZu("heute");
}
function heuteMenue() {
  setzeKopf("Heute üben", "start");
  heuteAktiv = null; lektionAktiv = null;
  heuteTiefe = tiefeJetzt();
  const st = heuteStand(), schritte = heuteSchritte();
  const offen = schritte.filter((s) => !s.leer && !st.erledigt.includes(s.id));
  const fertig = schritte.length - offen.length;
  zeige(`
    <p>Eine Runde von etwa <b>15 Minuten</b>, gut gemischt. Am besten jeden Tag – Regelmäßigkeit bringt mehr als lange Einheiten.</p>
    <div class="fortschritt"><span>${fertig} / ${schritte.length}</span><div class="balken"><i style="width:${(100 * fertig) / schritte.length}%"></i></div></div>
    <div class="liste">${schritte.map((s, i) => {
      const erledigt = st.erledigt.includes(s.id) || s.leer;
      return `<button class="zeile${erledigt ? " aktiv" : ""}" data-hschritt="${s.id}"><span class="sym">${s.sym}</span><span class="mitte">${i + 1}. ${s.name}<small>${esc(s.text)}</small></span><span class="haken haken-gross" data-hhaken="${s.id}" role="checkbox" aria-checked="${erledigt}" title="Abhaken">${erledigt ? "✓" : ""}</span></button>`;
    }).join("")}</div>
    ${offen.length
      ? `<button class="btn voll" id="heuteLos" style="margin-top:14px;min-height:64px;font-size:20px">▶ ${fertig ? "Weiter" : "Los geht's"}: ${offen[0].name}</button>`
      : `<div class="meldung gut" style="margin-top:14px">🎉 <b>Bravissimo!</b> Für heute ist alles geschafft. Du kannst natürlich trotzdem weiter üben.</div>`}`);
  const los = document.getElementById("heuteLos");
  if (los) los.onclick = () => heuteStarten(offen[0].id);
  // Zeile antippen = diesen Schritt direkt starten; Kästchen antippen = von Hand abhaken / Haken wegnehmen
  $app.querySelectorAll("[data-hschritt]").forEach((b) => (b.onclick = () => {
    const s = schritte.find((x) => x.id === b.dataset.hschritt);
    if (s.leer) return toast(`${s.name}: ${s.text}.`, 3000);
    heuteStarten(s.id);
  }));
  $app.querySelectorAll("[data-hhaken]").forEach((h) => (h.onclick = (ev) => {
    ev.stopPropagation();
    const id = h.dataset.hhaken, s = schritte.find((x) => x.id === id);
    if (s.leer) return toast(`${s.name}: ${s.text} – gilt automatisch als erledigt.`, 3000);
    st.erledigt = st.erledigt.includes(id) ? st.erledigt.filter((x) => x !== id) : st.erledigt.concat(id);
    speichern(); ohneSprung(heuteMenue);
  }));
}
function heuteStarten(id) {
  heuteAktiv = id;
  if (id === "lektionA" || id === "lektionB") {
    const L = aktuelleLektion(), s = L && offeneSchritte(L)[0];
    if (!s) { heuteAktiv = null; return heuteMenue(); }
    return lektionStarten(L, s.id);
  }
  if (id === "karten") {
    const plan = rundePlanen(kartenDerThemen(S.einstellungen.themen), S.einstellungen.richtung);
    const neue = plan.neue.slice(0, Math.min(5, neueHeuteUebrig())), fa = plan.faellige.slice(0, 20 - neue.length), liste = [];
    let d = 0, n = 0;
    while (d < fa.length || n < neue.length) { if (n < neue.length && (d >= fa.length || liste.length % 3 === 2)) liste.push(neue[n++]); else liste.push(fa[d++]); }
    sitzung = { liste, pos: 0, neuKeys: new Set(neue.map((x) => schluessel(x.k.id, x.r))), aufgedeckt: false, eingabe: null, gesamt: liste.length, fertig: 0, zurueck: "heute" };
    return geheZu("karte");
  }
  if (id === "fehler") {
    const liste = schwacheKarten().filter((x) => !istFaellig(x.k.id, x.r)).slice(0, 8);
    sitzung = { liste, pos: 0, neuKeys: new Set(), aufgedeckt: false, eingabe: null, gesamt: liste.length, fertig: 0, zurueck: "heute" };
    return geheZu("karte");
  }
  if (id === "grammatik") {
    const getippt = gewichtetZiehen(VERB_SAETZE, (x) => gGewicht("vsatz:" + x.s), 2).map(vsatzAufgabe);
    const pool = ALLE_VERBEN.flatMap((v) => [0, 1, 2, 3, 4, 5].map((p) => ({ key: `verb:${v.inf}:${p}`, bau: () => verbAufgabe(v, p) })))
      .concat(ARTIKEL_NOMEN.map((a) => ({ key: "art:" + a.ganz, bau: () => artikelAufgabe(a) })))
      .concat(CE_CI_SONO.map((x) => ({ key: "ce:" + x.s, bau: () => ceAufgabe(x) })));
    const rest = gewichtetZiehen(pool, (x) => gGewicht(x.key) * (x.key.startsWith("art:") ? 0.5 : 1), 4).map((x) => x.bau());
    return quizStarten({ aufgaben: mischen(getippt.concat(rest)), pos: 0, punkte: 0, zurueck: "heute", titel: "Grammatik", nochmal: "heute" });
  }
  if (id === "dialog") return geheZu("dialog/" + naechsterDialog().id);
  if (id === "gespraech") {
    gespraech = { liste: gewichtetZiehen(ALLE_FRAGEN, (q) => gGewicht(q.key), 3), pos: 0 };
    neueFrage(); return geheZu("gespraech-ueben");
  }
}

// ---------- Mit Claude üben: fertige Anweisungen für die Claude-App (über das eigene Abo, ohne Zusatzkosten) ----------
const SZENEN = [
  { id: "bar", name: "☕ Im Café / an der Bar", du: "einen freundlichen Barista in einer Bar in Rom", ich: "einen Gast, der etwas bestellt und bezahlt" },
  { id: "ristorante", name: "🍝 Im Restaurant", du: "einen Kellner in einer Trattoria", ich: "einen Gast, der einen Tisch möchte, bestellt und am Ende die Rechnung verlangt" },
  { id: "hotel", name: "🏨 Im Hotel", du: "die Person an der Hotelrezeption", ich: "einen Gast, der einchecken möchte und Fragen zum Zimmer und Frühstück hat" },
  { id: "bahnhof", name: "🚆 Am Bahnhof", du: "die Person am Fahrkartenschalter", ich: "einen Reisenden, der eine Fahrkarte kauft und nach Abfahrt und Gleis fragt" },
  { id: "markt", name: "🍅 Auf dem Markt", du: "einen Obst- und Gemüsehändler auf dem Markt", ich: "einen Kunden, der einkauft und nach Preisen fragt" },
  { id: "weg", name: "🧭 Nach dem Weg fragen", du: "eine hilfsbereite Passantin in einer italienischen Stadt", ich: "einen Touristen, der den Weg zu einem Museum, Bahnhof oder einer Apotheke sucht" },
  { id: "arzt", name: "💊 In der Apotheke", du: "eine Apothekerin", ich: "einen Kunden mit leichten Beschwerden (z. B. Kopfschmerzen, Erkältung)" },
  { id: "kennenlernen", name: "🤝 Kennenlernen", du: "eine Italienerin namens Giulia, die ich im Urlaub kennenlerne", ich: "einen deutschen Urlauber, der sich vorstellt und Smalltalk macht" },
  { id: "nachbar", name: "🏡 Smalltalk mit dem Nachbarn", du: "einen netten italienischen Nachbarn namens Paolo", ich: "einen neuen Nachbarn, der über Wetter, Familie, Arbeit und Freizeit plaudert" }
];
// Sprach-Niveau für die Gespräche mit Claude (in „Mit Claude üben“ wählbar)
const CLAUDE_NIVEAUS = {
  einfach: { name: "Ganz einfach", grenzen: "höchstens 6 Wörter pro Satz; nur Gegenwart (Präsens); nur die häufigsten Grundwörter; sprich langsam und deutlich; wiederhole wichtige Wörter ruhig" },
  a1: { name: "Normal (A1)", grenzen: "höchstens 10 Wörter pro Satz; nur Gegenwart (Präsens); nur Wortschatz von Niveau A1; keine Nebensätze" },
  schwerer: { name: "Etwas schwerer", grenzen: "höchstens 15 Wörter pro Satz; Gegenwart und ab und zu die einfache Vergangenheit (passato prossimo); Wortschatz A1 bis A2" }
};
const STUFEN = ["einfach", "a1", "schwerer"];
function regeln(niveau) {
  const n = CLAUDE_NIVEAUS[niveau] || CLAUDE_NIVEAUS.a1;
  return `Das soll ein echtes Gespräch sein, kein Unterricht.

Niveau – sehr wichtig:
- Feste Grenzen: ${n.grenzen}.
- Bleib das GANZE Gespräch auf genau diesem Niveau, auch wenn ich gut antworte. Steigere dich nie von selbst – auch nicht nach vielen Wechseln.
- Wenn ich „più semplice“ sage: ab sofort noch einfacher (kürzere Sätze, leichtere Wörter).
- Wenn ich „più difficile“ sage: ab sofort eine Stufe schwerer – aber nur dann.

` + REGELN_REST;
}
const REGELN_REST = `Sprache und Aussprache:
- Sprich im Gespräch ausschließlich Italienisch – mit natürlicher italienischer Aussprache wie ein Muttersprachler aus Italien, nicht mit deutschem Akzent.
- Im laufenden Gespräch kein einziges deutsches Wort, auch nicht in der Korrektur. Deutsch nur, wenn ich „aiuto“ oder „basta“ sage.

Jede deiner Antworten hat genau diese Form – nichts anderes:
1. Nur wenn ich einen Fehler gemacht habe: ein kurzer Satz auf Italienisch mit der richtigen Fassung, z. B. „Si dice: Ho cinquantaquattro anni.“ Ohne Fehler fällt dieser Satz weg.
2. Eine natürliche, passende Reaktion auf das, was ich gesagt habe – 1–2 kurze, einfache Sätze.
3. Eine Frage an mich, damit das Gespräch weitergeht.

Wichtig:
- Keine Erklärungen, Listen, Überschriften, Übersetzungen oder Lob-Absätze. Halte jede Antwort kurz (höchstens 3 Sätze), wie in einem echten Gespräch.
- Wenn ich „aiuto“ sage oder Deutsch spreche: Sag mir kurz auf Deutsch, was ich auf Italienisch sagen könnte, und stell dann die Frage noch einmal auf Italienisch.
- Erst wenn ich „basta“ sage: kurze Zusammenfassung auf Deutsch, welche Fehler ich am häufigsten gemacht habe und warum. Danach – damit ich sie in meine Lern-App übernehmen kann – genau in diesem Format, ohne weiteren Text dazwischen:
FEHLERLISTE
- falsch: … → richtig: … (Erklärung in wenigen Wörtern)
(eine Zeile pro Fehler, höchstens 8)`;

// ---------- Deine Fehler für Claude: aus der App + aus früheren Gesprächen ----------
// Beschreibt die aktuellen Schwachstellen in einfachen Worten, damit Claude sie im Gespräch üben lässt.
function fehlerFuerClaude() {
  const zeilen = [];
  // Wörter und Sätze, die oft falsch waren
  fehlerWoerter().slice(0, 6).forEach((k) => zeilen.push(`Wort: ${k.it} (= ${k.de})`));
  // Grammatik, die oft falsch war
  Object.entries(S.grammatik).filter(([, g]) => gSchwach(g)).sort((a, b) => schwaecheWert(b[1]) - schwaecheWert(a[1])).slice(0, 6).forEach(([key]) => {
    const [art, ...rest] = key.split(":"), wert = rest.join(":");
    if (art === "verb") { const inf = rest.slice(0, -1).join(":"), p = +rest[rest.length - 1], v = ALLE_VERBEN.find((x) => x.inf === inf); if (v) zeilen.push(`Verbform: ${PERSONEN[p].split("/")[0]} ${konjugiere(v)[p]} (von ${inf})`); }
    else if (art === "art") zeilen.push(`Artikel: ${wert}`);
    else if (art === "ce") { const x = CE_CI_SONO.find((c) => c.s === wert); if (x) zeilen.push(`c'è / ci sono: ${x.s.replace("___", x.a)}`); }
    else if (art === "vsatz") { const x = VERB_SAETZE.find((c) => c.s === wert); if (x) zeilen.push(`Verb im Satz: ${x.s.replace("___", konjugiere(ALLE_VERBEN.find((v) => v.inf === x.inf))[x.p])}`); }
    else if (art === "lk") { const set = LUECKEN[rest[0]], s = rest.slice(1).join(":"), x = set && set.saetze.find((c) => c.s === s); if (x) zeilen.push(`${set.titel}: ${x.s.replace("___", x.a).replace(" → ", " = ")}`); }
    else if (art === "zahl") zeilen.push(`Zahl: ${wert} = ${zahlMitAkzent(+wert)}`);
    else if (art === "satz") zeilen.push(`Satzbau: ${wert}`);
    else if (art === "dialog") { const q = ALLE_FRAGEN.find((x) => x.key === key); if (q) zeilen.push(`Antworten auf „${q.f}“ (z. B. ${q.b})`); }
  });
  // Fehler, die Claude in früheren Gesprächen gefunden hat (über „Fehler aus dem Gespräch übernehmen“)
  (S.claudeFehler || []).slice(-8).forEach((f) => zeilen.push(`Aus einem früheren Gespräch: ${f.text}`));
  return zeilen;
}
function fehlerBlock() {
  const zeilen = fehlerFuerClaude();
  if (!zeilen.length) return "";
  return `\n\nMeine typischen Fehler zurzeit (aus meiner Lern-App):\n${zeilen.map((z) => "- " + z).join("\n")}\n` +
    `Lenke das Gespräch nach und nach so, dass ich genau diese Dinge benutzen muss: Stell mir passende Fragen und bring Situationen ins Spiel, in denen sie natürlich vorkommen – nicht alle auf einmal, verteilt über das Gespräch. Wenn ich so etwas richtig benutze, sag kurz „Bravo!“. Erwähne diese Liste nicht ausdrücklich.`;
}
// Fehlerliste aus einem Claude-Gespräch übernehmen (Zeilen nach „FEHLERLISTE“ bzw. Zeilen mit „→“)
function claudeFehlerUebernehmen(text) {
  const ab = text.indexOf("FEHLERLISTE");
  const teil = ab >= 0 ? text.slice(ab + 11) : text;
  const neue = teil.split("\n").map((z) => z.replace(/^[\s\-•*\d.)]+/, "").replace(/\*\*/g, "").trim())
    .filter((z) => z.length > 3 && z.includes("→")).slice(0, 12);
  S.claudeFehler = S.claudeFehler || [];
  let n = 0;
  neue.forEach((t) => { if (!S.claudeFehler.some((f) => f.text === t)) { S.claudeFehler.push({ text: t, zeit: heute(), genutzt: 0 }); n++; } });
  speichern();
  return n;
}
// Nach 5 Gesprächen, in die ein übernommener Fehler eingeflossen ist, fällt er heraus
function claudeFehlerGenutzt() {
  (S.claudeFehler || []).slice(-8).forEach((f) => (f.genutzt = (f.genutzt || 0) + 1));
  S.claudeFehler = (S.claudeFehler || []).filter((f) => f.genutzt < 5);
  speichern();
}
function woerterListe(liste) { return liste.map((k) => `${k.it} = ${k.de}`).join("; "); }
function fehlerWoerter() {
  const gesehen = new Set();
  return schwacheKarten().map((x) => x.k).filter((k) => !gesehen.has(k.id) && gesehen.add(k.id)).slice(0, 15);
}
function gelernteWoerter() {
  return Object.entries(S.karten).filter(([key, k]) => k.richtig > 0 && KARTE_NACH_ID[key.split("|")[0]])
    .sort((a, b) => (b[1].zuletzt || 0) - (a[1].zuletzt || 0)).map(([key]) => KARTE_NACH_ID[key.split("|")[0]])
    .filter((k, i, arr) => arr.findIndex((x) => x.id === k.id) === i).slice(0, 30);
}
function claudeAnweisungen(werte) {
  const sz = SZENEN.find((s) => s.id === werte.szene) || SZENEN[0];
  const fehler = fehlerWoerter(), gelernt = gelernteWoerter();
  const uebungsWoerter = fehler.length ? fehler : gelernt.length ? gelernt : kartenDerThemen(S.einstellungen.themen).slice(0, 20);
  const fb = fehlerBlock();
  return [
    { id: "rolle", sym: "🎭", titel: "Rollenspiel", text: "Claude spielt eine Person in einer Alltagssituation, du antwortest auf Italienisch – mit Korrektur.",
      feld: `<select id="szene">${SZENEN.map((s) => `<option value="${s.id}" ${s.id === sz.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select>`,
      prompt: `Ich lerne Italienisch. Lass uns ein Rollenspiel machen. Du spielst ${sz.du}, ich spiele ${sz.ich}.\n\n${regeln(werte.niveau)}${fb}\n\nSchalte jetzt auf Italienisch um – auch bei der Aussprache, wie ein Italiener – und beginne direkt mit deinem ersten Satz in der Rolle, ohne Einleitung und ohne diese Regeln zu wiederholen.` },
    { id: "frei", sym: "💬", titel: "Freies Gespräch über mich", text: "Claude stellt dir einfache Fragen über dich (Familie, Arbeit, Hobbys, Urlaub) und plaudert mit dir.",
      prompt: `Ich lerne Italienisch. Unterhalte dich mit mir wie ein freundlicher italienischer Gesprächspartner. Stell mir einfache Fragen über mich – Familie, Wohnort, Arbeit, Hobbys, Essen, Urlaub – und erzähl auch kurz etwas von dir.\n\n${regeln(werte.niveau)}${fb}\n\nSchalte jetzt auf Italienisch um – auch bei der Aussprache, wie ein Italiener – und beginne direkt mit einer kurzen Begrüßung und deiner ersten Frage, ohne Einleitung und ohne diese Regeln zu wiederholen.` },
    { id: "korrektur", sym: "✏️", titel: "Meine Sätze korrigieren", text: "Du schreibst oder sprichst eigene italienische Sätze, Claude korrigiert und erklärt.",
      prompt: `Ich lerne Italienisch (Anfänger, Niveau A1). Ich schreibe dir gleich eigene italienische Sätze.\nFür jeden Satz:\n1. Ist er richtig? Wenn nicht, schreib die korrigierte Fassung.\n2. Erkläre jeden Fehler kurz und einfach auf Deutsch.\n3. Gib mir eine natürlichere Variante, wie ein Italiener es sagen würde.\nHalte die Antworten kurz. Antworte jetzt nur mit "Pronto! Scrivi una frase." und warte auf meinen ersten Satz.` },
    { id: "grammatik", sym: "📘", titel: "Grammatikfrage stellen", text: "Claude erklärt eine Grammatikfrage einfach, mit Beispielen und einer Mini-Übung.",
      feld: `<input type="text" id="gfrage" placeholder="z. B. Wann sage ich c'è und wann ci sono?" value="${esc(werte.frage || "")}">`,
      prompt: `Ich lerne Italienisch (Anfänger, Niveau A1) und bin kein Sprachexperte. Erkläre mir bitte ganz einfach auf Deutsch, ohne Fachbegriffe (oder mit Erklärung der Fachbegriffe):\n\n${werte.frage || "[hier deine Frage]"}\n\nGib 3 kurze Beispielsätze mit deutscher Übersetzung und am Ende 3 kleine Übungsaufgaben. Die Lösungen zeigst du erst, wenn ich geantwortet habe.` },
    { id: "geschichte", sym: "📖", titel: fehler.length ? "Geschichte mit meinen Fehler-Wörtern" : "Geschichte mit meinen Wörtern", text: fehler.length ? `Eine kurze Geschichte mit ${fehler.length} Wörtern, die du oft falsch hattest.` : "Eine kurze Geschichte mit Wörtern, die du schon gelernt hast.",
      prompt: `Ich lerne Italienisch. Schreib mir eine kurze, einfache Geschichte auf Italienisch (8–10 Sätze; ${(CLAUDE_NIVEAUS[werte.niveau] || CLAUDE_NIVEAUS.a1).grenzen}), in der möglichst viele dieser Wörter vorkommen:\n${woerterListe(uebungsWoerter)}\n\nDanach:\n1. Die Geschichte noch einmal Satz für Satz mit deutscher Übersetzung.\n2. 4 Verständnisfragen auf Italienisch. Ich antworte auf Italienisch, du korrigierst meine Antworten.` },
    { id: "uebersetzen", sym: "🔁", titel: "Übersetzungs-Training", text: "Claude gibt dir deutsche Sätze, du übersetzt ins Italienische – mit deinen Wörtern.",
      prompt: `Ich lerne Italienisch. Gib mir nacheinander 10 kurze, alltägliche deutsche Sätze zum Übersetzen ins Italienische (die italienische Lösung soll diese Grenzen einhalten: ${(CLAUDE_NIVEAUS[werte.niveau] || CLAUDE_NIVEAUS.a1).grenzen}). Verwende dabei möglichst diese Wörter:\n${woerterListe(uebungsWoerter)}\n\nImmer nur ein Satz, dann wartest du auf meine Übersetzung. Danach: richtig/falsch, die korrekte Fassung und eine kurze Erklärung auf Deutsch.${fb ? " Baue in die Sätze auch die folgenden Schwachstellen von mir ein." + fb.replace("Lenke das Gespräch", "Lenke die Sätze") : ""}\n\nZum Schluss eine kurze Auswertung und danach genau in diesem Format:\nFEHLERLISTE\n- falsch: … → richtig: … (Erklärung in wenigen Wörtern)\n(eine Zeile pro Fehler, höchstens 8)` }
  ];
}
let claudeWerte = { szene: "bar", frage: "" };
function claudeMenue() {
  setzeKopf("Mit Claude üben", "start");
  claudeWerte.niveau = S.einstellungen.claudeNiveau || "a1";
  const liste = claudeAnweisungen(claudeWerte);
  zeige(`
    <div class="meldung info">💡 Das läuft über <b>dein Claude-Abo</b> in der Claude-App – ohne Zusatzkosten.
      Tippe auf eine Übung: Die Anweisung wird <b>kopiert</b> und Claude geöffnet. Dort lange ins Eingabefeld drücken → <b>Einfügen</b> → senden.
      <br>🎤 Zum <b>Sprechen</b>: erst die Anweisung senden, dann im selben Chat den Sprachmodus starten.</div>
    <h2 style="margin-top:6px">Wie schwer soll Claude sprechen?</h2>
    ${umschalter("cniveau", claudeWerte.niveau, STUFEN.map((s) => [s, CLAUDE_NIVEAUS[s].name]))}
    <p class="leise">Gilt für Rollenspiel, Gespräch, Geschichte und Übersetzen. <b>Im Gespräch</b> kannst du jederzeit sagen:
      <b>„più semplice“</b> (einfacher) · <b>„più difficile“</b> (schwerer) · <b>„aiuto“</b> (Hilfe) · <b>„basta“</b> (Schluss mit Fehler-Zusammenfassung).
      Wird es trotzdem langsam schwerer: einfach einen neuen Chat beginnen (etwa alle 15–20 Wechsel).</p>
    <h2>🎯 Deine Fehler – Claude übt sie mit dir</h2>
    ${(() => {
      const zeilen = fehlerFuerClaude(), cf = S.claudeFehler || [];
      return `<div class="einstellung">
        <p style="margin-top:0">${zeilen.length ? `Claude bekommt im Rollenspiel, im Gespräch und beim Übersetzen <b>${zeilen.length} deiner Schwachstellen</b> mit und baut sie nach und nach ein.` : "Noch keine Fehler gesammelt – sobald dir in der App etwas öfter schwerfällt, übt Claude es automatisch mit."}</p>
        ${zeilen.length ? `<details><summary class="leise">Liste ansehen</summary><p class="leise">${zeilen.map(esc).join("<br>")}</p></details>` : ""}
        <label style="margin-top:10px">Fehler aus dem Gespräch übernehmen</label>
        <p class="leise" style="margin-top:0">Am Ende des Gesprächs „basta“ sagen. Claude schreibt dann eine <b>FEHLERLISTE</b>. Die kopieren (oder gleich die ganze Antwort) und hier einfügen:</p>
        <textarea id="cfText" placeholder="FEHLERLISTE&#10;- falsch: … → richtig: …" style="width:100%;min-height:90px;font:inherit;font-size:15px;padding:10px;border-radius:12px;border:1px solid var(--rand);background:var(--karte);color:var(--text)"></textarea>
        <button class="btn voll" id="cfUebernehmen" style="margin-top:8px">➕ Übernehmen</button>
        ${cf.length ? `<p class="leise" style="margin-bottom:4px">Aus Gesprächen übernommen (fallen nach 5 weiteren Gesprächen von selbst heraus):</p>
          <div class="liste">${cf.map((f, i) => `<div class="eintrag" style="padding:6px 10px"><div class="mitte" style="font-size:15px">${esc(f.text)}</div><button class="mini" data-cfweg="${i}" title="Entfernen" style="border:0;background:none;font-size:18px;cursor:pointer">🗑</button></div>`).join("")}</div>` : ""}
      </div>`;
    })()}
    ${liste.map((a) => `<div class="einstellung">
      <label>${a.sym} ${esc(a.titel)}</label>
      <p class="leise" style="margin-top:0">${esc(a.text)}</p>
      ${a.feld || ""}
      <button class="btn voll" data-claude="${a.id}">📋 Kopieren und Claude öffnen</button>
      <details style="margin-top:8px"><summary class="leise">Anweisung ansehen</summary><pre style="white-space:pre-wrap;font-size:14px;font-family:inherit">${esc(a.prompt)}</pre></details>
    </div>`).join("")}
    <div id="kopierFeld"></div>`);
  $app.querySelectorAll("#cniveau button").forEach((b) => (b.onclick = () => { S.einstellungen.claudeNiveau = b.dataset.w; speichern(); ohneSprung(claudeMenue); }));
  document.getElementById("cfUebernehmen").onclick = () => {
    const t = document.getElementById("cfText").value;
    if (!t.trim()) return toast("Bitte erst die Fehlerliste von Claude einfügen.");
    const n = claudeFehlerUebernehmen(t);
    toast(n ? `${n} Fehler übernommen ✓ – Claude übt sie ab dem nächsten Gespräch mit dir.` : "Keine neuen Fehler gefunden. Es braucht Zeilen mit „→“ (falsch → richtig).", 5000);
    if (n) ohneSprung(claudeMenue);
  };
  $app.querySelectorAll("[data-cfweg]").forEach((b) => (b.onclick = () => { S.claudeFehler.splice(+b.dataset.cfweg, 1); speichern(); ohneSprung(claudeMenue); }));
  const sz = document.getElementById("szene");
  if (sz) sz.onchange = () => { claudeWerte.szene = sz.value; ohneSprung(claudeMenue); };
  const gf = document.getElementById("gfrage");
  if (gf) gf.onchange = () => { claudeWerte.frage = gf.value.trim(); ohneSprung(claudeMenue); };
  $app.querySelectorAll("[data-claude]").forEach((b) => (b.onclick = async () => {
    if (gf) claudeWerte.frage = gf.value.trim();
    const a = claudeAnweisungen(claudeWerte).find((x) => x.id === b.dataset.claude);
    if (a.id === "grammatik" && !claudeWerte.frage) { toast("Bitte erst deine Grammatikfrage eintippen."); gf && gf.focus(); return; }
    let kopiert = false;
    try { await navigator.clipboard.writeText(a.prompt); kopiert = true; } catch (e) {}
    if (a.prompt.includes("Meine typischen Fehler zurzeit")) claudeFehlerGenutzt();
    if (kopiert) {
      toast("Kopiert! In Claude: lange ins Eingabefeld drücken → Einfügen → senden.", 6000);
      window.open("https://claude.ai/new", "_blank");
    } else {
      // Falls das Kopieren nicht erlaubt ist: Text zum selbst Markieren anzeigen
      document.getElementById("kopierFeld").innerHTML = `<div class="meldung info">Automatisches Kopieren ging nicht. Bitte den Text markieren (lange drücken → Alles auswählen → Kopieren), dann <a href="https://claude.ai/new" target="_blank" rel="noopener">Claude öffnen</a>.</div>
        <textarea readonly style="width:100%;min-height:220px;font:inherit;font-size:15px">${esc(a.prompt)}</textarea>`;
      document.querySelector("#kopierFeld textarea").select();
      document.getElementById("kopierFeld").scrollIntoView({ behavior: "smooth" });
    }
  }));
}

// ---------- Fehler wiederholen: nur was oft falsch war ----------
// "schwach" = mindestens einmal falsch und (Fehler ≥ halb so viele wie Treffer oder Karte fällt schwer).
// Sobald man es oft genug richtig hat, verschwindet es von selbst aus dieser Liste.
const kartenSchwach = (k) => !!k && k.falsch > 0 && (k.falsch * 2 >= k.richtig || k.ease <= 2.2);
const gSchwach = (g) => !!g && g.falsch > 0 && g.falsch * 2 >= g.richtig;
const schwaecheWert = (st) => st.falsch * 2 - st.richtig + (st.vergessen || 0) * 2;
function schwacheKarten() {
  return Object.entries(S.karten).filter(([key, k]) => kartenSchwach(k) && KARTE_NACH_ID[key.split("|")[0]])
    .sort((a, b) => schwaecheWert(b[1]) - schwaecheWert(a[1]))
    .map(([key]) => { const [id, r] = key.split("|"); return { k: KARTE_NACH_ID[id], r }; });
}
function schwacheGrammatik() {
  const aufgaben = [];
  Object.entries(S.grammatik).filter(([key, g]) => gSchwach(g)).sort((a, b) => schwaecheWert(b[1]) - schwaecheWert(a[1])).forEach(([key]) => {
    const [art, ...rest] = key.split(":"), wert = rest.join(":");
    if (art === "verb") { const [inf, p] = [rest.slice(0, -1).join(":"), +rest[rest.length - 1]]; const v = ALLE_VERBEN.find((x) => x.inf === inf); if (v) aufgaben.push(verbAufgabe(v, p)); }
    if (art === "art") { const a = ARTIKEL_NOMEN.find((x) => x.ganz === wert); if (a) aufgaben.push(artikelAufgabe(a)); }
    if (art === "ce") { const x = CE_CI_SONO.find((c) => c.s === wert); if (x) aufgaben.push(ceAufgabe(x)); }
    if (art === "vsatz") { const x = VERB_SAETZE.find((c) => c.s === wert); if (x) aufgaben.push(vsatzAufgabe(x)); }
    if (art === "zahl") aufgaben.push(zahlAufgabe(+wert));
    if (art === "lk") { const setId = rest[0], s = rest.slice(1).join(":"); const x = LUECKEN[setId] && LUECKEN[setId].saetze.find((c) => c.s === s); if (x) aufgaben.push(lueckeAufgabe(setId, x)); }
  });
  return aufgaben;
}
const schwacheSaetze = () => SAETZE_LISTE.filter((s) => gSchwach(S.grammatik["satz:" + s.it]));
const schwacheFragen = () => ALLE_FRAGEN.filter((q) => gSchwach(S.grammatik[q.key]));
function schwachesSprechen() {
  return ALLE_KARTEN.filter((k) => { const a = S.aussprache[k.id]; return (a && a.versuche > 0 && a.letzter < 70) || kartenSchwach(zustand(k.id, "de-it")); });
}
function anzahlFehler() {
  return schwacheKarten().length + schwacheGrammatik().length + schwacheSaetze().length + schwacheFragen().length;
}
function fehlerMenue() {
  setzeKopf("Fehler wiederholen", "start");
  const karten = schwacheKarten(), gram = schwacheGrammatik(), saetze = schwacheSaetze(), fragen = schwacheFragen(), sprechenListe = schwachesSprechen();
  const zeile = (id, sym, name, n, text) => `<button class="zeile" id="${id}" ${n ? "" : "disabled style='opacity:.5'"}><span class="sym">${sym}</span><span class="mitte">${name}<small>${n ? `<b>${n}</b> ${text}` : "nichts – sehr gut!"}</small></span><span class="pfeil">›</span></button>`;
  zeige(`
    <p>Hier übst du <b>nur</b> das, was du oft falsch hattest oder als „nicht gewusst“ markiert hast. Was du ein paar Mal richtig hast, verschwindet von selbst aus der Liste.</p>
    ${karten.length + gram.length + saetze.length + fragen.length + sprechenListe.length === 0 ? `<div class="meldung gut">🎉 Im Moment gibt es keine Fehler zu wiederholen. Üb erst ein bisschen – Fehler sammeln sich hier automatisch.</div>` : ""}
    <div class="liste">
      ${zeile("fKarten", "🗂️", "Vokabeln & Phrasen", karten.length, "Karten (beide Richtungen)")}
      ${zeile("fGram", "📘", "Grammatik", gram.length, "Verbformen, Artikel, c'è / ci sono")}
      ${zeile("fSatz", "🧩", "Satzbau", saetze.length, "Sätze")}
      ${zeile("fSprechen", "🎤", "Sprechen", sprechenListe.length, "Wörter und Sätze")}
      ${zeile("fFragen", "🗣️", "Frage & Antwort", fragen.length, "Fragen")}
    </div>`);
  const klick = (id, fn) => { const el = document.getElementById(id); if (el && !el.disabled) el.onclick = fn; };
  klick("fKarten", () => {
    const liste = karten.slice(0, 20);
    sitzung = { liste, pos: 0, neuKeys: new Set(), aufgedeckt: false, eingabe: null, gesamt: liste.length, fertig: 0, zurueck: "fehler" };
    geheZu("karte");
  });
  klick("fGram", () => quizStarten({ aufgaben: mischen(gram.slice(0, 15)), pos: 0, punkte: 0, zurueck: "fehler", titel: "Grammatik-Fehler", nochmal: "fehler" }));
  klick("fSatz", () => { satz = null; geheZu("satzbau-fehler"); });
  klick("fSprechen", () => sprechenStarten(sprechenListe));
  klick("fFragen", () => { gespraech = { liste: mischen(fragen), pos: 0 }; neueFrage(); geheZu("gespraech-ueben"); });
}

// ---------- Fehler einer Lektion: derselbe Lernstand, nur auf die Lektion gefiltert ----------
function lektionFehler(L) {
  const karten = [];
  lektionKarten(L).forEach((k) => RICHTUNGEN.forEach((r) => { if (kartenSchwach(zustand(k.id, r))) karten.push({ k, r, w: schwaecheWert(zustand(k.id, r)) }); }));
  karten.sort((a, b) => b.w - a.w);
  const gram = grammatikTopf(L.grammatik, L.themen).filter((x) => gSchwach(S.grammatik[x.key]));
  const fragen = lektionFragen(L).filter((q) => gSchwach(S.grammatik[q.key]));
  return { karten, gram, fragen, anzahl: karten.length + gram.length + fragen.length };
}
function lektionFehlerSeite(id) {
  const L = LEKTION_NACH_ID[id]; if (!L) return geheZu("lektionen");
  setzeKopf(`Lektion ${L.nr}: Fehler`, "lektion/" + id);
  const f = lektionFehler(L), zurueck = "lfehler/" + id;
  const zeile = (zid, sym, name, n, text) => `<button class="zeile" id="${zid}" ${n ? "" : "disabled style='opacity:.5'"}><span class="sym">${sym}</span><span class="mitte">${name}<small>${n ? `<b>${n}</b> ${text[n === 1 ? 0 : 1]}` : "nichts – sehr gut!"}</small></span><span class="pfeil">›</span></button>`;
  const gramTexte = f.gram.map((x) => x.bau().erklaerung).filter(Boolean);
  zeige(`
    <p>Hier übst du nur, was in <b>dieser Lektion</b> oft falsch war – aus allen Übungen, auch aus „Heute üben“. Was du ein paar Mal richtig hast, verschwindet von selbst aus der Liste. Am besten vor dem Abschluss-Check.</p>
    ${f.anzahl ? "" : `<div class="meldung gut">🎉 In dieser Lektion gibt es zurzeit keine Fehler zu wiederholen.</div>`}
    <div class="liste">
      ${zeile("lfKarten", "🗂️", "Wörter & Sätze", f.karten.length, ["Karte", "Karten"])}
      ${zeile("lfGram", "📘", "Grammatik", f.gram.length, ["Aufgabe", "Aufgaben"])}
      ${zeile("lfFragen", "🗣️", "Fragen beantworten", f.fragen.length, ["Frage", "Fragen"])}
    </div>
    ${f.anzahl ? `<h2>Das ist zurzeit schwach</h2>
    <div class="liste">
      ${f.karten.map((x) => `<div class="eintrag"><div class="mitte"><div class="it">${esc(x.k.it)}</div><div class="de">${esc(x.k.de)} · <small>${x.r === "de-it" ? "selbst sagen" : "verstehen"}</small></div></div></div>`).join("")}
      ${gramTexte.map((t) => `<div class="eintrag"><div class="mitte"><div class="it">📘 ${esc(t)}</div></div></div>`).join("")}
      ${f.fragen.map((q) => `<div class="eintrag"><div class="mitte"><div class="it">🗣️ ${esc(q.f)}</div></div></div>`).join("")}
    </div>` : ""}`);
  const klick = (zid, fn) => { const el = document.getElementById(zid); if (el && !el.disabled) el.onclick = fn; };
  klick("lfKarten", () => {
    const liste = f.karten.slice(0, 20).map(({ k, r }) => ({ k, r }));
    sitzung = { liste, pos: 0, neuKeys: new Set(), aufgedeckt: false, eingabe: null, gesamt: liste.length, fertig: 0, zurueck };
    geheZu("karte");
  });
  klick("lfGram", () => quizStarten({ aufgaben: mischen(f.gram.slice(0, 15).map((x) => x.bau())), pos: 0, punkte: 0, zurueck, titel: `Lektion ${L.nr}: Grammatik-Fehler`, nochmal: zurueck }));
  klick("lfFragen", () => { gespraech = { liste: mischen(f.fragen), pos: 0, zurueck }; neueFrage(); geheZu("gespraech-ueben"); });
}

// ---------- Phrasen ansehen ----------
function phrasenMenue() {
  setzeKopf("Phrasen", "start");
  zeige(`<div class="liste">${PHRASEN_GRUPPEN.map((g) => `<button class="zeile" data-gehe="phrasen/${g.id}"><span class="sym">${g.icon}</span><span class="mitte">${esc(g.name)}<small>${g.eintraege.length} Sätze</small></span><span class="pfeil">›</span></button>`).join("")}</div>`);
}
const eintragHtml = (e) => `<div class="eintrag">${lautBtn(e.it, true)}<div class="mitte"><div class="it">${esc(e.it)}</div><div class="de">${esc(e.de)}</div>${hinweisHtml(e, true)}</div></div>`;

// ---------- Hinweise 💡 zu einzelnen Karten und Wünsche nach Erklärungen ----------
// Hinweise stehen in data/hinweise.js. Fehlt einer, kann man ihn wünschen: Die App merkt sich das
// und schickt die Wünsche (mit GitHub-Schlüssel) in die Datei data/wuensche.json – Claude liest sie
// bei der nächsten Bearbeitung aus und trägt die Erklärungen ein.
const hinweisZu = (id) => (window.HINWEISE || {})[id];
const gewuenscht = (id) => (S.wuensche || []).some((w) => w.id === id && w.typ !== "antwort");
// Eintrag in der Wunschliste: Erklärung zu einer Karte – oder eine selbst als richtig markierte Antwort zur Prüfung
const wunschSchluessel = (w) => `${w.typ || "erklaerung"}|${w.id}|${w.antwort || ""}`;
function antwortZurPruefung(q, text) {
  const w = { typ: "antwort", id: q.key, frage: q.f, antwort: text, zeit: new Date().toISOString().slice(0, 10), gesendet: false };
  if ((S.wuensche || []).some((x) => wunschSchluessel(x) === wunschSchluessel(w))) return;
  S.wuensche = (S.wuensche || []).concat(w); speichern();
  toast("Gemerkt: Diese Antwort gilt ab jetzt als richtig. Claude prüft sie bei der nächsten Bearbeitung.", 4500);
  clearTimeout(wunschHinzufuegen._t); wunschHinzufuegen._t = setTimeout(wuenscheSenden, 2000);
}
function hinweisHtml(k, klein) {
  const h = hinweisZu(k.id);
  if (h) return `<div class="hinweis${klein ? " klein" : ""}">💡 ${esc(h)}</div>`;
  if (gewuenscht(k.id)) return `<div class="leise" style="font-size:13px">✓ Erklärung gewünscht</div>`;
  return `<button class="wunsch${klein ? " klein" : ""}" data-wunsch="${esc(k.id)}">❓ Erklärung wünschen</button>`;
}
function wunschHinzufuegen(id) {
  const k = KARTE_NACH_ID[id]; if (!k || gewuenscht(id)) return;
  S.wuensche = (S.wuensche || []).concat({ id, it: k.it, de: k.de, zeit: new Date().toISOString().slice(0, 10), gesendet: false });
  speichern();
  toast(githubSchluessel() ? "Gemerkt – die Erklärung kommt mit der nächsten Version." : "Gemerkt. (Ohne GitHub-Schlüssel nur auf diesem Gerät – siehe Einstellungen.)", 4000);
  clearTimeout(wunschHinzufuegen._t); wunschHinzufuegen._t = setTimeout(wuenscheSenden, 2000);
}
function githubSchluessel() {
  try { const s = (localStorage.getItem("italienisch-github-schluessel") || "").replace(/[^\x21-\x7E]/g, ""); return s.length >= 30 ? s : ""; } catch (e) { return ""; }
}
let wunschStatus = "";
async function wuenscheSenden() {
  const offen = (S.wuensche || []).filter((w) => !w.gesendet), schl = githubSchluessel();
  if (!offen.length || !schl || !navigator.onLine) return;
  const url = "https://api.github.com/repos/StefanReinhart/italienisch/contents/data/wuensche.json";
  const kopf = { Accept: "application/vnd.github+json", Authorization: "Bearer " + schl };
  for (let versuch = 0; versuch < 2; versuch++) {
    try {
      let liste = [], sha;
      const r = await fetch(url + "?ref=master", { headers: kopf, cache: "no-store" });
      if (r.ok) { const j = await r.json(); sha = j.sha; liste = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(j.content.replace(/\n/g, "")), (c) => c.charCodeAt(0))) || "[]"); }
      else if (r.status !== 404) throw new Error("GitHub antwortet mit Fehler " + r.status);
      const vorhanden = new Set(liste.map(wunschSchluessel));
      offen.forEach((w) => {
        if (vorhanden.has(wunschSchluessel(w))) return;
        liste.push(w.typ === "antwort" ? { typ: "antwort", id: w.id, frage: w.frage, antwort: w.antwort, zeit: w.zeit } : { id: w.id, it: w.it, de: w.de, zeit: w.zeit });
      });
      const text = JSON.stringify(liste, null, 1);
      const autor = { name: "StefanReinhart", email: "154806245+StefanReinhart@users.noreply.github.com" };
      const p = await fetch(url, { method: "PUT", headers: { ...kopf, "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Wünsche: ${offen.map((w) => (w.typ === "antwort" ? `Antwort „${w.antwort}“ prüfen` : `Erklärung zu ${w.it}`)).join(", ")}`, content: btoa(unescape(encodeURIComponent(text))), sha, branch: "master", author: autor, committer: autor }) });
      if (p.status === 409 || p.status === 422) continue; // Datei wurde gleichzeitig geändert – noch einmal versuchen
      if (!p.ok) throw new Error("GitHub antwortet mit Fehler " + p.status);
      offen.forEach((w) => (w.gesendet = true)); speichern();
      wunschStatus = `✓ ${offen.length} Wunsch/Wünsche an GitHub gesendet.`;
      return;
    } catch (e) { wunschStatus = "Senden hat nicht geklappt: " + e.message; return; }
  }
}
setTimeout(wuenscheSenden, 4000);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") setTimeout(wuenscheSenden, 2000); });
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
  $app.querySelectorAll("#pverdeckt button").forEach((b) => (b.onclick = () => { S.einstellungen.phrasenVerdeckt = b.dataset.w === "ja"; speichern(); ohneSprung(() => phrasenGruppe(id)); }));
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
    <h2>💡 Erklärungs-Wünsche</h2>
    ${(() => {
      const alle = S.wuensche || [], offen = alle.filter((w) => !w.gesendet);
      return `<div class="einstellung">
        <p style="margin-top:0">${alle.length ? `Auf der Liste: <b>${alle.length}</b>${offen.length ? ` – davon <b>${offen.length} noch nicht gesendet</b>` : " – alle an GitHub gesendet"}.` : "Noch nichts auf der Liste. Tippe bei einer Karte ohne 💡 auf „❓ Erklärung wünschen“ – oder bei Frage &amp; Antwort auf „Meine Antwort war richtig“."}</p>
        ${alle.length ? `<details><summary class="leise">Liste ansehen</summary><p class="leise">${alle.map((w) => (w.typ === "antwort" ? `Antwort „${esc(w.antwort)}“ (zu: ${esc(w.frage)})` : `Erklärung: ${esc(w.it)}`) + (w.gesendet ? " ✓" : "")).join("<br>")}</p></details>` : ""}
        ${wunschStatus ? `<p class="leise">${esc(wunschStatus)}</p>` : ""}
        <p class="leise">Gesendete Wünsche liest Claude bei der nächsten Bearbeitung der App aus und schreibt die Erklärungen dazu. Damit die Wünsche automatisch ankommen, braucht dieses Gerät einmalig den <b>GitHub-Schlüssel</b> (derselbe wie für die Bearbeiten-Seite): ${githubSchluessel() ? "<b>✓ vorhanden</b>" : "<b>fehlt noch</b>"}</p>
        <input type="password" id="ghSchluessel" placeholder="github_pat_… einfügen" autocomplete="off" style="font-family:monospace">
        <div class="reihe" style="margin-bottom:0"><button class="btn zweit" id="ghSpeichern">Schlüssel speichern</button>${offen.length ? `<button class="btn" id="wSenden">Jetzt senden</button>` : ""}${alle.length ? `<button class="btn zweit" id="wKopieren">📋 Liste kopieren</button>` : ""}</div>
      </div>`;
    })()}
    <h2>Inhalte</h2>
    <a class="btn zweit voll" href="bearbeiten.html" style="text-decoration:none">✏️ Wörter, Phrasen und Fragen bearbeiten (am PC)</a>
    <p class="leise" style="margin-top:20px"><span id="versionText">Version ?</span> · Vorlesen: ${TTS ? "ja" : "nein"} · Spracherkennung: ${SR ? "ja" : "nein"}</p>`);
  // Versionsnummer aus dem Offline-Speicher lesen (wird beim Veröffentlichen automatisch erhöht)
  if (window.caches) caches.keys().then((k) => { const v = k.map((x) => (x.match(/italienisch-v(\d+)/) || [])[1]).filter(Boolean).sort((a, b) => b - a)[0]; const el = document.getElementById("versionText"); if (v && el) el.textContent = "Version " + v; }).catch(() => {});
  const sel = document.getElementById("stimme");
  if (sel) sel.onchange = () => { E.stimme = sel.value; speichern(); sprich("Ciao, come stai?"); };
  document.getElementById("test").onclick = () => sprich("Ciao! Benvenuto. Impariamo l'italiano insieme.");
  document.getElementById("tempo").oninput = (e) => { E.tempo = +e.target.value; document.getElementById("tempoWert").textContent = Math.round(E.tempo * 100) + " %"; speichern(); };
  document.getElementById("tempo").onchange = () => sprich("Buongiorno, come sta?");
  document.getElementById("neu").oninput = (e) => { E.neueProTag = +e.target.value; document.getElementById("neuWert").textContent = E.neueProTag; speichern(); };
  document.getElementById("auto").onchange = (e) => { E.automatischVorlesen = e.target.checked; speichern(); };
  document.getElementById("tippen").onchange = (e) => { E.eintippen = e.target.checked; speichern(); };
  document.getElementById("ghSpeichern").onclick = () => {
    const roh = document.getElementById("ghSchluessel").value.replace(/[^\x21-\x7E]/g, ""), m = roh.match(/(?:github_pat_|gh[pousr]_)[A-Za-z0-9_\-]+/), s = m ? m[0] : roh;
    if (s.length < 30) return toast("Das ist zu kurz für einen GitHub-Schlüssel – bitte vollständig kopieren.", 4000);
    try { localStorage.setItem("italienisch-github-schluessel", s); } catch (e) {}
    toast("Schlüssel gespeichert ✓"); wuenscheSenden().then(() => ohneSprung(einstellungen));
  };
  const ws = document.getElementById("wSenden");
  if (ws) ws.onclick = async () => { ws.disabled = true; ws.textContent = "Sende …"; await wuenscheSenden(); ohneSprung(einstellungen); };
  const wk = document.getElementById("wKopieren");
  if (wk) wk.onclick = async () => {
    const text = "Bitte Erklärungen für diese Karten der Italienisch-App:\n" + (S.wuensche || []).map((w) => `${w.id} – ${w.it} = ${w.de}`).join("\n");
    try { await navigator.clipboard.writeText(text); toast("Liste kopiert ✓"); } catch (e) { toast("Kopieren ging nicht."); }
  };
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
  dialogAnsicht.laeuft = false;
  if (erkennung) { try { erkennung.abort(); } catch (e) {} }
  const h = location.hash.replace(/^#/, "") || "start";
  const [teil, arg] = h.split("/");
  const seiten = {
    start: startseite, karten: kartenMenue, karte: karteZeigen, grammatik: grammatikMenue, verben: verbenMenue,
    tabellen: verbTabellen, artikel: artikelStart, cecisono: ceStart, verbsatz: vsatzStart,
    heute: heuteMenue, dialoge: dialogeMenue, dialog: () => dialogZeigen(arg), claude: claudeMenue,
    lektionen: lektionenMenue, lektion: () => lektionZeigen(arg), lerkl: () => lektionErklaerung(arg),
    uebung: () => (arg === "zahlen" ? uebungStarten("Zahlen", [{ zahlen: true }], "grammatik", "uebung/zahlen") : LUECKEN[arg] ? uebungStarten(LUECKEN[arg].titel, [{ luecke: arg }], "grammatik", "uebung/" + arg) : geheZu("grammatik")), satzbau: () => { satz = null; satzbauZeigen(); }, quiz: quizZeigen,
    hoeren: hoerenMenue, sprechen: sprechenMenue, "sprechen-ueben": sprechenZeigen,
    gespraech: gespraechMenue, "gespraech-ueben": gespraechZeigen,
    fehler: fehlerMenue, "satzbau-fehler": () => { satz = null; satzbauStart(schwacheSaetze()); },
    phrasen: () => (arg ? phrasenGruppe(arg) : phrasenMenue()), nachschlagen, einstellungen, stand: () => standSeite(arg), lfehler: () => lektionFehlerSeite(arg)
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
    if (!hatteSteuerung) return;
    // Neue Version ist da: auf der Startseite sofort neu laden, sonst nicht mitten in der Übung stören
    const h = location.hash.replace("#", "");
    if (!h || h === "start" || h === "einstellungen") location.reload();
    else toast("Neue Version geladen – sie ist beim nächsten Öffnen der Startseite da.", 5000);
  });
  // Beim Zurückkehren zur Startseite eine bereits geladene neue Version aktivieren
  window.addEventListener("hashchange", () => {
    if ((location.hash === "#start" || !location.hash) && navigator.serviceWorker.controller && window.__neueVersion) location.reload();
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => { window.__neueVersion = true; });
  // Beim Öffnen der App (auch aus dem Hintergrund) nach einer neuen Version schauen
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") navigator.serviceWorker.getRegistration().then((r) => r && r.update()).catch(() => {});
  });
}
