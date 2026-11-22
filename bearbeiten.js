"use strict";
/* Inhalte bearbeiten (für den PC).
   - Lädt Wortschatz, Phrasen, Satzbau-Sätze und Frage & Antwort direkt von GitHub (immer der aktuelle Stand).
   - Jede Änderung wird sofort als Entwurf in diesem Browser gespeichert.
   - "Veröffentlichen" schreibt die Dateien zu GitHub (ein Speicherstand) und erhöht die Versionsnummer.
   Mit ?test im Adressfeld werden die Dateien vom eigenen Server gelesen und nichts veröffentlicht. */

const REPO = "StefanReinhart/italienisch", ZWEIG = "master";
const AUTOR = { name: "StefanReinhart", email: "154806245+StefanReinhart@users.noreply.github.com" };
const SEITE = "https://stefanreinhart.github.io/italienisch/";
const DATEIEN = { wortschatz: "data/wortschatz.js", phrasen: "data/phrasen.js", gespraech: "data/gespraech.js" };
const TEST = new URLSearchParams(location.search).has("test");
const K_SCHLUESSEL = "italienisch-github-schluessel";
const K_ENTWURF = TEST ? "italienisch-entwurf-test" : "italienisch-entwurf";
const $ed = document.getElementById("ed");

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const neueKennung = (vorne) => vorne + ":" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function toast(text, ms = 3000) {
  const t = document.getElementById("toast"); t.textContent = text; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), ms);
}
function sprich(text) {
  if (!("speechSynthesis" in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.lang = "it-IT"; u.rate = 0.9;
  const v = speechSynthesis.getVoices().find((x) => /^it/i.test(x.lang)); if (v) u.voice = v;
  speechSynthesis.speak(u);
}

// ---------- Zustand ----------
let D = null;            // die bearbeiteten Inhalte
let basis = {};          // Datei → Stand (sha) auf GitHub, auf dem die Bearbeitung aufbaut
let original = {};       // Datei → erzeugter Text des GitHub-Stands (zum Erkennen von Änderungen)
let ansicht = { bereich: "w", thema: 0, suche: "" };
let schluessel = "";
// Unsichtbare Zeichen, Leerzeichen und Zeilenumbrüche entfernen, die beim Kopieren mitkommen können
const schluesselSaeubern = (s) => String(s || "").replace(/[^\x21-\x7E]/g, "");
const schluesselGueltig = (s) => /^(github_pat_|ghp_)[A-Za-z0-9_]{20,}$/.test(s);
try { schluessel = schluesselSaeubern(localStorage.getItem(K_SCHLUESSEL)); } catch (e) {}

// ---------- Dateien lesen und schreiben ----------
function zeilenLesen(text, vorne) {
  return String(text || "").split("\n").map((z) => z.trim()).filter((z) => z.includes("|")).map((z) => {
    const [it, de, id] = z.split("|").map((s) => s.trim());
    return { it, de, id: id || (vorne ? vorne + ":" + it : "") };
  });
}
function auswerten(texte) {
  const w = {};
  new Function("window", texte.wortschatz)(w);
  new Function("window", texte.phrasen)(w);
  new Function("window", texte.gespraech)(w);
  const gruppen = (liste) => liste.map((t) => ({ id: t.id, name: t.name, icon: t.icon, eintraege: zeilenLesen(t.liste, t.id) }));
  return {
    w: gruppen(w.WORTSCHATZ), p: gruppen(w.PHRASEN), s: zeilenLesen(w.SAETZE, ""),
    g: w.GESPRAECH.map((t) => ({ thema: t.thema, fragen: t.fragen.map((q) => ({ id: q.id || q.f, f: q.f, de: q.de, b: q.b, bde: q.bde, m: q.m.slice() })) }))
  };
}
// Text säubern, damit die Datei gültig bleibt (| trennt die Spalten, ` umschließt die Blöcke)
const sauber = (s) => String(s ?? "").replace(/\|/g, "/").replace(/`/g, "'").replace(/\$\{/g, "$ {").replace(/\s+/g, " ").trim();
const sauberG = (s) => String(s ?? "").replace(/`/g, "'").replace(/\s+/g, " ").trim();
const leer = (e) => !sauber(e.it) && !sauber(e.de);
const KOPF = "// Diese Datei wird von der Seite „Inhalte bearbeiten“ (bearbeiten.html) geschrieben – Änderungen am besten dort machen.\n";
function erzeugen(d) {
  const block = (t) => `{ id: ${JSON.stringify(t.id)}, name: ${JSON.stringify(sauber(t.name))}, icon: ${JSON.stringify(sauber(t.icon))}, liste: \`\n` +
    t.eintraege.filter((e) => !leer(e)).map((e) => `${sauber(e.it)} | ${sauber(e.de)} | ${e.id}`).join("\n") + "\n` }";
  const wortschatz = KOPF + "// Grundwortschatz – Format je Zeile:  italienisch | deutsch | feste Kennung\nwindow.WORTSCHATZ = [\n" + d.w.map(block).join(",\n") + "\n];\n";
  const phrasen = KOPF + "// Alltagsphrasen – Format je Zeile:  italienisch | deutsch | feste Kennung\nwindow.PHRASEN = [\n" + d.p.map(block).join(",\n") + "\n];\n\n" +
    "// Sätze für die Übung \"Satzbau\" – Format je Zeile:  italienisch | deutsch\nwindow.SAETZE = `\n" +
    d.s.filter((e) => !leer(e)).map((e) => `${sauber(e.it)} | ${sauber(e.de)}`).join("\n") + "\n`;\n";
  const gespraech = KOPF +
    "// Frage & Antwort. f = Frage, de = Übersetzung, b/bde = Beispielantwort, m = Antwortmuster:\n" +
    "//   wort|wort = eines davon   [wort] = darf fehlen   {x} = 1–4 beliebige Wörter   {zahl} = Zahl   {rest} = 0–5 Wörter\n" +
    "window.GESPRAECH = [\n" + d.g.map((t) => `{ thema: ${JSON.stringify(sauber(t.thema))}, fragen: [\n` +
      t.fragen.filter((q) => sauberG(q.f)).map((q) => "  " + JSON.stringify({ id: q.id, f: sauberG(q.f), de: sauberG(q.de), b: sauberG(q.b), bde: sauberG(q.bde), m: q.m.map(sauberG).filter(Boolean) })).join(",\n") +
      "\n]}").join(",\n") + "\n];\n";
  return { [DATEIEN.wortschatz]: wortschatz, [DATEIEN.phrasen]: phrasen, [DATEIEN.gespraech]: gespraech };
}

// ---------- GitHub ----------
async function gh(pfad, opt = {}) {
  let r;
  try {
    r = await fetch("https://api.github.com/repos/" + REPO + pfad, {
      ...opt, cache: "no-store",
      headers: { Accept: "application/vnd.github+json", Authorization: "Bearer " + schluessel, ...(opt.body ? { "Content-Type": "application/json" } : {}) }
    });
  } catch (e) {
    throw new Error("Keine Verbindung zu GitHub (Internet prüfen). Technische Meldung: " + e.message);
  }
  if (r.status === 401) throw new Error("Der Zugangsschlüssel wird von GitHub nicht angenommen (abgelaufen oder falsch).");
  if (r.status === 403 || r.status === 404) throw new Error("GitHub verweigert den Zugriff. Hat der Schlüssel das Recht „Contents: Read and write“ für das Projekt „italienisch“?");
  if (!r.ok) throw new Error("GitHub meldet Fehler " + r.status + ".");
  return r.json();
}
const ausBase64 = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\n/g, "")), (c) => c.charCodeAt(0)));
async function dateiVonGithub(pfad) {
  const j = await gh(`/contents/${pfad}?ref=${ZWEIG}`);
  return { text: ausBase64(j.content), sha: j.sha };
}
async function allesLaden() {
  const texte = {}, shas = {};
  for (const [name, pfad] of Object.entries(DATEIEN)) {
    if (TEST) { texte[name] = await (await fetch(pfad, { cache: "no-store" })).text(); shas[pfad] = "test"; }
    else { const f = await dateiVonGithub(pfad); texte[name] = f.text; shas[pfad] = f.sha; }
  }
  return { texte, shas };
}

