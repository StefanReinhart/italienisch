# Italienisch-Lern-App – Hinweise für Claude

Der Nutzer ist kein Programmierer: einfach erklären, auf Deutsch, ohne Fachbegriffe.

## Bei JEDER Bearbeitung zuerst: Erklärungs-Wünsche abarbeiten

1. `git pull` (die App und die Bearbeiten-Seite schreiben direkt zu GitHub).
2. `data/wuensche.json` lesen. Einträge ohne `typ` sind Karten, zu denen der Nutzer eine Erklärung möchte
   (`id` = feste Kennung, `it`, `de`) – manchmal mit einer **Frage** im Feld `nachricht`.
3. Für jede eine kurze, einfache Erklärung (1–2 Sätze, Deutsch) in `data/hinweise.js` eintragen:
   `"kennung": "Hinweis",` (gibt es schon einen Hinweis, ihn ergänzen). Mit `nachricht`: die Frage beantworten, und zwar
   so, dass der Hinweis auch später allein verständlich ist.
   - Fragt der Nutzer „Ist … auch richtig?“ und es **stimmt**: die Antwort in `window.KARTEN_ALTERNATIVEN`
     (italienisch) bzw. `window.KARTEN_ALTERNATIVEN_DE` (deutsch) unter der Kennung eintragen – dann zählt sie
     beim Prüfen als richtig – und im Hinweis erwähnen. Stimmt es **nicht**: im Hinweis erklären, warum.
   - **Immer auch in die Karten einbauen** (Wunsch des Nutzers): Taucht in der Antwort ein nützliches Wort oder
     eine Wendung auf, die es noch nicht als Karte gibt (z. B. „la prima volta“ aus „È la prima volta …“), sie als
     neue Karte in die passende Lektion (`neu` in `data/lektionen-a1.js`) aufnehmen – Karten gibt es automatisch in
     beiden Richtungen – und die Grundform ins Wörterbuch. Nicht nur erklären, sondern lernbar machen.
   - Einträge mit `id: "fehler:…"` (z. B. `"fehler:a / di"`) kommen von der Seite „Typische Fehler“: Der Nutzer
     möchte wissen, wann man welches der beiden Wörter nimmt. Erklärung unter genau dieser Kennung in
     `HINWEISE` (data/hinweise.js, Block „Erklärungen zu typischen Fehlern“) eintragen: kurz, mit Merkhilfe und
     Beispielen für BEIDE Wörter. Die Kennung ist immer „fehler:“ + beide Wörter alphabetisch sortiert, mit „ / “.
     Passen neue Beispielsätze, auch als Karten aufnehmen.
   - Einträge mit `"typ": "nachricht"` (`id: "allgemein"`) sind Nachrichten aus dem **Postfach** der App (Wünsche,
     Fragen, „Mache eine Karte: …“, Fehlermeldungen): umsetzen bzw. beantworten; wenn unklar oder größer, erst im
     Chat nachfragen.
   - **Antwort ins Postfach:** Auf JEDE Nachricht mit Text (`typ: "nachricht"` und Karten-/Fehler-Fragen mit
     `nachricht`) eine Antwort in `data/postfach.js` (`window.POSTFACH`) schreiben:
     `{ datum: "JJJJ-MM-TT HH:MM", id: "<Kennung der Karte, bei freien Nachrichten weglassen>", bezug: "<genau der Text aus nachricht>", text, karten, gruppe, lektion }`.
     `bezug` muss exakt der Nachrichtentext sein (daran hängt die App die Antwort an die Nachricht). Bei „Mache eine
     Karte: …“: die Karte(n) in `karten` vorschlagen (`{ it, de }`, natürliches Italienisch, ggf. du- und Sie-Form)
     mit passender `gruppe` (p_restaurant, p_reisen, p_einkaufen, p_weg, p_alltag, p_begruessung …) und `lektion`
     – der Nutzer übernimmt sie per ➕ und sie kommen sofort dran. Alle Antworten stehen lassen (Verlauf).
     Bei reinen Erklärungs-Wünschen ohne Text reicht der Hinweis in hinweise.js (die App zeigt ihn im Postfach an).
