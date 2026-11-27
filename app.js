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
// Wörter aus data/woerterbuch.js (Grundformen aus Phrasen und Sätzen) sind ebenfalls Karteikarten – Kennung "wb:<italienisch>".
// Was es schon als Karte gibt (gleicher italienischer Text), wird nicht doppelt aufgenommen.
const WB_GRUPPE = (() => {
  const schon = new Set(THEMEN.flatMap((t) => t.eintraege).concat(LEKTION_GRUPPEN.flatMap((g) => g.eintraege)).map((e) => e.it.toLowerCase().trim()));
  const g = { id: "wb", name: "Wörter aus Phrasen & Sätzen", icon: "📖" };
  return { ...g, liste: "", eintraege: zeilen(window.WOERTERBUCH || "").filter((e) => !schon.has(e.it.toLowerCase().trim())).map((e) => ({ it: e.it, de: e.de, id: "wb:" + e.it, thema: "wb" })) };
})();
THEMEN.push(WB_GRUPPE);
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
  nuesse: {},          // id → { drin, seit, serie, zuletzt } – „harte Nüsse“ (von Hand markiert)
  fehlerMuster: {},    // „di→a“ → { falsch, richtig, anzahl, beispiele, … } – typische Verwechslungen
  lektionen: {},       // Lektions-ID → { schritte }  (alte Stände: bestanden = früherer Abschluss-Check)
  wuensche: [],        // Wunschliste: Erklärungen { id, it, de, zeit, gesendet } und Antworten zur Prüfung { typ: "antwort", … }
  eigeneAntworten: {}, // Frage-Kennung → selbst als richtig markierte Antworten (vereinfachte Schreibweise)
  claudeFehler: [],    // Fehler, die Claude in Gesprächen gefunden hat: { text, zeit, genutzt }
  einstellungen: { tempo: 0.9, stimme: "", neueProTag: 25, automatischVorlesen: true, richtung: "beide", eintippen: true, sprechenModus: "zeigen", gespraechText: true, themen: ["grundwoerter"] },
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
  s.grammatik = s.grammatik || {}; s.aussprache = s.aussprache || {}; s.nuesse = s.nuesse || {}; s.fehlerMuster = s.fehlerMuster || {}; s.lektionen = s.lektionen || {}; s.wuensche = s.wuensche || [];
  if (!s.einstellungen.sprechenModus) s.einstellungen.sprechenModus = s.einstellungen.sprechenVerdeckt ? "gedaechtnis" : "zeigen";
  // 25.11.2026: neuer Richtwert 25 neue Karten pro Tag (vorher 10) – einmalig umstellen, falls noch der alte Wert eingestellt ist
  if (!s.einstellungen.neu25) { if (s.einstellungen.neueProTag === 10) s.einstellungen.neueProTag = 25; s.einstellungen.neu25 = true; }
  return s;
}
function speichern() {
  try { localStorage.setItem(SPEICHER_KEY, JSON.stringify(S)); } catch (e) { toast("Speichern hat nicht geklappt."); }
  if (typeof syncVormerken === "function") syncVormerken(); // Lernstand in ~1 Minute online sichern (falls GitHub-Schlüssel da)
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
// Lernstand einer Karte als 6 Punkte: je weiter der Abstand, desto mehr Punkte; ab ½ Jahr „sitzt fest“
const LERN_STUFEN = [1, 3, 8, 20, 50, 125]; // Tage – entspricht ungefähr den Wiederholungen mit „Gut“
function lernstandHtml(id, r) {
  const z = zustand(id, r);
  if (!z || !z.wdh) return "";
  if (z.intervall >= SICHER_TAGE) return `<div class="lernstand" title="kommt erst in einem halben Jahr oder später wieder">🏆 sitzt fest</div>`;
  const n = LERN_STUFEN.filter((t) => z.intervall >= t).length;
  return `<div class="lernstand" title="Lernstand dieser Karte">${"●".repeat(n)}<span>${"○".repeat(LERN_STUFEN.length - n)}</span> 🏆</div>`;
}
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
  nussLernen(id, note > 0);
  const key = schluessel(id, r), alt = S.karten[key];
  const k = alt || { ease: 2.5, intervall: 0, wdh: 0, faellig: 0, richtig: 0, falsch: 0, vergessen: 0 };
  const t = naechsterAbstand(alt, note);
  // Für die Lernkurve: neue Karte oder echte Wiederholung (Karte war schon einmal gekonnt)?
  if (!alt) statZaehlen("neu"); else if (alt.wdh > 0) statZaehlen("wdh", note > 0);
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
// ---------- Tagesstatistik für die Lernkurve ----------
// Pro Tag und Gerät: w = Wiederholungen gekonnter Karten, wOk = davon gewusst, n = neue Karten.
// Getrennt nach Gerät, damit sich Handy und PC beim Abgleich nicht gegenseitig überschreiben.
const GERAET = (() => { try { let g = localStorage.getItem("italienisch-geraet"); if (!g) { g = Math.random().toString(36).slice(2, 8); localStorage.setItem("italienisch-geraet", g); } return g; } catch (e) { return "x"; } })();
function statZaehlen(art, ok) {
  S.statistik = S.statistik || {};
  const tag = (S.statistik[heute()] = S.statistik[heute()] || {});
  const g = (tag[GERAET] = tag[GERAET] || { w: 0, wOk: 0, n: 0 });
  if (art === "neu") g.n++; else { g.w++; if (ok) g.wOk++; }
}
// Ergebnisse aus Hören und Sprechen fließen sanft in den Lernstand ein
function rueckmeldung(id, r, ok) {
  const key = schluessel(id, r), k = S.karten[key];
  if (!k) return; // neue Wörter werden nur über die Karteikarten eingeführt
  if (ok && k.faellig <= Date.now()) { bewerte(id, r, 2); return; } // fällige Karte richtig = zählt als Wiederholung
  nussLernen(id, ok);
  k.zuletzt = Date.now(); // für den Abgleich zwischen Geräten: der zuletzt geübte Stand gewinnt
  if (ok) k.richtig++;
  else {
    if (k.wdh > 0) statZaehlen("wdh", false); // gekonnte Karte beim Hören/Sprechen nicht gewusst = vergessen
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
  g.zuletzt = Date.now(); // für den Abgleich zwischen Geräten
  if (ok) { g.richtig++; g.intervall = g.intervall ? Math.min(120, Math.round(g.intervall * 2.5)) : 1; g.faellig = startDesTages(Date.now() + g.intervall * TAG); }
  else { g.falsch++; g.intervall = 0; g.faellig = Date.now(); }
  S.grammatik[key] = g; geuebt();
}
// „Kann ich sicher“ bei Grammatik und Fragen: sofort auf den längsten Abstand (120 Tage)
function gSicher(key) {
  const g = S.grammatik[key] || { intervall: 0, faellig: 0, richtig: 0, falsch: 0 };
  g.zuletzt = Date.now(); g.intervall = 120; g.faellig = startDesTages(Date.now() + 120 * TAG);
  S.grammatik[key] = g; speichern();
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
// Alle italienischen Einträge mit derselben deutschen Bedeutung zählen als richtig (z. B. Che cosa significa? = Che cosa vuol dire?)
// … plus die von Claude bestätigten weiteren Antworten (data/hinweise.js). Die Karte selbst steht vorn.
function gleicheZiele(karte) {
  const roh = [karte.it].concat(ALLE_KARTEN.filter((k) => k.de === karte.de).map((k) => k.it), (window.KARTEN_ALTERNATIVEN || {})[karte.id] || []);
  const alle = roh.concat(roh.flatMap((t) => wasVarianten(t, karte)));
  const gesehen = new Set();
  return alle.filter((t) => { const n = t.toLowerCase(); return !gesehen.has(n) && gesehen.add(n); });
}
// „Was …?“-Fragen gibt es dreimal: cosa (am häufigsten) · che cosa (vollständig) · che (locker).
// „Che …“ allein nur, wenn die deutsche Seite mit „Was“ anfängt – sonst kann che auch „welche“ heißen (Che ore sono?).
function wasVarianten(t, karte) {
  const m = t.match(/^(che cosa |cosa |che cos'|cos'|che )(.*)$/i);
  if (!m) return [];
  const vor = m[1].toLowerCase(), rest = m[2];
  if (vor === "che " && !/^was\b/i.test(karte.de)) return [];
  if (!rest.trim() || /^cos/i.test(rest) || /^was für\b/i.test(karte.de)) return []; // „che cosa“ allein, „Che bella giornata!“ (= Was für …)
  const gross = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const passt = (s) => (/^[A-ZÀ-Ý]/.test(t) ? gross(s) : s);
  if (vor === "che cos'" || vor === "cos'") return ["cos'" + rest, "che cos'" + rest].map(passt);
  return ["cosa " + rest, "che cosa " + rest, "che " + rest].map(passt);
}
const istWasFrage = (karte) => wasVarianten(karte.it, karte).length > 0;
function pruefeEingabe(eingabe, karte) {
  const e = saeubern(eingabe);
  if (!e) return { stufe: "falsch", text: "Keine Antwort eingegeben." };
  const ziele = gleicheZiele(karte);
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
  const varianten = [karte.de].concat(karte.de.split(/\/|,|;| oder /), (window.KARTEN_ALTERNATIVEN_DE || {})[karte.id] || []).map(norm).filter(Boolean);
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
  // Kachel eines Wortes / einer Phrase antippen (nicht den Lautsprecher) → Detailseite
  const kw = e.target.closest("[data-wort]");
  // Walnuss antippen: Karte zu den harten Nüssen legen oder wieder herausnehmen
  const nb = e.target.closest("[data-nuss]");
  if (nb) { e.stopPropagation(); nussUmschalten(nb.dataset.nuss); }
  if (kw && !b && !nb) geheZu("wort/" + kw.dataset.wort);
  const g = e.target.closest("[data-gehe]");
  if (g) geheZu(g.dataset.gehe);
  if (e.target.closest("[data-heute-weiter]")) zurueckZuHeute();
  if (e.target.closest("[data-lektion-weiter]")) zurueckZuLektion();
  const wb = e.target.closest("[data-wunsch]");
  // „Frage an Claude“: erst ein kleines Eingabefeld öffnen, dann senden
  if (wb) { e.stopPropagation(); wunschFormular(wb); }
  const ws = e.target.closest("[data-wsenden]");
  if (ws) {
    e.stopPropagation();
    const form = ws.closest(".wunschform"), text = form.querySelector("textarea").value.trim();
    wunschHinzufuegen(ws.dataset.wsenden, text);
    form.outerHTML = `<div class="leise" style="font-size:13px">✓ ${text ? "Frage" : "Erklärungs-Wunsch"} an Claude gesendet – die Antwort steht nach der nächsten Bearbeitung hier als 💡.</div>`;
  }
  const wa = e.target.closest("[data-wabbruch]");
  if (wa) { e.stopPropagation(); const f = wa.closest(".wunschform"); f.outerHTML = f.dataset.vorher; }
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

// ---------- Lernkurve: was kann ich wirklich – und wie schnell lerne ich? ----------
// Abrufwahrscheinlichkeit einer Karte (Vergessenskurve): Der Abstand ist so gewählt, dass man die Karte zum Termin
// noch zu etwa 90 % weiß. Davor ist sie höher, danach sinkt sie:  R = 0,9 ^ (Tage seit dem letzten Üben / Abstand).
function abrufW(z, zeitpunkt) {
  if (!z || !z.wdh) return 0;
  const letzte = z.zuletzt || (z.faellig - (z.intervall || 1) * TAG);
  return Math.pow(0.9, Math.max(0, (zeitpunkt - letzte) / TAG) / Math.max(1, z.intervall));
}
// Rückblick für Tage vor der Aufzeichnung: frühere Wiederholungen grob nachbilden (Abstände wie bei „Gut“)
const STANDARD_ABSTAENDE = [1, 3, 8, 20, 50, 125, 313];
function abrufWDamals(z, zeitpunkt) {
  if (!z || !z.wdh || !z.zuletzt) return 0;
  let t = z.zuletzt, k = z.wdh, abstand = Math.max(1, z.intervall);
  while (k >= 1) {
    if (t <= zeitpunkt) return Math.pow(0.9, (zeitpunkt - t) / TAG / abstand);
    k--; if (k < 1) break;
    abstand = STANDARD_ABSTAENDE[k - 1] || 1; // Abstand nach der k-ten Wiederholung
    t -= abstand * TAG;
  }
  return 0; // damals noch nicht gelernt
}
let A1_IDS = null;
const a1Ids = () => A1_IDS || (A1_IDS = new Set(LEKTION_LISTE.flatMap(lektionKarten).map((k) => k.id)));
// Wie viele Karten könntest du zu diesem Zeitpunkt abrufen? (Summe der Wahrscheinlichkeiten)
function wortschatzMessen(zeitpunkt = Date.now(), damals = false) {
  const f = damals ? abrufWDamals : abrufW, a1 = a1Ids();
  let itde = 0, deit = 0, inA1 = 0;
  for (const key in S.karten) {
    const [id, r] = key.split("|"); if (!KARTE_NACH_ID[id]) continue;
    const p = f(S.karten[key], zeitpunkt);
    if (r === "it-de") itde += p; else deit += p;
    if (a1.has(id)) inA1 += p;
  }
  return { itde: Math.round(itde), deit: Math.round(deit), a1: Math.round(inA1) };
}
// A1 gilt als erreicht, wenn 90 % des Lektionsstoffs (Karten in den geübten Richtungen) abrufbar sind
const a1Ziel = () => Math.round(a1Ids().size * richtungenFuer(S.einstellungen.richtung).length * 0.9);
const tagMinus = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
// Tageswerte festhalten: heute gemessen, fehlende frühere Tage (seit dem ersten Übungstag) nachträglich geschätzt
function verlaufAktualisieren() {
  S.verlauf = S.verlauf || {};
  const vorher = JSON.stringify(S.verlauf[heute()] ? { ...S.verlauf[heute()], zeit: 0 } : null);
  const tage = Object.keys(S.tage || {}).sort();
  if (tage.length) for (let d = new Date(tage[0] + "T12:00:00"); d.toISOString().slice(0, 10) < heute(); d.setDate(d.getDate() + 1)) {
    const k = d.toISOString().slice(0, 10);
    if (!S.verlauf[k]) S.verlauf[k] = { ...wortschatzMessen(new Date(k + "T23:59:00").getTime(), true), geschaetzt: true, zeit: 0 };
  }
  S.verlauf[heute()] = { ...wortschatzMessen(), zeit: Date.now() };
  return JSON.stringify({ ...S.verlauf[heute()], zeit: 0 }) !== vorher; // true = hat sich geändert
}
function statSumme(von, bis) {
  let w = 0, wOk = 0, n = 0;
  Object.entries(S.statistik || {}).forEach(([d, geraete]) => { if (d >= von && d <= bis) Object.values(geraete).forEach((g) => { w += g.w; wOk += g.wOk; n += g.n; }); });
  return { w, wOk, n, quote: w ? Math.round((100 * wOk) / w) : null };
}
function lernAnalyse() {
  if (verlaufAktualisieren()) { try { localStorage.setItem(SPEICHER_KEY, JSON.stringify(S)); } catch (e) {} }
  const v = S.verlauf, jetzt = v[heute()], summe = (x) => x.itde + x.deit;
  // Zuwachs pro Tag: Vergleich mit dem Stand vor (bis zu) 7 Tagen
  const frueher = Object.keys(v).filter((d) => d < heute()).sort();
  const basis = frueher.find((d) => d >= tagMinus(7)) || frueher[0] || null;
  const spanne = basis ? Math.max(1, Math.round((Date.parse(heute()) - Date.parse(basis)) / TAG)) : 0;
  const tempoA1 = basis ? (jetzt.a1 - v[basis].a1) / spanne : null;
  const tempo = basis ? (summe(jetzt) - summe(v[basis])) / spanne : null;
  const w7 = statSumme(tagMinus(6), heute()), wVor = statSumme(tagMinus(13), tagMinus(7));
  const ziel = a1Ziel();
  // Schneller als die eingestellten neuen Karten pro Tag kann der Wortschatz auf Dauer nicht wachsen
  // (jede neue Karte bringt gut 0,9 abrufbare Karten) – sonst wäre die Prognose nach einem fleißigen Start zu optimistisch.
  const obergrenze = S.einstellungen.neueProTag * 0.9;
  const tempoPrognose = tempoA1 == null ? null : Math.min(tempoA1, obergrenze);
  let prognose = null;
  if (jetzt.a1 >= ziel) prognose = { erreicht: true };
  else if (tempoPrognose > 0.5) { const tage = (ziel - jetzt.a1) / tempoPrognose; prognose = { tage, datum: new Date(Date.now() + tage * TAG), begrenzt: tempoA1 > obergrenze }; }
  return { jetzt, tempo, tempoA1, spanne, w7, wVor, ziel, prognose, empfehlung: lernEmpfehlung(w7, wVor) };
}
// Empfehlung: mehr oder weniger neue Karten – nach Behaltensquote, ihrem Trend und dem Rückstand an fälligen Karten
function lernEmpfehlung(w7, wVor) {
  const neu = S.einstellungen.neueProTag, faellig = anzahlFaellig();
  const aktiveTage = Object.keys(S.statistik || {}).filter((d) => d >= tagMinus(6)).length || 1;
  const wdhProTag = Math.round(w7.w / aktiveTage);
  const e = (art, wert, text) => ({ art, wert, text });
  if (w7.w < 30) return e("info", neu, `Für eine Empfehlung braucht es noch etwas mehr Wiederholungen (bisher ${w7.w} von mindestens 30 in 7 Tagen) – üb einfach weiter.`);
  if (w7.quote < 80) return e("weniger", Math.max(5, neu - 5), `Bei Wiederholungen weißt du zurzeit nur ${w7.quote} % – es kommt mehr Neues dazu, als hängen bleibt. Weniger neue Karten geben dem Gedächtnis Zeit.`);
  if (wVor.w >= 30 && w7.quote < wVor.quote - 7) return e("weniger", Math.max(5, neu - 5), `Deine Behaltensquote ist gesunken (${wVor.quote} % → ${w7.quote} %). Etwas weniger Neues hilft, das Gelernte zu festigen.`);
  if (faellig > Math.max(60, 2 * wdhProTag)) return e("weniger", Math.max(5, neu - 10), `Es sind ${faellig} Karten fällig – mehr, als du sonst an zwei Tagen wiederholst. Erst den Rückstand abbauen, dann wieder mehr Neues.`);
  if (w7.quote >= 92 && faellig <= Math.max(20, wdhProTag)) return e("mehr", Math.min(40, neu + 5), `Du weißt ${w7.quote} % der Wiederholungen und hast keinen Rückstand – du kannst mehr Neues vertragen.`);
  return e("passt", neu, `Behaltensquote ${w7.quote} % – im guten Bereich (80–92 %), kein Rückstand. ${neu} neue Karten pro Tag passen.`);
}
const prognoseText = (p) => !p ? "Für eine Prognose braucht es noch ein paar Übungstage mit Zuwachs."
  : p.erreicht ? "🎉 Du hast A1 erreicht: 90 % des Lektionsstoffs sind abrufbar."
  : `Wenn du in diesem Tempo weiterlernst, erreichst du A1 voraussichtlich <b>${p.datum.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</b> (in etwa ${p.tage < 21 ? Math.round(p.tage) + " Tagen" : p.tage < 120 ? Math.round(p.tage / 7) + " Wochen" : Math.round(p.tage / 30) + " Monaten"}).`
    + (p.begrenzt ? ` <small>Gerechnet mit ${S.einstellungen.neueProTag} neuen Karten pro Tag – schneller wächst der Wortschatz mit dieser Einstellung nicht.</small>` : "");

// Kleine SVG-Diagramme ohne Bibliothek. Antippen oder Überfahren eines Punktes/Balkens zeigt den Wert darunter.
const kurzDatum = (d) => d.slice(8, 10) + "." + d.slice(5, 7) + ".";
function diagramm(id, svg, legende = "") {
  return `<div class="diagramm" id="${id}">${legende}${svg}<div class="diagramm-tipp leise">Punkt oder Balken antippen für den genauen Wert.</div></div>`;
}
function achsenRaster(B, H, L, U, max, format) {
  return [0, 0.5, 1].map((f) => { const y = U - f * (U - 10); return `<line x1="${L}" x2="${B}" y1="${y}" y2="${y}" class="raster"/><text x="${L - 4}" y="${y + 4}" class="achse" text-anchor="end">${format(max * f)}</text>`; }).join("");
}
function xBeschriftung(tage, x, U) {
  const idx = tage.length <= 3 ? tage.map((_, i) => i) : [0, Math.floor((tage.length - 1) / 2), tage.length - 1];
  return [...new Set(idx)].map((i) => `<text x="${x(i)}" y="${U + 16}" class="achse" text-anchor="middle">${kurzDatum(tage[i])}</text>`).join("");
}
const schoeneGrenze = (v) => { const s = [5, 10, 20, 25, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000]; return s.find((x) => x >= v) || Math.ceil(v / 1000) * 1000; };
function linienDiagramm(tage, serien) { // serien: [{name, klasse, werte:[], gestrichelt}]
  const B = 320, H = 170, L = 38, U = H - 24;
  const max = schoeneGrenze(Math.max(5, ...serien.flatMap((s) => s.werte)));
  const x = (i) => (tage.length === 1 ? (L + B) / 2 : L + 8 + (i * (B - L - 46)) / (tage.length - 1));
  const y = (v) => U - (v / max) * (U - 10);
  const linien = serien.map((s) => `<polyline class="linie ${s.klasse}" points="${s.werte.map((v, i) => `${x(i)},${y(v)}`).join(" ")}"/>`
    + s.werte.map((v, i) => `<circle class="punkt ${s.klasse}${s.geschaetzt && s.geschaetzt[i] ? " hohl" : ""}" cx="${x(i)}" cy="${y(v)}" r="4" data-tipp="${kurzDatum(tage[i])}: ${s.name} ${v}${s.geschaetzt && s.geschaetzt[i] ? " (nachträglich geschätzt)" : ""}"/>`).join("")
    + `<text x="${x(s.werte.length - 1) + 7}" y="${y(s.werte[s.werte.length - 1]) + 4}" class="direkt ${s.klasse}">${s.werte[s.werte.length - 1]}</text>`).join("");
  return `<svg viewBox="0 0 ${B} ${H}" class="chart">${achsenRaster(B - 40, H, L, U, max, (v) => Math.round(v))}${linien}${xBeschriftung(tage, x, U)}</svg>`;
}
function balkenDiagramm(tage, werte, opt = {}) { // opt: {max, ziel, einheit, tipps}
  const B = 320, H = 150, L = 38, U = H - 24;
  const hatNeg = werte.some((v) => v < 0);
  const max = opt.max || schoeneGrenze(Math.max(5, ...werte.map(Math.abs)));
  const null0 = hatNeg ? (U + 10) / 2 : U, skala = (hatNeg ? (U - 10) / 2 : U - 10) / max;
  const breite = Math.min(22, (B - L - 10) / tage.length - 2);
  const x = (i) => L + 6 + i * ((B - L - 10) / tage.length) + ((B - L - 10) / tage.length - breite) / 2;
  const balken = werte.map((v, i) => v == null ? "" : `<rect class="saeule${v < 0 ? " negativ" : ""}" x="${x(i)}" y="${v >= 0 ? null0 - v * skala : null0}" width="${breite}" height="${Math.max(1, Math.abs(v) * skala)}" rx="3" data-tipp="${(opt.tipps || [])[i] || kurzDatum(tage[i]) + ": " + v + (opt.einheit || "")}"/>`).join("");
  const ziel = opt.ziel != null ? `<line x1="${L}" x2="${B}" y1="${null0 - opt.ziel * skala}" y2="${null0 - opt.ziel * skala}" class="ziellinie"/><text x="${B}" y="${null0 - opt.ziel * skala - 4}" class="achse" text-anchor="end">Ziel ${opt.ziel}${opt.einheit || ""}</text>` : "";
  const raster = hatNeg
    ? `<line x1="${L}" x2="${B}" y1="${null0}" y2="${null0}" class="raster"/><text x="${L - 4}" y="${null0 + 4}" class="achse" text-anchor="end">0</text><text x="${L - 4}" y="14" class="achse" text-anchor="end">+${max}</text><text x="${L - 4}" y="${U + 4}" class="achse" text-anchor="end">−${max}</text>`
    : achsenRaster(B, H, L, U, max, (v) => Math.round(v) + (opt.einheit || ""));
  const xi = (i) => x(i) + breite / 2;
  return `<svg viewBox="0 0 ${B} ${H}" class="chart">${raster}${ziel}${balken}${xBeschriftung(tage, xi, U)}</svg>`;
}
function diagrammeKlickbar() {
  $app.querySelectorAll(".diagramm").forEach((d) => {
    const tipp = d.querySelector(".diagramm-tipp");
    const zeigen = (ev) => { const t = ev.target.closest("[data-tipp]"); if (!t) return; tipp.textContent = t.dataset.tipp; d.querySelectorAll(".aktiv").forEach((x) => x.classList.remove("aktiv")); t.classList.add("aktiv"); };
    d.addEventListener("click", zeigen); d.addEventListener("mouseover", zeigen);
  });
}
function lernkurveSeite() {
  setzeKopf("📈 Lernkurve", "start");
  const a = lernAnalyse(), e = a.empfehlung;
  const tage = Object.keys(S.verlauf).sort().slice(-30);
  const v = tage.map((d) => S.verlauf[d]);
  // 1. Behaltensquote der letzten 14 Tage
  const tage14 = Array.from({ length: 14 }, (_, i) => tagMinus(13 - i));
  const quoten = tage14.map((d) => statSumme(d, d));
  // 3. Zuwachs pro Tag (Unterschied zum Vortag)
  const zuwachs = tage.slice(1).map((d, i) => (v[i + 1].itde + v[i + 1].deit) - (v[i].itde + v[i].deit));
  const empfFarbe = e.art === "weniger" ? "warnung" : e.art === "mehr" ? "gut" : "info";
  zeige(`
    <div class="statistik">
      <div><b>${a.jetzt.itde}</b><span>Wörter & Sätze verstehst du gerade</span></div>
      <div><b>${a.jetzt.deit}</b><span>kannst du gerade selbst sagen</span></div>
      <div><b>${a.w7.quote == null ? "–" : a.w7.quote + " %"}</b><span>Behaltensquote (7 Tage)</span></div>
      <div><b>${a.tempo == null ? "–" : (a.tempo >= 0 ? "+" : "") + a.tempo.toLocaleString("de-DE", { maximumFractionDigits: 1 })}</b><span>Zuwachs pro Tag${a.spanne ? ` (${a.spanne} ${a.spanne === 1 ? "Tag" : "Tage"})` : ""}</span></div>
    </div>
    <div class="meldung info">🎯 ${prognoseText(a.prognose)}<br><small>A1 = 90 % des Lektionsstoffs abrufbar: Ziel ${a.ziel}, jetzt ${a.jetzt.a1}.</small></div>
    <div class="meldung ${empfFarbe === "warnung" ? "schlecht" : empfFarbe}">💡 <b>Empfehlung: ${e.art === "weniger" ? "weniger neue Karten" : e.art === "mehr" ? "mehr neue Karten" : e.art === "passt" ? "weiter so" : "noch zu früh"}</b><br>${e.text}
      ${e.wert !== S.einstellungen.neueProTag ? `<br><button class="btn" id="empfJa" style="margin-top:8px">Übernehmen: ${e.wert} neue Karten pro Tag (bisher ${S.einstellungen.neueProTag})</button>` : ""}</div>

    <h2>1. Behaltensquote</h2>
    <p class="leise">Wie viel Prozent der Wiederholungen du noch wusstest – der ehrlichste Wert dafür, ob Gelerntes hängen bleibt. Gut: 80–92 %.</p>
    ${quoten.every((q) => !q.w) ? `<p class="meldung info">Die Aufzeichnung der Wiederholungen läuft ab jetzt – nach ein paar Übungstagen erscheinen hier die Balken.</p>` : diagramm("dQuote", balkenDiagramm(tage14, quoten.map((q) => q.quote), { max: 100, ziel: 85, einheit: " %", tipps: tage14.map((d, i) => quoten[i].w ? `${kurzDatum(d)}: ${quoten[i].quote} % (${quoten[i].wOk} von ${quoten[i].w} Wiederholungen gewusst)` : `${kurzDatum(d)}: keine Wiederholungen`) }))}

    <h2>2. Abrufbarer Wortschatz</h2>
    <p class="leise">Wie viele Karten du an jedem Tag wahrscheinlich abrufen konntest. Hohle Punkte: nachträglich geschätzt (vor Beginn der Aufzeichnung).</p>
    ${diagramm("dWortschatz", linienDiagramm(tage, [
      { name: "verstehen", klasse: "s1", werte: v.map((x) => x.itde), geschaetzt: v.map((x) => !!x.geschaetzt) },
      { name: "selbst sagen", klasse: "s2", werte: v.map((x) => x.deit), geschaetzt: v.map((x) => !!x.geschaetzt) }
    ]), `<div class="legende"><span class="s1">● verstehen</span><span class="s2">● selbst sagen</span></div>`)}

    <h2>3. Zuwachs pro Tag</h2>
    <p class="leise">Neu Gelerntes minus Vergessenes (beide Richtungen zusammen). Rote Balken: An dem Tag ist mehr verblasst als dazugekommen – das passiert an Tagen ohne Üben.</p>
    ${zuwachs.length ? diagramm("dZuwachs", balkenDiagramm(tage.slice(1), zuwachs, { tipps: tage.slice(1).map((d, i) => `${kurzDatum(d)}: ${zuwachs[i] >= 0 ? "+" : ""}${zuwachs[i]} Karten`) })) : `<p class="leise">Ab dem zweiten Tag zu sehen.</p>`}

    <details class="leise" style="margin-top:16px"><summary>So wird gerechnet</summary>
      <p>Für jede Karte schätzt die App, wie wahrscheinlich du sie gerade weißt: Zum Wiederholungstermin etwa 90 %, davor mehr, danach sinkt es (Vergessenskurve). Die Summe über alle Karten ist dein abrufbarer Wortschatz. Der Zuwachs pro Tag ist der Unterschied zu vor bis zu 7 Tagen, die Prognose rechnet diesen Zuwachs bis zum A1-Ziel weiter. Am Anfang ist sie noch ungenau – sie wird mit jeder Woche verlässlicher.</p>
      <p>Behaltensquote: nur Wiederholungen von Karten, die du schon einmal konntest – Fehler bei neuen Karten zählen nicht, die gehören zum Lernen dazu.</p></details>`);
  diagrammeKlickbar();
  const ja = document.getElementById("empfJa");
  if (ja) ja.onclick = () => { S.einstellungen.neueProTag = e.wert; S.empfehlungAntwort = { datum: heute(), art: e.art }; speichern(); toast(`Gespeichert: ${e.wert} neue Karten pro Tag.`); ohneSprung(lernkurveSeite); };
}
// Hinweis auf der Startseite, wenn die Empfehlung eine Änderung ist (höchstens alle 7 Tage, wenn man „Später“ sagt)
function empfehlungHinweis(a) {
  const e = a.empfehlung;
  if (!["weniger", "mehr"].includes(e.art) || e.wert === S.einstellungen.neueProTag) return "";
  const antw = S.empfehlungAntwort;
  if (antw && antw.art === e.art && antw.datum > tagMinus(7)) return "";
  return `<div class="meldung ${e.art === "weniger" ? "schlecht" : "gut"}">📈 <b>Lern-Analyse:</b> ${e.text}
    <div class="reihe" style="margin:8px 0 0"><button class="btn" id="hEmpfJa">${e.wert} neue Karten pro Tag</button><button class="btn zweit" id="hEmpfNein">Später</button></div></div>`;
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
  const la = lernAnalyse();
  const prog = la.prognose && !la.prognose.erreicht ? ` · A1 voraussichtlich ${la.prognose.datum.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}` : la.prognose ? " · A1 erreicht 🎉" : "";
  zeige(`${schluesselWarnung()}${sicherungsHinweis()}${empfehlungHinweis(la)}
    <div class="statistik">
      <button data-gehe="stand/faellig"><b>${anzahlFaellig()}</b><span>Karten heute wiederholen</span></button>
      <button data-gehe="stand/serie"><b>${serie()}</b><span>Tage am Stück geübt</span></button>
      <button data-gehe="stand/verstehe"><b>${verstanden}</b><span>verstehe ich (von ${ALLE_KARTEN.length})</span></button>
      <button data-gehe="stand/sagen"><b>${sagen}</b><span>kann ich selbst sagen</span></button>
    </div>
    <div class="kacheln">
      <button class="kachel breit haupt" data-gehe="heute"><span class="sym">▶️</span><span><b>Heute üben</b><br><small>${hOffen ? `${hs.length - hOffen} von ${hs.length} Schritten erledigt · ca. 15–20 Minuten` : "🎉 Für heute geschafft!"}</small></span></button>
      <button class="kachel breit" data-gehe="lektionen"><span class="sym">📚</span><span><b>Alle Lektionen</b><br><small>${gesamtGefestigt().prozent} % sitzen fest · ${LEKTION_LISTE.filter(durchgearbeitet).length} von 12 durchgearbeitet${akt ? ` · als Nächstes: Lektion ${akt.nr} – ${esc(akt.titel)}` : ""}</small></span></button>
      <button class="kachel breit" data-gehe="lernkurve"><span class="sym">📈</span><span><b>Lernkurve</b><br><small>${la.jetzt.itde} verstehen · ${la.jetzt.deit} selbst sagen${la.tempo != null ? ` · ${la.tempo >= 0 ? "+" : ""}${la.tempo.toLocaleString("de-DE", { maximumFractionDigits: 1 })} pro Tag` : ""}${prog}</small></span></button>
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
  // Empfehlung aus der Lern-Analyse annehmen oder auf später verschieben
  const ej = document.getElementById("hEmpfJa"), en = document.getElementById("hEmpfNein");
  if (ej) ej.onclick = () => { S.einstellungen.neueProTag = la.empfehlung.wert; S.empfehlungAntwort = { datum: heute(), art: la.empfehlung.art }; speichern(); toast(`Gespeichert: ${la.empfehlung.wert} neue Karten pro Tag.`); ohneSprung(startseite); };
  if (en) en.onclick = () => { S.empfehlungAntwort = { datum: heute(), art: la.empfehlung.art }; speichern(); ohneSprung(startseite); };
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
  if (sitzung.rueck != null) return karteRueckblick();
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
      ${nussBtn(k.id)}
      <span class="leise">${neu ? "✨ Neu · " : ""}${itDe ? "Was heißt das?" : "Wie sagt man auf Italienisch?"}</span>
      ${lernstandHtml(k.id, r)}
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
    <div class="reihe sprechleiste">
      <button class="btn zweit" id="kZurueck" ${(sitzung.verlauf || []).length ? "" : "disabled"}>‹ Zurück</button>
      <button class="btn zweit" id="kWeiter" ${sitzung.pos < sitzung.liste.length - 1 ? "" : "disabled"}>Überspringen ›</button>
    </div>
  `);
  // Zurück = die zuletzt bewerteten Karten noch einmal ansehen · Überspringen = diese Karte ans Ende der Runde
  document.getElementById("kZurueck").onclick = () => { sitzung.rueck = sitzung.verlauf.length - 1; karteZeigen(); };
  document.getElementById("kWeiter").onclick = () => {
    sitzung.liste.push(sitzung.liste.splice(sitzung.pos, 1)[0]);
    sitzung.aufgedeckt = false; sitzung.eingabe = null; karteZeigen();
  };
  if (!sitzung.aufgedeckt && itDe && S.einstellungen.automatischVorlesen) sprich(k.it);
  if (sitzung.aufgedeckt && !itDe && S.einstellungen.automatischVorlesen) sprich(k.it);
  const auf = document.getElementById("aufdecken");
  if (auf) auf.onclick = () => { sitzung.aufgedeckt = true; karteZeigen(); };
  const feld = document.getElementById("antwort");
  if (feld) {
    const pruefen = () => {
      sitzung.eingabe = { ...pruefeEingabe(feld.value, k), eingabe: feld.value.trim() };
      if (!["richtig", "akzent"].includes(sitzung.eingabe.stufe)) fehlerAusText(k.it, feld.value); // typische Verwechslung merken
      sitzung.aufgedeckt = true; karteZeigen();
    };
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
    (sitzung.verlauf = sitzung.verlauf || []).push({ k, r, n, eingabe: sitzung.eingabe && sitzung.eingabe.eingabe });
    if (n === 0) sitzung.liste.push({ k, r }); else sitzung.fertig++;
    sitzung.pos++; sitzung.aufgedeckt = false; sitzung.eingabe = null; karteZeigen();
  }));
}

// Schon bewertete Karte noch einmal ansehen (nur anschauen – die Bewertung bleibt, wie sie war)
function karteRueckblick() {
  const i = sitzung.rueck, { k, r, n, eingabe } = sitzung.verlauf[i], itDe = r === "it-de";
  const namen = ["🔁 Nochmal", "Schwer", "Gut", "Leicht", "🏆 Kann ich sicher"];
  zeige(`
    ${fortschrittsLeiste(Math.min(sitzung.fertig + 1, sitzung.gesamt), sitzung.gesamt)}
    <div class="karte">
      ${nussBtn(k.id)}
      <span class="leise">Schon bewertet: <b>${namen[n]}</b></span>
      <div class="wort">${esc(itDe ? k.it : k.de)}</div>
      <div class="trenner"></div>
      ${eingabe ? `<div class="leise">Deine Antwort: <b>${esc(eingabe)}</b></div>` : ""}
      <div class="loesung">${esc(itDe ? k.de : k.it)}</div>${lautBtn(k.it)}${hinweisHtml(k)}
    </div>
    <p class="leise" style="text-align:center">Rückblick – mit „Weiter“ geht es zurück zur aktuellen Karte.</p>
    <div class="reihe sprechleiste">
      <button class="btn zweit" id="kZurueck" ${i ? "" : "disabled"}>‹ Zurück</button>
      <button class="btn" id="kWeiter">Weiter ›</button>
    </div>`);
  document.getElementById("kZurueck").onclick = () => { sitzung.rueck = i - 1; karteZeigen(); };
  document.getElementById("kWeiter").onclick = () => { sitzung.rueck = i + 1 < sitzung.verlauf.length ? i + 1 : null; karteZeigen(); };
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
    <details class="hilfe" style="margin-top:8px"><summary>Präpositionen – a, in, di, da, al, nel …</summary>${GRAMMATIK_HILFE.praep}</details>
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
    beiAntwort: (ok) => gBewerte("ce:" + x.s, ok), sicher: () => gSicher("ce:" + x.s)
  };
}
// Übung "Verben im Satz": Verbform selbst eintippen
function vsatzAufgabe(x) {
  const v = ALLE_VERBEN.find((y) => y.inf === x.inf), richtig = konjugiere(v)[x.p], key = "vsatz:" + x.s;
  const ganz = x.s.replace("___", richtig);
  return {
    frage: `<div class="leise">${esc(x.de)}</div><div class="gross" style="font-size:24px">${esc(x.s).replace("___", "<u>&nbsp;&nbsp;?&nbsp;&nbsp;</u>")}</div><div class="leise">Verb: <b>${esc(x.inf)}</b> (${esc(v.de)})</div>`,
    tippen: true, richtig, sprechen: ganz, erklaerung: ganz,
    beiAntwort: (ok) => gBewerte(key, ok), nichtGewusst: () => gBewerte(key, false), sicher: () => gSicher(key)
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
    beiAntwort: (ok) => gBewerte(key, ok), sicher: () => gSicher(key) };
}
const artikelAufgabe = (a) => ({
  frage: `<div class="leise">Welcher Artikel passt?</div><div class="gross">___ ${esc(a.nomen)}</div>`,
  optionen: ["il", "lo", "la", "l'", "i", "gli", "le"], richtig: a.artikel, sprechen: a.ganz,
  erklaerung: `${a.ganz} = ${a.de}`, zwei: true, beiAntwort: (ok) => gBewerte("art:" + a.ganz, ok), sicher: () => gSicher("art:" + a.ganz)
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
    ? `<div class="reihe" style="flex-wrap:nowrap;margin-top:0"><input type="text" id="qtipp" lang="it" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Antwort eintippen …" style="margin:0;flex:1">${SR && !a.keinMikro ? `<button class="btn zweit" id="qsprechen" title="Antwort sprechen" style="flex:none">🎤</button>` : ""}<button class="btn" id="qpruefen" style="flex:none">Prüfen</button></div><div id="qstatus" class="leise"></div>`
    : `<div class="optionen${a.zwei ? " zwei" : ""}">${a.optionen.map((o) => `<button data-o="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
  zeige(`${fortschrittsLeiste(quiz.pos + 1, quiz.aufgaben.length)}
    <div class="frage">${a.frage}</div>
    ${antwortHtml}
    <div id="rueck"></div>
    ${a.nichtGewusst ? `<div class="reihe"><button class="btn zweit voll" id="nichtGewusst" style="border-color:var(--rot);color:var(--rot)">🙈 Nicht gewusst – öfter üben</button></div>` : ""}
    <div class="reihe sprechleiste">
      <button class="btn zweit" id="qZurueck" ${quiz.pos ? "" : "disabled"}>‹ Zurück</button>
      <button class="btn zweit" id="qWeiter" ${a._erg || quiz.pos < quiz.aufgaben.length - 1 ? "" : "disabled"}>${a._erg ? "Weiter ›" : "Überspringen ›"}</button>
    </div>`);
  // Zurück = vorige Aufgabe ansehen (schon beantwortet: nur anschauen) · Überspringen = Aufgabe ans Ende
  document.getElementById("qZurueck").onclick = () => { quiz.pos--; quizZeigen(); };
  document.getElementById("qWeiter").onclick = () => {
    if (!a._erg) quiz.aufgaben.push(quiz.aufgaben.splice(quiz.pos, 1)[0]); else quiz.pos++;
    quizZeigen();
  };
  const rueckblick = !!a._erg;
  if (a.beimStart && !rueckblick) a.beimStart();
  let beantwortet = rueckblick, richtigGezaehlt = false;
  const aufloesen = (ok, text, gewaehlt, still) => {
    $app.querySelectorAll("[data-o]").forEach((x) => { if (x.dataset.o === a.richtig) x.classList.add("richtig"); });
    if (gewaehlt && !ok) gewaehlt.classList.add("falsch");
    if (a.sprechen && !still) sprich(a.sprechen);
    if (!still) a._erg = { ok, text, wahl: gewaehlt && gewaehlt.dataset ? gewaehlt.dataset.o : null, eingabe: feldWert() };
    // „Kann ich sicher“ nur nach einer richtigen Antwort (wie bei den Karteikarten)
    const sicherKnopf = ok && a.sicher && !(a._erg && a._erg.ng)
      ? (a._erg && a._erg.sicher ? `<button class="btn zweit voll b-sicher" disabled>🏆 Gemerkt – kommt erst in Monaten wieder</button>` : `<button class="btn zweit voll b-sicher" id="qSicher">🏆 Kann ich sicher <small>kommt erst in Monaten wieder</small></button>`)
      : "";
    document.getElementById("rueck").innerHTML = `<div class="meldung ${ok ? "gut" : "schlecht"}">${text} <b>${esc(a.erklaerung)}</b></div>
      <button class="btn voll" id="weiter">Weiter</button>${sicherKnopf}`;
    document.getElementById("weiter").onclick = () => { quiz.pos++; quizZeigen(); };
    const qs = document.getElementById("qSicher");
    if (qs) qs.onclick = () => { a.sicher(); a._erg.sicher = true; speichern(); toast("🏆 Gemerkt – kommt erst in ein paar Monaten wieder."); quiz.pos++; quizZeigen(); };
    const qw = document.getElementById("qWeiter"); if (qw) { qw.disabled = false; qw.textContent = "Weiter ›"; }
  };
  const feldWert = () => { const f = document.getElementById("qtipp"); return f ? f.value : null; };
  // Schon beantwortete Aufgabe (über „Zurück“): Ergebnis wieder anzeigen, nichts neu werten
  if (rueckblick) {
    const e = a._erg, f = document.getElementById("qtipp");
    if (f) { f.value = e.eingabe || ""; f.disabled = true; }
    aufloesen(e.ok, e.text, e.wahl ? [...$app.querySelectorAll("[data-o]")].find((x) => x.dataset.o === e.wahl) : null, true);
    const ngb = document.getElementById("nichtGewusst"); if (ngb) { ngb.disabled = true; if (e.ng) ngb.textContent = "✓ Gemerkt – kommt öfter wieder"; }
  }
  $app.querySelectorAll("[data-o]").forEach((b) => (b.onclick = () => {
    if (beantwortet) return; beantwortet = true;
    const ok = b.dataset.o === a.richtig;
    if (!ok && !a.deutsch) { fehlerMerken(b.dataset.o, a.richtig, a.erklaerung); speichern(); } // typische Verwechslung merken
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
      if (!ok && !a.deutsch) { if (a.richtig.split(" ").length <= 3) fehlerMerken(feld.value, a.richtig, a.erklaerung); else fehlerAusText(a.richtig, feld.value); }
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
    if (a._erg) a._erg.ng = true;
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
    <button class="btn zweit voll" id="diktat" style="margin-top:8px" ${kartenDerThemen(S.einstellungen.themen).length ? "" : "disabled"}>✍️ Diktat: hören und eintippen (10)</button>
    <p class="leise">Beim Diktat hörst du Italienisch und schreibst es auf – deutlich schwerer als Auswählen, aber es schult Hören und Rechtschreibung zugleich. Akzente dürfen fehlen.</p>
    <h2>Themen</h2>
    <p class="leise">Dieselbe Auswahl wie bei den Karteikarten.</p>
    ${themenAuswahl(THEMEN, S.einstellungen.themen)}
    <h2>Phrasen</h2>${themenAuswahl(PHRASEN_GRUPPEN, S.einstellungen.themen)}`);
  themenKlickbar(hoerenMenue);
  document.getElementById("los").onclick = hoerenStart;
  document.getElementById("diktat").onclick = diktatStart;
}
function hoerenStart() {
  const pool = kartenDerThemen(S.einstellungen.themen);
  if (pool.length < 4) return geheZu("hoeren");
  const aufgaben = gewichtetZiehen(pool, (k) => gewicht(k.id, "it-de"), 10).map((k) => hoerAufgabe(k, pool));
  quizStarten({ aufgaben, pos: 0, punkte: 0, zurueck: "hoeren", titel: "Hören", nochmal: "hoeren-neu" });
}
function diktatStart() {
  const pool = kartenDerThemen(S.einstellungen.themen);
  if (!pool.length) return geheZu("hoeren");
  // bekannte Karten bevorzugt – Diktat von ganz neuen Wörtern ist eher Raten
  const aufgaben = gewichtetZiehen(pool, (k) => (istNeu(k.id, "it-de") ? 0.3 : gewicht(k.id, "it-de")), 10).map(diktatAufgabe);
  quizStarten({ aufgaben, pos: 0, punkte: 0, zurueck: "hoeren", titel: "Diktat", nochmal: "hoeren" });
}
// Diktat: hören und auf Italienisch eintippen (Akzente dürfen fehlen)
function diktatAufgabe(k) {
  return {
    tippen: true, keinMikro: true, richtig: k.it, erklaerung: `${k.it} = ${k.de}`,
    frage: `<div class="leise">Hör zu und schreib auf Italienisch:</div>
      <div class="mitte-zentriert" style="margin:8px 0;flex-direction:row;justify-content:center">${lautBtn(k.it)}${langsamBtn(k.it)}</div>`,
    beimStart: () => setTimeout(() => sprich(k.it), 250),
    sicher: () => bewerte(k.id, "it-de", 4),
    beiAntwort: (ok) => { if (zustand(k.id, "it-de")) rueckmeldung(k.id, "it-de", ok); geuebt(); },
    nichtGewusst: () => { if (zustand(k.id, "it-de")) rueckmeldung(k.id, "it-de", false); }
  };
}
function hoerAufgabe(k, pool) {
  const falsche = mischen([...new Set(pool.filter((x) => x.de !== k.de).map((x) => x.de))]).slice(0, 3);
  return {
    frage: `<div class="leise">Was bedeutet das?</div>
      <div class="mitte-zentriert" style="margin:8px 0;flex-direction:row;justify-content:center">${lautBtn(k.it)}${langsamBtn(k.it)}</div>`,
    deutsch: true, optionen: mischen([k.de, ...falsche]), richtig: k.de, erklaerung: `${k.it} = ${k.de}`,
    beimStart: () => setTimeout(() => sprich(k.it), 250),
    // Neue Phrase richtig erkannt → als Karteikarte aufnehmen (wie "Gut": kommt in 2 Tagen wieder)
    sicher: () => bewerte(k.id, "it-de", 4),
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
// opt.fest: Reihenfolge übernehmen · opt.modusFuer(k): Modus je Satz · opt.endlich: mit Abschluss statt endlos
// opt.danach: wird am Ende aufgerufen (z. B. Fragen im Lektionsschritt) · opt.zurueck: Ziel des Zurück-Knopfs
function sprechenStarten(eintraege, opt = {}) {
  const liste = opt.fest ? eintraege : gewichtetZiehen(eintraege, sprechGewicht, eintraege.length);
  sprechen = { liste, pos: 0, ergebnis: null, status: "", gezeigt: false, modi: opt.modusFuer ? liste.map(opt.modusFuer) : null,
    endlich: !!opt.endlich, danach: opt.danach || null, zurueck: opt.zurueck || null, titel: opt.titel || "Sprechen", gewusst: 0, gefragt: 0, wieder: {}, verfehlt: [] };
  geheZu("sprechen-ueben");
}
// Ergebnis aus dem Gedächtnis merken: nicht gewusst → kommt in dieser Runde nochmal und in die Liste „nicht gewusste Sätze“;
// zweimal hintereinander richtig → fällt aus dieser Liste wieder heraus
function sprechMerken(k, ok) {
  const a = S.aussprache[k.id] || { versuche: 0, bester: 0, letzter: 0 };
  if (ok) { a.serie = (a.serie || 0) + 1; if (a.serie >= 2) a.offen = false; }
  else { a.serie = 0; a.offen = true; }
  S.aussprache[k.id] = a;
  if (!ok && sprechen) { sprechen.nichtOk = true; if (!sprechen.verfehlt.includes(k)) sprechen.verfehlt.push(k); }
}
// Sätze, die zuletzt nicht geklappt haben (ältere Stände ohne „offen“: schwache Aussprache oder oft falsch)
function offeneSprechSaetze() {
  return ALLE_KARTEN.filter((k) => {
    if (!istSatz(k)) return false;
    const a = S.aussprache[k.id];
    if (a && a.offen !== undefined) return a.offen;
    return (a && a.versuche > 0 && a.letzter < 70) || kartenSchwach(zustand(k.id, "de-it"));
  });
}
const nochmalSprechen = (liste, zurueck, titel) =>
  sprechenStarten(liste, { modusFuer: () => "gedaechtnis", endlich: true, zurueck, titel });
// ---------- Sätze sprechen (für „Heute üben“ und den Lektionsschritt „Sprechen“) ----------
const istSatz = (k) => k.it.trim().split(/\s+/).length >= 3;
const HEUTE_SAETZE = 20, LEKTION_SAETZE = 8;
// Schon bekannte Sätze aus dem Gedächtnis sagen; ganz neue erst anhören und nachsprechen
const satzModus = (k) => (istNeu(k.id, "it-de") && istNeu(k.id, "de-it") ? "hoeren" : "gedaechtnis");
function saetzeAuswaehlen(karten, n, vorrang) {
  const saetze = [...new Map(karten.filter(istSatz).map((k) => [k.id, k])).values()];
  const bekannt = saetze.filter((k) => satzModus(k) === "gedaechtnis");
  const gew = (k) => sprechGewicht(k) * (istFaellig(k.id, "de-it") ? 3 : 1) * (vorrang && vorrang.has(k.id) ? 1.5 : 1);
  const liste = gewichtetZiehen(bekannt, gew, n);
  // zu wenig bekannte Sätze: mit neuen aus den Vorrang-Karten auffüllen (die werden erst angehört)
  if (liste.length < n) liste.push(...saetze.filter((k) => !liste.includes(k) && (!vorrang || vorrang.has(k.id))).slice(0, n - liste.length));
  return liste;
}
function heuteSaetze() {
  const lek = begonneneLektionen(), aktiv = aktiveLektionen().length ? aktiveLektionen() : lek;
  const alleLek = [...new Set(lek.concat(aktiv))];
  const quelle = alleLek.length ? alleLek.flatMap(lektionKarten) : kartenDerThemen(S.einstellungen.themen);
  if (!quelle.some((k) => istSatz(k) && satzModus(k) === "gedaechtnis")) return []; // erst wenn schon Sätze gelernt sind
  return saetzeAuswaehlen(quelle, HEUTE_SAETZE, aktiv.length ? new Set(aktiv.flatMap(lektionKarten).map((k) => k.id)) : null);
}
function sprechenFertig() {
  const d = sprechen.danach, n = new Set(sprechen.liste).size, g = sprechen.gewusst, f = sprechen.gefragt;
  const verfehlt = sprechen.verfehlt, zurueck = sprechen.zurueck || "sprechen";
  if (d) { toast(`🎤 ${n} Sätze geübt – jetzt noch die Fragen.`, 2500); return d(); }
  setzeKopf(sprechen.titel, sprechen.zurueck || "sprechen");
  zeige(`<div class="ergebnis">
      <div class="gross">🎤</div>
      <h2>${n} Sätze geübt!</h2>
      ${f ? `<p>Aus dem Gedächtnis richtig: <b>${g} von ${f}</b></p>` : ""}
      <p class="leise">Was nicht geklappt hat, kommt bald wieder dran.</p>
    </div>
    ${verfehlt.length ? `<button class="btn voll zweit" id="sNochmal">🔁 ${verfehlt.length === 1 ? "Den nicht gewussten Satz" : `Die ${verfehlt.length} nicht gewussten`} nochmal</button>` : ""}
    ${schrittFertig() ? heuteWeiterKnopf() : `<div class="reihe"><button class="btn" data-zurueck="${zurueck}">Zurück</button></div>`}`);
  const b = document.getElementById("sNochmal");
  if (b) b.onclick = () => nochmalSprechen(mischen(verfehlt.slice()), zurueck, "Nicht gewusste Sätze");
}
// Auswahl fürs Sprechen: die gewählten Themen – standardmäßig nur ganze Sätze (ab 3 Wörtern)
const sprechKarten = () => kartenDerThemen(S.einstellungen.themen).filter((k) => S.einstellungen.nurSaetze === false || istSatz(k));
function sprechenMenue() {
  setzeKopf("Sprechen", "start");
  const offen = offeneSprechSaetze();
  zeige(`
    ${offen.length ? `<button class="btn voll" id="sOffen" style="margin-bottom:12px">🎯 Nicht gewusste Sätze wiederholen (${offen.length})</button>
    <p class="leise" style="margin-top:-6px">Sätze, die zuletzt nicht geklappt haben – aus dem Gedächtnis. Zweimal hintereinander richtig, dann fällt der Satz aus der Liste.</p>` : ""}
    <div class="meldung info">ℹ️ Gut zu wissen: Die Spracherkennung schreibt auf, was sie verstanden hat, und vergleicht es mit dem Zielsatz. Das ist <b>keine echte Bewertung deiner Aussprache</b>, aber ein guter Hinweis: Wenn das Handy dich versteht, verstehen dich meist auch Menschen. Auf Android braucht die Erkennung meist <b>Internet</b>.</div>
    ${SR ? "" : `<div class="meldung schlecht">Dieser Browser hat keine Spracherkennung. Bitte die App in Chrome öffnen.</div>`}
    <h2>Wie möchtest du üben?</h2>
    ${umschalter("smodus", S.einstellungen.sprechenModus, [["zeigen", "Lesen + hören"], ["hoeren", "Nur hören"], ["gedaechtnis", "Gedächtnis"]])}
    <p class="leise">${{
      zeigen: "Du siehst und hörst den italienischen Satz und sprichst ihn nach – gut für die Aussprache.",
      hoeren: "Du siehst nur den deutschen Satz und hörst den italienischen vorgelesen. Den italienischen Text zeigt die App erst, wenn du auf „Text zeigen“ tippst oder gesprochen hast.",
      gedaechtnis: "Du siehst nur den deutschen Satz und sagst ihn ohne Hilfe auf Italienisch. Das Ergebnis zählt für den Lernstand „selbst sagen“."
    }[S.einstellungen.sprechenModus]} Was dir schwerfällt, kommt bevorzugt dran.</p>
    ${umschalter("snur", S.einstellungen.nurSaetze === false ? "alle" : "saetze", [["saetze", "Nur Sätze"], ["alle", "Wörter und Sätze"]])}
    <button class="btn voll" id="sLos" ${sprechKarten().length ? "" : "disabled"}>🎤 Sprechen starten (${sprechKarten().length} ${S.einstellungen.nurSaetze === false ? "Einträge" : "Sätze"})</button>
    <h2>Was möchtest du sprechen?</h2>
    <p class="leise">Themen antippen, mehrere sind möglich. Dieselbe Auswahl wie bei den Karteikarten und beim Hören.</p>
    <h2>Phrasen</h2>${themenAuswahl(PHRASEN_GRUPPEN, S.einstellungen.themen)}
    <h2>Wortschatz</h2>${themenAuswahl(THEMEN, S.einstellungen.themen)}`);
  $app.querySelectorAll("#smodus button").forEach((b) => (b.onclick = () => { S.einstellungen.sprechenModus = b.dataset.w; speichern(); ohneSprung(sprechenMenue); }));
  themenKlickbar(sprechenMenue);
  $app.querySelectorAll("#snur button").forEach((b) => (b.onclick = () => { S.einstellungen.nurSaetze = b.dataset.w === "saetze"; speichern(); ohneSprung(sprechenMenue); }));
  document.getElementById("sLos").onclick = () => sprechenStarten(sprechKarten());
  const so = document.getElementById("sOffen");
  if (so) so.onclick = () => nochmalSprechen(gewichtetZiehen(offen, sprechGewicht, 20), "sprechen", "Nicht gewusste Sätze");
}
function sprechenZeigen() {
  if (!sprechen) return abgelaufen("sprechen");
  setzeKopf(sprechen.titel || "Sprechen", sprechen.zurueck || "sprechen");
  const k = sprechen.liste[sprechen.pos];
  const e = sprechen.ergebnis;
  const modus = sprechen.modi ? sprechen.modi[sprechen.pos] : S.einstellungen.sprechenModus;
  // nicht gewusst → kommt am Ende der Runde nochmal (höchstens zweimal zusätzlich)
  const nochmal = sprechen.endlich && sprechen.nichtOk && (sprechen.wieder[k.id] || 0) < 2;
  const erstes = !sprechen.wieder || !sprechen.wieder[k.id]; // nur das erste Mal zählt für „aus dem Gedächtnis richtig“
  const letzter = sprechen.endlich && sprechen.pos === sprechen.liste.length - 1 && !nochmal;
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
      ${e.ziel && e.ziel !== k.it && e.prozent >= 80 ? `<p class="meldung gut" style="margin:6px 0">✅ Auch richtig – du hast eine andere Variante gesagt: <b>${esc(e.ziel)}</b></p>` : ""}
      <p class="leise">Verstanden wurde: „${esc(e.text)}“</p>
      <div class="legende"><span class="l-ok">richtig</span><span class="l-fast">fast</span><span class="l-falsch">falsch</span><span class="l-fehlt">fehlt</span></div>
    </div>`;
  }
  zeige(`
    ${fortschrittsLeiste(sprechen.pos + 1, sprechen.liste.length)}
    <div class="karte" style="min-height:auto">
      ${nussBtn(k.id)}
      <div class="leise">${erstes ? "" : "🔁 Noch einmal – "}Sag auf Italienisch:</div>
      <div style="font-size:20px">${esc(k.de)}</div>
      <div class="trenner"></div>
      ${zeigeItalienisch ? `<div class="wort" style="font-size:28px">${esc(k.it)}</div>` : ""}
      ${zeigeItalienisch && verdeckt ? auchRichtigHtml(k) : ""}
      ${zeigeLautsprecher ? `<div class="reihe" style="justify-content:center;margin:4px 0">${lautBtn(k.it)}${langsamBtn(k.it)}</div>` : ""}
      ${zeigeItalienisch ? "" : `<button class="btn zweit" id="zeigen">${verdeckt ? "Lösung zeigen" : "Text zeigen"}</button>`}
    </div>
    <div class="mitte-zentriert">
      <button class="mikro" id="mikro" aria-label="Sprechen">🎤</button>
      <div id="status" class="leise">${esc(sprechen.status || (verdeckt && !zeigeItalienisch ? "Tippe aufs Mikrofon und sag den Satz auf Italienisch." : "Erst anhören, dann aufs Mikrofon tippen und nachsprechen."))}</div>
    </div>
    ${ergebnisHtml}
    ${verdeckt && e && e.prozent >= 80 && !sprechen.nichtGewusst ? (sprechen.sicher ? `<button class="btn zweit voll b-sicher" disabled>🏆 Gemerkt – kommt erst in einem halben Jahr wieder</button>` : `<button class="btn zweit voll b-sicher" id="sSicher">🏆 Kann ich sicher <small>kommt erst in einem halben Jahr wieder</small></button>`) : ""}
    <div class="reihe">
      ${sprechen.nichtGewusst
        ? `<button class="btn zweit voll" disabled>✓ Gemerkt – kommt öfter wieder</button>`
        : `<button class="btn zweit voll" id="nichtGewusst" style="border-color:var(--rot);color:var(--rot)">🙈 Nicht gewusst – öfter üben</button>`}
    </div>
    <div class="reihe sprechleiste">
      <button class="btn zweit" id="zurueckK" ${sprechen.pos ? "" : "disabled"}>‹ Zurück</button>
      ${e ? `<button class="btn zweit" id="nochmalS">🔁 Nochmal</button>` : ""}
      <button class="btn" id="weiterK">${letzter ? "Fertig ✓" : "Weiter ›"}</button>
    </div>`);
  // Nochmal sprechen: Ergebnis wegräumen und gleich wieder zuhören (zählt nicht noch einmal für den Lernstand)
  const ssk = document.getElementById("sSicher");
  if (ssk) ssk.onclick = () => { bewerte(k.id, "de-it", 4); sprechen.sicher = true; speichern(); toast("🏆 Gemerkt – kommt erst in einem halben Jahr wieder."); sprechenZeigen(); };
  const ns = document.getElementById("nochmalS");
  if (ns) ns.onclick = () => { sprechen.ergebnis = null; sprechen.status = ""; sprechenZeigen(); document.getElementById("mikro").click(); };
  const zeigen = document.getElementById("zeigen");
  if (zeigen) zeigen.onclick = () => {
    sprechen.gezeigt = true;
    if (verdeckt && !sprechen.gewertet) { sprechen.gewertet = true; if (erstes) sprechen.gefragt++; rueckmeldung(k.id, "de-it", false); sprechMerken(k, false); speichern(); } // nachgeschaut = nicht gewusst
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
        // die Variante nehmen, die dem Zielsatz am nächsten kommt – aus dem Gedächtnis zählen auch gleichbedeutende Sätze
        // (z. B. „Che cosa vuol dire?“ statt „Che cosa significa?“); bei Gleichstand gewinnt der Satz der Karte
        const ziele = verdeckt ? gleicheZiele(k) : [k.it];
        const beste = alternativen.flatMap((t) => ziele.map((z) => ({ t, z, v: vergleiche(z, t) }))).sort((a, b) => b.v.prozent - a.v.prozent)[0];
        sprechen.ergebnis = { ...beste.v, text: beste.t, ziel: beste.z };
        sprechen.status = beste.v.prozent >= 90 ? "Sehr gut! Noch einmal oder weiter." : "Hör dir die richtige Aussprache an und versuch es noch einmal.";
        const a = S.aussprache[k.id] || { versuche: 0, bester: 0, letzter: 0 };
        a.versuche++; a.letzter = beste.v.prozent; a.bester = Math.max(a.bester, beste.v.prozent);
        S.aussprache[k.id] = a;
        // aus dem Gedächtnis gesprochen → zählt für "selbst sagen" (nur der erste Versuch je Karte)
        if (verdeckt && !sprechen.gezeigt && !sprechen.gewertet) {
          sprechen.gewertet = true;
          const ok = beste.v.prozent >= 80;
          if (erstes) { sprechen.gefragt++; if (ok) sprechen.gewusst++; }
          sprechMerken(k, ok);
          // neue Phrase richtig aus dem Gedächtnis gesagt → als Karteikarte "selbst sagen" aufnehmen (wie "Gut": in 2 Tagen)
          if (ok && istNeu(k.id, "de-it")) bewerte(k.id, "de-it", 2); else rueckmeldung(k.id, "de-it", ok);
        }
        geuebt();
        sprechenZeigen();
        setTimeout(() => sprich(k.it), 500); // nach dem Sprechen immer die richtige Aussprache vorlesen – auch wenn es richtig war
      },
      fehler: (text) => { mikro.classList.remove("hoert"); status.textContent = text; sprechen.status = ""; },
      ende: () => mikro.classList.remove("hoert")
    });
  };
  const wechsel = (pos) => { sprechen.pos = pos; sprechen.ergebnis = null; sprechen.status = ""; sprechen.gezeigt = false; sprechen.gewertet = false; sprechen.vorgelesen = false; sprechen.nichtGewusst = false; sprechen.nichtOk = false; sprechen.sicher = false; sprechenZeigen(); };
  // Von Hand als "nicht gewusst" markieren: zählt als Fehler für "selbst sagen" und für die Auswahl beim Sprechen
  const ng = document.getElementById("nichtGewusst");
  if (ng) ng.onclick = () => {
    if (verdeckt && !sprechen.gewertet && erstes) sprechen.gefragt++;
    if (sprechen.gewertet && verdeckt && erstes && !sprechen.gezeigt && sprechen.ergebnis && sprechen.ergebnis.prozent >= 80) sprechen.gewusst--; // doch nicht gewusst
    sprechen.nichtGewusst = true; sprechen.gewertet = true;
    sprechMerken(k, false);
    if (zustand(k.id, "de-it")) rueckmeldung(k.id, "de-it", false);
    else bewerte(k.id, "de-it", 0); // noch nie gelernt: als Karteikarte aufnehmen, kommt gleich dran
    const a = S.aussprache[k.id] || { versuche: 0, bester: 0, letzter: 0 };
    a.letzter = 0; S.aussprache[k.id] = a; speichern();
    toast("Gemerkt – der Satz kommt öfter wieder.");
    sprechenZeigen();
  };
  document.getElementById("weiterK").onclick = () => {
    if (letzter) return sprechenFertig();
    if (nochmal) {
      sprechen.wieder[k.id] = (sprechen.wieder[k.id] || 0) + 1;
      sprechen.liste.push(k); if (sprechen.modi) sprechen.modi.push("gedaechtnis");
    }
    wechsel((sprechen.pos + 1) % sprechen.liste.length);
  };
  document.getElementById("zurueckK").onclick = () => wechsel(Math.max(0, sprechen.pos - 1));
}

// ---------- Frage-Antwort-Übung (Gespräch) ----------
// Antwortmuster in Bausteine zerlegen (Schreibweise siehe data/gespraech.js)
function musterBauen(text) {
  return (text.match(/\[[^\]]+\]|\{\w+\}|\S+/g) || []).map((tok) => {
    const frei = tok.match(/^\{(\w+)\}$/);
    if (frei) return { frei: true, art: frei[1], min: frei[1] === "rest" ? 0 : 1, max: frei[1] === "zahl" || frei[1] === "name" ? 3 : frei[1] === "rest" ? 8 : 4 }; // {rest} wird auf echtes Italienisch geprüft, darf daher länger sein
    const opt = /^\[.*\]$/.test(tok), inner = opt ? tok.slice(1, -1) : tok;
    const seq = inner.includes("|") ? [inner.split("|").map(normWort).filter(Boolean)] : woerterVon(inner).map((t) => [t.n]);
    return { opt, seq };
  }).filter((m) => m.frei || m.seq.length);
}
// Alle italienischen Wörter, die die App kennt (aus Karten, Sätzen, Antworten, Wörterbuch, Verbformen) – für die
// Prüfung freier Stellen: {rest} muss Italienisch sein (nicht Deutsch oder Unsinn), {zahl} muss eine Zahl sein.
let BEKANNTE_WOERTER = null, ZAHL_WOERTER = null;
function bekannteWoerter() {
  if (BEKANNTE_WOERTER) return BEKANNTE_WOERTER;
  const s = new Set(), add = (t) => t && woerterVon(String(t)).forEach((w) => s.add(w.n));
  ALLE_KARTEN.forEach((k) => add(k.it)); SAETZE_LISTE.forEach((x) => add(x.it));
  GESPRAECH.forEach((t) => t.fragen.forEach((q) => { add(q.f); add(q.b); q.m.forEach((m) => add(m.replace(/[\[\]{}|]/g, " "))); }));
  WOERTERBUCH_LISTE.forEach((e) => { add(e.it); const vf = verbFormen(e); if (vf) vf.formen.forEach(add); });
  ALLE_VERBEN.forEach((v) => konjugiere(v).forEach(add));
  DIALOGE.forEach((d) => add(String(d.text).split("\n").map((z) => z.split("|")[1] || "").join(" ")));
  Object.values(LUECKEN).forEach((set) => set.saetze.forEach((x) => add(lueckeFuellen(x.s, x.a))));
  return (BEKANNTE_WOERTER = s);
}
function istZahlwort(w) {
  if (!ZAHL_WOERTER) { ZAHL_WOERTER = new Set(); for (let n = 0; n <= 2100; n++) ZAHL_WOERTER.add(normWort(zahlwort(n))); }
  return ZAHL_WOERTER.has(w);
}
function freiOk(m, woerter) {
  if (m.art === "zahl") return woerter.every((w) => istZahlwort(w) || w === "anni" || w === "e");
  if (m.art === "rest") {
    const unbekannt = woerter.filter((w) => !bekannteWoerter().has(w) && !istZahlwort(w)).length;
    return unbekannt === 0 || (woerter.length >= 3 && unbekannt === 1); // ein unbekanntes Wort (z. B. ein Name) in längeren Antworten ist ok
  }
  return true; // {x} und {name}: Namen, Orte usw. – alles erlaubt
}
function musterPasst(M, T, i = 0, j = 0) {
  if (i === M.length) return j === T.length;
  const m = M[i];
  if (m.frei) {
    for (let n = m.min; n <= m.max && j + n <= T.length; n++) if (freiOk(m, T.slice(j, j + n)) && musterPasst(M, T, i + 1, j + n)) return true;
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
function neueFrage() { Object.assign(gespraech, { ergebnis: null, gewertet: false, korrigiert: false, textGezeigt: false, deGezeigt: false, tippGezeigt: false, vorgelesen: false, status: "", nichtGewusst: false, alsRichtigGezaehlt: false, sicher: false }); }
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
      ${e.stufe === "richtig" && !g.nichtGewusst ? (g.sicher ? `<button class="btn zweit voll b-sicher" disabled>🏆 Gemerkt – kommt erst in ein paar Monaten wieder</button>` : `<button class="btn zweit voll b-sicher" id="gSicher">🏆 Kann ich sicher <small>kommt erst in ein paar Monaten wieder</small></button>`) : ""}
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
      ${g.nichtGewusst
        ? `<button class="btn zweit voll" disabled>✓ Gemerkt – kommt öfter wieder</button>`
        : `<button class="btn zweit voll" id="nichtGewusst" style="border-color:var(--rot);color:var(--rot)">🙈 Nicht gewusst – öfter üben</button>`}
    </div>
    <div class="reihe sprechleiste">
      <button class="btn zweit" id="gZurueck" ${g.pos ? "" : "disabled"}>‹ Zurück</button>
      ${e ? `<button class="btn zweit" id="nochmalAntworten">🔁 Nochmal</button>` : ""}
      <button class="btn${e ? "" : " zweit"}" id="naechste">${e ? "Weiter ›" : "Überspringen ›"}</button>
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
  // Vor und zurück: der Stand jeder Frage (Antwort, Ergebnis …) wird gemerkt und beim Zurückkommen wieder angezeigt
  const FELDER = ["ergebnis", "gewertet", "korrigiert", "textGezeigt", "deGezeigt", "tippGezeigt", "vorgelesen", "status", "nichtGewusst", "alsRichtigGezaehlt", "sicher"];
  const wechseln = (neu) => {
    g.staende = g.staende || {};
    g.staende[g.pos] = Object.fromEntries(FELDER.map((f) => [f, g[f]]));
    g.pos = neu; neueFrage();
    if (g.staende[neu]) Object.assign(g, g.staende[neu], { vorgelesen: true });
    gespraechZeigen();
  };
  klick("naechste", () => wechseln(g.pos + 1));
  klick("gZurueck", () => wechseln(g.pos - 1));
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
  klick("gSicher", () => { gSicher(q.key); g.sicher = true; toast("🏆 Gemerkt – kommt erst in ein paar Monaten wieder."); gespraechZeigen(); });
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
// Setzt die Antwort in die Lücke(n): „a … in“ füllt zwei Lücken nacheinander, ein einzelnes Wort alle Lücken
function lueckeFuellen(s, a) {
  const teile = String(a).split(" … "); let i = 0;
  return s.replace(/___/g, () => teile[Math.min(i++, teile.length - 1)]);
}
function lueckeAufgabe(setId, x) {
  const set = LUECKEN[setId], key = "lk:" + setId + ":" + x.s;
  const amAnfang = x.s.startsWith("___");
  const gross = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const optionen = x.o ? mischen(x.o) : set.optionen.map((o) => (amAnfang ? gross(o) : o));
  const ganz = lueckeFuellen(x.s, x.a).replace(" → ", ", ").replace(/\s*\([^)]*\)/g, ""); // Klammer-Hinweise wie „(Sie)“ oder „(a + il)“ nicht mitvorlesen
  return {
    frage: `<div class="leise">${esc(x.de)}</div><div class="gross" style="font-size:24px">${esc(x.s).replace(/___/g, "<u>&nbsp;&nbsp;?&nbsp;&nbsp;</u>")}</div>`,
    optionen, richtig: x.a, zwei: optionen.length !== 3, sprechen: ganz, erklaerung: lueckeFuellen(x.s, x.a),
    beiAntwort: (ok) => gBewerte(key, ok), nichtGewusst: () => gBewerte(key, false), sicher: () => gSicher(key)
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
    beiAntwort: (ok) => gBewerte(key, ok), nichtGewusst: () => gBewerte(key, false), sicher: () => gSicher(key)
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
  { id: "sprechen", sym: "🗣️", name: "Sprechen", text: "Sätze der Lektion sagen, dann Fragen beantworten" }
];
// „Gemischt üben“ ist kein Schritt zum Abhaken, sondern eine Wiederholung, die man beliebig oft machen kann
const GEMISCHT_ANZAHL = 30;
let lektionAktiv = null, lektionTiefe = null;
function lStand(id) { S.lektionen = S.lektionen || {}; return (S.lektionen[id] = S.lektionen[id] || { schritte: [] }); }
// Ist ein Schritt erledigt? „Neue Wörter“ erst, wenn ALLE Karten der Lektion kennengelernt sind (oder von Hand abgehakt) –
// eine einzelne Runde mit 12 Karten reicht nicht. Die anderen Schritte: einmal gemacht oder abgehakt.
function schrittErledigt(L, sid) {
  const st = lStand(L.id);
  if (sid === "woerter") { const w = lektionWoerterStand(L); return w.kennen >= w.gesamt || !!st.woerterVonHand; }
  return st.schritte.includes(sid);
}
// Durchgearbeitet = alle Schritte erledigt.
const durchgearbeitet = (L) => LEKTION_SCHRITTE.every((s) => schrittErledigt(L, s.id));
// Bis zu drei Lektionen laufen parallel: Die nächste Lektion beginnt, sobald bei der vorigen alle Schritte außer
// „Neue Wörter“ erledigt sind – deren restliche Wörter kommen nebenher dran. Mehr als drei unfertige Lektionen gibt es nicht.
const MAX_PARALLEL = 3;
const bereitFuerNaechste = (L) => LEKTION_SCHRITTE.every((s) => s.id === "woerter" || schrittErledigt(L, s.id));
function aktiveLektionen() {
  const aktiv = [];
  for (const L of LEKTION_LISTE) {
    if (durchgearbeitet(L)) continue;
    aktiv.push(L);
    if (aktiv.length >= MAX_PARALLEL || !bereitFuerNaechste(L)) break;
  }
  return aktiv;
}
// Die „aktuelle“ Lektion = die vorderste der aktiven (dort geht es mit neuen Schritten weiter)
const aktuelleLektion = () => { const a = aktiveLektionen(); return a[a.length - 1] || null; };
const offeneSchritte = (L) => LEKTION_SCHRITTE.filter((s) => !schrittErledigt(L, s.id));
// Karten einer Lektion = Kernwortschatz (vorhandene Wörter/Sätze, über den italienischen Text gefunden) + eigene Lektions-Gruppe
const KARTE_NACH_TEXT = {};
ALLE_KARTEN.forEach((k) => { if (!k.thema.startsWith("lk_") && !KARTE_NACH_TEXT[k.it]) KARTE_NACH_TEXT[k.it] = k; });
function lektionKarten(L) {
  if (!L.kern && !L.neu) return kartenDerThemen(L.themen);
  // über die feste Kennung (bleibt beim Bearbeiten gleich); alte Einträge mit reinem Text gehen zur Sicherheit auch
  const kern = (L.kern || []).map((t) => KARTE_NACH_ID[t] || KARTE_NACH_TEXT[t]).filter(Boolean);
  const eigene = GRUPPE_NACH_ID["lk_" + L.id] ? GRUPPE_NACH_ID["lk_" + L.id].eintraege : [];
  return [...new Map(kern.concat(eigene, wbFuerLektion(L.id)).map((k) => [k.id, k])).values()];
}
// Wörterbuch-Karten der ersten Lektion zuordnen, in deren Wörtern/Sätzen sie (oder eine Verbform davon) vorkommen
let WB_ZUORDNUNG = null;
function wbFuerLektion(lid) {
  if (!WB_ZUORDNUNG) {
    WB_ZUORDNUNG = {};
    const woerterDer = LEKTION_LISTE.map((L) => {
      const kern = (L.kern || []).map((t) => KARTE_NACH_ID[t] || KARTE_NACH_TEXT[t]).filter(Boolean);
      const eigene = GRUPPE_NACH_ID["lk_" + L.id] ? GRUPPE_NACH_ID["lk_" + L.id].eintraege : [];
      const s = new Set(); kern.concat(eigene).forEach((k) => woerterVon(k.it).forEach((w) => s.add(w.n)));
      return { id: L.id, s };
    });
    WB_GRUPPE.eintraege.forEach((e) => {
      const vf = verbFormen(e);
      const suche = vf ? vf.formen.map((f) => normWort(f.split(" ").pop())) : woerterVon(e.it.split(" / ")[0]).map((w) => w.n).slice(-1);
      const treffer = woerterDer.find((l) => suche.some((w) => l.s.has(w)));
      if (treffer) (WB_ZUORDNUNG[treffer.id] = WB_ZUORDNUNG[treffer.id] || []).push(e);
    });
  }
  return WB_ZUORDNUNG[lid] || [];
}
// Fragen über ihre feste Kennung (id; bei noch nie bearbeiteten Fragen ist das der ursprüngliche Fragetext)
const lektionFragen = (L) => L.fragen.map((f) => ALLE_FRAGEN.find((q) => (q.id || q.f) === f) || ALLE_FRAGEN.find((q) => q.f === f)).filter(Boolean);
function lektionWoerterStand(L) {
  const karten = lektionKarten(L);
  return { gesamt: karten.length, kennen: karten.filter((k) => !istNeu(k.id, "it-de")).length };
}
// Wie viel einer Lektion sitzt wirklich? Drei Teile, gewichtet:
//  - Karten (60 %): kommen erst in einem halben Jahr oder später wieder
//  - Grammatik-Aufgaben (25 %) und Fragen (15 %): ganz oben im Wiederholungsplan (120 Tage = sechsmal hintereinander richtig)
// Dazu „im Lernen“: schon einmal gewusst, aber noch nicht fest.
const GRAMMATIK_FEST = 120;
function festTeil(eintraege, istFest, istLernen) {
  let fest = 0, lernen = 0;
  eintraege.forEach((x) => { if (istFest(x)) fest++; else if (istLernen(x)) lernen++; });
  return { gesamt: eintraege.length, fest, lernen };
}
function lektionGefestigt(L) {
  const richt = richtungenFuer(S.einstellungen.richtung);
  const paare = (L._karten || lektionKarten(L)).flatMap((k) => richt.map((r) => zustand(k.id, r)));
  const karten = festTeil(paare, (z) => z && z.intervall >= SICHER_TAGE, (z) => z && z.wdh > 0);
  const gFest = (g) => g && g.intervall >= GRAMMATIK_FEST, gLernen = (g) => g && g.richtig > 0;
  const gram = festTeil((L._gram || grammatikTopf(L.grammatik, L.themen).map((x) => x.key)).map((k) => S.grammatik[k]), gFest, gLernen);
  const fragen = festTeil((L._fragen || lektionFragen(L).map((q) => q.key)).map((k) => S.grammatik[k]), gFest, gLernen);
  // gewichteter Mittelwert (Teile ohne Einträge zählen nicht)
  const teile = [[karten, 0.6], [gram, 0.25], [fragen, 0.15]].filter(([t]) => t.gesamt);
  const summe = teile.reduce((s, [, w]) => s + w, 0) || 1;
  const anteil = (feld) => Math.floor(100 * teile.reduce((s, [t, w]) => s + (w * t[feld]) / t.gesamt, 0) / summe);
  const pz = (t) => (t.gesamt ? Math.floor((100 * t.fest) / t.gesamt) : 0);
  return { karten, gram, fragen, gesamt: karten.gesamt, fest: karten.fest, prozent: anteil("fest"), lernenProzent: anteil("lernen"),
    teile: `Karten ${pz(karten)} % · Grammatik ${pz(gram)} % · Fragen ${pz(fragen)} %` };
}
// über alle Lektionen (jede Karte, Aufgabe und Frage nur einmal gezählt)
function gesamtGefestigt() {
  const eins = (liste) => [...new Set(liste)];
  return lektionGefestigt({
    _karten: [...new Map(LEKTION_LISTE.flatMap(lektionKarten).map((k) => [k.id, k])).values()],
    _gram: eins(LEKTION_LISTE.flatMap((L) => grammatikTopf(L.grammatik, L.themen).map((x) => x.key))),
    _fragen: eins(LEKTION_LISTE.flatMap((L) => lektionFragen(L).map((q) => q.key)))
  });
}
const festBalken = (g) => `<div class="balken" title="${g.prozent} % sitzen fest"><i style="width:${g.prozent}%"></i><i class="lernen" style="width:${g.lernenProzent}%"></i></div>`;
function lektionenMenue() {
  setzeKopf("Lektionen", "start");
  lektionAktiv = null;
  const akt = aktuelleLektion(), aktiv = aktiveLektionen(), durch = LEKTION_LISTE.filter(durchgearbeitet).length, gs = gesamtGefestigt();
  zeige(`
    <div class="meldung info">🎓 <b>Niveau A1</b> – Diese 12 Lektionen decken den Stoff von A1 ab, der ersten Stufe des europäischen Sprachrahmens. Wenn du sie kannst, kannst du dich vorstellen, einkaufen, bestellen, nach dem Weg fragen, über Familie, Alltag und Freizeit sprechen und einfache Gespräche verstehen.</div>
    <p>Jede Lektion hat Erklärung, Wörter, Grammatik, Hör-Dialog und Sprechen – dazu „Gemischt üben“ zum Wiederholen. Alle sind offen: Du kannst jederzeit springen.</p>
    <p class="leise">„Heute üben“ arbeitet bis zu ${MAX_PARALLEL} Lektionen gleichzeitig ab: Die nächste beginnt, sobald bei der vorigen alle Schritte außer „Neue Wörter“ erledigt sind – deren restliche Wörter kommen nebenher dran.</p>
    <p class="leise">„% sitzen fest“ zeigt, was du wirklich kannst: Karten, die erst in einem halben Jahr wiederkommen, und Grammatik-Aufgaben und Fragen, die du sechsmal hintereinander richtig hattest (Karten zählen am meisten). Im Balken: <b style="color:var(--gruen)">dunkelgrün</b> = sitzt fest, <b style="color:var(--gruen);opacity:.5">hellgrün</b> = im Lernen (schon mal gewusst).</p>
    <div class="fortschritt"><span>Alle 12: ${gs.prozent} % sitzen fest · ${durch} / ${LEKTION_LISTE.length} durchgearbeitet</span>${festBalken(gs)}</div>
    <div class="liste">${LEKTION_LISTE.map((L) => {
      const st = lStand(L.id), fertig = LEKTION_SCHRITTE.filter((s) => schrittErledigt(L, s.id)).length, d = durchgearbeitet(L);
      const g = lektionGefestigt(L);
      const status = d ? `✓ durchgearbeitet` : L === akt ? `<b>▶ aktuell</b> · ${fertig} von ${LEKTION_SCHRITTE.length} Schritten` : aktiv.includes(L) ? `<b>läuft nebenher</b> · ${fertig} von ${LEKTION_SCHRITTE.length} Schritten` : fertig ? `${fertig} von ${LEKTION_SCHRITTE.length} Schritten` : "noch nicht begonnen";
      const fest = d || fertig || g.fest || g.lernen ? ` · <b>${g.prozent} % sitzen fest</b>${festBalken(g)}` : "";
      return `<button class="zeile${d ? " aktiv" : ""}" data-gehe="lektion/${L.id}"><span class="sym">${L.icon}</span>
        <span class="mitte">${L.nr}. ${esc(L.titel)}<small>${status}${fest}</small></span><span class="pfeil">›</span></button>`;
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
      ${(() => { const g = lektionGefestigt(L); return `<div style="margin-top:10px"><b>📊 ${g.prozent} % sitzen fest</b> <span class="leise">· ${g.lernenProzent} % im Lernen</span>${festBalken(g)}
        <div class="leise" style="font-size:13px;margin-top:4px">${g.teile}${durchgearbeitet(L) ? " · Lektion durchgearbeitet" : ""}<br>Fest = Karte kommt erst in ½ Jahr wieder · Grammatik/Frage sechsmal hintereinander richtig.</div></div>`; })()}
    </div>
    <button class="zeile" id="lGemischt" style="margin-bottom:12px"><span class="sym">🔀</span><span class="mitte"><b>Gemischt üben</b><small>${GEMISCHT_ANZAHL} gemischte Aufgaben aus der ganzen Lektion – Hören, Diktat und Grammatik. Beliebig oft, am besten immer wieder.</small></span><span class="pfeil">›</span></button>
    ${offen.length ? `<button class="btn voll" id="lWeiter" style="min-height:64px;font-size:20px;margin-bottom:12px">▶ ${st.schritte.length ? "Weiter" : "Los geht's"}: ${offen[0].sym} ${offen[0].name}</button>` : ""}
    <div class="liste">${LEKTION_SCHRITTE.map((s, i) => {
      const erledigt = schrittErledigt(L, s.id);
      const extra = s.id === "woerter" ? ` · <b>${w.kennen} von ${w.gesamt} kennengelernt</b>${w.kennen < w.gesamt && !st.woerterVonHand ? " – fertig, wenn alle dran waren" : ""}` : "";
      const text = s.text + extra;
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
    if (id === "woerter") { // „Neue Wörter“ ergibt sich aus den Karten; von Hand abhaken = „reicht mir so“
      if (schrittErledigt(L, "woerter") && !st.woerterVonHand) return toast("Alle Karten dieser Lektion sind schon kennengelernt.", 3000);
      st.woerterVonHand = !st.woerterVonHand;
    } else st.schritte = st.schritte.includes(id) ? st.schritte.filter((x) => x !== id) : st.schritte.concat(id);
    speichern(); ohneSprung(() => lektionZeigen(L.id));
  }));
  document.getElementById("lClaude").onclick = () => { claudeWerte.szene = L.szene; geheZu("claude"); };
  document.getElementById("lGemischt").onclick = () => lektionStarten(L, "gemischt");
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
    // Neue Karten nur bis zur Tagesgrenze („Neue Karten pro Tag“) – sonst wächst der Berg an Wiederholungen zu schnell
    const frei0 = neueHeuteUebrig();
    const neue = plan.neue.slice(0, Math.min(12, frei0)), fa = plan.faellige.slice(0, 20 - neue.length), liste = [];
    if (plan.neue.length && !frei0) toast(`Für heute sind die neuen Karten aufgebraucht (${S.einstellungen.neueProTag} pro Tag – änderbar in den Einstellungen). Jetzt nur Wiederholung; morgen geht es weiter.`, 6000);
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
    // erst Sätze der Lektion sagen (bekannte aus dem Gedächtnis, neue nachsprechen), dann die Fragen
    const fragen = () => { gespraech = { liste: mischen(lektionFragen(L)), pos: 0 }; neueFrage(); return geheZu("gespraech-ueben"); };
    const lk = lektionKarten(L), saetze = saetzeAuswaehlen(lk, LEKTION_SAETZE, new Set(lk.map((k) => k.id)));
    if (!saetze.length) return fragen();
    return sprechenStarten(saetze, { fest: true, modusFuer: satzModus, endlich: true, danach: fragen, zurueck, titel: `Lektion ${L.nr}: Sätze sprechen` });
  }
  if (schritt === "gemischt") {
    // Gemischt üben: Grammatik, Hören (auswählen) und Diktat (eintippen) – Fälliges und Schwieriges kommt bevorzugt
    const karten = lektionKarten(L);
    const gram = ausTopf(grammatikTopf(L.grammatik, L.themen), Math.round(GEMISCHT_ANZAHL * 0.4));
    const gew = (k) => (istNeu(k.id, "it-de") ? 0.3 : gewicht(k.id, "it-de"));
    const nDiktat = Math.round(GEMISCHT_ANZAHL * 0.2);
    const gezogen = gewichtetZiehen(karten, gew, GEMISCHT_ANZAHL - gram.length);
    // Diktat nur mit bekannten Karten (sonst ist es Raten)
    const fuerDiktat = gezogen.filter((k) => !istNeu(k.id, "it-de")).slice(0, nDiktat);
    const hoeren = gezogen.filter((k) => !fuerDiktat.includes(k)).map((k) => hoerAufgabe(k, karten)).concat(fuerDiktat.map(diktatAufgabe));
    // merken, was falsch war (für die Liste am Ende)
    const falsch = [];
    const aufgaben = mischen(hoeren.concat(gram)).map((a) => {
      const merk = () => { if (a.erklaerung && !falsch.includes(a.erklaerung)) falsch.push(a.erklaerung); };
      const bA = a.beiAntwort, nG = a.nichtGewusst;
      return { ...a, beiAntwort: (ok) => { if (!ok) merk(); if (bA) bA(ok); else geuebt(); }, nichtGewusst: nG ? () => { merk(); nG(); } : undefined };
    });
    const falschListe = () => falsch.length ? `<div class="frage" style="text-align:left"><b>Das war falsch:</b><ul style="margin:6px 0 0;padding-left:20px">${falsch.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>` : "";
    return quizStarten({ aufgaben, pos: 0, punkte: 0, zurueck, titel: `Lektion ${L.nr}: Gemischt üben`, nochmal: zurueck,
      endeHinweis: () => falschListe()
        + (falsch.length ? `<button class="btn zweit voll" data-gehe="lfehler/${L.id}" style="margin-bottom:12px">🎯 Fehler dieser Lektion üben</button>` : "") });
  }
}

// ---------- Heute üben: ein Tagesablauf von ca. 15 Minuten ----------
let heuteAktiv = null; // Schritt, der gerade aus "Heute üben" heraus läuft
function heuteStand() {
  if (!S.heute || S.heute.datum !== heute()) S.heute = { datum: heute(), erledigt: [] };
  return S.heute;
}
// Karteikarten für „Heute üben“: ALLE fälligen Wiederholungen – egal ob aus Lektion, Thema oder Phrasen –
// plus bis zu 5 neue Karten aus den aktiven Lektionen, die älteste zuerst (sind alle Lektionen durch: aus den Themen). Bis zu 25 Wiederholungen + 5 neue.
function heuteKartenRunde() {
  const richt = richtungenFuer(S.einstellungen.richtung);
  const fa = faelligeKarten().filter((x) => richt.includes(x.r));
  const aktiv = aktiveLektionen(), frei = Math.min(5, neueHeuteUebrig());
  let neue = [], L = null;
  for (const A of aktiv) { // erst die Wörter der ältesten aktiven Lektion fertig machen
    if (neue.length >= frei) break;
    const n = rundePlanen(lektionKarten(A), S.einstellungen.richtung).neue.filter((x) => !neue.some((y) => y.k.id === x.k.id && y.r === x.r));
    if (n.length && !L) L = A;
    neue = neue.concat(n.slice(0, frei - neue.length));
  }
  if (!aktiv.length) neue = rundePlanen(kartenDerThemen(S.einstellungen.themen), S.einstellungen.richtung).neue.slice(0, frei);
  const f = fa.slice(0, 25), liste = [];
  let d = 0, n = 0;
  while (d < f.length || n < neue.length) { if (n < neue.length && (d >= f.length || liste.length % 3 === 2)) liste.push(neue[n++]); else liste.push(f[d++]); }
  return { liste, neue, faellig: fa.length, lektion: L };
}
// Lektionen, mit denen man schon angefangen hat (für „Gemischt“ über alle Lektionen)
const begonneneLektionen = () => LEKTION_LISTE.filter((L) => { const st = lStand(L.id); return st.bestanden || st.schritte.length; });
const HEUTE_GEMISCHT = 10;
const HEUTE_FRAGEN = 5;
function heuteGemischtAufgaben() {
  const lek = begonneneLektionen(); if (!lek.length) return [];
  // Grammatik: reihum aus jeder begonnenen Lektion (jede Lektion = eine Gruppe), Schwaches bevorzugt
  const gesehen = new Set();
  const topf = lek.flatMap((L, i) => grammatikTopf(L.grammatik, L.themen).map((x) => ({ ...x, gruppe: i }))).filter((x) => !gesehen.has(x.key) && gesehen.add(x.key));
  const gram = ausTopf(topf, Math.ceil(HEUTE_GEMISCHT / 2));
  // Hören: Wörter dieser Lektionen, die schon einmal dran waren – fällige und schwache bevorzugt
  const karten = [...new Map(lek.flatMap(lektionKarten).map((k) => [k.id, k])).values()];
  const bekannt = karten.filter((k) => !istNeu(k.id, "it-de"));
  const hoeren = gewichtetZiehen(bekannt.length >= 4 ? bekannt : karten, (k) => gewicht(k.id, "it-de"), HEUTE_GEMISCHT - gram.length).map((k) => hoerAufgabe(k, karten));
  return mischen(gram.concat(hoeren));
}
// Die zwei Lektionsschritte für heute ({ L, s }):
//  A = Fortschritt: nächster offener Schritt der vordersten aktiven Lektion
//  B = Nachholen: „Neue Wörter“ einer älteren aktiven Lektion, sonst der übernächste Schritt der vordersten
// Was heute schon über diese Zeilen gemacht wurde, bleibt an seinem Platz stehen.
function heuteLektionsSchritte() {
  const aktiv = aktiveLektionen(); if (!aktiv.length) return [null, null];
  const vorn = aktiv[aktiv.length - 1], st = heuteStand();
  const gemerkt = (x) => (x && LEKTION_NACH_ID[x.lid] ? { L: LEKTION_NACH_ID[x.lid], s: LEKTION_SCHRITTE.find((s) => s.id === x.sid) } : null);
  const offenVorn = offeneSchritte(vorn);
  const a = gemerkt(st.lektionAMerk) || (offenVorn[0] ? { L: vorn, s: offenVorn[0] } : null);
  let b = gemerkt(st.lektionBMerk);
  if (!b) {
    const aelter = aktiv.slice(0, -1).find((L) => !schrittErledigt(L, "woerter") && !(a && a.L === L && a.s.id === "woerter"));
    const s2 = offenVorn.find((s) => !a || a.L !== vorn || s.id !== a.s.id);
    b = aelter ? { L: aelter, s: LEKTION_SCHRITTE.find((s) => s.id === "woerter") } : s2 ? { L: vorn, s: s2 } : null;
  }
  return [a, b];
}
function heuteSchritte() {
  const runde = heuteKartenRunde(), nKarten = runde.liste.length;
  const nNeu = runde.neue.length, nWdh = nKarten - nNeu;
  const lek = begonneneLektionen();
  const nFehler = Math.min(15, schwacheKarten().filter((x) => !istFaellig(x.k.id, x.r)).length);
  const nSaetze = heuteSaetze().length;
  // Zwei Lektionsschritte (siehe heuteLektionsSchritte): Fortschritt in der vordersten Lektion + Nachholen in einer älteren
  const st = heuteStand(), alleDurch = !aktiveLektionen().length;
  const [sA, sB] = heuteLektionsSchritte();
  const lZeile = (id, x) => {
    if (!x) return { id, sym: "📚", name: "Lektion", text: alleDurch ? "alle Lektionen durchgearbeitet" : "nichts mehr offen", leer: true };
    const w = x.s.id === "woerter" ? lektionWoerterStand(x.L) : null;
    return { id, sym: x.s.sym, name: `Lektion ${x.L.nr}: ${x.s.name}`, text: st.erledigt.includes(id) ? "heute erledigt" : w ? `${w.kennen} von ${w.gesamt} Karten kennengelernt – die nächsten neuen` : x.s.text };
  };
  return [
    { id: "karten", sym: "🗂️", name: "Karteikarten", leer: !nKarten,
      text: nKarten ? [nWdh ? `${nWdh} Wiederholungen aus allen Lektionen und Themen${runde.faellig > nWdh ? ` (von ${runde.faellig} fälligen)` : ""}` : "", nNeu ? `${nNeu} neue${runde.lektion ? ` aus Lektion ${runde.lektion.nr}` : ""}` : ""].filter(Boolean).join(" + ") : "heute nichts fällig" },
    { id: "fehler", sym: "🎯", name: "Fehler wiederholen", text: nFehler ? `${nFehler} Karten, die oft falsch waren` : "keine Fehler offen", leer: !nFehler },
    { id: "saetze", sym: "🎤", name: "Sätze sprechen", leer: !nSaetze, text: nSaetze ? `${nSaetze} Sätze auf Italienisch sagen – ohne Hilfe, aus dem Gedächtnis` : "noch keine Sätze – erst ein paar Karten lernen" },
    { id: "gemischt", sym: "🔀", name: "Gemischt – alle Lektionen", leer: !lek.length,
      text: lek.length ? `${HEUTE_GEMISCHT} Aufgaben quer durch ${lek.length === 1 ? "Lektion " + lek[0].nr : lek.length + " Lektionen"} – damit auch Älteres wach bleibt` : "ab der ersten angefangenen Lektion" },
    lZeile("lektionA", sA),
    lZeile("lektionB", sB),
    { id: "gespraech", sym: "🗣️", name: "Frage & Antwort", text: `${HEUTE_FRAGEN} Fragen frei beantworten` }
  ];
}
let letzterKontext = null, letzteLektion = null;
function schrittFertig() { // am Ende einer Übung aufrufen; true = kam aus "Heute üben" oder einer Lektion
  let kam = false;
  if (lektionAktiv) {
    const ls = lStand(lektionAktiv.lid);
    // „Gemischt üben“ ist kein Schritt zum Abhaken
    // „Neue Wörter“ wird nicht abgehakt – er ist erledigt, sobald alle Karten der Lektion kennengelernt sind
    if (LEKTION_SCHRITTE.some((s) => s.id === lektionAktiv.schritt) && lektionAktiv.schritt !== "woerter" && !ls.schritte.includes(lektionAktiv.schritt)) ls.schritte.push(lektionAktiv.schritt);
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
    <p>Eine Runde von etwa <b>20–30 Minuten</b>, gut gemischt: Wiederholungen aus allen Lektionen, Neues aus der aktuellen Lektion. Am besten jeden Tag – Regelmäßigkeit bringt mehr als lange Einheiten.</p>
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
    const x = heuteLektionsSchritte()[id === "lektionA" ? 0 : 1];
    if (!x) { heuteAktiv = null; return heuteMenue(); }
    heuteStand()[id + "Merk"] = { lid: x.L.id, sid: x.s.id }; // merken, welche Lektion/welcher Schritt heute dran war
    return lektionStarten(x.L, x.s.id);
  }
  if (id === "karten") {
    const { liste, neue } = heuteKartenRunde();
    sitzung = { liste, pos: 0, neuKeys: new Set(neue.map((x) => schluessel(x.k.id, x.r))), aufgedeckt: false, eingabe: null, gesamt: liste.length, fertig: 0, zurueck: "heute" };
    return geheZu("karte");
  }
  if (id === "saetze") {
    const liste = heuteSaetze();
    if (!liste.length) { heuteAktiv = null; return heuteMenue(); }
    return sprechenStarten(liste, { fest: true, modusFuer: satzModus, endlich: true, zurueck: "heute", titel: "Sätze sprechen" });
  }
  if (id === "gemischt") {
    const aufgaben = heuteGemischtAufgaben();
    if (!aufgaben.length) { heuteAktiv = null; return heuteMenue(); }
    return quizStarten({ aufgaben, pos: 0, punkte: 0, zurueck: "heute", titel: "Gemischt – alle Lektionen", nochmal: "heute" });
  }
  if (id === "fehler") {
    const liste = schwacheKarten().filter((x) => !istFaellig(x.k.id, x.r)).slice(0, 15);
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
    gespraech = { liste: gewichtetZiehen(ALLE_FRAGEN, (q) => gGewicht(q.key), HEUTE_FRAGEN), pos: 0 };
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
    else if (art === "lk") { const set = LUECKEN[rest[0]], s = rest.slice(1).join(":"), x = set && set.saetze.find((c) => c.s === s); if (x) zeilen.push(`${set.titel}: ${lueckeFuellen(x.s, x.a).replace(" → ", " = ")}`); }
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
      <button class="zeile" data-gehe="nuesse"><span class="sym">${WALNUSS}</span><span class="mitte">Harte Nüsse<small>${nussListe().length ? `<b>${nussListe().length}</b> Karten, die du selbst markiert hast` : "noch keine – auf einer Karte ${WALNUSS} antippen"}</small></span><span class="pfeil">›</span></button>
      <button class="zeile" data-gehe="typfehler"><span class="sym">🔀</span><span class="mitte">Typische Fehler<small>${fehlerMusterListe().length ? `<b>${fehlerMusterListe().length}</b> Verwechslungen, z. B. ${esc(fehlerMusterListe()[0].falsch)} statt ${esc(fehlerMusterListe()[0].richtig)} – gezielt üben` : "was du verwechselst, z. B. di statt a – sammelt sich von selbst"}</small></span><span class="pfeil">›</span></button>
      <button class="zeile" data-gehe="schwierig"><span class="sym">😬</span><span class="mitte">Schwierigste Karten<small>Was am häufigsten falsch war – zum Ansehen</small></span><span class="pfeil">›</span></button>
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

// ---------- Harte Nüsse: von Hand markierte Karten ----------
// Walnuss als kleines Bild (es gibt kein Walnuss-Emoji)
const WALNUSS = `<svg class="walnuss" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="12.5" rx="8.5" ry="10" fill="#b27b45" stroke="#6b4423" stroke-width="1.3"/><path d="M12 2.6v19.8" stroke="#6b4423" stroke-width="1.4"/><path d="M8.2 6c1.6 1 1.6 2.5 0 3.5s-1.6 2.5 0 3.5-1.6 2.5 0 3.5M15.8 6c-1.6 1-1.6 2.5 0 3.5s1.6 2.5 0 3.5 1.6 2.5 0 3.5" fill="none" stroke="#6b4423" stroke-width="1.1" stroke-linecap="round"/></svg>`;
// Rein: die Walnuss auf einer Karte antippen. Raus: 3-mal hintereinander richtig (egal in welcher Übung) oder Haken in der Liste wegnehmen.
const NUSS_RAUS = 3;
const istNuss = (id) => !!(S.nuesse[id] && S.nuesse[id].drin);
const nussListe = () => Object.keys(S.nuesse).filter((id) => istNuss(id) && KARTE_NACH_ID[id]).map((id) => KARTE_NACH_ID[id]);
function nussBtn(id) {
  if (!KARTE_NACH_ID[id]) return "";
  const an = istNuss(id);
  return `<button class="nuss${an ? " an" : ""}" data-nuss="${esc(id)}" aria-pressed="${an}" title="${an ? "Ist bei den harten Nüssen – antippen zum Herausnehmen" : "Zu den harten Nüssen legen"}">${WALNUSS}</button>`;
}
function nussSetzen(id, drin) {
  const alt = S.nuesse[id] || {};
  S.nuesse[id] = { ...alt, drin, serie: 0, zuletzt: Date.now(), seit: drin ? Date.now() : alt.seit };
  speichern();
}
function nussUmschalten(id) {
  const an = !istNuss(id);
  nussSetzen(id, an);
  document.querySelectorAll("[data-nuss]").forEach((x) => { if (x.dataset.nuss === id) { x.classList.toggle("an", an); x.setAttribute("aria-pressed", an); } });
  toast(an ? `Zu den harten Nüssen gelegt. ${NUSS_RAUS}-mal hintereinander richtig, dann ist sie geknackt.` : "Aus den harten Nüssen genommen.", 2500);
}
// Normaler Lernweg: jede Antwort zählt mit – 3-mal hintereinander richtig = geknackt
function nussLernen(id, ok) {
  const n = S.nuesse[id]; if (!n || !n.drin) return;
  n.zuletzt = Date.now();
  if (!ok) { n.serie = 0; return; }
  n.serie = (n.serie || 0) + 1;
  if (n.serie >= NUSS_RAUS) { n.drin = false; n.serie = 0; n.geknackt = Date.now(); setTimeout(() => toast("Harte Nuss geknackt! Die Karte ist aus der Liste."), 50); }
}
const nussGemerkt = new Set(); // auf der Nüsse-Seite abgewählt: bleibt sichtbar, bis man die Seite verlässt
function nuesseSeite() {
  setzeKopf("Harte Nüsse", "fehler");
  const ids = [...new Set(nussListe().map((k) => k.id).concat([...nussGemerkt]))];
  const liste = ids.map((id) => KARTE_NACH_ID[id]).filter(Boolean)
    .sort((a, b) => (istNuss(b.id) - istNuss(a.id)) || a.it.localeCompare(b.it, "it"));
  const anzahl = nussListe().length;
  const fehlerText = (id) => { const f = RICHTUNGEN.reduce((s, r) => s + ((zustand(id, r) || {}).falsch || 0), 0); return f ? ` · ${f} × falsch` : ""; };
  zeige(`
    <p>Deine <b>harten Nüsse</b>: Karten, die du selbst mit ${WALNUSS} markiert hast. Hier übst du nur sie.</p>
    <div class="meldung info">ℹ️ <b>Rein:</b> auf einer Karte (beim Üben oder im Wörterbuch) auf ${WALNUSS} tippen.<br>
    <b>Raus:</b> von selbst, wenn du die Karte <b>${NUSS_RAUS}-mal hintereinander richtig</b> hast – egal in welcher Übung. Oder hier den Haken wegnehmen.</div>
    <button class="btn voll" id="nLos" ${anzahl ? "" : "disabled"}>${WALNUSS} Harte Nüsse üben (${anzahl})</button>
    <div class="liste" style="margin-top:12px">${liste.length ? liste.map((k) => {
      const an = istNuss(k.id), n = S.nuesse[k.id] || {};
      const noch = an ? `noch ${NUSS_RAUS - (n.serie || 0)} × richtig bis geknackt` : "herausgenommen";
      return `<button class="zeile${an ? " aktiv" : ""}" data-nzeile="${esc(k.id)}"><span class="mitte">${esc(k.it)}<small>${esc(k.de)} · ${noch}${fehlerText(k.id)}</small></span><span class="haken haken-gross" role="checkbox" aria-checked="${an}">${an ? "✓" : ""}</span></button>`;
    }).join("") : `<p class="leise">Noch keine harten Nüsse. Tipp beim Üben auf ${WALNUSS}, wenn eine Karte einfach nicht sitzen will – oder schau in die Liste der schwierigsten Karten.</p>`}</div>
    <button class="btn zweit voll" data-gehe="schwierig" style="margin-top:10px">😬 Schwierigste Karten ansehen</button>`);
  $app.querySelectorAll("[data-nzeile]").forEach((b) => (b.onclick = () => {
    const id = b.dataset.nzeile, an = !istNuss(id);
    nussSetzen(id, an); if (!an) nussGemerkt.add(id);
    ohneSprung(nuesseSeite);
  }));
  const los = document.getElementById("nLos");
  if (los) los.onclick = () => {
    nussGemerkt.clear();
    const richt = richtungenFuer(S.einstellungen.richtung);
    const liste = mischen(nussListe().flatMap((k) => richt.map((r) => ({ k, r })))).slice(0, 30);
    sitzung = { liste, pos: 0, neuKeys: new Set(), aufgedeckt: false, eingabe: null, gesamt: liste.length, fertig: 0, zurueck: "nuesse" };
    geheZu("karte");
  };
}
// Die Karten, die am häufigsten falsch waren (beide Richtungen zusammen)
function schwierigsteKarten(n = 50) {
  const summe = {};
  Object.entries(S.karten).forEach(([key, z]) => {
    const [id, r] = key.split("|"); if (!KARTE_NACH_ID[id] || !z.falsch) return;
    const s = summe[id] || (summe[id] = { k: KARTE_NACH_ID[id], falsch: 0, richtig: 0, r: {} });
    s.falsch += z.falsch; s.richtig += z.richtig || 0; s.r[r] = z;
  });
  return Object.values(summe).sort((a, b) => b.falsch - a.falsch || a.richtig - b.richtig).slice(0, n);
}
function schwierigSeite() {
  setzeKopf("Schwierigste Karten", "fehler");
  const liste = schwierigsteKarten();
  const rText = (z, name) => (z ? `${name} ${z.falsch} × falsch · ${z.richtig || 0} × richtig` : "");
  zeige(`
    <p>Die Karten, die du <b>am häufigsten falsch</b> hattest – oben die schwierigsten. Antippen zeigt die Erklärung, ${WALNUSS} legt sie zu den harten Nüssen.</p>
    <div class="liste">${liste.length ? liste.map((s, i) => `<div class="eintrag kachel-wort" data-wort="${encodeURIComponent(s.k.id)}" role="button" tabindex="0">
      <div class="rang leise">${i + 1}.</div>
      <div class="mitte"><div class="it">${esc(s.k.it)}</div><div class="de">${esc(s.k.de)}</div>
        <div class="ministand">${[rText(s.r["de-it"], "🇩🇪→🇮🇹"), rText(s.r["it-de"], "🇮🇹→🇩🇪")].filter(Boolean).join("<br>")}</div></div>
      ${nussBtn(s.k.id)}</div>`).join("") : `<p class="leise">Noch keine Fehler – sehr gut!</p>`}</div>`);
}

// ---------- Typische Fehler: Verwechslungen wie „di statt a“ automatisch sammeln ----------
// S.fehlerMuster["di→a"] = { falsch, richtig, anzahl, beispiele: [...], zuletzt, geloescht, serie }
// Gesammelt wird bei Auswahl-Aufgaben (falsche Option) und beim Eintippen (Wort für Wort verglichen) – nicht beim Sprechen,
// weil die Spracherkennung selbst oft danebenliegt.
const PRAEP_WOERTER = new Set("a in di da su con per tra fra al allo alla all' ai agli alle del dello della dell' dei degli delle dal dallo dalla dall' dai dagli dalle nel nello nella nell' nei negli nelle sul sullo sulla sull' sui sugli sulle ad".split(" "));
const ARTIKEL_WOERTER = new Set("il lo la l' i gli le un uno una un'".split(" "));
function musterArt(f, r) {
  if (PRAEP_WOERTER.has(f) && PRAEP_WOERTER.has(r)) return "Präposition";
  if (ARTIKEL_WOERTER.has(f) && ARTIKEL_WOERTER.has(r)) return "Artikel";
  if (f.slice(0, 3) === r.slice(0, 3) && f.length > 2 && r.length > 2) return "Endung / Form";
  return "Wort";
}
const musterNorm = (s) => String(s || "").toLowerCase().replace(/[’`´]/g, "'").replace(/[.,!?;:¿¡"«»()]/g, "").replace(/\s+/g, " ").trim();
function fehlerMerken(falsch, richtig, beispiel) {
  // zwei Lücken („a … in“ statt „in … a“): jede Lücke einzeln
  if (String(falsch).includes(" … ") && String(richtig).includes(" … ")) {
    const fs = String(falsch).split(" … "), rs = String(richtig).split(" … ");
    return fs.forEach((x, i) => rs[i] && fehlerMerken(x, rs[i], beispiel));
  }
  const f = musterNorm(falsch), r = musterNorm(richtig);
  if (!f || !r || f === r || ohneAkzente(f) === ohneAkzente(r)) return; // gleich oder nur Akzent
  if (f.split(" ").length > 3 || r.split(" ").length > 3) return;       // nur einzelne Wörter / kurze Wendungen
  const key = f + "→" + r, alt = S.fehlerMuster[key];
  const m = alt && !alt.geloescht ? alt : { falsch: f, richtig: r, anzahl: 0, beispiele: [], serie: 0 };
  m.anzahl++; m.zuletzt = Date.now(); m.geloescht = false; m.serie = 0;
  if (beispiel && !m.beispiele.includes(beispiel)) m.beispiele = [beispiel].concat(m.beispiele).slice(0, 5);
  S.fehlerMuster[key] = m;
}
// Eingetippten Satz mit der Lösung vergleichen und die verwechselten Wörter merken
function fehlerAusText(loesung, eingabe) {
  if (!eingabe || !loesung) return;
  const v = vergleiche(loesung, eingabe);
  const falsche = v.woerter.filter((w) => (w.art === "falsch" || w.art === "fast") && w.gehoert);
  if (falsche.length > 2) return; // ganz anderer Satz – keine einzelne Verwechslung
  falsche.forEach((w) => fehlerMerken(w.gehoert, w.wort, loesung));
}
const fehlerMusterListe = () => Object.entries(S.fehlerMuster).filter(([, m]) => !m.geloescht).map(([key, m]) => ({ key, ...m }))
  .sort((a, b) => b.anzahl - a.anzahl || b.zuletzt - a.zuletzt);
// Gezielte Übung zu einem Fehler: passende Lückensätze und Karten, in denen das richtige Wort vorkommt
function musterAufgaben(m, n = 12) {
  const r = m.richtig, f = m.falsch, aufgaben = [];
  const gross = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  Object.entries(LUECKEN).forEach(([setId, set]) => set.saetze.forEach((x) => {
    const opt = (x.o || set.optionen || []).map(musterNorm);
    if (musterNorm(x.a) === r && opt.includes(f)) aufgaben.push(() => musterWerten(lueckeAufgabe(setId, x), m));
  }));
  const wortRe = new RegExp("(^|[\\s'’])(" + r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")(?=[\\s.,!?;:]|$)", "i");
  ALLE_KARTEN.filter((k) => k.it.split(/\s+/).length >= 2 && k.it.split(/\s+/).length <= 12 && wortRe.test(k.it)).forEach((k) => aufgaben.push(() => {
    const treffer = k.it.match(wortRe), start = treffer.index + treffer[1].length;
    const satz = k.it.slice(0, start) + "___" + k.it.slice(start + treffer[2].length);
    const amAnfang = start === 0;
    const opts = mischen([r, f]).map((o) => (amAnfang ? gross(o) : o));
    const richtig = amAnfang ? gross(r) : r;
    return musterWerten({
      frage: `<div class="leise">${esc(k.de)}</div><div class="gross" style="font-size:24px">${esc(satz).replace("___", "<u>&nbsp;&nbsp;?&nbsp;&nbsp;</u>")}</div>`,
      optionen: opts, richtig, zwei: true, sprechen: k.it, erklaerung: k.it,
      beiAntwort: (ok) => { if (zustand(k.id, "de-it")) rueckmeldung(k.id, "de-it", ok); geuebt(); }
    }, m);
  }));
  return mischen(aufgaben).slice(0, n).map((bau) => bau());
}
// In der gezielten Übung mitzählen, wie oft hintereinander richtig
function musterWerten(a, m) {
  const bA = a.beiAntwort, key = m.falsch + "→" + m.richtig;
  return { ...a, beiAntwort: (ok) => {
    const x = S.fehlerMuster[key];
    if (x) { x.serie = ok ? (x.serie || 0) + 1 : 0; x.zuletzt = Date.now(); }
    if (bA) bA(ok); else geuebt();
  } };
}
function typFehlerSeite() {
  setzeKopf("Typische Fehler", "fehler");
  const liste = fehlerMusterListe();
  zeige(`
    <p>Hier sammelt die App <b>automatisch</b>, welche Wörter du verwechselst – z. B. <b>di</b> statt <b>a</b>. Daraus macht sie gezielte Übungen.</p>
    <div class="meldung info">ℹ️ Gesammelt wird bei Auswahl-Aufgaben und beim Eintippen (nicht beim Sprechen – da verhört sich das Handy zu oft).
    War etwas kein typischer Fehler, nimm ihn mit <b>✕</b> heraus.</div>
    ${liste.length ? `<button class="btn voll" id="tfAlle">🎯 Alle typischen Fehler üben</button>` : ""}
    <div class="liste" style="margin-top:12px">${liste.length ? liste.map((m) => `
      <div class="eintrag tf-zeile">
        <div class="mitte">
          <div class="it"><span class="tf-falsch">${esc(m.falsch)}</span> statt <b>${esc(m.richtig)}</b> <small class="leise">· ${musterArt(m.falsch, m.richtig)}</small></div>
          <div class="de">${m.anzahl} × passiert${m.serie ? ` · zuletzt ${m.serie} × hintereinander richtig` : ""}</div>
          ${m.beispiele.length ? `<div class="ministand">z. B. ${esc(m.beispiele[0])}</div>` : ""}
          <button class="btn zweit" data-tfueben="${esc(m.key)}" style="margin-top:6px;padding:6px 12px;min-height:0">🎯 Üben</button>
        </div>
        <button class="tf-weg" data-tfweg="${esc(m.key)}" title="Kein typischer Fehler – herausnehmen" aria-label="Herausnehmen">✕</button>
      </div>`).join("") : `<p class="leise">Noch keine typischen Fehler gesammelt. Sie erscheinen hier, sobald du etwas verwechselst.</p>`}</div>
    <h2>Selbst eintragen</h2>
    <p class="leise">Dir ist selbst ein Fehler aufgefallen? Trag ihn ein:</p>
    <div class="reihe" style="flex-wrap:nowrap;align-items:center"><input id="tfF" placeholder="falsch, z. B. di" autocomplete="off" autocapitalize="off" style="margin:0;flex:1;min-width:0"><span>statt</span><input id="tfR" placeholder="richtig, z. B. a" autocomplete="off" autocapitalize="off" style="margin:0;flex:1;min-width:0"></div>
    <button class="btn zweit voll" id="tfDazu">➕ Eintragen</button>`);
  const ueben = (ms, titel) => {
    const aufgaben = mischen(ms.flatMap((m) => musterAufgaben(m, ms.length > 1 ? 4 : 12))).slice(0, 15);
    if (!aufgaben.length) return toast("Dazu gibt es noch keine passenden Übungssätze.", 3000);
    quizStarten({ aufgaben, pos: 0, punkte: 0, zurueck: "typfehler", titel, nochmal: "typfehler" });
  };
  $app.querySelectorAll("[data-tfueben]").forEach((b) => (b.onclick = () => { const m = liste.find((x) => x.key === b.dataset.tfueben); ueben([m], `${m.falsch} statt ${m.richtig}`); }));
  $app.querySelectorAll("[data-tfweg]").forEach((b) => (b.onclick = () => {
    const m = S.fehlerMuster[b.dataset.tfweg]; if (!m) return;
    m.geloescht = true; m.zuletzt = Date.now(); speichern();
    toast(`„${m.falsch} statt ${m.richtig}“ herausgenommen.`); ohneSprung(typFehlerSeite);
  }));
  const alle = document.getElementById("tfAlle"); if (alle) alle.onclick = () => ueben(liste.slice(0, 8), "Typische Fehler");
  document.getElementById("tfDazu").onclick = () => {
    const f = document.getElementById("tfF").value, r = document.getElementById("tfR").value;
    if (!musterNorm(f) || !musterNorm(r) || musterNorm(f) === musterNorm(r)) return toast("Bitte beide Felder ausfüllen (falsch und richtig).");
    fehlerMerken(f, r, ""); speichern(); toast("Eingetragen."); ohneSprung(typFehlerSeite);
  };
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
    <p>Hier übst du nur, was in <b>dieser Lektion</b> oft falsch war – aus allen Übungen, auch aus „Heute üben“. Was du ein paar Mal richtig hast, verschwindet von selbst aus der Liste. Gut zusammen mit „Gemischt üben“.</p>
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
const gewuenscht = (id) => (S.wuensche || []).some((w) => w.id === id && w.typ !== "antwort" && !w.nachricht);
// Eintrag in der Wunschliste: Erklärung/Frage zu einer Karte, eine freie Nachricht – oder eine selbst als richtig markierte Antwort zur Prüfung
const wunschSchluessel = (w) => `${w.typ || "erklaerung"}|${w.id}|${w.antwort || w.nachricht || ""}`;
// Eingabefeld für eine Frage an Claude zu einer Karte (leer = nur Erklärung wünschen)
function wunschFormular(knopf) {
  const id = knopf.dataset.wunsch, k = KARTE_NACH_ID[id] || WB_NACH_ID[id];
  const div = document.createElement("div");
  div.className = "wunschform"; div.dataset.vorher = knopf.outerHTML;
  div.innerHTML = `<div class="leise" style="font-size:13px;margin-bottom:4px">✉️ Frage an Claude zu „${esc(k ? k.it : id)}“</div>
    <textarea rows="2" placeholder="z. B. Was heißt po'? · Ist „Cosa fai stasera?“ auch richtig? – leer lassen = einfach eine Erklärung wünschen"></textarea>
    <div class="reihe" style="margin:6px 0 0"><button class="btn" data-wsenden="${esc(id)}">Senden</button><button class="btn zweit" data-wabbruch="1">Abbrechen</button></div>`;
  knopf.replaceWith(div);
  div.querySelector("textarea").focus();
}
function antwortZurPruefung(q, text) {
  const w = { typ: "antwort", id: q.key, frage: q.f, antwort: text, zeit: new Date().toISOString().slice(0, 10), gesendet: false };
  if ((S.wuensche || []).some((x) => wunschSchluessel(x) === wunschSchluessel(w))) return;
  S.wuensche = (S.wuensche || []).concat(w); speichern();
  toast("Gemerkt: Diese Antwort gilt ab jetzt als richtig. Claude prüft sie bei der nächsten Bearbeitung.", 4500);
  clearTimeout(wunschHinzufuegen._t); wunschHinzufuegen._t = setTimeout(wuenscheSenden, 2000);
}
// Andere richtige Möglichkeiten (gleiche deutsche Bedeutung oder von Claude bestätigt), z. B. bei „Che cosa significa?“ → „Che cosa vuol dire?“
function auchRichtigHtml(k) {
  if (!KARTE_NACH_ID[k.id]) return "";
  // zuerst die che/cosa-Formen desselben Satzes, dann andere Sätze mit gleicher Bedeutung
  const eigene = wasVarianten(k.it, k).filter((z) => z.toLowerCase() !== k.it.toLowerCase());
  const andere = [...new Set(eigene.concat(gleicheZiele(k)))].filter((z) => z.toLowerCase() !== k.it.toLowerCase());
  if (!andere.length) return "";
  const apo = /^(che )?cos'/i.test(k.it);
  const was = !eigene.length ? "" : `<div class="wastipp">💬 ${apo ? "<b>Cos'è?</b> ist im Gespräch üblich · <b>Che cos'è?</b> ist etwas vollständiger – beides passt immer." : "<b>cosa</b> sagt man im Gespräch am häufigsten · <b>che cosa</b> ist etwas vollständiger und passt immer · <b>che</b> allein ist locker, eher umgangssprachlich."}</div>`;
  return `<div class="auchrichtig">✅ Auch richtig: ${andere.slice(0, 4).map((z) => `<b>${esc(z)}</b>`).join(" · ")}${andere.length > 4 ? " …" : ""}</div>${was}`;
}
function hinweisHtml(k, klein) {
  const auch = klein ? "" : auchRichtigHtml(k);
  if (auch) return auch + hinweisHtmlOhne(k, klein);
  return hinweisHtmlOhne(k, klein);
}
function hinweisHtmlOhne(k, klein) {
  const h = hinweisZu(k.id);
  const offen = (S.wuensche || []).filter((w) => w.id === k.id && w.typ !== "antwort" && !w.erledigt).length;
  const frage = `<button class="wunsch${klein ? " klein" : ""}" data-wunsch="${esc(k.id)}">${h ? "✉️ Frage an Claude" : "❓ Erklärung wünschen / Frage stellen"}</button>`;
  if (h) return `<div class="hinweis${klein ? " klein" : ""}">💡 ${esc(h)}</div>${frage}`;
  if (offen) return `<div class="leise" style="font-size:13px">✓ Schon an Claude geschickt</div>${frage}`;
  return frage;
}
function wunschHinzufuegen(id, nachricht) {
  const k = KARTE_NACH_ID[id] || WB_NACH_ID[id]; if (!k) return;
  nachricht = (nachricht || "").trim();
  if (!nachricht && gewuenscht(id)) return;
  const w = { id, it: k.it, de: k.de, zeit: new Date().toISOString().slice(0, 10), gesendet: false };
  if (nachricht) w.nachricht = nachricht;
  if ((S.wuensche || []).some((x) => wunschSchluessel(x) === wunschSchluessel(w))) return;
  S.wuensche = (S.wuensche || []).concat(w);
  speichern();
  toast(githubSchluessel() ? "Gesendet – die Antwort kommt mit der nächsten Version." : "Gemerkt. (Ohne GitHub-Schlüssel nur auf diesem Gerät – siehe Einstellungen.)", 4000);
  clearTimeout(wunschHinzufuegen._t); wunschHinzufuegen._t = setTimeout(wuenscheSenden, 2000);
}
function githubSchluessel() {
  try { const s = (localStorage.getItem("italienisch-github-schluessel") || "").replace(/[^\x21-\x7E]/g, ""); return s.length >= 30 ? s : ""; } catch (e) { return ""; }
}
// ---------- Gilt der GitHub-Schlüssel noch? ----------
// Höchstens einmal am Tag bei GitHub nachfragen. Ungültig → rote Warnung auf der Startseite.
// Das Ablaufdatum kommt aus der Antwort von GitHub (falls lesbar) oder aus dem Feld in den Einstellungen → 14 Tage vorher Hinweis.
async function schluesselPruefen(sofort) {
  const schl = githubSchluessel();
  if (!schl || !navigator.onLine) return;
  const info = S.schluesselInfo || {};
  if (!sofort && info.geprueft === heute()) return;
  try {
    const r = await fetch("https://api.github.com/repos/StefanReinhart/italienisch", { headers: { Accept: "application/vnd.github+json", Authorization: "Bearer " + schl }, cache: "no-store" });
    if (r.status !== 401 && !r.ok) return; // GitHub gerade nicht erreichbar o. Ä. – später nochmal
    const ab = r.headers.get("github-authentication-token-expiration"); // z. B. "2027-11-25 10:00:00 UTC"
    const ablauf = ab ? Date.parse(ab.replace(" UTC", "Z").replace(" ", "T")) : NaN;
    S.schluesselInfo = { ...info, geprueft: heute(), ungueltig: r.status === 401, ...(isNaN(ablauf) ? {} : { ablauf }) };
    speichern();
    if (!location.hash || location.hash === "#start") ohneSprung(startseite);
  } catch (e) {}
}
function schluesselWarnung() {
  if (!githubSchluessel()) return "";
  const info = S.schluesselInfo || {};
  if (info.ungueltig) return `<div class="meldung schlecht">🔑 <b>Dein GitHub-Schlüssel gilt nicht mehr</b> (abgelaufen oder gelöscht). Deine Fragen an Claude kommen deshalb nicht an. <a href="#einstellungen">So erneuerst du ihn →</a></div>`;
  if (info.ablauf) {
    const tage = Math.ceil((info.ablauf - Date.now()) / TAG);
    if (tage <= 14) return `<div class="meldung info">🔑 Dein GitHub-Schlüssel läuft ${tage <= 0 ? "heute" : tage === 1 ? "morgen" : `in ${tage} Tagen`} ab (${new Date(info.ablauf).toLocaleDateString("de-DE")}). Danach kommen deine Fragen an Claude nicht mehr an. <a href="#einstellungen">So erneuerst du ihn →</a></div>`;
  }
  return "";
}
// ---------- Lernstand sichern und zwischen Geräten abgleichen (über GitHub) ----------
// Mit GitHub-Schlüssel legt die App den Lernstand als lernstand.json auf einem eigenen Zweig „lernstand“ ab
// (gehört nicht zur Webseite). Jedes Gerät holt beim Öffnen den Stand und führt ihn mit dem eigenen zusammen:
// pro Karte/Aufgabe gilt der zuletzt geübte Stand, Tage und Lektionsschritte werden vereinigt.
const SYNC_API = "https://api.github.com/repos/StefanReinhart/italienisch", SYNC_ZWEIG = "lernstand", SYNC_DATEI = "lernstand.json";
let syncSha = null, syncTimer = null, syncLaeuft = false, syncLetzterInhalt = null, syncStatus = "";
const SYNC_FELDER = ["karten", "grammatik", "aussprache", "nuesse", "fehlerMuster", "lektionen", "eigeneAntworten", "claudeFehler", "tage", "neueHeute", "heute", "statistik", "verlauf"];
// Inhalt als Text mit sortierten Schlüsseln – so erkennt die App zuverlässig „nichts Neues“ und lädt nicht unnötig hoch
const sortiert = (x) => (Array.isArray(x) ? x.map(sortiert) : x && typeof x === "object" ? Object.fromEntries(Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => [k, sortiert(x[k])])) : x);
const syncInhalt = (s) => JSON.stringify(sortiert(Object.fromEntries(SYNC_FELDER.map((f) => [f, s[f]]))));
function syncAnfrage(pfad, opt = {}) {
  return fetch(SYNC_API + pfad, { ...opt, cache: "no-store", headers: { Accept: "application/vnd.github+json", Authorization: "Bearer " + githubSchluessel(), ...(opt.body ? { "Content-Type": "application/json" } : {}) } });
}
function zusammenfuehren(lokal, fern) {
  const mische = (a = {}, b = {}, fn) => { const out = { ...a }; Object.keys(b).forEach((k) => { out[k] = k in a ? fn(a[k], b[k]) : b[k]; }); return out; };
  const juenger = (a, b) => ((b.zuletzt || 0) > (a.zuletzt || 0) ? b : a);
  lokal.karten = mische(lokal.karten, fern.karten, juenger);
  lokal.grammatik = mische(lokal.grammatik, fern.grammatik, (a, b) => (a.zuletzt || b.zuletzt ? juenger(a, b) : (b.richtig + b.falsch > a.richtig + a.falsch ? b : a)));
  lokal.aussprache = mische(lokal.aussprache, fern.aussprache, (a, b) => ((b.versuche || 0) > (a.versuche || 0) ? b : a));
  lokal.nuesse = mische(lokal.nuesse, fern.nuesse, juenger);
  lokal.fehlerMuster = mische(lokal.fehlerMuster, fern.fehlerMuster, juenger);
  lokal.tage = mische(lokal.tage, fern.tage, (a, b) => Math.max(a || 0, b || 0));
  // Statistik: je Tag und Gerät – vom selben Gerät gilt der weitere Stand
  lokal.statistik = mische(lokal.statistik, fern.statistik, (a, b) => mische(a, b, (x, y) => (y.w + y.n > x.w + x.n ? y : x)));
  // Verlauf (geschätzter Wortschatz je Tag): echter Messwert schlägt nachträgliche Schätzung, sonst der spätere
  lokal.verlauf = mische(lokal.verlauf, fern.verlauf, (a, b) => (a.geschaetzt && !b.geschaetzt ? b : b.geschaetzt && !a.geschaetzt ? a : (b.zeit || 0) > (a.zeit || 0) ? b : a));
  lokal.lektionen = mische(lokal.lektionen, fern.lektionen, (a, b) => ({ ...a, ...b, schritte: [...new Set([...(a.schritte || []), ...(b.schritte || [])])], bestanden: a.bestanden || b.bestanden }));
  lokal.eigeneAntworten = mische(lokal.eigeneAntworten, fern.eigeneAntworten, (a, b) => [...new Set([...(a || []), ...(b || [])])]);
  const cf = new Map((lokal.claudeFehler || []).map((f) => [f.text, f])); (fern.claudeFehler || []).forEach((f) => cf.has(f.text) || cf.set(f.text, f)); lokal.claudeFehler = [...cf.values()];
  const tag = (x) => (x && x.datum) || "";
  if (fern.neueHeute && tag(fern.neueHeute) === tag(lokal.neueHeute)) lokal.neueHeute.anzahl = Math.max(lokal.neueHeute.anzahl, fern.neueHeute.anzahl);
  else if (tag(fern.neueHeute) > tag(lokal.neueHeute)) lokal.neueHeute = fern.neueHeute;
  if (fern.heute && lokal.heute && tag(fern.heute) === tag(lokal.heute)) lokal.heute.erledigt = [...new Set([...lokal.heute.erledigt, ...fern.heute.erledigt])];
  else if (tag(fern.heute) > tag(lokal.heute)) lokal.heute = fern.heute;
  return lokal;
}
// Stand von GitHub holen und einmischen
async function syncHolen() {
  const r = await syncAnfrage(`/contents/${SYNC_DATEI}?ref=${SYNC_ZWEIG}`);
  if (r.status === 404) { syncSha = null; return false; }
  if (r.status === 401) { S.schluesselInfo = { ...(S.schluesselInfo || {}), ungueltig: true }; throw new Error("GitHub-Schlüssel gilt nicht mehr"); }
  if (!r.ok) throw new Error("GitHub antwortet mit Fehler " + r.status);
  const j = await r.json(); syncSha = j.sha;
  const fern = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(j.content.replace(/\n/g, "")), (c) => c.charCodeAt(0))));
  const vorher = syncInhalt(S);
  zusammenfuehren(S, fern);
  syncLetzterInhalt = syncInhalt(fern);
  const geaendert = syncInhalt(S) !== vorher;
  if (geaendert) { try { localStorage.setItem(SPEICHER_KEY, JSON.stringify(S)); } catch (e) {} }
  return geaendert;
}
// Zweig „lernstand“ anlegen, falls es ihn noch nicht gibt
async function syncZweigSicherstellen() {
  const r = await syncAnfrage(`/git/ref/heads/${SYNC_ZWEIG}`);
  if (r.ok) return;
  const m = await syncAnfrage("/git/ref/heads/master");
  if (!m.ok) throw new Error("GitHub antwortet mit Fehler " + m.status);
  const sha = (await m.json()).object.sha;
  const neu = await syncAnfrage("/git/refs", { method: "POST", body: JSON.stringify({ ref: `refs/heads/${SYNC_ZWEIG}`, sha }) });
  if (!neu.ok && neu.status !== 422) throw new Error("Zweig anlegen ging nicht (Fehler " + neu.status + ")");
}
async function syncHochladen(versuch = 0) {
  const inhalt = syncInhalt(S);
  if (inhalt === syncLetzterInhalt) return; // nichts Neues
  await syncZweigSicherstellen();
  const autor = { name: "StefanReinhart", email: "154806245+StefanReinhart@users.noreply.github.com" };
  const senden = () => syncAnfrage(`/contents/${SYNC_DATEI}`, { method: "PUT", body: JSON.stringify({ message: "Lernstand", content: btoa(unescape(encodeURIComponent(inhalt))), branch: SYNC_ZWEIG, ...(syncSha ? { sha: syncSha } : {}), author: autor, committer: autor }) });
  let p = await senden();
  if ((p.status === 409 || p.status === 422) && versuch < 2) { await syncHolen(); return syncHochladen(versuch + 1); } // anderes Gerät war schneller: erst zusammenführen
  if (!p.ok) throw new Error("GitHub antwortet mit Fehler " + p.status);
  syncSha = (await p.json()).content.sha; syncLetzterInhalt = inhalt;
}
// Kompletter Abgleich: holen, zusammenführen, hochladen
async function abgleichen(still = true) {
  if (!githubSchluessel() || !navigator.onLine || syncLaeuft) return;
  syncLaeuft = true;
  try {
    const geaendert = await syncHolen();
    await syncHochladen();
    S.letzteSicherung = Date.now();
    try { localStorage.setItem(SPEICHER_KEY, JSON.stringify(S)); } catch (e) {}
    syncStatus = `✓ Abgeglichen ${new Date().toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`;
    if (geaendert && (!location.hash || location.hash === "#start" || location.hash === "#heute" || location.hash === "#lektionen")) ohneSprung(route);
    if (!still) toast(geaendert ? "Abgeglichen – Stand vom anderen Gerät übernommen ✓" : "Abgeglichen ✓");
  } catch (e) { syncStatus = "Abgleich hat nicht geklappt: " + e.message; if (!still) toast(syncStatus, 5000); }
  finally { syncLaeuft = false; }
}
// Nach jeder Änderung: in einer Minute hochladen (sammelt mehrere Änderungen)
function syncVormerken() {
  if (!githubSchluessel()) return;
  clearTimeout(syncTimer); syncTimer = setTimeout(() => abgleichen(), 60 * 1000);
}
// Erinnerung ans Sichern – nur ohne automatischen Abgleich und wenn schon etwas gelernt wurde
function sicherungsHinweis() {
  if (githubSchluessel() || Object.keys(S.karten).length < 20) return "";
  const seit = S.letzteSicherung ? Math.floor((Date.now() - S.letzteSicherung) / TAG) : null;
  if (seit !== null && seit < 7) return "";
  return `<div class="meldung info">💾 ${seit === null ? "Dein Lernstand ist noch nie gesichert worden." : `Letzte Sicherung vor ${seit} Tagen.`} Er liegt nur auf diesem Gerät. <a href="#einstellungen">Jetzt sichern →</a></div>`;
}

// kurze Beschreibung eines Eintrags (Liste in den Einstellungen, Kopieren, Commit-Text)
const wunschText = (w) => w.typ === "antwort" ? `Antwort „${w.antwort}“ prüfen (zu: ${w.frage})`
  : w.typ === "nachricht" ? `Nachricht: ${w.nachricht}`
  : w.nachricht ? `Frage zu „${w.it}“: ${w.nachricht}` : `Erklärung zu „${w.it}“`;
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
      else if (r.status === 401) { S.schluesselInfo = { ...(S.schluesselInfo || {}), geprueft: heute(), ungueltig: true }; speichern(); throw new Error("der GitHub-Schlüssel gilt nicht mehr (abgelaufen?)"); }
      else if (r.status !== 404) throw new Error("GitHub antwortet mit Fehler " + r.status);
      const vorhanden = new Set(liste.map(wunschSchluessel));
      offen.forEach((w) => {
        if (vorhanden.has(wunschSchluessel(w))) return;
        liste.push(w.typ === "antwort" ? { typ: "antwort", id: w.id, frage: w.frage, antwort: w.antwort, zeit: w.zeit }
          : w.typ === "nachricht" ? { typ: "nachricht", id: w.id, nachricht: w.nachricht, zeit: w.zeit }
          : { id: w.id, it: w.it, de: w.de, ...(w.nachricht ? { nachricht: w.nachricht } : {}), zeit: w.zeit });
      });
      const text = JSON.stringify(liste, null, 1);
      const autor = { name: "StefanReinhart", email: "154806245+StefanReinhart@users.noreply.github.com" };
      const p = await fetch(url, { method: "PUT", headers: { ...kopf, "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Wünsche: ${offen.map(wunschText).join(", ").slice(0, 300)}`, content: btoa(unescape(encodeURIComponent(text))), sha, branch: "master", author: autor, committer: autor }) });
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
    <p class="leise">${verdeckt ? "Du siehst nur den deutschen Satz. Hör ihn dir mit 🔊 an oder überleg selbst – antippen zeigt das Italienische." : "🔊 zum Anhören · Satz antippen für Erklärung und Lernstand."}</p>
    <div class="liste">${g.eintraege.map((e, i) => (verdeckt ? eintragVerdecktHtml(e, i) : kachelHtml(e))).join("")}</div>
    <div class="reihe"><button class="btn" id="ueben">🎤 Diese Sätze sprechen üben</button></div>`);
  $app.querySelectorAll("#pverdeckt button").forEach((b) => (b.onclick = () => { S.einstellungen.phrasenVerdeckt = b.dataset.w === "ja"; speichern(); ohneSprung(() => phrasenGruppe(id)); }));
  $app.querySelectorAll("[data-auf]").forEach((z) => (z.onclick = (ev) => {
    if (ev.target.closest("[data-sprich]")) return;
    const feld = z.querySelector("[data-it]");
    if (feld.classList.contains("verdeckt-it")) { feld.textContent = feld.dataset.it; feld.classList.remove("verdeckt-it"); feld.style.color = "var(--gruen)"; feld.style.fontWeight = "650"; }
  }));
  document.getElementById("ueben").onclick = () => sprechenStarten(g.eintraege);
}
// ---------- Wörterbuch: nur Wörter (keine Sätze), Verben mit ihren Formen ----------
// Quellen: Wortschatz-Themen, einzelne Wörter aus den Lektionen und data/woerterbuch.js (Grundformen aus Phrasen/Sätzen).
const istEinzelwort = (e) => !/[.?!…]$/.test(e.it.trim()) && e.it.trim().split(/\s+/).length <= 4;
const WB_NACH_ID = {};
const WOERTERBUCH_LISTE = (() => {
  const gesehen = new Set(), aus = [];
  const nimm = (e) => { const k = e.it.toLowerCase().trim(); if (gesehen.has(k)) return; gesehen.add(k); aus.push(e); };
  ALLE_WOERTER.forEach(nimm);
  LEKTION_GRUPPEN.flatMap((g) => g.eintraege).filter(istEinzelwort).forEach(nimm);
  zeilen(window.WOERTERBUCH || "").forEach((e) => { const x = { it: e.it, de: e.de, id: "wb:" + e.it, nurWb: true }; WB_NACH_ID[x.id] = x; nimm(x); });
  return aus.sort((a, b) => a.it.replace(/^(il |lo |la |i |gli |le |l')/i, "").localeCompare(b.it.replace(/^(il |lo |la |i |gli |le |l')/i, ""), "it"));
})();
// Ist der Eintrag ein Verb? Grundform auf -are/-ere/-ire (oder -arsi …) und deutsch klein geschrieben (Hauptwörter sind groß)
const VERB_RE = /^[a-zàèéìòù]+(are|ere|ire|rre|arsi|ersi|irsi)$/;
function verbFormen(e) {
  const it = e.it.trim().toLowerCase();
  if (!VERB_RE.test(it) || !/^(sich )?[a-zäöüß]/.test(e.de.trim())) return null;
  if ((window.VERBEN_FORMEN_EXTRA || {})[it]) return { formen: VERBEN_FORMEN_EXTRA[it], unreg: true };
  const refl = /si$/.test(it), inf = refl ? it.slice(0, -2) + "e" : it;
  const v = ALLE_VERBEN.find((x) => x.inf === inf) || { inf };
  if (/rre$/.test(inf) && !VERBEN_UNREGELMAESSIG[inf]) return null; // tradurre & Co. – nicht automatisch
  const f = konjugiere(v);
  return { formen: refl ? f.map((x, i) => ["mi", "ti", "si", "ci", "vi", "si"][i] + " " + x) : f, unreg: !!VERBEN_UNREGELMAESSIG[inf] };
}
// ---------- Kachel für Wort/Phrase (Liste) und Detailseite mit allen Infos ----------
// Kleiner Lernstand für die Liste: je Richtung 6 Punkte (oder 🏆), neue Karten ohne Anzeige
function miniStand(id) {
  if (!KARTE_NACH_ID[id]) return "";
  const teil = (r, name) => {
    const z = zustand(id, r);
    if (!z || !z.wdh) return "";
    if (z.intervall >= SICHER_TAGE) return `${name} 🏆`;
    const n = LERN_STUFEN.filter((t) => z.intervall >= t).length;
    return `${name} <span class="punkte">${"●".repeat(n)}<i>${"○".repeat(LERN_STUFEN.length - n)}</i></span>`;
  };
  const t = [teil("it-de", "verstehen"), teil("de-it", "sagen")].filter(Boolean);
  return t.length ? `<div class="ministand">${t.join(" · ")}</div>` : "";
}
let letzteSuche = "";
function kachelHtml(e, gesucht) {
  const vf = gesucht ? verbFormen(e) : null;
  const form = vf ? vf.formen.findIndex((f) => normWort(f.split(" ").pop()) === gesucht) : -1;
  return `<div class="eintrag kachel-wort" data-wort="${encodeURIComponent(e.id)}" role="button" tabindex="0">${lautBtn(e.it, true)}
    <div class="mitte"><div class="it">${esc(e.it)}</div><div class="de">${esc(e.de)}</div>
      ${form >= 0 ? `<div class="ministand">Form: <b>${esc(vf.formen[form])}</b> (${PERSONEN[form]})</div>` : ""}</div><span class="pfeil">›</span></div>`;
}
const wbEintragHtml = kachelHtml;
function lernstandZeile(id, r) {
  const z = zustand(id, r), name = r === "it-de" ? "🇮🇹 → 🇩🇪 verstehen" : "🇩🇪 → 🇮🇹 selbst sagen";
  if (!z || !z.wdh) return `<tr><td>${name}</td><td colspan="2" class="leise">${z ? "noch nicht gewusst" : "noch nicht gelernt"}</td></tr>`;
  const tage = Math.round((z.faellig - Date.now()) / TAG);
  const wann = tage <= 0 ? "heute dran" : tage === 1 ? "morgen wieder" : `in ${tage < 60 ? tage + " Tagen" : Math.round(tage / 30) + " Monaten"} wieder`;
  return `<tr><td>${name}</td><td>${lernstandHtml(id, r)}</td><td class="leise">${wann}<br>${z.richtig} × richtig · ${z.falsch} × falsch</td></tr>`;
}
function wortSeite(arg) {
  const id = decodeURIComponent(arg || ""), e = KARTE_NACH_ID[id] || WB_NACH_ID[id];
  if (!e) return geheZu("nachschlagen");
  const gruppe = GRUPPE_NACH_ID[e.thema], istKarte = !!KARTE_NACH_ID[id];
  setzeKopf(istEinzelwort(e) ? "Wort" : "Phrase", gruppe && /^p_|^lk_/.test(gruppe.id) && !istEinzelwort(e) ? "phrasen/" + gruppe.id : "nachschlagen");
  const vf = verbFormen(e), gesucht = letzteSuche;
  const tabelle = vf ? `<h2>Formen (Gegenwart)${vf.unreg ? " · unregelmäßig" : ""}</h2>
    <table class="tab vformen-tab">${vf.formen.map((f, i) => `<tr${normWort(f.split(" ").pop()) === gesucht ? ' class="treffer"' : ""}><td class="leise">${PERSONEN[i]}</td><td><b>${esc(f)}</b></td><td class="leise">${PERSONEN_DE[i]}</td><td>${lautBtn(f, true)}</td></tr>`).join("")}</table>` : "";
  zeige(`
    <div class="karte" style="text-align:center">
      ${nussBtn(e.id)}
      <div class="wort">${esc(e.it)}</div>
      <div class="mitte-zentriert" style="flex-direction:row;justify-content:center">${lautBtn(e.it)}${langsamBtn(e.it)}</div>
      <div class="loesung" style="font-size:22px">${esc(e.de)}</div>
      ${gruppe ? `<div class="leise" style="margin-top:6px">${gruppe.icon || ""} ${esc(gruppe.name)}</div>` : ""}
      ${hinweisHtml(e)}
    </div>
    ${tabelle}
    <h2>Lernstand</h2>
    ${istKarte ? `<table class="tab lernstand-tab">${lernstandZeile(id, "it-de")}${lernstandZeile(id, "de-it")}</table>
      <button class="btn voll" id="wUeben" style="margin-top:10px">🗂️ Diese Karte jetzt üben</button>`
      : `<p class="leise">Für diesen Eintrag gibt es keine eigene Karteikarte.</p>`}`);
  const u = document.getElementById("wUeben");
  if (u) u.onclick = () => {
    const liste = richtungenFuer(S.einstellungen.richtung).map((r) => ({ k: e, r }));
    sitzung = { liste, pos: 0, neuKeys: new Set(liste.filter((x) => istNeu(e.id, x.r)).map((x) => schluessel(e.id, x.r))), aufgedeckt: false, eingabe: null, gesamt: liste.length, fertig: 0, zurueck: "wort/" + arg };
    geheZu("karte");
  };
}
function nachschlagen() {
  setzeKopf("Wörterbuch", "start");
  zeige(`<input type="search" id="suche" placeholder="Italienisch oder Deutsch suchen …" autocomplete="off"><div class="liste" id="treffer"></div>`);
  const feld = document.getElementById("suche"), aus = document.getElementById("treffer");
  feld.value = nachschlagen.text || ""; // Suchtext bleibt erhalten, wenn man von einem Wort zurückkommt
  const n = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const zeichnen = () => {
    const q = n(feld.value.trim());
    nachschlagen.text = feld.value; letzteSuche = normWort(q);
    if (!q) {
      // ohne Suchtext: alle Wörter alphabetisch (ohne Artikel sortiert), mit Buchstaben-Überschriften und Sprungleiste
      const buchstabe = (e) => n(e.it.replace(/^(il |lo |la |i |gli |le |l')/i, "")).charAt(0).toUpperCase();
      const gruppen = [];
      WOERTERBUCH_LISTE.forEach((e) => { const b = buchstabe(e); if (!gruppen.length || gruppen[gruppen.length - 1].b !== b) gruppen.push({ b, eintraege: [] }); gruppen[gruppen.length - 1].eintraege.push(e); });
      aus.innerHTML = `<p class="leise">${WOERTERBUCH_LISTE.length} Wörter, alphabetisch. Oben eintippen zum Filtern. Bei Verben siehst du unter „Formen“ alle Formen – und du findest ein Verb auch über eine Form (z. B. „consiglia“ → consigliare). Ganze Sätze stehen unter 💬 Phrasen.</p>
        <div class="abc">${gruppen.map((g) => `<button data-abc="${g.b}">${g.b}</button>`).join("")}</div>
        ${gruppen.map((g) => `<h2 class="abc-kopf" id="wb-${g.b}">${g.b}</h2>${g.eintraege.map((e) => wbEintragHtml(e)).join("")}`).join("")}`;
      aus.querySelectorAll("[data-abc]").forEach((b) => (b.onclick = () => document.getElementById("wb-" + b.dataset.abc).scrollIntoView({ behavior: "smooth" })));
      return;
    }
    // Treffer: im Wort, in der Übersetzung oder in einer Verbform; genaue Treffer zuerst
    const treffer = [];
    WOERTERBUCH_LISTE.forEach((e) => {
      const it = n(e.it), de = n(e.de), vf = verbFormen(e), formen = vf ? vf.formen.map((f) => n(f.split(" ").pop())) : [];
      let rang = -1;
      if (it === q || it.replace(/^(il |lo |la |i |gli |le |l')/, "") === q || formen.includes(q)) rang = 0;
      else if (it.startsWith(q) || it.replace(/^(il |lo |la |i |gli |le |l')/, "").startsWith(q) || de.split(/[ ,/;()]+/).includes(q)) rang = 1;
      else if (it.includes(q) || de.includes(q) || formen.some((f) => f.startsWith(q))) rang = 2;
      if (rang >= 0) treffer.push({ e, rang });
    });
    treffer.sort((a, b) => a.rang - b.rang);
    aus.innerHTML = treffer.slice(0, 80).map((t) => wbEintragHtml(t.e, q)).join("") || `<p class="leise">Nichts gefunden. Steht es vielleicht in einem Satz? Schau unter 💬 Phrasen – oder frag Claude bei einer Karte.</p>`;
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
    <h2>☁️ Lernstand sichern &amp; abgleichen</h2>
    ${githubSchluessel()
      ? `<p class="leise">Mit deinem GitHub-Schlüssel wird der Lernstand <b>automatisch online gesichert</b> und zwischen Handy und PC <b>abgeglichen</b> – beim Öffnen der App und etwa eine Minute nach dem Üben. Pro Karte gilt der zuletzt geübte Stand.<br>${esc(syncStatus || (S.letzteSicherung ? "Zuletzt gesichert: " + new Date(S.letzteSicherung).toLocaleString("de-DE") : "Noch nicht abgeglichen."))}</p>
         <button class="btn voll" id="syncJetzt">🔄 Jetzt abgleichen</button>`
      : `<p class="leise">Dein Lernstand liegt <b>nur auf diesem Gerät</b>. Trage unten den GitHub-Schlüssel ein – dann wird er automatisch gesichert und zwischen Handy und PC abgeglichen. Ohne Schlüssel: mit „Sichern“ eine Datei speichern (z. B. in Google Drive).${S.letzteSicherung ? " Zuletzt gesichert: " + new Date(S.letzteSicherung).toLocaleDateString("de-DE") + "." : ""}</p>`}
    <div class="reihe"><button class="btn zweit" id="export">💾 Als Datei sichern</button><button class="btn zweit" id="import">📂 Datei einlesen</button></div>
    <input type="file" id="datei" accept=".json,application/json" hidden>
    <button class="btn rot voll" id="reset" style="margin-top:20px">Lernstand löschen</button>
    <h2>✉️ Fragen &amp; Wünsche an Claude</h2>
    ${(() => {
      const alle = S.wuensche || [], offen = alle.filter((w) => !w.gesendet);
      return `<div class="einstellung">
        <label for="freiNachricht" style="margin-top:0">Nachricht an Claude</label>
        <textarea id="freiNachricht" rows="3" placeholder="z. B. Ich möchte mehr Übungen zu den Zahlen. · Was ist der Unterschied zwischen sapere und conoscere?"></textarea>
        <button class="btn voll" id="freiSenden" style="margin-bottom:10px">Senden</button>
        <p class="leise">Zu einzelnen Karten fragst du am besten direkt bei der Karte: „❓ Erklärung wünschen / Frage stellen“ bzw. „✉️ Frage an Claude“.</p>
        <p style="margin-top:0">${alle.length ? `Auf der Liste: <b>${alle.length}</b>${offen.length ? ` – davon <b>${offen.length} noch nicht gesendet</b>` : " – alle an GitHub gesendet"}.` : "Noch nichts auf der Liste."}</p>
        ${alle.length ? `<details><summary class="leise">Liste ansehen</summary><p class="leise">${alle.map((w) => esc(wunschText(w)) + (w.gesendet ? " ✓" : "")).join("<br>")}</p></details>` : ""}
        ${wunschStatus ? `<p class="leise">${esc(wunschStatus)}</p>` : ""}
        <p class="leise">Gesendete Wünsche liest Claude bei der nächsten Bearbeitung der App aus und schreibt die Erklärungen dazu. Damit die Wünsche automatisch ankommen, braucht dieses Gerät einmalig den <b>GitHub-Schlüssel</b> (derselbe wie für die Bearbeiten-Seite): ${!githubSchluessel() ? "<b>fehlt noch</b>" : (S.schluesselInfo || {}).ungueltig ? "<b style='color:var(--rot)'>✗ gilt nicht mehr</b>" : "<b>✓ vorhanden</b>"}</p>
        ${schluesselWarnung()}
        <details${(S.schluesselInfo || {}).ungueltig ? " open" : ""}><summary class="leise">Schlüssel abgelaufen? So erneuerst du ihn</summary>
          <p class="leise">Auf github.com (als StefanReinhart angemeldet): Profilbild → <b>Settings</b> → ganz unten <b>Developer settings</b> → <b>Personal access tokens</b> → <b>Fine-grained tokens</b> → deinen Schlüssel antippen → <b>Regenerate token</b>. Den neuen Schlüssel kopieren und hier unten einfügen – auf jedem Gerät (Handy, beide PCs).
          Ist keiner mehr da: <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">neuen anlegen</a> – nur Projekt <b>italienisch</b>, Recht <b>Contents: Read and write</b>.</p></details>
        <input type="password" id="ghSchluessel" placeholder="github_pat_… einfügen" autocomplete="off" style="font-family:monospace">
        <label for="ghAblauf" class="leise" style="font-weight:400">Läuft ab am (steht bei GitHub beim Schlüssel – für eine Erinnerung 14 Tage vorher):</label>
        <input type="date" id="ghAblauf" value="${(S.schluesselInfo || {}).ablauf ? new Date(S.schluesselInfo.ablauf).toISOString().slice(0, 10) : ""}">
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
    const datum = document.getElementById("ghAblauf").value;
    S.schluesselInfo = datum ? { ablauf: Date.parse(datum + "T12:00:00") } : {}; speichern(); // neuer Schlüssel: alten Stand vergessen
    toast("Schlüssel gespeichert ✓"); schluesselPruefen(true).then(wuenscheSenden).then(() => abgleichen()).then(() => ohneSprung(einstellungen));
  };
  document.getElementById("ghAblauf").onchange = (e) => {
    const d = e.target.value;
    S.schluesselInfo = { ...(S.schluesselInfo || {}) };
    if (d) S.schluesselInfo.ablauf = Date.parse(d + "T12:00:00"); else delete S.schluesselInfo.ablauf;
    speichern(); toast(d ? "Ablaufdatum gemerkt – 14 Tage vorher kommt eine Erinnerung." : "Ablaufdatum entfernt.");
  };
  document.getElementById("freiSenden").onclick = () => {
    const feld = document.getElementById("freiNachricht"), text = feld.value.trim();
    if (!text) return toast("Bitte erst eine Nachricht eintippen.");
    const w = { typ: "nachricht", id: "allgemein", nachricht: text, zeit: new Date().toISOString().slice(0, 10), gesendet: false };
    if (!(S.wuensche || []).some((x) => wunschSchluessel(x) === wunschSchluessel(w))) S.wuensche = (S.wuensche || []).concat(w);
    speichern();
    toast(githubSchluessel() ? "Gesendet – Claude liest das bei der nächsten Bearbeitung." : "Gemerkt. (Ohne GitHub-Schlüssel nur auf diesem Gerät.)", 4000);
    wuenscheSenden().then(() => ohneSprung(einstellungen));
  };
  const ws = document.getElementById("wSenden");
  if (ws) ws.onclick = async () => { ws.disabled = true; ws.textContent = "Sende …"; await wuenscheSenden(); ohneSprung(einstellungen); };
  const wk = document.getElementById("wKopieren");
  if (wk) wk.onclick = async () => {
    const text = "Fragen und Wünsche zur Italienisch-App:\n" + (S.wuensche || []).map((w) => `${w.id} – ${wunschText(w)}`).join("\n");
    try { await navigator.clipboard.writeText(text); toast("Liste kopiert ✓"); } catch (e) { toast("Kopieren ging nicht."); }
  };
  const sj = document.getElementById("syncJetzt");
  if (sj) sj.onclick = async () => { sj.disabled = true; sj.textContent = "Gleiche ab …"; await abgleichen(false); ohneSprung(einstellungen); };
  document.getElementById("export").onclick = () => {
    S.letzteSicherung = Date.now(); speichern();
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
    fehler: fehlerMenue, typfehler: typFehlerSeite, nuesse: nuesseSeite, schwierig: schwierigSeite, "satzbau-fehler": () => { satz = null; satzbauStart(schwacheSaetze()); },
    phrasen: () => (arg ? phrasenGruppe(arg) : phrasenMenue()), nachschlagen, einstellungen, stand: () => standSeite(arg), lfehler: () => lektionFehlerSeite(arg), wort: () => wortSeite(arg), lernkurve: lernkurveSeite
  };
  (seiten[teil] || startseite)();
}
window.addEventListener("hashchange", route);
speichern(); // übernommenen Lernstand (Version 1 → 2) gleich sichern
route();
setTimeout(() => { schluesselPruefen(); wuenscheSenden(); abgleichen(); }, 3000); // Schlüssel prüfen, Wünsche nachsenden, Lernstand abgleichen
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") { schluesselPruefen(); abgleichen(); } // anderes Gerät hat vielleicht geübt
  else if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; abgleichen(); } // beim Verlassen noch schnell sichern
});

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