// ---------- Entwurf ----------
function entwurfLesen() { try { return JSON.parse(localStorage.getItem(K_ENTWURF) || "null"); } catch (e) { return null; } }
function entwurfSpeichern() { try { localStorage.setItem(K_ENTWURF, JSON.stringify({ basis, daten: D, zeit: Date.now() })); } catch (e) { toast("Entwurf konnte nicht gespeichert werden!"); } }
function entwurfLoeschen() { try { localStorage.removeItem(K_ENTWURF); } catch (e) {} }
function geaenderteDateien() { const neu = erzeugen(D); return Object.keys(neu).filter((p) => neu[p] !== original[p]); }
let speicherTimer = null;
function geaendert() {
  clearTimeout(speicherTimer);
  speicherTimer = setTimeout(() => { entwurfSpeichern(); leisteAktualisieren(); }, 400);
}

// ---------- Start ----------
async function start() {
  if (!TEST && !schluesselGueltig(schluessel)) return einrichten();
  $ed.innerHTML = `<p class="leise">Lade die Inhalte${TEST ? " (Testmodus)" : " von GitHub"} …</p>`;
  try {
    const { texte, shas } = await allesLaden();
    const frisch = auswerten(texte);
    original = erzeugen(frisch);
    const e = entwurfLesen();
    if (e && e.daten) {
      const gleicheBasis = Object.keys(shas).every((p) => e.basis && e.basis[p] === shas[p]);
      if (gleicheBasis) { D = e.daten; basis = e.basis; }
      else {
        D = frisch; basis = shas;
        $ed.innerHTML = `<div class="meldung info einrichten"><p><b>Auf GitHub gibt es inzwischen eine neuere Fassung</b> (z. B. vom anderen PC veröffentlicht), aber hier liegt noch ein unveröffentlichter Entwurf vom ${new Date(e.zeit).toLocaleString("de-DE")}.</p>
          <div class="reihe"><button class="btn" id="verwerfen">Neuere Fassung nehmen (Entwurf verwerfen)</button><button class="btn zweit" id="behalten">Meinen Entwurf behalten</button></div>
          <p class="leise">„Entwurf behalten“ überschreibt beim Veröffentlichen die neuere Fassung.</p></div>`;
        document.getElementById("verwerfen").onclick = () => { entwurfLoeschen(); zeichnen(); };
        document.getElementById("behalten").onclick = () => { D = e.daten; entwurfSpeichern(); zeichnen(); };
        return;
      }
    } else { D = frisch; basis = shas; }
    zeichnen();
  } catch (err) {
    $ed.innerHTML = `<div class="meldung schlecht">${esc(err.message)}</div><div class="reihe"><button class="btn" id="nochmal">Nochmal versuchen</button><button class="btn zweit" id="neuerSchluessel">Zugangsschlüssel ändern</button></div>`;
    document.getElementById("nochmal").onclick = start;
    document.getElementById("neuerSchluessel").onclick = einrichten;
  }
}

