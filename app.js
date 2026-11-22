"use strict";
/* Italienisch lernen – die ganze App in einer Datei.
   Aufbau: Hilfsfunktionen → Daten → Speichern → Sprachausgabe → Spracherkennung → Bildschirme → Start */

// ---------- Hilfsfunktionen ----------
const $app = document.getElementById("app");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const mischen = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const zufall = (arr) => arr[Math.floor(Math.random() * arr.length)];
const TAG = 24 * 60 * 60 * 1000;
const heute = () => new Date().toISOString().slice(0, 10);

function toast(text, ms = 2500) {
  const t = document.getElementById("toast");
  t.textContent = text; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), ms);
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
  karten: {},          // id → { box, faellig, richtig, falsch }
  einstellungen: { tempo: 0.9, stimme: "", neueProTag: 10, automatischVorlesen: true, richtung: "it-de", themen: ["grundwoerter"] },
  tage: {},            // Datum → Anzahl geübter Aufgaben
  neueHeute: { datum: "", anzahl: 0 }
};
let S = laden();
function laden() {
  try {
    const roh = JSON.parse(localStorage.getItem(SPEICHER_KEY) || "null");
    if (roh) return { ...STANDARD, ...roh, einstellungen: { ...STANDARD.einstellungen, ...(roh.einstellungen || {}) } };
  } catch (e) { /* kaputter Speicher → neu anfangen */ }
  return JSON.parse(JSON.stringify(STANDARD));
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

// ---------- Wiederholung in Abständen (Lernkartei) ----------
// Jede Karte liegt in einem "Fach". Je höher das Fach, desto später kommt sie wieder.
const ABSTAENDE = [0, 1, 2, 4, 8, 16, 35, 75, 150]; // Tage je Fach
function bewerte(id, note) { // note: 0 nochmal, 1 schwer, 2 gut, 3 leicht
  const k = S.karten[id] || { box: 0, faellig: 0, richtig: 0, falsch: 0 };
  if (note === 0) { k.box = 0; k.falsch++; k.faellig = Date.now() + 60 * 1000; }
  else {
    if (note === 1) k.box = Math.max(1, k.box);
    if (note === 2) k.box = Math.min(ABSTAENDE.length - 1, k.box + 1);
    if (note === 3) k.box = Math.min(ABSTAENDE.length - 1, k.box + 2);
    k.richtig++;
    const tage = note === 1 ? Math.max(1, Math.round(ABSTAENDE[k.box] / 2)) : ABSTAENDE[k.box];
    k.faellig = startDesTages(Date.now() + tage * TAG);
  }
  S.karten[id] = k; geuebt();
}
function startDesTages(ms) { const d = new Date(ms); d.setHours(3, 0, 0, 0); return d.getTime(); }
const istFaellig = (id) => S.karten[id] && S.karten[id].faellig <= Date.now();
const istNeu = (id) => !S.karten[id];
const istGelernt = (id) => S.karten[id] && S.karten[id].box >= 2;
function neueHeuteUebrig() {
  if (S.neueHeute.datum !== heute()) S.neueHeute = { datum: heute(), anzahl: 0 };
  return Math.max(0, S.einstellungen.neueProTag - S.neueHeute.anzahl);
}
function kartenDerThemen(ids) { return ids.flatMap((id) => (GRUPPE_NACH_ID[id] ? GRUPPE_NACH_ID[id].eintraege : [])); }

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
$app.addEventListener("click", (e) => {
  const b = e.target.closest("[data-sprich]");
  if (b) { e.stopPropagation(); sprich(b.dataset.sprich, b.dataset.langsam === "1"); }
  const g = e.target.closest("[data-gehe]");
  if (g) geheZu(g.dataset.gehe);
});
const fortschrittsLeiste = (nr, gesamt) => `<div class="fortschritt"><span>${nr} / ${gesamt}</span><div class="balken"><i style="width:${(100 * (nr - 1)) / gesamt}%"></i></div></div>`;

// ---------- Startseite ----------
function startseite() {
  setzeKopf("Italienisch lernen", null);
  const faellig = ALLE_KARTEN.filter((k) => istFaellig(k.id)).length;
  const gelernt = ALLE_KARTEN.filter((k) => istGelernt(k.id)).length;
  zeige(`
    <div class="statistik">
      <div><b>${faellig}</b><span>heute wiederholen</span></div>
      <div><b>${gelernt}</b><span>von ${ALLE_KARTEN.length} gelernt</span></div>
      <div><b>${serie()}</b><span>Tage am Stück</span></div>
    </div>
    <div class="kacheln">
      <button class="kachel breit" data-gehe="karten"><span class="sym">🗂️</span><span><b>Karteikarten</b><br><small>Vokabeln und Phrasen lernen und wiederholen</small></span></button>
      <button class="kachel" data-gehe="grammatik"><span class="sym">📘</span><b>Grammatik</b><small>Verben, Artikel, Satzbau</small></button>
      <button class="kachel" data-gehe="hoeren"><span class="sym">👂</span><b>Hören</b><small>Hören und verstehen</small></button>
      <button class="kachel" data-gehe="sprechen"><span class="sym">🎤</span><b>Sprechen</b><small>Nachsprechen mit Korrektur</small></button>
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
    const gel = ids.filter(istGelernt).length, f = ids.filter(istFaellig).length;
    const an = gewaehlt.includes(g.id);
    return `<button class="zeile${an ? " aktiv" : ""}" data-thema="${g.id}">
      <span class="sym">${g.icon}</span>
      <span class="mitte">${esc(g.name)}<small>${ids.length} Einträge · ${gel} gelernt${f ? ` · <b>${f} fällig</b>` : ""}</small>
      <span class="balken"><i style="width:${(100 * gel) / ids.length}%"></i></span></span>
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
  const f = karten.filter((k) => istFaellig(k.id)).length;
  const neu = Math.min(karten.filter((k) => istNeu(k.id)).length, neueHeuteUebrig());
  const r = S.einstellungen.richtung;
  zeige(`
    <p class="leise">Wähle Themen aus (antippen). Die App zeigt zuerst fällige Wiederholungen, dann neue Karten.</p>
    <div class="umschalter" id="richtung">
      <button data-r="it-de" class="${r === "it-de" ? "an" : ""}">Italienisch → Deutsch</button>
      <button data-r="de-it" class="${r === "de-it" ? "an" : ""}">Deutsch → Italienisch</button>
    </div>
    <button class="btn voll" id="los" ${f + neu ? "" : "disabled"}>Los geht's: ${f} Wiederholungen, ${neu} neue</button>
    ${f + neu ? "" : `<p class="leise">Für die gewählten Themen ist heute nichts mehr zu tun. Wähle weitere Themen oder erhöhe in den Einstellungen die Zahl der neuen Karten pro Tag. <button class="btn zweit voll" id="extra">Trotzdem üben (10 zufällige Karten)</button></p>`}
    <h2>Wortschatz</h2>${themenAuswahl(THEMEN, gew)}
    <h2>Phrasen</h2>${themenAuswahl(PHRASEN_GRUPPEN, gew)}
  `);
  themenKlickbar(kartenMenue);
  $app.querySelectorAll("#richtung button").forEach((b) => (b.onclick = () => { S.einstellungen.richtung = b.dataset.r; speichern(); kartenMenue(); }));
  const los = document.getElementById("los");
  los.onclick = () => {
    const faellige = mischen(karten.filter((k) => istFaellig(k.id)));
    const neue = karten.filter((k) => istNeu(k.id)).slice(0, neu);
    sitzung = { liste: faellige.concat(neue), pos: 0, neuIds: new Set(neue.map((k) => k.id)), aufgedeckt: false, gesamt: faellige.length + neue.length, fertig: 0 };
    geheZu("karte");
  };
  const extra = document.getElementById("extra");
  if (extra) extra.onclick = () => {
    const l = mischen(karten.length ? karten : ALLE_WOERTER).slice(0, 10);
    sitzung = { liste: l, pos: 0, neuIds: new Set(), aufgedeckt: false, gesamt: l.length, fertig: 0, frei: true };
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
  const k = sitzung.liste[sitzung.pos];
  const itDe = S.einstellungen.richtung === "it-de";
  const vorne = itDe ? k.it : k.de, hinten = itDe ? k.de : k.it;
  const neu = sitzung.neuIds.has(k.id) && istNeu(k.id);
  const zeit = (n) => { const kk = S.karten[k.id] || { box: 0 }; let b = kk.box; if (n === 1) b = Math.max(1, b); if (n === 2) b = Math.min(8, b + 1); if (n === 3) b = Math.min(8, b + 2); const t = n === 1 ? Math.max(1, Math.round(ABSTAENDE[b] / 2)) : ABSTAENDE[b]; return t === 1 ? "1 Tag" : t + " Tage"; };
  zeige(`
    ${fortschrittsLeiste(Math.min(sitzung.fertig + 1, sitzung.gesamt), sitzung.gesamt)}
    <div class="karte" id="karte">
      ${neu ? `<span class="leise">✨ Neues Wort</span>` : ""}
      <div class="wort">${esc(vorne)}</div>
      ${itDe ? lautBtn(k.it) : ""}
      ${sitzung.aufgedeckt ? `<div class="trenner"></div><div class="loesung">${esc(hinten)}</div>${itDe ? "" : lautBtn(k.it)}` : `<p class="leise">Überlege die Antwort, dann tippe auf „Aufdecken“.</p>`}
    </div>
    ${sitzung.aufgedeckt
      ? `<div class="bewertung">
          <button class="b-nochmal" data-n="0">Nochmal<small>gleich wieder</small></button>
          <button class="b-schwer" data-n="1">Schwer<small>${zeit(1)}</small></button>
          <button class="b-gut" data-n="2">Gut<small>${zeit(2)}</small></button>
          <button class="b-leicht" data-n="3">Leicht<small>${zeit(3)}</small></button>
        </div>`
      : `<button class="btn voll" id="aufdecken" style="margin-top:14px">Aufdecken</button>`}
  `);
  if (!sitzung.aufgedeckt && itDe && S.einstellungen.automatischVorlesen) sprich(k.it);
  if (sitzung.aufgedeckt && !itDe && S.einstellungen.automatischVorlesen) sprich(k.it);
  const auf = document.getElementById("aufdecken");
  if (auf) auf.onclick = () => { sitzung.aufgedeckt = true; karteZeigen(); };
  $app.querySelectorAll("[data-n]").forEach((b) => (b.onclick = () => {
    const n = +b.dataset.n;
    if (!sitzung.frei) {
      if (sitzung.neuIds.has(k.id) && istNeu(k.id)) { neueHeuteUebrig(); S.neueHeute.anzahl++; }
      bewerte(k.id, n);
    } else geuebt();
    if (n === 0) sitzung.liste.push(k); else sitzung.fertig++;
    sitzung.pos++; sitzung.aufgedeckt = false; karteZeigen();
  }));
}

// ---------- Grammatik ----------
function grammatikMenue() {
  setzeKopf("Grammatik", "start");
  zeige(`
    <div class="liste">
      <button class="zeile" data-gehe="verben"><span class="sym">🔤</span><span class="mitte">Verben konjugieren<small>essere, avere, -are/-ere/-ire, unregelmäßige</small></span><span class="pfeil">›</span></button>
      <button class="zeile" data-gehe="tabellen"><span class="sym">📋</span><span class="mitte">Verbtabellen nachschlagen<small>Alle Formen zum Anhören</small></span><span class="pfeil">›</span></button>
      <button class="zeile" data-gehe="artikel"><span class="sym">🏷️</span><span class="mitte">Artikel üben<small>il, lo, la, l', i, gli, le</small></span><span class="pfeil">›</span></button>
      <button class="zeile" data-gehe="satzbau"><span class="sym">🧩</span><span class="mitte">Satzbau<small>Wörter in die richtige Reihenfolge bringen</small></span><span class="pfeil">›</span></button>
    </div>
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
    let s = stamm, t = ["o", "i", "a", "iamo", "ate", "ano"];
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
  zeige(`
    <p>Welche Verben möchtest du üben?</p>
    <div class="liste">
      <button class="zeile" data-art="essere-avere"><span class="sym">⭐</span><span class="mitte">essere und avere<small>sein und haben – die wichtigsten</small></span><span class="pfeil">›</span></button>
      <button class="zeile" data-art="regel"><span class="sym">✅</span><span class="mitte">Regelmäßige Verben<small>-are, -ere, -ire</small></span><span class="pfeil">›</span></button>
      <button class="zeile" data-art="unreg"><span class="sym">⚡</span><span class="mitte">Unregelmäßige Verben<small>andare, fare, volere, potere …</small></span><span class="pfeil">›</span></button>
      <button class="zeile" data-art="alle"><span class="sym">🎲</span><span class="mitte">Alles gemischt<small>alle Verben durcheinander</small></span><span class="pfeil">›</span></button>
    </div>`);
  $app.querySelectorAll("[data-art]").forEach((b) => (b.onclick = () => {
    const art = b.dataset.art;
    const pool = ALLE_VERBEN.filter((v) => art === "alle" || (art === "regel" && !v.unreg) || (art === "unreg" && v.unreg && !["essere", "avere"].includes(v.inf)) || (art === "essere-avere" && ["essere", "avere"].includes(v.inf)));
    const aufgaben = Array.from({ length: 10 }, () => {
      const v = zufall(pool), formen = konjugiere(v), p = Math.floor(Math.random() * 6), richtig = formen[p];
      const falsche = mischen([...new Set(formen.filter((f) => f !== richtig))]).slice(0, 3);
      return { frage: `<div class="leise">${esc(v.inf)} = ${esc(v.de)}</div><div class="gross">${PERSONEN[p]} ___</div><div class="leise">(${PERSONEN_DE[p]})</div>`,
        optionen: mischen([richtig, ...falsche]), richtig, sprechen: `${PERSONEN[p].split("/")[0]} ${richtig}`, erklaerung: `${PERSONEN[p]} ${richtig}` };
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
  const aufgaben = mischen(ARTIKEL_NOMEN).slice(0, 10).map((a) => ({
    frage: `<div class="leise">Welcher Artikel passt?</div><div class="gross">___ ${esc(a.nomen)}</div>`,
    optionen: ["il", "lo", "la", "l'", "i", "gli", "le"], richtig: a.artikel, sprechen: a.ganz,
    erklaerung: `${a.ganz} = ${a.de}`, zwei: true
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
      <p>${p === n ? "Perfetto! Alles richtig." : p >= n * 0.7 ? "Bravo! Sehr gut." : "Weiter üben – das wird!"}</p></div>
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
    geuebt();
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
  const s = zufall(SAETZE_LISTE);
  const ende = (s.it.match(/[.?!]$/) || [""])[0];
  const woerter = s.it.replace(/[.?!]$/, "").split(" ");
  let gemischt = mischen(woerter.map((w, i) => ({ w, i })));
  if (gemischt.every((x, i) => x.i === i)) gemischt = gemischt.reverse();
  satz = { s, ende, woerter, gemischt, gewaehlt: [], geprueft: false };
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
  const p = document.getElementById("pruefen"); if (p) p.onclick = () => { satz.geprueft = true; geuebt(); satzbauZeigen(); sprich(s.it); };
  const l = document.getElementById("leeren"); if (l) l.onclick = () => { satz.gewaehlt = []; satzbauZeigen(); };
  const n = document.getElementById("neu"); if (n) n.onclick = () => satzbauStart();
}

// ---------- Hören ----------
function hoerenMenue() {
  setzeKopf("Hören", "start");
  zeige(`
    <p>Du hörst ein italienisches Wort oder einen Satz und wählst die richtige Übersetzung. Tipp: 🐢 spielt es langsam ab.</p>
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
  const aufgaben = mischen(pool).slice(0, 10).map((k) => {
    const falsche = mischen(pool.filter((x) => x.de !== k.de)).slice(0, 3).map((x) => x.de);
    return {
      frage: `<div class="leise">Was bedeutet das?</div>
        <div class="mitte-zentriert" style="margin:8px 0;flex-direction:row;justify-content:center">
          ${lautBtn(k.it)}<button class="lautsprecher" data-sprich="${esc(k.it)}" data-langsam="1" aria-label="Langsam vorlesen">🐢</button></div>`,
      optionen: mischen([k.de, ...falsche]), richtig: k.de, erklaerung: `${k.it} = ${k.de}`,
      beimStart: () => setTimeout(() => sprich(k.it), 250)
    };
  });
  quizStarten({ aufgaben, pos: 0, punkte: 0, zurueck: "hoeren", titel: "Hören", nochmal: "hoeren-neu" });
}

// ---------- Sprechen ----------
let sprechen = null;
function sprechenMenue() {
  setzeKopf("Sprechen", "start");
  zeige(`
    <div class="meldung info">ℹ️ Gut zu wissen: Die Spracherkennung schreibt auf, was sie verstanden hat, und vergleicht es mit dem Zielsatz. Das ist <b>keine echte Bewertung deiner Aussprache</b>, aber ein guter Hinweis: Wenn das Handy dich versteht, verstehen dich meist auch Menschen. Auf Android braucht die Erkennung meist <b>Internet</b>.</div>
    ${SR ? "" : `<div class="meldung schlecht">Dieser Browser hat keine Spracherkennung. Bitte die App in Chrome öffnen.</div>`}
    <h2>Was möchtest du sprechen?</h2>
    <div class="liste">
      ${PHRASEN_GRUPPEN.concat(THEMEN).map((g) => `<button class="zeile" data-gruppe="${g.id}"><span class="sym">${g.icon}</span><span class="mitte">${esc(g.name)}<small>${g.eintraege.length} ${GRUPPE_NACH_ID[g.id].id.startsWith("p_") ? "Sätze" : "Wörter"}</small></span><span class="pfeil">›</span></button>`).join("")}
    </div>`);
  $app.querySelectorAll("[data-gruppe]").forEach((b) => (b.onclick = () => {
    sprechen = { liste: mischen(GRUPPE_NACH_ID[b.dataset.gruppe].eintraege), pos: 0, ergebnis: null, status: "" };
    geheZu("sprechen-ueben");
  }));
}
function sprechenZeigen() {
  if (!sprechen) return geheZu("sprechen");
  setzeKopf("Sprechen", "sprechen");
  const k = sprechen.liste[sprechen.pos];
  const e = sprechen.ergebnis;
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
      <div class="wort" style="font-size:28px">${esc(k.it)}</div>
      <div class="reihe" style="justify-content:center;margin:4px 0">${lautBtn(k.it)}<button class="lautsprecher" data-sprich="${esc(k.it)}" data-langsam="1" aria-label="Langsam vorlesen">🐢</button></div>
    </div>
    <div class="mitte-zentriert">
      <button class="mikro" id="mikro" aria-label="Sprechen">🎤</button>
      <div id="status" class="leise">${esc(sprechen.status || "Erst anhören, dann aufs Mikrofon tippen und nachsprechen.")}</div>
    </div>
    ${ergebnisHtml}
    <div class="reihe">
      <button class="btn zweit" id="zurueckK" ${sprechen.pos ? "" : "disabled"}>‹ Vorheriger</button>
      <button class="btn" id="weiterK">Nächster ›</button>
    </div>`);
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
        geuebt();
        sprechenZeigen();
        if (beste.v.prozent < 90) setTimeout(() => sprich(k.it), 500);
      },
      fehler: (text) => { mikro.classList.remove("hoert"); status.textContent = text; sprechen.status = ""; },
      ende: () => mikro.classList.remove("hoert")
    });
  };
  document.getElementById("weiterK").onclick = () => { sprechen.pos = (sprechen.pos + 1) % sprechen.liste.length; sprechen.ergebnis = null; sprechen.status = ""; sprechenZeigen(); };
  document.getElementById("zurueckK").onclick = () => { sprechen.pos = Math.max(0, sprechen.pos - 1); sprechen.ergebnis = null; sprechen.status = ""; sprechenZeigen(); };
}

// ---------- Phrasen ansehen ----------
function phrasenMenue() {
  setzeKopf("Phrasen", "start");
  zeige(`<div class="liste">${PHRASEN_GRUPPEN.map((g) => `<button class="zeile" data-gehe="phrasen/${g.id}"><span class="sym">${g.icon}</span><span class="mitte">${esc(g.name)}<small>${g.eintraege.length} Sätze</small></span><span class="pfeil">›</span></button>`).join("")}</div>`);
}
const eintragHtml = (e) => `<div class="eintrag">${lautBtn(e.it, true)}<div class="mitte"><div class="it">${esc(e.it)}</div><div class="de">${esc(e.de)}</div></div></div>`;
function phrasenGruppe(id) {
  const g = GRUPPE_NACH_ID[id]; if (!g) return geheZu("phrasen");
  setzeKopf(g.name, "phrasen");
  zeige(`<p class="leise">Tippe auf 🔊 zum Anhören.</p><div class="liste">${g.eintraege.map(eintragHtml).join("")}</div>
    <div class="reihe"><button class="btn" id="ueben">🎤 Diese Sätze sprechen üben</button></div>`);
  document.getElementById("ueben").onclick = () => { sprechen = { liste: g.eintraege.slice(), pos: 0, ergebnis: null, status: "" }; geheZu("sprechen-ueben"); };
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
      <input type="range" id="neu" min="5" max="40" step="5" value="${E.neueProTag}"></div>
    <div class="einstellung schalter"><span><b>Automatisch vorlesen</b><br><small class="leise">bei Karteikarten</small></span><input type="checkbox" id="auto" ${E.automatischVorlesen ? "checked" : ""}></div>
    <h2>Lernstand sichern</h2>
    <p class="leise">Dein Lernstand ist nur auf diesem Handy gespeichert. Mit „Sichern“ bekommst du eine Datei, die du z. B. in Google Drive ablegen und später wieder einlesen kannst.</p>
    <div class="reihe"><button class="btn zweit" id="export">💾 Sichern</button><button class="btn zweit" id="import">📂 Einlesen</button></div>
    <input type="file" id="datei" accept=".json,application/json" hidden>
    <button class="btn rot voll" id="reset" style="margin-top:20px">Lernstand löschen</button>
    <p class="leise" style="margin-top:20px">Version 1 · Vorlesen: ${TTS ? "ja" : "nein"} · Spracherkennung: ${SR ? "ja" : "nein"}</p>`);
  const sel = document.getElementById("stimme");
  if (sel) sel.onchange = () => { E.stimme = sel.value; speichern(); sprich("Ciao, come stai?"); };
  document.getElementById("test").onclick = () => sprich("Ciao! Benvenuto. Impariamo l'italiano insieme.");
  document.getElementById("tempo").oninput = (e) => { E.tempo = +e.target.value; document.getElementById("tempoWert").textContent = Math.round(E.tempo * 100) + " %"; speichern(); };
  document.getElementById("tempo").onchange = () => sprich("Buongiorno, come sta?");
  document.getElementById("neu").oninput = (e) => { E.neueProTag = +e.target.value; document.getElementById("neuWert").textContent = E.neueProTag; speichern(); };
  document.getElementById("auto").onchange = (e) => { E.automatischVorlesen = e.target.checked; speichern(); };
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
      localStorage.setItem(SPEICHER_KEY, JSON.stringify(d)); S = laden(); toast("Lernstand eingelesen ✓"); einstellungen();
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
    phrasen: () => (arg ? phrasenGruppe(arg) : phrasenMenue()), nachschlagen, einstellungen
  };
  (seiten[teil] || startseite)();
}
window.addEventListener("hashchange", route);
route();

// ---------- Offline-Funktion ----------
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  const hatteSteuerung = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("sw.js").catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hatteSteuerung) toast("Neue Version geladen – App einmal schließen und neu öffnen.", 5000);
  });
}