4. Einträge mit `"typ": "antwort"` sind Antworten aus „Frage & Antwort“, die der Nutzer selbst als richtig
   markiert hat (`id` = Kennung der Frage, z. B. `dialog:Che cosa prendi?`, `frage`, `antwort`). Prüfen:
   - **Richtig:** in `data/gespraech.js` bei dieser Frage ein passendes, möglichst allgemeines Antwortmuster
     ergänzen (Schreibweise steht oben in der Datei), damit es auf allen Geräten erkannt wird.
   - **Falsch:** in `data/hinweise.js` unter `window.ABGELEHNTE_ANTWORTEN` eintragen
     (`"dialog:…": ["falsche Antwort"]`) – dann zählt sie nicht mehr als richtig – und dem Nutzer den Fehler erklären.
4b. Einträge mit `"typ": "gespraech"` sind ALLE Antworten aus „Frage & Antwort“ (`id` = Kennung der Frage, `frage`,
   `antwort`, `stufe` = wie die App sie bewertet hat). Für jede eine Rückmeldung in `data/rueckmeldungen.js` schreiben
   (`window.RUECKMELDUNGEN["dialog:…"]`, Liste mit `{ datum, antwort, text, besser, besserDe, gruppe, lektion, karten }`):
   - `text`: kurz und freundlich – was gut war, was falsch war (Grammatik, Wortwahl), auf Deutsch. Fehlende Akzente
     (si statt sì) NICHT bemängeln – der Nutzer hat am Handy keinen leichten Zugang zu Akzenten; die App wertet das ohnehin als richtig.
   - `besser`: eine ausführlichere, natürliche Antwort auf A1/A2-Niveau, die auf seiner Antwort aufbaut; `besserDe` = Übersetzung.
   - **Datenschutz:** Die Dateien sind öffentlich. Echte Namen, Adressen, Orte o. Ä. aus seinen Antworten NICHT
     übernehmen – durch Platzhalter ersetzen (z. B. „a nome Rossi“, „Monaco“ ist ok, Familiennamen nicht).
   - `gruppe` + `lektion`: wohin eine daraus gemachte Karte gehört (Phrasen-Gruppe wie `p_restaurant`, `p_reisen`,
     `p_einkaufen`, `p_weg`, `p_alltag`, `p_begruessung` … und Lektion wie `l5` Restaurant, `l10` Hotel). Der Nutzer
     übernimmt `besser` und die `karten` selbst per Knopf „➕ Als Karte üben“ – dafür NICHT selbst Karten anlegen.
   - `karten`: 2–4 lohnende Teile aus `besser` als eigene Karten-Vorschläge (`{ it, de }`), z. B. „abbiamo prenotato“,
     „a nome Rossi“ – kurze, wiederverwendbare Bausteine, keine Sätze, die es schon als Karte gibt.
   - Gleiche oder sehr ähnliche Antworten zusammenfassen. ALLE Rückmeldungen stehen lassen – sie sind der Verlauf
     (Seite „Nachrichten von Claude“, 💬 oben).
   - War eine richtige Antwort nicht erkannt, Muster in `data/gespraech.js` ergänzen (wie bei Punkt 4).
5. `data/wuensche.json` danach wieder auf `[]` setzen.
6. Dem Nutzer kurz sagen, welche Erklärungen und Antwortmuster dazugekommen sind, und seine Fragen auch im Chat beantworten.

## Veröffentlichen

`veroeffentlichen.ps1 -Nachricht "…" -OhnePause` (erhöht die Version in `sw.js`, committet mit der
anonymen GitHub-Adresse, pusht und wartet, bis die Version online ist).

## Lernstand-Abgleich

Die App sichert den Lernstand (mit GitHub-Schlüssel) als `lernstand.json` auf dem Zweig **`lernstand`**
(nicht master, gehört nicht zur Webseite) und gleicht so Handy und PC ab. Diesen Zweig nie löschen oder
zurücksetzen. Neue Felder im Lernstand, die zwischen Geräten wandern sollen, in `SYNC_FELDER` und
`zusammenfuehren()` in app.js aufnehmen.

## Wichtige Regeln

- Verknüpfungen immer über feste Kennungen (IDs), nie über Texte.
- Wörterbuch = nur Wörter (keine Sätze). Kommen neue Phrasen/Lektionssätze dazu, deren Wörter noch fehlen, die
  **Grundform** (Verb im Infinitiv, Hauptwort mit Artikel) in `data/woerterbuch.js` ergänzen; unregelmäßige Verben
  dort auch in `VERBEN_FORMEN_EXTRA`. Hinweise zu diesen Wörtern haben die Kennung `wb:<italienisch>`.
- Neue Datendateien in `index.html` UND in die Liste in `sw.js` eintragen.
- Vor dem Veröffentlichen lokal testen (`lokal-starten.ps1 -OhneBrowser`), auch mit leerem Lernstand.