// ---------- Einrichten: Zugangsschlüssel ----------
function einrichten() {
  $ed.innerHTML = `<div class="einrichten">
    <h2>Einmalig einrichten</h2>
    <p>Damit diese Seite deine Änderungen bei GitHub speichern darf, braucht sie einen <b>Zugangsschlüssel</b> – wie einen Zweitschlüssel, der nur zu einer einzigen Tür passt (dem Projekt „italienisch“).</p>
    <ol>
      <li>Auf <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com → Fine-grained token anlegen</a> gehen (als <b>StefanReinhart</b> angemeldet).</li>
      <li><b>Token name:</b> z. B. <code>Italienisch bearbeiten</code>. <b>Expiration:</b> z. B. 1 Jahr.</li>
      <li><b>Repository access:</b> „Only select repositories“ anklicken, dann <b>Select repositories</b> → <b>italienisch</b> auswählen.</li>
      <li>Unter <b>Permissions</b> den Reiter <b>Repositories</b> wählen → rechts <b>＋ Add permissions</b> → <b>Contents</b> ankreuzen.
        In der neuen Zeile „Contents“ rechts das Auswahlfeld von <b>Read-only</b> auf <b>Read and write</b> umstellen. Sonst nichts ändern.</li>
      <li>Unten <b>Generate token</b>, den angezeigten Schlüssel (beginnt mit <code>github_pat_</code>) kopieren und hier einfügen:</li>
    </ol>
    <input type="password" id="schluessel" placeholder="github_pat_…" autocomplete="off" style="font-family:monospace">
    <button class="btn" id="speichern">Speichern und Inhalte laden</button>
    <p class="leise">Der Schlüssel wird nur in diesem Browser auf diesem PC gespeichert, nicht im Projekt. Am zweiten PC fügst du ihn dort einmal ein (oder legst einen zweiten an). Er erlaubt nur Änderungen am Projekt „italienisch“ – an „Bericht und Gutachten“ kommt er nicht heran.</p>
  </div>`;
  document.getElementById("speichern").onclick = () => {
    const s = schluesselSaeubern(document.getElementById("schluessel").value);
    if (!s) return toast("Bitte den Schlüssel einfügen.");
    if (!schluesselGueltig(s)) return toast("Das sieht nicht wie ein GitHub-Schlüssel aus – er beginnt mit github_pat_ und ist sehr lang. Bitte nochmal kopieren.", 6000);
    schluessel = s;
    try { localStorage.setItem(K_SCHLUESSEL, s); } catch (e) {}
    start();
  };
}

// ---------- Ansicht ----------
const BEREICHE = { w: "Wortschatz", p: "Phrasen", s: "Satzbau", g: "Frage & Antwort" };
function gruppenVon(b) { return b === "w" ? D.w : b === "p" ? D.p : b === "g" ? D.g : null; }
function zeichnen() {
  const gruppen = gruppenVon(ansicht.bereich);
  if (gruppen && ansicht.thema >= gruppen.length) ansicht.thema = Math.max(0, gruppen.length - 1);
  $ed.innerHTML = `
    <div class="leiste">
      <div class="status" id="status"></div>
      <button class="btn zweit" id="verwerfenAlle">Änderungen verwerfen</button>
      <button class="btn" id="veroeffentlichen">🚀 Veröffentlichen</button>
    </div>
    <div class="raster">
      <nav class="nav">
        <input type="search" id="suche" placeholder="🔎 Überall suchen …" value="${esc(ansicht.suche)}" style="margin-bottom:6px">
        <div class="bereiche">${Object.entries(BEREICHE).map(([k, n]) => `<button data-bereich="${k}" class="${!ansicht.suche && ansicht.bereich === k ? "an" : ""}">${n}</button>`).join("")}</div>
        ${gruppen && !ansicht.suche ? gruppen.map((g, i) => `<button data-thema="${i}" class="${ansicht.thema === i ? "an" : ""}">${esc(g.icon || "💬")} ${esc(g.name || g.thema)} <small>(${(g.eintraege || g.fragen).length})</small></button>`).join("") +
          `<button id="neuesThema">＋ Neues Thema</button>` : ""}
      </nav>
      <section id="inhalt">${ansicht.suche ? sucheHtml() : bereichHtml()}</section>
    </div>`;
  leisteAktualisieren();
  verdrahten();
}
const zeileHtml = (a, t, i, e) => `<tr>
  <td><input data-a="${a}" data-t="${t}" data-e="${i}" data-f="de" value="${esc(e.de)}" placeholder="Deutsch"></td>
  <td class="it"><input data-a="${a}" data-t="${t}" data-e="${i}" data-f="it" value="${esc(e.it)}" placeholder="Italienisch" lang="it" spellcheck="false"></td>
  <td style="width:44px"><button class="mini" data-sprich="${a}|${t}|${i}" title="Vorlesen">🔊</button></td>
  <td style="width:44px"><button class="mini" data-loeschen="${a}|${t}|${i}" title="Löschen">🗑</button></td></tr>`;
const tabelle = (zeilen) => `<table class="ed"><thead><tr><th>Deutsch</th><th>Italienisch</th><th></th><th></th></tr></thead><tbody>${zeilen}</tbody></table>`;
const frageHtml = (t, i, q) => `<div class="frage-ed">
  <div><label>Frage auf Deutsch</label><input data-a="g" data-t="${t}" data-e="${i}" data-f="de" value="${esc(q.de)}">
       <label>Beispielantwort auf Deutsch</label><input data-a="g" data-t="${t}" data-e="${i}" data-f="bde" value="${esc(q.bde)}"></div>
  <div><label>Frage auf Italienisch</label><input data-a="g" data-t="${t}" data-e="${i}" data-f="f" value="${esc(q.f)}" lang="it" spellcheck="false" style="font-weight:600">
       <label>Beispielantwort auf Italienisch</label><input data-a="g" data-t="${t}" data-e="${i}" data-f="b" value="${esc(q.b)}" lang="it" spellcheck="false">
       <label>Antwortmuster (eines pro Zeile): wort|wort · [darf fehlen] · {x} beliebige Wörter · {zahl} · {rest}</label>
       <textarea data-a="g" data-t="${t}" data-e="${i}" data-f="m" spellcheck="false">${esc(q.m.join("\n"))}</textarea></div>
  <div><button class="mini" data-sprich="g|${t}|${i}" title="Frage vorlesen">🔊</button><br><button class="mini" data-loeschen="g|${t}|${i}" title="Frage löschen">🗑</button></div>
</div>`;
function bereichHtml() {
  const b = ansicht.bereich;
  if (b === "s") return `<h2 style="margin-top:0">Satzbau-Sätze</h2><p class="leise">Sätze für die Übung „Satzbau“ (Wörter in die richtige Reihenfolge bringen).</p>
    ${tabelle(D.s.map((e, i) => zeileHtml("s", 0, i, e)).join(""))}<div class="reihe"><button class="btn zweit" id="neu">＋ Satz hinzufügen</button></div>`;
  const g = gruppenVon(b)[ansicht.thema];
  if (!g) return `<p>Noch kein Thema vorhanden.</p>`;
  const kopf = b === "g"
    ? `<div class="kopf-ed"><input data-a="g" data-t="${ansicht.thema}" data-f="thema" value="${esc(g.thema)}" title="Name des Themas"><button class="mini" id="themaLoeschen" title="Thema löschen">🗑</button></div>`
    : `<div class="kopf-ed"><input class="icon" data-a="${b}" data-t="${ansicht.thema}" data-f="icon" value="${esc(g.icon)}" title="Symbol"><input data-a="${b}" data-t="${ansicht.thema}" data-f="name" value="${esc(g.name)}" title="Name des Themas"><button class="mini" id="themaLoeschen" title="Thema löschen">🗑</button></div>`;
  if (b === "g") return kopf + g.fragen.map((q, i) => frageHtml(ansicht.thema, i, q)).join("") + `<div class="reihe"><button class="btn zweit" id="neu">＋ Frage hinzufügen</button></div>`;
  return kopf + tabelle(g.eintraege.map((e, i) => zeileHtml(b, ansicht.thema, i, e)).join("")) +
    `<div class="reihe"><button class="btn zweit" id="neu">＋ Eintrag hinzufügen</button></div>`;
}
function sucheHtml() {
  const n = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const q = n(ansicht.suche);
  let html = "", gesamt = 0;
  for (const b of ["w", "p"]) gruppenVon(b).forEach((g, t) => {
    const z = g.eintraege.map((e, i) => [e, i]).filter(([e]) => n(e.it).includes(q) || n(e.de).includes(q));
    if (z.length) { gesamt += z.length; html += `<div class="treffer-kopf">${BEREICHE[b]} › ${esc(g.icon)} ${esc(g.name)}</div>` + tabelle(z.map(([e, i]) => zeileHtml(b, t, i, e)).join("")); }
  });
  const zs = D.s.map((e, i) => [e, i]).filter(([e]) => n(e.it).includes(q) || n(e.de).includes(q));
  if (zs.length) { gesamt += zs.length; html += `<div class="treffer-kopf">Satzbau</div>` + tabelle(zs.map(([e, i]) => zeileHtml("s", 0, i, e)).join("")); }
  D.g.forEach((g, t) => {
    const z = g.fragen.map((x, i) => [x, i]).filter(([x]) => [x.f, x.de, x.b, x.bde].some((s) => n(s).includes(q)));
    if (z.length) { gesamt += z.length; html += `<div class="treffer-kopf">Frage & Antwort › ${esc(g.thema)}</div>` + z.map(([x, i]) => frageHtml(t, i, x)).join(""); }
  });
  return `<p class="leise">${gesamt} Treffer für „${esc(ansicht.suche)}“</p>` + (html || "");
}
function leisteAktualisieren() {
  const st = document.getElementById("status"); if (!st) return;
  const g = geaenderteDateien();
  st.innerHTML = g.length
    ? `<span class="geaendert">● Unveröffentlichte Änderungen</span> – automatisch als Entwurf gespeichert. Mit „Veröffentlichen“ kommen sie aufs Handy.`
    : `✓ Alles veröffentlicht. ${TEST ? "<b>(Testmodus – Veröffentlichen ist abgeschaltet)</b>" : "Änderungen werden automatisch gespeichert."}`;
  document.getElementById("veroeffentlichen").disabled = !g.length || TEST;
  document.getElementById("verwerfenAlle").disabled = !g.length;
}

// ---------- Bedienung ----------
function ziel(el) {
  const a = el.dataset.a, t = +el.dataset.t, e = el.dataset.e;
  if (a === "s") return D.s[+e];
  const g = gruppenVon(a)[t];
  if (e === undefined) return g;
  return a === "g" ? g.fragen[+e] : g.eintraege[+e];
}
function verdrahten() {
  const inhalt = document.getElementById("inhalt");
  inhalt.addEventListener("input", (ev) => {
    const el = ev.target; if (!el.dataset.f) return;
    const obj = ziel(el); if (!obj) return;
    obj[el.dataset.f] = el.dataset.f === "m" ? el.value.split("\n") : el.value;
    geaendert();
  });
  inhalt.addEventListener("click", (ev) => {
    const sp = ev.target.closest("[data-sprich]");
    if (sp) { const [a, t, i] = sp.dataset.sprich.split("|"); const o = a === "s" ? D.s[+i] : a === "g" ? D.g[+t].fragen[+i] : gruppenVon(a)[+t].eintraege[+i]; sprich(a === "g" ? o.f : o.it); return; }
    const lo = ev.target.closest("[data-loeschen]");
    if (lo) {
      const [a, t, i] = lo.dataset.loeschen.split("|");
      const liste = a === "s" ? D.s : a === "g" ? D.g[+t].fragen : gruppenVon(a)[+t].eintraege;
      const o = liste[+i];
      if (!confirm(`„${a === "g" ? o.f : o.it || o.de}“ löschen?`)) return;
      liste.splice(+i, 1); geaendert(); zeichnen();
    }
  });
  document.querySelectorAll("[data-bereich]").forEach((b) => (b.onclick = () => { ansicht = { bereich: b.dataset.bereich, thema: 0, suche: "" }; zeichnen(); }));
  document.querySelectorAll("[data-thema]").forEach((b) => (b.onclick = () => { ansicht.thema = +b.dataset.thema; zeichnen(); }));
  const suche = document.getElementById("suche");
  let st = null;
  suche.oninput = () => { clearTimeout(st); st = setTimeout(() => { ansicht.suche = suche.value.trim(); zeichnen(); const s = document.getElementById("suche"); s.focus(); s.setSelectionRange(s.value.length, s.value.length); }, 300); };
  const neu = document.getElementById("neu");
  if (neu) neu.onclick = () => {
    const b = ansicht.bereich;
    if (b === "s") D.s.push({ it: "", de: "", id: "" });
    else if (b === "g") D.g[ansicht.thema].fragen.push({ id: neueKennung("frage"), f: "", de: "", b: "", bde: "", m: [] });
    else { const g = gruppenVon(b)[ansicht.thema]; g.eintraege.push({ it: "", de: "", id: neueKennung(g.id) }); }
    geaendert(); zeichnen();
    const felder = document.querySelectorAll("#inhalt input[data-f='de']"); const letztes = felder[felder.length - 1];
    if (letztes) { letztes.focus(); letztes.scrollIntoView({ block: "center" }); }
  };
  const neuesThema = document.getElementById("neuesThema");
  if (neuesThema) neuesThema.onclick = () => {
    const b = ansicht.bereich, name = prompt("Name des neuen Themas:"); if (!name) return;
    if (b === "g") D.g.push({ thema: name, fragen: [] });
    else gruppenVon(b).push({ id: (b === "p" ? "p_" : "") + "thema_" + Date.now().toString(36), name, icon: b === "p" ? "💬" : "📗", eintraege: [] });
    ansicht.thema = gruppenVon(b).length - 1; geaendert(); zeichnen();
  };
  const tl = document.getElementById("themaLoeschen");
  if (tl) tl.onclick = () => {
    const gruppen = gruppenVon(ansicht.bereich), g = gruppen[ansicht.thema], n = (g.eintraege || g.fragen).length;
    if (!confirm(`Thema „${g.name || g.thema}“${n ? ` mit ${n} Einträgen` : ""} löschen?`)) return;
    gruppen.splice(ansicht.thema, 1); ansicht.thema = 0; geaendert(); zeichnen();
  };
  document.getElementById("verwerfenAlle").onclick = () => {
    if (!confirm("Alle unveröffentlichten Änderungen verwerfen und den Stand von GitHub neu laden?")) return;
    entwurfLoeschen(); start();
  };
  document.getElementById("veroeffentlichen").onclick = veroeffentlichen;
}

// ---------- Veröffentlichen ----------
async function veroeffentlichen() {
  const knopf = document.getElementById("veroeffentlichen"), st = document.getElementById("status");
  const neu = erzeugen(D), geaendert = Object.keys(neu).filter((p) => neu[p] !== original[p]);
  if (!geaendert.length) return;
  knopf.disabled = true;
  const melde = (t) => (st.innerHTML = t);
  try {
    melde("⏳ Prüfe, ob sich auf GitHub inzwischen etwas geändert hat …");
    for (const p of geaendert) {
      const aktuell = await dateiVonGithub(p);
      if (aktuell.sha !== basis[p]) throw new Error(`Die Datei ${p} wurde inzwischen woanders geändert (anderer PC?). Lade die Seite neu – dein Entwurf bleibt erhalten, und du kannst wählen, welche Fassung gilt.`);
    }
    melde("⏳ Erhöhe die Versionsnummer …");
    const sw = await dateiVonGithub("sw.js");
    const m = sw.text.match(/italienisch-v(\d+)/); if (!m) throw new Error("Versionsnummer in sw.js nicht gefunden.");
    const version = +m[1] + 1;
    const dateien = geaendert.map((p) => ({ path: p, mode: "100644", type: "blob", content: neu[p] }))
      .concat({ path: "sw.js", mode: "100644", type: "blob", content: sw.text.replace(/italienisch-v\d+/, "italienisch-v" + version) });
    melde("⏳ Lade zu GitHub hoch …");
    const ref = await gh(`/git/ref/heads/${ZWEIG}`);
    const kopf = await gh(`/git/commits/${ref.object.sha}`);
    const baum = await gh("/git/trees", { method: "POST", body: JSON.stringify({ base_tree: kopf.tree.sha, tree: dateien }) });
    const jetzt = new Date().toISOString();
    const stand = await gh("/git/commits", { method: "POST", body: JSON.stringify({ message: `Version ${version}: Inhalte bearbeitet`, tree: baum.sha, parents: [ref.object.sha], author: { ...AUTOR, date: jetzt }, committer: { ...AUTOR, date: jetzt } }) });
    await gh(`/git/refs/heads/${ZWEIG}`, { method: "PATCH", body: JSON.stringify({ sha: stand.sha }) });
    // neuen Stand als Grundlage übernehmen
    for (const p of geaendert) { basis[p] = (await dateiVonGithub(p)).sha; original[p] = neu[p]; }
    entwurfLoeschen();
    melde("⏳ Hochgeladen. Warte, bis Version " + version + " online ist (meist 1–2 Minuten) …");
    let online = false;
    for (let i = 0; i < 30 && !online; i++) {
      await new Promise((r) => setTimeout(r, 10000));
      try { online = /italienisch-v(\d+)/.exec(await (await fetch(SEITE + "sw.js?t=" + Date.now(), { cache: "no-store" })).text())[1] >= version; } catch (e) {}
    }
    melde(online
      ? `✅ <b>Version ${version} ist online.</b> Auf dem Handy: App öffnen, ganz schließen, wieder öffnen.`
      : `✅ Hochgeladen (Version ${version}). Online ist es in ein paar Minuten.`);
    toast("Veröffentlicht ✓");
  } catch (err) {
    melde(`<span style="color:var(--rot)">❌ ${esc(err.message)}</span>`);
  } finally { knopf.disabled = !geaenderteDateien().length; }
}

start();
